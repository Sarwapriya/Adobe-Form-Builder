/**
 * Zod schema mirroring `contribution.ts` 1:1, hand-kept in sync (no z.infer codegen) —
 * same convention as formDefinitionZod.ts. This is what the backend actually validates
 * a submitted contribution against at the API boundary.
 */
import { z } from "zod";
import { answerDefinitionSchema, consentDefinitionSchema, questionDefinitionSchema } from "./formDefinitionZod";

export const translationTargetSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("profileLabel"), field: z.enum(["firstName", "lastName", "email", "mobileNumber", "marketingOptin"]) }),
  z.object({ kind: z.literal("privacyPolicyText") }),
  z.object({ kind: z.literal("privacyPolicyLink") }),
  z.object({ kind: z.literal("privacyPolicyLinkText") }),
  z.object({ kind: z.literal("termsAndConditionsText") }),
  z.object({ kind: z.literal("termsAndConditionsUrl") }),
  z.object({ kind: z.literal("consentText"), consentId: z.string() }),
  z.object({ kind: z.literal("consentLink"), consentId: z.string() }),
  z.object({ kind: z.literal("questionHeading"), questionId: z.string() }),
  z.object({ kind: z.literal("questionSubheading"), questionId: z.string() }),
  z.object({ kind: z.literal("answerText"), questionId: z.string(), answerId: z.string() }),
  z.object({ kind: z.literal("campaignHeading") }),
  z.object({ kind: z.literal("campaignSubheading") }),
  z.object({ kind: z.literal("campaignHeadingFullForm") }),
  z.object({ kind: z.literal("campaignSubheadingFullForm") }),
  z.object({ kind: z.literal("submitButtonLabel") }),
]);

export const translationEntrySchema = z.object({
  target: translationTargetSchema,
  locale: z.string(),
  value: z.string(),
});

export const autoPopulateToggleSchema = z.object({
  questionId: z.string(),
  enabled: z.boolean(),
});

export const newAnswerEntrySchema = z.object({
  questionId: z.string(),
  answer: answerDefinitionSchema,
});

export const deletedAnswerRefSchema = z.object({
  questionId: z.string(),
  answerId: z.string(),
});

export const contributionContentSchema = z.object({
  translations: z.array(translationEntrySchema),
  newQuestions: z.array(questionDefinitionSchema),
  newConsents: z.array(consentDefinitionSchema),
  autoPopulateToggles: z.array(autoPopulateToggleSchema),
  deletedQuestionIds: z.array(z.string()),
  newAnswers: z.array(newAnswerEntrySchema),
  deletedAnswerIds: z.array(deletedAnswerRefSchema),
});
