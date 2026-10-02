import { useEffect, useState } from "react";
import { Box, Button, Chip, CircularProgress, Stack, TextField, Typography } from "@mui/material";
import type { FormVariant } from "@formbuilder/shared";
import * as aiChatApi from "../../api/aiChatApi";
import type { QuestionSearchResult } from "../../api/aiChatApi";
import { ApiError } from "../../api/apiClient";
import { isAdminRole, useAuthStore } from "../../auth/authStore";
import { listSubsidiaries, type Subsidiary } from "../../api/subsidiariesApi";
import { listOpenProjectCodes, type ProjectCode } from "../../api/projectCodesApi";
import { listSubsidiaryLocales, type SubsidiaryLocale } from "../../api/subsidiaryLocalesApi";
import { GUIDED_STEPS, PROFILE_FIELD_OPTIONS, useGuidedCampaignStore, type GuidedStep } from "../../store/guidedCampaignStore";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { EditableQuestionRow } from "./EditableQuestionRow";
import { ProposalCard } from "./ProposalCard";
import { showToast } from "../../store/toastStore";

const CATEGORY_SUGGESTIONS = [
  "Hand Raiser", "NPS", "R-NPS Detractor", "Product Registration",
  "Warranty Registration", "Lead Generation", "Customer Satisfaction",
];

const VARIANT_OPTIONS: { value: FormVariant[]; label: string }[] = [
  { value: ["ff"], label: "Full Form" },
  { value: ["oc"], label: "One-Click" },
  { value: ["ff", "oc"], label: "Both" },
];

const QUESTION_TEXT: Record<GuidedStep, string> = {
  category: "What campaign category would you like to create?",
  subsidiary: "Which subsidiary is this for?",
  projectCode: "Which project code should this use?",
  fields: "Which personal details should this form collect?",
  variant: "Full Form, One-Click, or both?",
  questions: "Here are questions used in similar campaigns — which should this one include? At least one is required.",
  locales: "Which languages should this support?",
  review: "",
};

/** One assistant "question" bubble — same visual language as AIChatMessage's
 * own assistant bubble, so the guided flow reads as the bot actually asking,
 * not a bolted-on form. */
function AssistantBubble({ children }: { children: string }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "flex-start", mb: 1 }}>
      <Box sx={{ maxWidth: "88%", px: 1.5, py: 1, borderRadius: 2, bgcolor: "action.hover" }}>
        <Typography variant="body2">{children}</Typography>
      </Box>
    </Box>
  );
}

/** A completed step's own answer, right-aligned like a user chat bubble. */
function AnswerBubble({ children }: { children: string }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1.5 }}>
      <Box sx={{ maxWidth: "88%", px: 1.5, py: 1, borderRadius: 2, bgcolor: "primary.main", color: "primary.contrastText" }}>
        <Typography variant="body2">{children}</Typography>
      </Box>
    </Box>
  );
}

function summarizeStep(step: GuidedStep): string {
  const s = useGuidedCampaignStore.getState();
  switch (step) {
    case "category":
      return `${s.name} (${s.category})`;
    case "subsidiary":
      return s.subsidiaryId;
    case "projectCode":
      return s.projectCode ?? "I'll decide later";
    case "fields":
      return s.fields.length > 0 ? PROFILE_FIELD_OPTIONS.filter((o) => s.fields.includes(o.key)).map((o) => o.label).join(", ") : "None";
    case "variant":
      return VARIANT_OPTIONS.find((v) => v.value.join(",") === s.variants.join(","))?.label ?? "Full Form";
    case "questions":
      return `${s.questions.length} question${s.questions.length === 1 ? "" : "s"} selected`;
    case "locales":
      return s.locales.length > 0 ? s.locales.join(", ") : "Same as the subsidiary's default";
    default:
      return "";
  }
}

function CategoryStep() {
  const name = useGuidedCampaignStore((s) => s.name);
  const category = useGuidedCampaignStore((s) => s.category);
  const setName = useGuidedCampaignStore((s) => s.setName);
  const setCategory = useGuidedCampaignStore((s) => s.setCategory);

  return (
    <Stack spacing={1.5}>
      <TextField label="Campaign name" size="small" autoFocus value={name} onChange={(e) => setName(e.target.value)} />
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {CATEGORY_SUGGESTIONS.map((c) => (
          <Chip key={c} label={c} color={category === c ? "primary" : "default"} onClick={() => setCategory(c)} />
        ))}
      </Stack>
      <TextField
        label="Or describe the category"
        size="small"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        placeholder="e.g. Back to School promotion"
      />
    </Stack>
  );
}

function SubsidiaryStep() {
  const subsidiaryId = useGuidedCampaignStore((s) => s.subsidiaryId);
  const setSubsidiaryId = useGuidedCampaignStore((s) => s.setSubsidiaryId);
  const [subsidiaries, setSubsidiaries] = useState<Subsidiary[]>([]);

  useEffect(() => {
    listSubsidiaries().then(setSubsidiaries).catch(() => undefined);
  }, []);

  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      {subsidiaries.map((s) => (
        <Chip key={s.id} label={s.name} color={subsidiaryId === s.name ? "primary" : "default"} onClick={() => setSubsidiaryId(s.name)} />
      ))}
    </Stack>
  );
}

function ProjectCodeStep() {
  const subsidiaryId = useGuidedCampaignStore((s) => s.subsidiaryId);
  const projectCode = useGuidedCampaignStore((s) => s.projectCode);
  const setProjectCode = useGuidedCampaignStore((s) => s.setProjectCode);
  const [codes, setCodes] = useState<ProjectCode[]>([]);

  useEffect(() => {
    if (!subsidiaryId) {
      setCodes([]);
      return;
    }
    listOpenProjectCodes(subsidiaryId).then(setCodes).catch(() => undefined);
  }, [subsidiaryId]);

  return (
    <Stack spacing={1}>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {codes.map((pc) => (
          <Chip key={pc.id} label={pc.code} color={projectCode === pc.code ? "primary" : "default"} onClick={() => setProjectCode(pc.code)} />
        ))}
        <Chip
          label="I don't have one yet"
          variant={projectCode === null ? "filled" : "outlined"}
          color={projectCode === null ? "primary" : "default"}
          onClick={() => setProjectCode(null)}
        />
      </Stack>
      {codes.length === 0 && (
        <Typography variant="caption" color="text.secondary">
          No open project codes for this subsidiary — leave it blank and an admin can assign one when it's submitted for review.
        </Typography>
      )}
    </Stack>
  );
}

function FieldsStep() {
  const fields = useGuidedCampaignStore((s) => s.fields);
  const toggleField = useGuidedCampaignStore((s) => s.toggleField);

  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      {PROFILE_FIELD_OPTIONS.map((o) => (
        <Chip key={o.key} label={o.label} color={fields.includes(o.key) ? "primary" : "default"} onClick={() => toggleField(o.key)} />
      ))}
    </Stack>
  );
}

function VariantStep() {
  const variants = useGuidedCampaignStore((s) => s.variants);
  const setVariants = useGuidedCampaignStore((s) => s.setVariants);

  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      {VARIANT_OPTIONS.map((o) => (
        <Chip
          key={o.label}
          label={o.label}
          color={variants.join(",") === o.value.join(",") ? "primary" : "default"}
          onClick={() => setVariants(o.value)}
        />
      ))}
    </Stack>
  );
}

function QuestionsStep() {
  const category = useGuidedCampaignStore((s) => s.category);
  const questions = useGuidedCampaignStore((s) => s.questions);
  const addSearchResult = useGuidedCampaignStore((s) => s.addSearchResult);
  const addDraftedQuestion = useGuidedCampaignStore((s) => s.addDraftedQuestion);
  const removeQuestion = useGuidedCampaignStore((s) => s.removeQuestion);
  const updateQuestionHeading = useGuidedCampaignStore((s) => s.updateQuestionHeading);
  const toggleAnswer = useGuidedCampaignStore((s) => s.toggleAnswer);
  const updateAnswerText = useGuidedCampaignStore((s) => s.updateAnswerText);

  const [searchText, setSearchText] = useState(category);
  const debouncedSearch = useDebouncedValue(searchText, 400);
  const [results, setResults] = useState<QuestionSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [draftTopic, setDraftTopic] = useState("");
  const [drafting, setDrafting] = useState(false);

  useEffect(() => {
    const text = debouncedSearch.trim();
    if (!text) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    aiChatApi
      .searchQuestions({ text, limit: 8 })
      .then((r) => {
        if (!cancelled) setResults(r.questions);
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setSearching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch]);

  const addedKeys = new Set(questions.map((q) => `${q.sourceFormId ?? ""}:${q.sourceQuestionId ?? ""}`));

  async function handleDraft() {
    const topic = draftTopic.trim();
    if (!topic) return;
    setDrafting(true);
    try {
      const drafted = await aiChatApi.draftQuestion({ topic, locale: "en_GB", defaultLocale: "en_GB" });
      addDraftedQuestion(drafted);
      setDraftTopic("");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Could not draft that question", "error");
    } finally {
      setDrafting(false);
    }
  }

  return (
    <Stack spacing={1.5}>
      <TextField
        label="Search existing questions"
        size="small"
        fullWidth
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        InputProps={{ endAdornment: searching ? <CircularProgress size={16} /> : undefined }}
      />

      {results.length > 0 && (
        <Stack spacing={1}>
          {results.map((r) => {
            const key = `${r.sourceFormId}:${r.sourceQuestionId}`;
            const already = addedKeys.has(key);
            return (
              <Stack
                key={key}
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ p: 1, border: "1px solid", borderColor: "divider", borderRadius: 1 }}
              >
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={600}>
                    {r.heading}
                  </Typography>
                  {r.answers.length > 0 && (
                    <Typography variant="caption" color="text.secondary">
                      {r.answers.map((a) => a.text).join(", ")}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                    from {r.formName}
                  </Typography>
                </Box>
                <Button size="small" variant={already ? "outlined" : "contained"} disabled={already} onClick={() => addSearchResult(r)}>
                  {already ? "Added" : "Add"}
                </Button>
              </Stack>
            );
          })}
        </Stack>
      )}

      <Stack direction="row" spacing={1} alignItems="center">
        <TextField
          label="Draft a custom question"
          size="small"
          fullWidth
          value={draftTopic}
          onChange={(e) => setDraftTopic(e.target.value)}
          placeholder="Describe the question you need"
        />
        <Button variant="outlined" disabled={drafting || !draftTopic.trim()} onClick={() => void handleDraft()}>
          {drafting ? "Drafting..." : "Draft"}
        </Button>
      </Stack>

      {questions.length > 0 && (
        <Stack spacing={1}>
          <Typography variant="subtitle2">Selected questions ({questions.length})</Typography>
          {questions.map((q, index) => (
            <EditableQuestionRow
              key={index}
              heading={q.heading}
              controlType={q.controlType}
              required={q.required}
              reused={q.reused}
              keep
              answers={q.answers}
              onToggleKeep={() => removeQuestion(index)}
              onHeadingChange={(value) => updateQuestionHeading(index, value)}
              onToggleAnswer={(aIndex) => toggleAnswer(index, aIndex)}
              onAnswerTextChange={(aIndex, value) => updateAnswerText(index, aIndex, value)}
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
}

function LocalesStep() {
  const subsidiaryId = useGuidedCampaignStore((s) => s.subsidiaryId);
  const locales = useGuidedCampaignStore((s) => s.locales);
  const toggleLocale = useGuidedCampaignStore((s) => s.toggleLocale);
  const [master, setMaster] = useState<SubsidiaryLocale[]>([]);

  useEffect(() => {
    if (!subsidiaryId) {
      setMaster([]);
      return;
    }
    listSubsidiaryLocales(subsidiaryId).then(setMaster).catch(() => undefined);
  }, [subsidiaryId]);

  return (
    <Stack spacing={1}>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {master.map((l) => (
          <Chip key={l.id} label={l.label} color={locales.includes(l.code) ? "primary" : "default"} onClick={() => toggleLocale(l.code)} />
        ))}
      </Stack>
      {master.length === 0 && (
        <Typography variant="caption" color="text.secondary">
          No locales configured for this subsidiary yet — it'll use the subsidiary's own default.
        </Typography>
      )}
    </Stack>
  );
}

function ReviewStep({ onApproved }: { onApproved: (formId: string) => void | Promise<void> }) {
  const proposal = useGuidedCampaignStore((s) => s.proposal);
  const submitting = useGuidedCampaignStore((s) => s.submitting);
  const error = useGuidedCampaignStore((s) => s.error);
  const back = useGuidedCampaignStore((s) => s.back);

  if (!proposal) {
    return (
      <Stack spacing={1} alignItems="flex-start" sx={{ py: 1 }}>
        {submitting ? (
          <CircularProgress size={20} />
        ) : (
          <>
            <Typography color="error" variant="body2">
              {error ?? "Something went wrong."}
            </Typography>
            <Button size="small" onClick={back}>
              Back
            </Button>
          </>
        )}
      </Stack>
    );
  }
  return <ProposalCard proposal={proposal} onApproved={onApproved} />;
}

const STEP_COMPONENT: Record<GuidedStep, React.ComponentType> = {
  category: CategoryStep,
  subsidiary: SubsidiaryStep,
  projectCode: ProjectCodeStep,
  fields: FieldsStep,
  variant: VariantStep,
  questions: QuestionsStep,
  locales: LocalesStep,
  review: () => null,
};

/**
 * Renders inside AIChatPanel in place of free-form messages while a guided
 * "create a new campaign" flow is active (see guidedCampaignStore.ts). Shows
 * every completed step as a Q&A bubble pair (same visual language as a real
 * chat exchange) followed by the current step's question + interactive
 * chips/fields. The final step hands off to the real ProposalCard — Approve
 * & Save applies any selected profile fields/variant/locales onto the new
 * draft before navigating (finalizeAfterApprove).
 */
export function GuidedCampaignFlow() {
  const stepIndex = useGuidedCampaignStore((s) => s.stepIndex);
  const name = useGuidedCampaignStore((s) => s.name);
  const category = useGuidedCampaignStore((s) => s.category);
  const subsidiaryId = useGuidedCampaignStore((s) => s.subsidiaryId);
  const questions = useGuidedCampaignStore((s) => s.questions);
  const submitting = useGuidedCampaignStore((s) => s.submitting);
  const next = useGuidedCampaignStore((s) => s.next);
  const back = useGuidedCampaignStore((s) => s.back);
  const submit = useGuidedCampaignStore((s) => s.submit);
  const setSubsidiaryId = useGuidedCampaignStore((s) => s.setSubsidiaryId);
  const finalizeAfterApprove = useGuidedCampaignStore((s) => s.finalizeAfterApprove);
  const resetGuided = useGuidedCampaignStore((s) => s.reset);
  const user = useAuthStore((s) => s.user);
  const isAdmin = isAdminRole(user?.role);

  async function handleApproved(formId: string) {
    await finalizeAfterApprove(formId);
    resetGuided();
  }

  const step = GUIDED_STEPS[stepIndex];
  const isLastBeforeReview = GUIDED_STEPS[stepIndex + 1] === "review";
  const StepComponent = STEP_COMPONENT[step];

  // A standard/subsidiary user's own campaign is always for their own
  // subsidiary — only an admin picks one, so skip straight past this step.
  useEffect(() => {
    if (step === "subsidiary" && !isAdmin) {
      setSubsidiaryId(user?.subsidiaryId ?? "");
      next();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, isAdmin]);

  const canAdvance =
    step === "category"
      ? name.trim() !== "" && category.trim() !== ""
      : step === "subsidiary"
        ? subsidiaryId.trim() !== ""
        : step === "questions"
          ? questions.length > 0
          : true;

  async function handleNext() {
    if (isLastBeforeReview) {
      const ok = await submit();
      if (ok) next();
      return;
    }
    next();
  }

  return (
    <Box sx={{ mb: 1 }}>
      {GUIDED_STEPS.slice(0, stepIndex).map((s) =>
        s === "review" ? null : (
          <Box key={s}>
            <AssistantBubble>{QUESTION_TEXT[s]}</AssistantBubble>
            <AnswerBubble>{summarizeStep(s)}</AnswerBubble>
          </Box>
        ),
      )}

      {step !== "review" && (
        <>
          <AssistantBubble>{QUESTION_TEXT[step]}</AssistantBubble>
          <Box sx={{ pl: 0.5, mb: 1.5 }}>
            <StepComponent />
          </Box>
          <Stack direction="row" spacing={1}>
            {stepIndex > 0 && (
              <Button size="small" onClick={back} disabled={submitting}>
                Back
              </Button>
            )}
            <Button size="small" variant="contained" disabled={!canAdvance || submitting} onClick={() => void handleNext()}>
              {submitting ? "Creating..." : isLastBeforeReview ? "Review" : "Next"}
            </Button>
          </Stack>
        </>
      )}

      {step === "review" && (
        <>
          <AssistantBubble>Here's the draft — review and approve, or tell me what to change.</AssistantBubble>
          <ReviewStep onApproved={handleApproved} />
        </>
      )}
    </Box>
  );
}
