import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { generateSolution } from "../../src/codegen/generate";
import { formDefinitionSchema } from "../../src/schema/formDefinitionZod";
import { evaluateCondition } from "../../src/schema/conditions";
import { evaluateValidation } from "../../src/schema/validations";

const fixturePath = join(__dirname, "../../sample-forms/contact-form.en-ar.json");
const fixture = formDefinitionSchema.parse(JSON.parse(readFileSync(fixturePath, "utf-8")));

describe("generateSolution", () => {
  const files = generateSolution(fixture);

  it("produces exactly the four Solution files", () => {
    expect(files.map((f) => f.path).sort()).toEqual(["css/style.css", "index.html", "js/app.js", "js/form.js"]);
  });

  it("index.html snapshot", () => {
    expect(files.find((f) => f.path === "index.html")!.content).toMatchSnapshot();
  });

  it("css/style.css snapshot", () => {
    expect(files.find((f) => f.path === "css/style.css")!.content).toMatchSnapshot();
  });

  it("js/app.js snapshot", () => {
    expect(files.find((f) => f.path === "js/app.js")!.content).toMatchSnapshot();
  });

  it("js/form.js snapshot", () => {
    expect(files.find((f) => f.path === "js/form.js")!.content).toMatchSnapshot();
  });

  it("embeds the exact conditional field from the fixture in app.js", () => {
    const appJs = files.find((f) => f.path === "js/app.js")!.content;
    expect(appJs).toContain('"sourceFieldId": "field-country"');
    expect(appJs).toContain('"action": "show"');
  });
});

describe("embedded evaluator drift", () => {
  // Extracts the ACTUAL embedded function source from generated form.js and
  // asserts it behaves identically to the TS evaluator over the same fixture
  // table used in tests/schema/evaluators.test.ts — this is the guard against
  // the toString()-embedding step silently diverging from the source of truth.
  const formJs = generateSolution(fixture).find((f) => f.path === "js/form.js")!.content;

  function extractEmbeddedFn(name: string): (...args: unknown[]) => unknown {
    const marker = `var ${name} = `;
    const start = formJs.indexOf(marker) + marker.length;
    const end = formJs.indexOf(`\n\nvar `, start) !== -1 && formJs.indexOf(`\n\nvar `, start) < formJs.indexOf(`\n\nwindow.FormRuntime`)
      ? formJs.indexOf(`\n\nvar `, start)
      : formJs.indexOf(`\n\nwindow.FormRuntime`, start);
    const source = formJs.slice(start, end).trim().replace(/;$/, "");
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    return new Function(`return (${source});`)() as (...args: unknown[]) => unknown;
  }

  it("evaluateCondition embedded in form.js matches the TS evaluator", () => {
    const embedded = extractEmbeddedFn("evaluateCondition");
    const cases: Array<[string, string, string | undefined]> = [
      ["equals", "Other", "Other"],
      ["equals", "UAE", "Other"],
      ["contains", "I like Other things", "Other"],
      ["isEmpty", "", undefined],
      ["isNotEmpty", "x", undefined],
    ];
    for (const [operator, current, comparison] of cases) {
      expect(embedded(operator, current, comparison)).toBe(evaluateCondition(operator as never, current, comparison));
    }
  });

  it("evaluateValidation embedded in form.js matches the TS evaluator", () => {
    const embedded = extractEmbeddedFn("evaluateValidation");
    const cases: Array<[string, string, number | string | undefined]> = [
      ["required", "", undefined],
      ["required", "x", undefined],
      ["email", "a@b.com", undefined],
      ["email", "not-an-email", undefined],
      ["minLength", "ab", 3],
      ["regex", "12345", "^\\d+$"],
    ];
    for (const [type, value, param] of cases) {
      expect(embedded(type, value, param)).toBe(evaluateValidation(type as never, value, param));
    }
  });
});
