import { syntaxTree } from "@codemirror/language";
import { linter, lintGutter, type Diagnostic } from "@codemirror/lint";
import type { EditorView } from "@codemirror/view";
import type { Extension } from "@codemirror/state";

/**
 * Live syntax-error highlighting for the Edit Files editor — CodeMirror's
 * own documented recipe (walk the Lezer parse tree for error nodes) rather
 * than a bundled linter, so this only ever flags genuinely broken syntax
 * (an unclosed tag, a mismatched brace/quote, invalid CSS) with zero
 * false-positive risk, unlike a full lint-rule engine (e.g. ESLint) which
 * would need tuning against the reference scripts' own existing style to
 * avoid noisy warnings an admin can't act on. Shows as a red squiggly
 * underline plus a gutter marker (hover for the message), the same shape
 * every other IDE uses — debounced by `linter()`'s own default delay so it
 * doesn't flash errors while a tag/string is still mid-edit.
 */
function syntaxErrorSource(view: EditorView): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const docLength = view.state.doc.length;
  syntaxTree(view.state).iterate({
    enter: (node) => {
      if (node.type.isError) {
        // Lezer sometimes inserts a zero-width error node at the point of
        // failure — widen it by one character (clamped to the document's
        // own length) so the underline is actually visible.
        diagnostics.push({
          from: node.from,
          to: Math.min(Math.max(node.to, node.from + 1), docLength),
          severity: "error",
          message: "Syntax error",
        });
      }
    },
  });
  return diagnostics;
}

export function codeSyntaxLinter(): Extension[] {
  return [linter(syntaxErrorSource), lintGutter()];
}
