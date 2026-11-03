"""Unit tests for app/services/data_js_patch.py — pure data functions, no DB
or HTTP needed."""

from __future__ import annotations

from app.form_pipeline.codegen.build_data_js import build_data_js
from app.form_pipeline.codegen.file_names import resolve_file_names
from app.form_pipeline.codegen.types import BuilderConfig
from app.services.data_js_patch import merge_data_js, merge_three_way, parse_data_js, serialize_data_js
from tests.form_pipeline.fixtures import sample_form_definition


def _real_data_js() -> str:
    form = sample_form_definition()
    config = BuilderConfig()
    return build_data_js(form, config, resolve_file_names(form, config)).contents


class TestParseAndSerializeRoundTrip:
    def test_parses_a_real_generated_file_and_round_trips(self):
        content = _real_data_js()
        parts = parse_data_js(content)
        assert parts is not None
        assert set(parts.keys()) == {
            "page_error", "fields", "questions", "answers", "validation_messages",
            "country_subsidiary", "subsidiary_detail", "param", "auto_populate_params",
        }
        reparsed = parse_data_js(serialize_data_js(parts))
        assert reparsed == parts

    def test_returns_none_for_js_syntax_a_hand_edit_might_introduce(self):
        assert parse_data_js("const param = {trailing: 'comma',};\n") is None
        assert parse_data_js("const param = { // a comment\n  a: 1\n};\n") is None
        assert parse_data_js("not even close to the expected shape") is None

    def test_extra_unknown_top_level_const_is_preserved_through_a_round_trip(self):
        content = 'const param = {"a": 1};\n\nconst myCustomThing = {"b": 2};\n'
        parts = parse_data_js(content)
        assert parts == {"param": {"a": 1}, "myCustomThing": {"b": 2}}
        assert parse_data_js(serialize_data_js(parts)) == parts


class TestMergeThreeWay:
    def test_unchanged_by_hand_takes_the_new_value(self):
        value, conflicted = merge_three_way("old", "old", "new")
        assert (value, conflicted) == ("new", False)

    def test_unchanged_by_design_keeps_the_hand_edit(self):
        value, conflicted = merge_three_way("old", "hand", "old")
        assert (value, conflicted) == ("hand", False)

    def test_both_sides_change_to_the_same_value_is_not_a_conflict(self):
        value, conflicted = merge_three_way("old", "same", "same")
        assert (value, conflicted) == ("same", False)

    def test_both_sides_change_to_different_values_is_a_conflict(self):
        value, conflicted = merge_three_way("old", "hand", "new")
        assert conflicted is True

    def test_merges_independent_leaves_inside_a_shared_dict(self):
        old = {"x": 1, "y": 2}
        hand = {"x": 5, "y": 2}
        new = {"x": 1, "y": 9}
        value, conflicted = merge_three_way(old, hand, new)
        assert (value, conflicted) == ({"x": 5, "y": 9}, False)

    def test_conflicting_leaves_inside_a_shared_dict_flag_the_whole_merge(self):
        old = {"x": 1}
        hand = {"x": 2}
        new = {"x": 3}
        _value, conflicted = merge_three_way(old, hand, new)
        assert conflicted is True

    def test_a_hand_added_key_the_design_never_touched_is_preserved(self):
        old = {}
        hand = {"custom": "value"}
        new = {}
        value, conflicted = merge_three_way(old, hand, new)
        assert (value, conflicted) == ({"custom": "value"}, False)

    def test_a_key_the_design_added_is_included_even_though_hand_never_had_it(self):
        old = {}
        hand = {}
        new = {"brandNew": "value"}
        value, conflicted = merge_three_way(old, hand, new)
        assert (value, conflicted) == ({"brandNew": "value"}, False)

    def test_a_hand_removed_key_the_design_never_touched_stays_removed(self):
        old = {"gone": "value", "kept": "x"}
        hand = {"kept": "x"}
        new = {"gone": "value", "kept": "x"}
        value, conflicted = merge_three_way(old, hand, new)
        assert (value, conflicted) == ({"kept": "x"}, False)

    def test_lists_are_treated_as_whole_leaves_not_merged_item_by_item(self):
        old = [1, 2]
        hand = [1, 2, 3]
        new = [1, 2]
        value, conflicted = merge_three_way(old, hand, new)
        assert (value, conflicted) == ([1, 2, 3], False)

    def test_both_sides_changing_a_list_differently_conflicts(self):
        old = [1, 2]
        hand = [1, 2, 3]
        new = [1, 2, 4]
        _value, conflicted = merge_three_way(old, hand, new)
        assert conflicted is True


class TestMergeDataJs:
    def test_a_hand_edited_leaf_survives_an_unrelated_design_change(self):
        old = _real_data_js()
        old_parts = parse_data_js(old)
        hand_parts = dict(old_parts)
        hand_parts["param"] = {**old_parts["param"], "redirectAfterSuccessUrl": "https://hand-edited.example.com"}
        hand = serialize_data_js(hand_parts)

        new_parts = dict(old_parts)
        new_parts["questions"] = {**old_parts["questions"], "en_GB": {**old_parts["questions"]["en_GB"], "Q1": {"heading": "Changed on the design screen", "subheading": ""}}}
        new = serialize_data_js(new_parts)

        merged = merge_data_js(old, hand, new)
        assert merged is not None
        merged_parts = parse_data_js(merged)
        assert merged_parts["param"]["redirectAfterSuccessUrl"] == "https://hand-edited.example.com"
        assert merged_parts["questions"]["en_GB"]["Q1"]["heading"] == "Changed on the design screen"

    def test_returns_none_when_the_same_leaf_is_changed_on_both_sides(self):
        old = _real_data_js()
        old_parts = parse_data_js(old)
        hand = serialize_data_js({**old_parts, "param": {**old_parts["param"], "redirectAfterSuccessUrl": "https://hand.example.com"}})
        new = serialize_data_js({**old_parts, "param": {**old_parts["param"], "redirectAfterSuccessUrl": "https://design.example.com"}})

        assert merge_data_js(old, hand, new) is None

    def test_returns_none_when_the_hand_edited_file_is_not_valid_json(self):
        old = _real_data_js()
        new = _real_data_js()
        hand = "const param = { not: valid, // js comment\n};\n"
        assert merge_data_js(old, hand, new) is None

    def test_no_hand_edit_at_all_just_takes_the_new_content(self):
        old = _real_data_js()
        new = old  # nothing changed anywhere
        merged = merge_data_js(old, old, new)
        assert merged is not None
        assert parse_data_js(merged) == parse_data_js(new)
