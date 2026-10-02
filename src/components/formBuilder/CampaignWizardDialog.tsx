import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Step,
  StepLabel,
  Stepper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import * as aiChatApi from "../../api/aiChatApi";
import type { QuestionSearchResult } from "../../api/aiChatApi";
import { ApiError } from "../../api/apiClient";
import { listSubsidiaries, type Subsidiary } from "../../api/subsidiariesApi";
import { listOpenProjectCodes, type ProjectCode } from "../../api/projectCodesApi";
import { useCampaignWizardStore, WIZARD_STEPS, type WizardStep } from "../../store/campaignWizardStore";
import { useResponsiveDialogProps } from "../../hooks/useResponsiveDialog";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { EditableQuestionRow } from "../ai/EditableQuestionRow";
import { ProposalCard } from "../ai/ProposalCard";
import { showToast } from "../../store/toastStore";

const CATEGORY_SUGGESTIONS = [
  "Hand Raiser", "NPS", "R-NPS Detractor", "Product Registration",
  "Warranty Registration", "Lead Generation", "Customer Satisfaction",
];

const STEP_LABEL: Record<WizardStep, string> = {
  category: "Campaign",
  subsidiary: "Subsidiary",
  projectCode: "Project code",
  questions: "Questions",
  review: "Review",
};

function CategoryStep() {
  const name = useCampaignWizardStore((s) => s.name);
  const category = useCampaignWizardStore((s) => s.category);
  const setName = useCampaignWizardStore((s) => s.setName);
  const setCategory = useCampaignWizardStore((s) => s.setCategory);

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        What campaign category would you like to create?
      </Typography>
      <TextField label="Campaign name" size="small" autoFocus required value={name} onChange={(e) => setName(e.target.value)} />
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
  const subsidiaryId = useCampaignWizardStore((s) => s.subsidiaryId);
  const setSubsidiaryId = useCampaignWizardStore((s) => s.setSubsidiaryId);
  const [subsidiaries, setSubsidiaries] = useState<Subsidiary[]>([]);

  useEffect(() => {
    listSubsidiaries().then(setSubsidiaries).catch(() => undefined);
  }, []);

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        Which subsidiary is this campaign for?
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {subsidiaries.map((s) => (
          <Chip key={s.id} label={s.name} color={subsidiaryId === s.name ? "primary" : "default"} onClick={() => setSubsidiaryId(s.name)} />
        ))}
      </Stack>
    </Stack>
  );
}

function ProjectCodeStep() {
  const subsidiaryId = useCampaignWizardStore((s) => s.subsidiaryId);
  const projectCode = useCampaignWizardStore((s) => s.projectCode);
  const setProjectCode = useCampaignWizardStore((s) => s.setProjectCode);
  const [codes, setCodes] = useState<ProjectCode[]>([]);

  useEffect(() => {
    if (!subsidiaryId) {
      setCodes([]);
      return;
    }
    listOpenProjectCodes(subsidiaryId).then(setCodes).catch(() => undefined);
  }, [subsidiaryId]);

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        Which project code should this use? You can also decide later.
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {codes.map((pc) => (
          <Chip key={pc.id} label={pc.code} color={projectCode === pc.code ? "primary" : "default"} onClick={() => setProjectCode(pc.code)} />
        ))}
        <Chip
          label="Decide later"
          variant={projectCode === null ? "filled" : "outlined"}
          color={projectCode === null ? "primary" : "default"}
          onClick={() => setProjectCode(null)}
        />
      </Stack>
      {codes.length === 0 && (
        <Typography variant="caption" color="text.secondary">
          No open project codes for this subsidiary yet — leave it blank and an admin can assign one when it's submitted for review.
        </Typography>
      )}
    </Stack>
  );
}

function QuestionsStep() {
  const category = useCampaignWizardStore((s) => s.category);
  const questions = useCampaignWizardStore((s) => s.questions);
  const addSearchResult = useCampaignWizardStore((s) => s.addSearchResult);
  const addDraftedQuestion = useCampaignWizardStore((s) => s.addDraftedQuestion);
  const removeQuestion = useCampaignWizardStore((s) => s.removeQuestion);
  const updateQuestionHeading = useCampaignWizardStore((s) => s.updateQuestionHeading);
  const toggleAnswer = useCampaignWizardStore((s) => s.toggleAnswer);
  const updateAnswerText = useCampaignWizardStore((s) => s.updateAnswerText);

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
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        Search for questions used in similar campaigns, or draft a new one. At least one question is required.
      </Typography>
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

function ReviewStep({ onApproved }: { onApproved: () => void }) {
  const proposal = useCampaignWizardStore((s) => s.proposal);
  const submitting = useCampaignWizardStore((s) => s.submitting);
  const error = useCampaignWizardStore((s) => s.error);

  if (!proposal) {
    return (
      <Stack spacing={2} alignItems="center" sx={{ py: 4 }}>
        {submitting ? <CircularProgress /> : <Typography color="error">{error ?? "Something went wrong."}</Typography>}
      </Stack>
    );
  }
  return <ProposalCard proposal={proposal} onApproved={onApproved} />;
}

/**
 * "New Form (Guided)" — a token-efficient alternative to describing a new
 * campaign in free-form chat: every step is a plain REST lookup or a click
 * (listSubsidiaries/listOpenProjectCodes/searchQuestions), not an LLM call.
 * The only LLM-touching step is drafting a custom question when nothing in
 * the library fits (POST /ai/questions/draft). The final step submits the
 * exact same proposal shape the chat flow produces (POST /ai/wizard/proposals)
 * and hands off to the existing ProposalCard for Approve & Save — unchanged.
 *
 * Always produces an admin-origin campaign — see campaignWizardStore.ts's own
 * doc comment for why this isn't offered from Ad-hoc Forms.
 */
export function CampaignWizardDialog() {
  const responsiveDialogProps = useResponsiveDialogProps();
  const open = useCampaignWizardStore((s) => s.open);
  const stepIndex = useCampaignWizardStore((s) => s.stepIndex);
  const name = useCampaignWizardStore((s) => s.name);
  const category = useCampaignWizardStore((s) => s.category);
  const subsidiaryId = useCampaignWizardStore((s) => s.subsidiaryId);
  const questions = useCampaignWizardStore((s) => s.questions);
  const submitting = useCampaignWizardStore((s) => s.submitting);
  const close = useCampaignWizardStore((s) => s.close);
  const next = useCampaignWizardStore((s) => s.next);
  const back = useCampaignWizardStore((s) => s.back);
  const submit = useCampaignWizardStore((s) => s.submit);

  const step = WIZARD_STEPS[stepIndex];
  const isLastBeforeReview = WIZARD_STEPS[stepIndex + 1] === "review";

  const canAdvance =
    step === "category"
      ? name.trim() !== "" && category.trim() !== ""
      : step === "subsidiary"
        ? subsidiaryId.trim() !== ""
        : step === "projectCode"
          ? true
          : step === "questions"
            ? questions.length > 0
            : false;

  async function handleNext() {
    if (isLastBeforeReview) {
      const ok = await submit();
      if (ok) next();
      return;
    }
    next();
  }

  return (
    <Dialog {...responsiveDialogProps} open={open} onClose={close} maxWidth="md" fullWidth>
      <DialogTitle>New Form (Guided)</DialogTitle>
      <DialogContent>
        <Stepper activeStep={stepIndex} sx={{ mb: 3 }}>
          {WIZARD_STEPS.map((s) => (
            <Step key={s}>
              <StepLabel>{STEP_LABEL[s]}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {step === "category" && <CategoryStep />}
        {step === "subsidiary" && <SubsidiaryStep />}
        {step === "projectCode" && <ProjectCodeStep />}
        {step === "questions" && <QuestionsStep />}
        {step === "review" && <ReviewStep onApproved={close} />}
      </DialogContent>
      {step !== "review" && (
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={close}>Cancel</Button>
          {stepIndex > 0 && (
            <Button onClick={back} disabled={submitting}>
              Back
            </Button>
          )}
          <Button variant="contained" disabled={!canAdvance || submitting} onClick={() => void handleNext()}>
            {submitting ? "Creating..." : isLastBeforeReview ? "Review" : "Next"}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}
