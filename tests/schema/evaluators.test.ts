import { describe, expect, it } from "vitest";
import { evaluateCondition } from "../../src/schema/conditions";
import { evaluateValidation } from "../../src/schema/validations";

describe("evaluateCondition", () => {
  const cases: Array<[Parameters<typeof evaluateCondition>, boolean]> = [
    [["equals", "Other", "Other"], true],
    [["equals", "UAE", "Other"], false],
    [["notEquals", "UAE", "Other"], true],
    [["notEquals", "Other", "Other"], false],
    [["contains", "I like Other things", "Other"], true],
    [["contains", "nope", "Other"], false],
    [["isEmpty", "", undefined], true],
    [["isEmpty", "  ", undefined], true],
    [["isEmpty", "x", undefined], false],
    [["isNotEmpty", "x", undefined], true],
    [["isNotEmpty", "", undefined], false],
  ];

  it.each(cases)("evaluateCondition%p -> %p", (args, expected) => {
    expect(evaluateCondition(...args)).toBe(expected);
  });
});

describe("evaluateValidation", () => {
  const cases: Array<[Parameters<typeof evaluateValidation>, boolean]> = [
    [["required", ""], false],
    [["required", "  "], false],
    [["required", "x"], true],
    [["email", "a@b.com"], true],
    [["email", "not-an-email"], false],
    [["minLength", "ab", 3], false],
    [["minLength", "abc", 3], true],
    [["maxLength", "abcd", 3], false],
    [["maxLength", "abc", 3], true],
    [["regex", "12345", "^\\d+$"], true],
    [["regex", "12a45", "^\\d+$"], false],
  ];

  it.each(cases)("evaluateValidation%p -> %p", (args, expected) => {
    expect(evaluateValidation(...args)).toBe(expected);
  });
});
