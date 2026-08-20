import {
  resolveLocalizedText,
  validateFormDefinition,
  type AICampaignReference,
  type QuestionDefinition,
  type ValidationResult,
} from "@formbuilder/shared";
import type {
  SearchCampaignsArgs,
  GetCampaignArgs,
  GetCampaignQuestionsArgs,
  SearchQuestionsArgs,
  FindSimilarCampaignsArgs,
  FindSimilarQuestionsArgs,
  ValidateFormArgs,
} from "@formbuilder/shared";
import type { UserRole } from "../entities/User";
import { isAdminRole } from "../entities/User";
import { getFormDetail, listForms, type FormDetail, type FormListItem } from "./formBuilderService";
import { getAccessibleFormDetail, listAccessibleForms } from "./formAccessService";

/**
 * Read-only tool implementations backing the AI assistant's `READ_ONLY_AI_TOOLS`
 * (see @formbuilder/shared's aiTypes.ts). Every function here takes the
 * calling user's own auth context and enforces the *exact* same
 * subsidiary-scoping subsidiaryForms.router.ts already applies for a human
 * hitting these same underlying services directly — a non-admin's
 * `subsidiaryId` always comes from this context, never from a model-supplied
 * tool argument (there is no subsidiaryId argument on any of these tool
 * shapes in the first place, precisely so nothing can be trusted from the
 * model here).
 *
 * `GET_CAMPAIGN`/`GET_CAMPAIGN_QUESTIONS` intentionally return a *compact*
 * projection (name/status/locales/questions reduced to id+heading+type+
 * required) rather than the full FormDefinition JSON — keeps token cost down
 * and avoids ever handing the model profile-field/validation-message/consent
 * content it has no reason to see.
 *
 * `SEARCH_QUESTIONS`/`FIND_SIMILAR_CAMPAIGNS`/`FIND_SIMILAR_QUESTIONS` are
 * deliberately simple v1 in-memory keyword/token-overlap scans over a capped
 * number of accessible forms — not a real search index or embeddings. This
 * is a conscious v1 choice (per the plan) with a stable calling contract, so
 * it can be swapped for vector search later without any caller needing to
 * change.
 */

export interface AiToolCallerContext {
  userId: string;
  role: UserRole;
  subsidiaryId: string | null;
}

/** Cap on how many forms a keyword scan reads full content for — this is an
 * in-memory O(N) scan, not an index, so N must stay small enough to run
 * inline within a chat request. */
const SCAN_FORM_LIMIT = 100;
/** Cap on how many results any of the "search"/"similar" tools returns to the
 * model — keeps the tool-result turn's token cost bounded regardless of how
 * many forms exist. */
const RESULT_LIMIT = 10;

export interface CompactQuestion {
  id: string;
  heading: string;
  controlType: string;
  required: boolean;
}

export interface CompactCampaign {
  formId: string;
  name: string;
  status: string;
  locales: string[];
  defaultLocale: string;
  questions: CompactQuestion[];
}

export interface CampaignSearchResult {
  formId: string;
  name: string;
  status: string;
  projectCode: string | null;
  questionCount: number;
  updatedAt: string;
}

export interface QuestionSearchResult {
  formId: string;
  formName: string;
  questionId: string;
  heading: string;
  controlType: string;
}

/** Every form the caller may read, scoped exactly like a human hitting
 * GET /api/v1/admin/forms (admin) or GET /api/v1/forms (subsidiary user)
 * would see — admins see every non-deleted form regardless of subsidiary,
 * a subsidiary-scoped standard user sees only their own subsidiary's
 * *published* forms (formAccessService's own restriction, not loosened
 * here), and a standard user with no subsidiary assigned sees nothing. */
async function listCallerForms(
  ctx: AiToolCallerContext,
  filters: { search?: string; projectCode?: string; status?: SearchCampaignsArgs["status"] } = {},
): Promise<FormListItem[]> {
  if (isAdminRole(ctx.role)) {
    const page = await listForms({
      search: filters.search,
      projectCode: filters.projectCode,
      status: filters.status,
      pageSize: SCAN_FORM_LIMIT,
    });
    return page.items;
  }

  if (!ctx.subsidiaryId) return [];
  let forms = await listAccessibleForms(ctx.subsidiaryId, ctx.userId);
  if (filters.status) forms = forms.filter((f) => f.status === filters.status);
  if (filters.projectCode) forms = forms.filter((f) => f.projectCode === filters.projectCode);
  if (filters.search) {
    const needle = filters.search.toLowerCase();
    forms = forms.filter((f) => f.name.toLowerCase().includes(needle));
  }
  return forms.slice(0, SCAN_FORM_LIMIT);
}

/** Same access rule as `listCallerForms`, for a single form by id — returns
 * null identically whether the form doesn't exist or the caller can't see
 * it, matching this codebase's "never leak which case occurred" ownership
 * convention (see uploadService.findOwnedUpload's own doc comment). */
export async function getCallerFormDetail(ctx: AiToolCallerContext, formId: string): Promise<FormDetail | null> {
  if (isAdminRole(ctx.role)) return getFormDetail(formId);
  if (!ctx.subsidiaryId) return null;
  return getAccessibleFormDetail(formId, ctx.subsidiaryId);
}

function toCompactCampaign(formId: string, name: string, status: string, detail: FormDetail): CompactCampaign {
  const content = detail.draft ?? detail.published;
  if (!content) {
    return { formId, name, status, locales: [], defaultLocale: "", questions: [] };
  }
  const { definition } = content;
  return {
    formId,
    name,
    status,
    locales: definition.locales.map((l) => l.code),
    defaultLocale: definition.meta.defaultLocale,
    questions: definition.questions
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((q) => ({
        id: q.id,
        heading: resolveLocalizedText(q.headingByLocale, definition.meta.defaultLocale, definition.meta.defaultLocale),
        controlType: q.controlType,
        required: q.required,
      })),
  };
}

export async function searchCampaigns(ctx: AiToolCallerContext, args: SearchCampaignsArgs): Promise<CampaignSearchResult[]> {
  const forms = await listCallerForms(ctx, { search: args.searchText, projectCode: args.projectCode, status: args.status });
  return forms.slice(0, RESULT_LIMIT).map((f) => ({
    formId: f.id,
    name: f.name,
    status: f.status,
    projectCode: f.projectCode,
    questionCount: 0, // list items don't carry parsed content; see getCampaign for a full question list
    updatedAt: f.updatedAt.toISOString(),
  }));
}

export async function getCampaign(ctx: AiToolCallerContext, args: GetCampaignArgs): Promise<CompactCampaign | null> {
  const detail = await getCallerFormDetail(ctx, args.formId);
  if (!detail) return null;
  return toCompactCampaign(detail.id, detail.name, detail.status, detail);
}

export async function getCampaignQuestions(ctx: AiToolCallerContext, args: GetCampaignQuestionsArgs): Promise<CompactQuestion[] | null> {
  const campaign = await getCampaign(ctx, { formId: args.formId });
  return campaign ? campaign.questions : null;
}

/** Lowercased, punctuation-stripped word set — the unit both the "search" and
 * "similar" keyword scans compare on. Deliberately naive (no stemming/
 * stopwords) — see this file's own doc comment on why that's fine for v1. */
function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/i)
      .filter((t) => t.length > 1),
  );
}

function overlapScore(a: Set<string>, b: Set<string>): number {
  let score = 0;
  for (const token of a) if (b.has(token)) score++;
  return score;
}

export async function searchQuestions(ctx: AiToolCallerContext, args: SearchQuestionsArgs): Promise<QuestionSearchResult[]> {
  const forms = args.formId
    ? [await getCallerFormDetail(ctx, args.formId)].filter((f): f is FormDetail => f !== null)
    : await Promise.all((await listCallerForms(ctx)).map((f) => getCallerFormDetail(ctx, f.id))).then((rows) =>
        rows.filter((f): f is FormDetail => f !== null),
      );

  const needle = args.searchText.toLowerCase();
  const results: QuestionSearchResult[] = [];
  for (const form of forms) {
    const content = form.draft ?? form.published;
    if (!content) continue;
    for (const q of content.definition.questions) {
      const heading = resolveLocalizedText(q.headingByLocale, content.definition.meta.defaultLocale, content.definition.meta.defaultLocale);
      if (heading.toLowerCase().includes(needle)) {
        results.push({ formId: form.id, formName: form.name, questionId: q.id, heading, controlType: q.controlType });
      }
    }
    if (results.length >= RESULT_LIMIT) break;
  }
  return results.slice(0, RESULT_LIMIT);
}

export async function findSimilarCampaigns(ctx: AiToolCallerContext, args: FindSimilarCampaignsArgs): Promise<CampaignSearchResult[]> {
  const target = await getCallerFormDetail(ctx, args.formId);
  if (!target) return [];
  const targetTokens = tokenize(target.name);

  const candidates = await listCallerForms(ctx);
  const scored = candidates
    .filter((f) => f.id !== args.formId)
    .map((f) => ({ form: f, score: overlapScore(targetTokens, tokenize(f.name)) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, RESULT_LIMIT);

  return scored.map(({ form }) => ({
    formId: form.id,
    name: form.name,
    status: form.status,
    projectCode: form.projectCode,
    questionCount: 0,
    updatedAt: form.updatedAt.toISOString(),
  }));
}

export async function findSimilarQuestions(ctx: AiToolCallerContext, args: FindSimilarQuestionsArgs): Promise<QuestionSearchResult[]> {
  let targetText = args.text ?? "";
  if (!targetText && args.formId && args.questionId) {
    const campaign = await getCampaign(ctx, { formId: args.formId });
    targetText = campaign?.questions.find((q) => q.id === args.questionId)?.heading ?? "";
  }
  if (!targetText) return [];
  const targetTokens = tokenize(targetText);

  const forms = await Promise.all((await listCallerForms(ctx)).map((f) => getCallerFormDetail(ctx, f.id))).then((rows) =>
    rows.filter((f): f is FormDetail => f !== null),
  );

  const results: { result: QuestionSearchResult; score: number }[] = [];
  for (const form of forms) {
    const content = form.draft ?? form.published;
    if (!content) continue;
    for (const q of content.definition.questions) {
      if (args.formId && args.questionId && form.id === args.formId && q.id === args.questionId) continue;
      const heading = resolveLocalizedText(q.headingByLocale, content.definition.meta.defaultLocale, content.definition.meta.defaultLocale);
      const score = overlapScore(targetTokens, tokenize(heading));
      if (score > 0) {
        results.push({ result: { formId: form.id, formName: form.name, questionId: q.id, heading, controlType: q.controlType }, score });
      }
    }
  }
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, RESULT_LIMIT)
    .map((r) => r.result);
}

export async function validateForm(ctx: AiToolCallerContext, args: ValidateFormArgs): Promise<ValidationResult | null> {
  const detail = await getCallerFormDetail(ctx, args.formId);
  const content = detail?.draft ?? detail?.published;
  if (!content) return null;
  return validateFormDefinition(content.definition);
}

/** Builds `AIChatResponse.references` for a SEARCH_CAMPAIGNS/FIND_SIMILAR_CAMPAIGNS
 * tool result — fetches each candidate's full detail (bounded by the RESULT_LIMIT-sized
 * input list, so at most a handful of extra reads) to fill in `locales`/`questionCount`,
 * which the plain search-result rows above don't carry. Silently drops a formId that's
 * no longer accessible (e.g. unpublished between the search and this call) rather than
 * failing the whole response. */
export async function buildCampaignReferences(ctx: AiToolCallerContext, results: CampaignSearchResult[]): Promise<AICampaignReference[]> {
  const details = await Promise.all(results.map((r) => getCallerFormDetail(ctx, r.formId)));
  const references: AICampaignReference[] = [];
  for (let i = 0; i < results.length; i++) {
    const detail = details[i];
    if (!detail) continue;
    const content = detail.draft ?? detail.published;
    references.push({
      formId: results[i].formId,
      name: results[i].name,
      status: results[i].status,
      questionCount: content?.definition.questions.length ?? 0,
      locales: content?.definition.locales.map((l) => l.code) ?? [],
      updatedAt: results[i].updatedAt,
    });
  }
  return references;
}

/** Referenced by aiAssistantService.ts when it needs a QuestionDefinition's
 * heading purely for logging/echoing purposes — kept here alongside the
 * other question-shaped helpers rather than duplicated. */
export function questionHeading(question: QuestionDefinition, defaultLocale: string): string {
  return resolveLocalizedText(question.headingByLocale, defaultLocale, defaultLocale);
}
