"""Which stored files a published form's preview (and a QA run's in-memory inlining) picks
now that a form has one page per language — including forms published *before* per-language
files existed, whose single set of files has the old names."""

from __future__ import annotations

from types import SimpleNamespace

from app.form_pipeline.codegen.file_names import resolve_file_names
from app.form_pipeline.codegen.generate import generate_solution
from app.form_pipeline.codegen.types import default_builder_config
from app.services.preview_service import _companion_files, _find_page, _published_file_names, inline_generated_files

from .form_pipeline.fixtures import sample_form_definition


def _stored(files: list[tuple[str, str]]) -> list[SimpleNamespace]:
    """Stand-ins for GeneratedFiles rows: (fileName, fileType)."""
    return [SimpleNamespace(fileName=n, fileType=t) for n, t in files]


def _both_variants(**extra):
    return default_builder_config().model_copy(update={"variants": ["ff", "oc"], **extra})


def _stored_from_generation(form, config) -> list[SimpleNamespace]:
    from app.services.generation_service import classify_file_type

    names = resolve_file_names(form, config)
    return _stored([(f.path, classify_file_type(f.path, names)) for f in generate_solution(form, config)])


def test_picks_the_default_languages_page_not_just_any_page_with_the_variant_suffix():
    form = sample_form_definition()  # default en_GB, plus ar_AE
    config = _both_variants(projectCode="F2H26")
    files = _stored_from_generation(form, config)
    names = resolve_file_names(form, config)

    assert _find_page(files, names, "ff").fileName == "TEST-EN_F2H26_FF.html"
    assert _find_page(files, names, "oc").fileName == "TEST-EN_F2H26_OC.html"

    # ...and follows the form's default locale, not file order.
    form.meta.defaultLocale = "ar_AE"
    ar_names = resolve_file_names(form, config)
    assert _find_page(list(reversed(files)), ar_names, "ff").fileName == "TEST-AR_F2H26_FF.html"


def test_companion_files_are_the_pages_own_js_css_and_the_shared_data_file():
    form = sample_form_definition()
    config = _both_variants(projectCode="F2H26")
    files = _stored_from_generation(form, config)
    contents = {f.path: f.contents for f in generate_solution(form, config)}
    names = resolve_file_names(form, config)

    for variant, language in (("ff", names.languages[0]), ("ff", names.languages[1]), ("oc", names.languages[1])):
        html_name = language.ffHtml if variant == "ff" else language.ocHtml
        html_file = next(f for f in files if f.fileName == html_name)
        js, css, data = _companion_files(html_file, contents[html_name], files)
        assert js.fileName == (language.ffJs if variant == "ff" else language.ocJs)
        assert css.fileName == language.css
        assert data.fileName == names.dataJs


def test_version_published_before_per_language_files_still_resolves_via_its_old_names():
    # Old scheme: one set per form, prefixed `{Sub}-{LANG}` with no project code.
    files = _stored(
        [
            ("SESAR-EN_FF.html", "html"),
            ("SESAR-EN_FF.js", "js"),
            ("SESAR-EN_OC.html", "html"),
            ("SESAR-EN_OC.js", "js"),
            ("SESAR-EN.js", "data-js"),
            ("SESAR-EN.css", "css"),
        ]
    )
    names = resolve_file_names(sample_form_definition(), _both_variants(projectCode="F2H26"))  # won't match any old name

    page = _find_page(files, names, "oc")
    assert page.fileName == "SESAR-EN_OC.html"

    legacy_html = '<link rel="stylesheet" href="SESAR-EN.css"><script src="SESAR-EN.js"></script><script src="SESAR-EN_OC.js"></script>'
    js, css, data = _companion_files(page, legacy_html, files)
    assert (js.fileName, css.fileName, data.fileName) == ("SESAR-EN_OC.js", "SESAR-EN.css", "SESAR-EN.js")


def test_no_page_for_a_variant_the_version_never_generated():
    form = sample_form_definition()
    config = default_builder_config().model_copy(update={"variants": ["ff"]})
    files = _stored_from_generation(form, config)
    assert _find_page(files, resolve_file_names(form, config), "oc") is None


def test_published_file_names_recompute_from_the_versions_own_stored_config():
    form = sample_form_definition()
    config = _both_variants(projectCode="F2H26")
    version = SimpleNamespace(definition=form.model_dump_json(), config=config.model_dump_json())
    assert _published_file_names(version).ffHtml == "TEST-EN_F2H26_FF.html"
    assert _published_file_names(None) is None
    assert _published_file_names(SimpleNamespace(definition="not json", config="{}")) is None


def test_inline_generated_files_inlines_the_requested_languages_page():
    form = sample_form_definition()
    config = _both_variants(projectCode="F2H26")
    files = generate_solution(form, config)
    names = resolve_file_names(form, config)

    en = inline_generated_files(files, names, "ff")
    assert '<html lang="en" dir="ltr">' in en
    assert 'param["fallbackLanguage"] = "en_GB";' in en
    assert "TEST-EN_F2H26_FF.js" not in en and "EN-F2H26.css" not in en

    ar = inline_generated_files(files, names, "oc", "ar_AE")
    assert '<html lang="ar" dir="rtl">' in ar
    assert 'param["fallbackLanguage"] = "ar_AE";' in ar
    assert "const fields = " in ar  # the shared data file was inlined too


def test_inline_generated_files_returns_none_when_the_variant_was_not_generated():
    form = sample_form_definition()
    config = default_builder_config().model_copy(update={"variants": ["ff"]})
    files = generate_solution(form, config)
    assert inline_generated_files(files, resolve_file_names(form, config), "oc") is None
