import type { Theme } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";
import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import type { Extension } from "@codemirror/state";

/**
 * Builds a CodeMirror theme straight from the app's own live MUI theme
 * (`useTheme()`) rather than a hardcoded editor palette — so the Edit Files
 * window automatically matches whichever mode (light/dark) and role accent
 * (admin maroon, subsidiary blue — see theme.ts's PALETTES) is actually
 * active, the same way every other surface in the app does, instead of
 * looking like a bolted-on third-party widget.
 */
export function buildCodeEditorExtensions(theme: Theme): Extension[] {
  const isDark = theme.palette.mode === "dark";
  const bg = theme.palette.background.default;
  const gutterBg = theme.palette.background.paper;
  const fg = theme.palette.text.primary;
  const muted = theme.palette.text.secondary;
  const accent = theme.palette.primary.main;
  const selection = alpha(theme.palette.primary.main, isDark ? 0.35 : 0.25);
  const activeLine = alpha(theme.palette.text.primary, isDark ? 0.06 : 0.04);

  const editorTheme = EditorView.theme(
    {
      "&": {
        color: fg,
        backgroundColor: bg,
        height: "100%",
        fontSize: "0.82rem",
      },
      ".cm-content": {
        fontFamily: '"Roboto Mono", "JetBrains Mono", monospace',
        caretColor: accent,
      },
      ".cm-cursor, .cm-dropCursor": { borderLeftColor: accent },
      "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
        backgroundColor: `${selection} !important`,
      },
      ".cm-activeLine": { backgroundColor: activeLine },
      ".cm-activeLineGutter": { backgroundColor: activeLine },
      ".cm-gutters": {
        backgroundColor: gutterBg,
        color: muted,
        border: "none",
        borderRight: `1px solid ${theme.palette.divider}`,
      },
      ".cm-lineNumbers .cm-gutterElement": { color: muted },
      ".cm-matchingBracket, .cm-nonmatchingBracket": {
        backgroundColor: alpha(accent, 0.25),
        outline: `1px solid ${accent}`,
      },
      ".cm-foldPlaceholder": {
        backgroundColor: alpha(accent, 0.15),
        border: `1px solid ${alpha(accent, 0.4)}`,
        color: muted,
      },
      ".cm-searchMatch": {
        backgroundColor: alpha(theme.palette.warning.main, 0.3),
      },
      ".cm-searchMatch.cm-searchMatch-selected": {
        backgroundColor: alpha(theme.palette.warning.main, 0.5),
      },
      "&.cm-editor.cm-focused": { outline: "none" },
      ".cm-scroller": { overflow: "auto" },
    },
    { dark: isDark },
  );

  // Syntax colors derived from the app's own palette (accent for
  // keywords/tags, secondary for attributes, the existing status colors for
  // strings/numbers/comments) rather than an unrelated editor-specific
  // palette, so the editor reads as part of this app, not a generic widget.
  const highlightStyle = HighlightStyle.define([
    { tag: t.keyword, color: accent, fontWeight: 600 },
    { tag: [t.tagName], color: theme.palette.secondary.main, fontWeight: 600 },
    { tag: [t.attributeName], color: theme.palette.secondary.main },
    { tag: [t.attributeValue, t.string], color: theme.palette.success.main },
    { tag: [t.number, t.bool, t.null], color: theme.palette.warning.main },
    { tag: t.comment, color: muted, fontStyle: "italic" },
    { tag: [t.propertyName], color: theme.palette.info.main },
    { tag: [t.function(t.variableName), t.function(t.propertyName)], color: theme.palette.info.main },
    { tag: t.className, color: theme.palette.secondary.main },
    { tag: [t.bracket, t.punctuation], color: muted },
    { tag: t.operator, color: fg },
    { tag: t.invalid, color: theme.palette.error.main, textDecoration: "underline wavy" },
  ]);

  return [editorTheme, syntaxHighlighting(highlightStyle)];
}
