/**
 * The XSS/injection-safety boundary for codegen: every value that ultimately came from
 * an uploaded Excel file is untrusted input flowing into generated HTML/JS source.
 */
export declare function escapeHtml(s: string): string;
/**
 * Serializes a value (typically the plain JS objects built by buildDataJs.ts) as JSON
 * text safe to embed directly inside a generated `<script>` block.
 *
 * `JSON.stringify` already spec-guarantees safe escaping of quotes, backslashes, and
 * control characters — so this only needs to close the few gaps that are valid JSON
 * but unsafe once embedded literally as JS source inside HTML:
 *  - U+2028/U+2029 (LINE/PARAGRAPH SEPARATOR): valid unescaped in JSON strings, but an
 *    illegal, string-terminating character inside a raw JS string literal.
 *  - "</script" (in any casing): closes the enclosing <script> tag during HTML parsing,
 *    which happens before the JS is ever parsed, so escaping only within JS syntax
 *    would not be enough.
 */
export declare function safeJsonForScript(value: unknown): string;
