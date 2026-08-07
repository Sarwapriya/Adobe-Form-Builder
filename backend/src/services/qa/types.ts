/** One assertion produced by qaIntrospection.ts, before it's persisted as a
 * QaTestCaseResult row — see that entity's own doc comment for what each
 * field means to the admin dashboard. */
export interface QaCheckResult {
  category: QaCategory;
  name: string;
  status: "passed" | "failed";
  fieldId?: string | null;
  message?: string | null;
}

/** Grouping shown in the report UI, in the order a QA engineer would
 * naturally read them: does the page even load, are the fields there, do
 * they validate correctly, does interacting with them work, does the submit
 * button gate correctly, does the actual submit flow succeed/fail visibly. */
export type QaCategory =
  | "structure"
  | "field-validation"
  | "field-interaction"
  | "required-enforcement"
  | "submit-gating"
  | "submit-flow";
