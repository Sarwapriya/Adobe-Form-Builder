import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";
import { useTheme } from "@mui/material/styles";
import CodeMirror, { type ReactCodeMirrorRef, type ViewUpdate } from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { javascript } from "@codemirror/lang-javascript";
import { redo, redoDepth, undo, undoDepth } from "@codemirror/commands";
import { buildCodeEditorExtensions } from "./codeEditorTheme";
import { codeSyntaxLinter } from "./codeSyntaxLinter";
import type { GeneratedFileType } from "../../api/formBuilderApi";

export interface CodeEditorHandle {
  undo: () => void;
  redo: () => void;
}

function languageExtension(fileType: GeneratedFileType) {
  if (fileType === "html") return html();
  if (fileType === "css") return css();
  return javascript();
}

/**
 * The Edit Files window's code editor — CodeMirror 6 (line numbers, syntax
 * highlighting, bracket matching, code folding — "IDE-like" out of the box
 * via its own `basicSetup`) themed from the app's live MUI theme (see
 * codeEditorTheme.ts) rather than a stock editor palette, plus live
 * syntax-error highlighting (see codeSyntaxLinter.ts) — a red underline and
 * gutter marker on genuinely broken syntax, same as any IDE. Undo/redo is
 * CodeMirror's own built-in history (already bound to Ctrl+Z/Ctrl+Y by
 * `basicSetup`'s keymap) — this component just exposes it imperatively so
 * FormFilesEditorPage's toolbar buttons can drive the same history, and
 * reports its depth so those buttons know when to disable.
 *
 * The caller remounts this with a new `key` (selectedFileId) on every file
 * switch — CodeMirror's history lives inside its own EditorView state, and
 * without a remount, loading a different file's content into the same
 * instance would make that content swap itself an undoable step (so "Undo"
 * right after switching files would jump back to the previous file).
 */
export const CodeEditor = forwardRef<
  CodeEditorHandle,
  {
    value: string;
    fileType: GeneratedFileType;
    onChange: (value: string) => void;
    onHistoryChange?: (canUndo: boolean, canRedo: boolean) => void;
  }
>(function CodeEditor({ value, fileType, onChange, onHistoryChange }, ref) {
  const theme = useTheme();
  const editorRef = useRef<ReactCodeMirrorRef>(null);

  useImperativeHandle(
    ref,
    () => ({
      undo: () => {
        if (editorRef.current?.view) undo(editorRef.current.view);
      },
      redo: () => {
        if (editorRef.current?.view) redo(editorRef.current.view);
      },
    }),
    [],
  );

  const handleUpdate = useCallback(
    (update: ViewUpdate) => {
      onHistoryChange?.(undoDepth(update.state) > 0, redoDepth(update.state) > 0);
    },
    [onHistoryChange],
  );

  return (
    <CodeMirror
      ref={editorRef}
      value={value}
      onChange={onChange}
      onUpdate={handleUpdate}
      extensions={[languageExtension(fileType), ...buildCodeEditorExtensions(theme), ...codeSyntaxLinter()]}
      theme="none"
      height="100%"
      width="100%"
      // A flex item otherwise sizes to its content's intrinsic width (a
      // long unwrapped line, e.g. a URL, would make it narrower than its
      // container) rather than stretching to fill — see the comment on the
      // wrapping Box in FormFilesEditorPage.tsx for the matching half of
      // this fix.
      style={{ height: "100%", width: "100%", flex: 1, minWidth: 0 }}
    />
  );
});
