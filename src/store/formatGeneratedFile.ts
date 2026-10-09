import * as beautify from "js-beautify";
import type { GeneratedFileType } from "../api/formBuilderApi";

/**
 * Pretty-prints a generated file's content for display/editing in the Edit
 * Files window — display only, never applied to what `publish_form` itself
 * writes to disk (that output must stay exactly what `generate_solution`
 * produces, including the byte-identical reference scripts — see
 * CLAUDE.md's codegen section). A file is dense/single-line by design (the
 * codegen pipeline isn't written for human reading), which made it
 * essentially unreadable in a plain editor; this is purely cosmetic so an
 * admin can actually find and edit the part they mean to change. Saving
 * writes back whatever's in the editor at that point (formatted + the
 * admin's own edits) — same "what you see is what's saved" contract as any
 * code editor.
 */
export function formatGeneratedFileContent(content: string, fileType: GeneratedFileType): string {
  const options = { indent_size: 2, wrap_line_length: 120, preserve_newlines: true };
  try {
    switch (fileType) {
      case "html":
        return beautify.html(content, { ...options, indent_inner_html: true, wrap_attributes: "auto" });
      case "css":
        return beautify.css(content, options);
      case "js":
      case "data-js":
        return beautify.js(content, { ...options, brace_style: "collapse" });
      default:
        return content;
    }
  } catch {
    // A formatter edge case (unbalanced markup, an unusual construct) must
    // never block opening the file — fall back to the raw content rather
    // than showing an error for something that's still perfectly editable
    // as-is.
    return content;
  }
}
