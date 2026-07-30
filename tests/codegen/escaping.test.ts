import { describe, expect, it } from "vitest";
import { escapeHtml, safeJsonForScript } from "../../src/codegen/js/escaping.ts";

describe("escapeHtml", () => {
  it("escapes the five HTML-special characters", () => {
    expect(escapeHtml(`<img src=x onerror="alert('xss')">&`)).toBe(
      "&lt;img src=x onerror=&quot;alert(&#39;xss&#39;)&quot;&gt;&amp;",
    );
  });

  it("leaves ordinary text (including non-Latin scripts) untouched", () => {
    expect(escapeHtml("הטלפון שלי כרגע הוא")).toBe("הטלפון שלי כרגע הוא");
  });
});

describe("safeJsonForScript", () => {
  it("never emits a raw </script> sequence, any casing", () => {
    const payloads = ['</script><script>alert(1)</script>', "</SCRIPT>", "</ScRiPt "];
    for (const payload of payloads) {
      const out = safeJsonForScript({ text: payload });
      expect(out.toLowerCase()).not.toContain("</script");
    }
  });

  it("escapes U+2028/U+2029 so the output is safe as a JS string literal", () => {
    const out = safeJsonForScript({ text: "line one line two line three" });
    expect(out).not.toContain(" ");
    expect(out).not.toContain(" ");
    expect(out).toContain("\\u2028");
    expect(out).toContain("\\u2029");
  });

  it("round-trips through JSON.parse to the original value (no data loss)", () => {
    const value = { a: 'quote " backslash \\ newline \n tab \t', b: ["<script>", "normal"] };
    const out = safeJsonForScript(value);
    expect(JSON.parse(out)).toEqual(value);
  });

  it("produces output that is executable as JS source when embedded in a script body", () => {
    const value = { malicious: "\";alert(1);//", tag: "</script>" };
    const out = safeJsonForScript(value);
    // eslint-disable-next-line no-new-func
    const evaluated = new Function(`return (${out});`)();
    expect(evaluated).toEqual(value);
  });
});
