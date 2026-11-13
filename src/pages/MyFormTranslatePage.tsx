import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import TranslateIcon from "@mui/icons-material/Translate";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SaveIcon from "@mui/icons-material/Save";
import SendIcon from "@mui/icons-material/Send";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import { useResponsiveDialogProps } from "../hooks/useResponsiveDialog";
import { resolveLocalizedText } from "@formbuilder/shared";
import { useFormContributionStore } from "../store/formContributionStore";
import { FormStatusBar, type FormStatusTone } from "../components/common/FormStatusBar";
import { PageBreadcrumbs } from "../components/common/PageBreadcrumbs";
import { listMyContributions, CONTRIBUTION_STATUS_LABEL, type ContributionStatus } from "../api/subsidiaryFormsApi";
import { TranslatableField } from "../components/formContribution/TranslatableField";
import { AddQuestionDialog } from "../components/formContribution/AddQuestionDialog";
import { AddAnswerDialog } from "../components/formContribution/AddAnswerDialog";
import { AddConsentDialog } from "../components/formContribution/AddConsentDialog";
import { ContributionPreviewDialog } from "../components/formContribution/ContributionPreviewDialog";
import { autoPopulateParamName, CONTROL_TYPE_LABEL } from "../components/formBuilder/formBuilderHelpers";
import { useSaveShortcut } from "../hooks/useSaveShortcut";
import { unsavedChangesBlinkSx } from "../components/formBuilder/unsavedChangesBlinkSx";
import { showToast } from "../store/toastStore";

const STATUS_COLOR: Record<ContributionStatus, "default" | "success" | "error"> = {
  draft: "default",
  pending: "default",
  approved: "success",
  rejected: "error",
};

const PROFILE_FIELDS: Array<{ key: "firstName" | "lastName" | "email" | "mobileNumber"; label: string }> = [
  { key: "firstName", label: "First Name" },
  { key: "lastName", label: "Last Name" },
  { key: "email", label: "Email" },
  { key: "mobileNumber", label: "Mobile Number" },
];

/**
 * The subsidiary-user "Translate & Extend" screen — reads the form's *published*
 * content read-only and lets the user add/update translations for any locale the
 * admin has added to the form, including its default one, plus entirely new
 * questions/consents of their own (see formContributionStore/contribution.ts).
 * "Save Draft" (or Ctrl+S) persists the working copy as this user's own scratch
 * space without notifying an admin; "Submit for review" queues it as a
 * FormContribution an admin must approve — see formContributionStore's own
 * saveDraft/submit and the "draft" ContributionStatus.
 */
export function MyFormTranslatePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const loading = useFormContributionStore((s) => s.loading);
  const error = useFormContributionStore((s) => s.error);
  const formId = useFormContributionStore((s) => s.formId);
  const formName = useFormContributionStore((s) => s.formName);
  const baseDefinition = useFormContributionStore((s) => s.baseDefinition);
  const translatableLocales = useFormContributionStore((s) => s.translatableLocales);
  const locale = useFormContributionStore((s) => s.locale);
  const setLocale = useFormContributionStore((s) => s.setLocale);
  const newQuestions = useFormContributionStore((s) => s.newQuestions);
  const removeQuestion = useFormContributionStore((s) => s.removeQuestion);
  const newConsents = useFormContributionStore((s) => s.newConsents);
  const removeConsent = useFormContributionStore((s) => s.removeConsent);
  const autoPopulateToggles = useFormContributionStore((s) => s.autoPopulateToggles);
  const setAutoPopulateToggle = useFormContributionStore((s) => s.setAutoPopulateToggle);
  const deletedQuestionIds = useFormContributionStore((s) => s.deletedQuestionIds);
  const toggleQuestionDeleted = useFormContributionStore((s) => s.toggleQuestionDeleted);
  const newAnswersForExisting = useFormContributionStore((s) => s.newAnswersForExisting);
  const addAnswerToQuestion = useFormContributionStore((s) => s.addAnswerToQuestion);
  const removeNewAnswer = useFormContributionStore((s) => s.removeNewAnswer);
  const deletedAnswerIds = useFormContributionStore((s) => s.deletedAnswerIds);
  const toggleAnswerDeleted = useFormContributionStore((s) => s.toggleAnswerDeleted);
  const note = useFormContributionStore((s) => s.note);
  const setNote = useFormContributionStore((s) => s.setNote);
  const validation = useFormContributionStore((s) => s.validation);
  const submitting = useFormContributionStore((s) => s.submitting);
  const submit = useFormContributionStore((s) => s.submit);
  const savingDraft = useFormContributionStore((s) => s.savingDraft);
  const saveDraft = useFormContributionStore((s) => s.saveDraft);
  const dirty = useFormContributionStore((s) => s.dirty);
  const loadForm = useFormContributionStore((s) => s.loadForm);
  const reset = useFormContributionStore((s) => s.reset);
  const ownContributions = useFormContributionStore((s) => s.ownContributions);
  const syncOwnContributions = useFormContributionStore((s) => s.syncOwnContributions);
  const locked = useFormContributionStore((s) => s.locked);
  const lockedContribution = useFormContributionStore((s) => s.lockedContribution);
  const projectLocked = useFormContributionStore((s) => s.projectLocked);
  const editLockedPostDeploy = useFormContributionStore((s) => s.editLockedPostDeploy);
  const updateRequest = useFormContributionStore((s) => s.updateRequest);
  const requestingUpdate = useFormContributionStore((s) => s.requestingUpdate);
  const requestUpdate = useFormContributionStore((s) => s.requestUpdate);

  const [addQuestionOpen, setAddQuestionOpen] = useState(false);
  const [addAnswerForQuestionId, setAddAnswerForQuestionId] = useState<string | null>(null);
  const [addConsentOpen, setAddConsentOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestNote, setRequestNote] = useState("");
  const responsiveDialogProps = useResponsiveDialogProps();

  // An approved, not-yet-consumed update request is the one thing that
  // reopens editing once the form's actually been deployed — see
  // form_update_request_service.py's own doc comment (same meaning as
  // AdHocActionBar.tsx's own hasOpenUpdateRequest). A merely "pending" or
  // "rejected" request still leaves editLockedPostDeploy in effect.
  const hasOpenUpdateRequest = updateRequest?.status === "approved";
  const effectivelyLocked = locked || projectLocked || (editLockedPostDeploy && !hasOpenUpdateRequest);

  async function handleRequestUpdate() {
    const ok = await requestUpdate(requestNote.trim() || undefined);
    if (ok) {
      setRequestOpen(false);
      setRequestNote("");
      showToast("Update request sent.", "success");
    }
  }

  useEffect(() => {
    if (error) showToast(error, "error");
  }, [error]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    // Sequenced, not parallel effects: syncOwnContributions must run *after*
    // loadForm's own `set()` finishes, since loadForm unconditionally resets
    // translations/newQuestions/newConsents to empty — running the two concurrently
    // could let loadForm's reset clobber a just-applied pending/rejected prefill
    // depending on which promise happens to resolve second.
    (async () => {
      await loadForm(id);
      if (cancelled) return;
      try {
        const contributions = await listMyContributions(id);
        if (!cancelled) syncOwnContributions(contributions);
      } catch {
        // Own-contribution status is a nice-to-have overlay on top of the form
        // itself — a failure here shouldn't block viewing/translating the form.
      }
    })();
    return () => {
      cancelled = true;
      reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleSaveDraft() {
    const ok = await saveDraft();
    if (ok) showToast("Draft saved.", "success");
  }

  useSaveShortcut(() => void handleSaveDraft(), dirty && !savingDraft && !effectivelyLocked);

  async function handleSubmit() {
    const ok = await submit();
    if (ok) {
      showToast("Submitted for review.", "success");
      if (id) {
        try {
          syncOwnContributions(await listMyContributions(id));
        } catch {
          // Non-fatal — the submission itself already succeeded.
        }
      }
    }
  }

  if (loading || !baseDefinition) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        {loading ? <CircularProgress /> : <Typography color="error">{error ?? "Form not found."}</Typography>}
      </Box>
    );
  }

  const defaultLocale = baseDefinition.meta.defaultLocale;

  // Same precedence MyAdHocFormEditorPage's own status bar uses: a locked
  // project blocks everything, a pending submission beats an older
  // approved/rejected one, and with neither, the most recent contribution
  // (if any) decides; no submission at all just reads as a plain draft.
  const latestContribution = ownContributions[0] ?? null;
  const statusTone: FormStatusTone = projectLocked
    ? "locked"
    : editLockedPostDeploy && !hasOpenUpdateRequest
      ? "locked"
      : locked
        ? "pending"
        : latestContribution?.status === "approved"
          ? "approved"
          : latestContribution?.status === "rejected"
            ? "rejected"
            : "draft";
  const statusLabel = projectLocked
    ? "Project locked"
    : editLockedPostDeploy && !hasOpenUpdateRequest
      ? "Deployed — locked"
      : locked
        ? "Pending review"
        : latestContribution?.status === "approved"
          ? "Approved"
          : latestContribution?.status === "rejected"
            ? "Rejected — editing enabled"
            : latestContribution?.status === "draft"
              ? "Draft saved"
              : "No submissions yet";
  const statusDescription = projectLocked
    ? "No further submissions can be made for this project."
    : editLockedPostDeploy && !hasOpenUpdateRequest
      ? "This form has been deployed — request an update if you need to make a change."
      : locked && lockedContribution
      ? `Submitted ${new Date(lockedContribution.submittedAt).toLocaleString()}`
      : latestContribution?.status === "rejected"
        ? (latestContribution.reviewNote ?? "You can make changes and submit again.")
        : latestContribution?.status === "approved"
          ? `Reviewed ${latestContribution.reviewedAt ? new Date(latestContribution.reviewedAt).toLocaleString() : ""}`
          : latestContribution?.status === "draft"
            ? `Last saved ${new Date(latestContribution.submittedAt).toLocaleString()} — not yet submitted for review.`
            : undefined;

  return (
    <Box>
      <PageBreadcrumbs items={[{ label: "Flagship HR", to: "/my-forms/hr" }, { label: formName }]} />
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <IconButton onClick={() => navigate("/my-forms")} aria-label="Back to My Forms">
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ width: 44, height: 44, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "primary.main", color: "primary.contrastText" }}>
          <TranslateIcon />
        </Box>
        <Typography variant="h4" component="h1" sx={{ lineHeight: 1.1, flexGrow: 1 }}>
          {formName}
        </Typography>
        <Button variant="outlined" size="small" startIcon={<VisibilityIcon />} onClick={() => setPreviewOpen(true)}>
          Preview
        </Button>
      </Stack>

      <FormStatusBar tone={statusTone} label={statusLabel} description={statusDescription} />

      {projectLocked && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
          This project has been locked by an admin — no further translations, questions, or consents can be
          submitted for it. You can still browse the form below.
        </Alert>
      )}

      {!projectLocked && editLockedPostDeploy && hasOpenUpdateRequest && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
          Update approved — you can submit changes again.
        </Alert>
      )}

      {!projectLocked && editLockedPostDeploy && !hasOpenUpdateRequest && updateRequest?.status === "pending" && (
        <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
          Update request sent — awaiting admin approval.
        </Alert>
      )}

      {!projectLocked && editLockedPostDeploy && !hasOpenUpdateRequest && updateRequest?.status !== "pending" && (
        <Alert
          severity={updateRequest?.status === "rejected" ? "warning" : "info"}
          sx={{ mb: 2, borderRadius: 2 }}
          action={
            <Button color="inherit" size="small" startIcon={<LockOpenIcon />} onClick={() => setRequestOpen(true)}>
              Request Update
            </Button>
          }
        >
          {updateRequest?.status === "rejected" ? (
            <>
              <Typography variant="body2" fontWeight={600}>
                Your update request was rejected{updateRequest.reviewNote ? ":" : "."}
              </Typography>
              {updateRequest.reviewNote}
            </>
          ) : (
            "This form has been deployed — no further translations, questions, or consents can be submitted until an admin approves an update request."
          )}
        </Alert>
      )}

      {locked && (
        <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
          You have a submission pending admin review{lockedContribution ? ` (submitted ${new Date(lockedContribution.submittedAt).toLocaleString()})` : ""}.
          The fields below show what you submitted. You'll be able to make further changes once it's been approved or
          rejected.
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
        <TextField select label="Translating into" size="small" value={locale} onChange={(e) => setLocale(e.target.value)} sx={{ minWidth: 200 }}>
          {translatableLocales.map((code) => (
            <MenuItem key={code} value={code}>
              {code}
              {code === defaultLocale ? " (default)" : ""}
            </MenuItem>
          ))}
        </TextField>
        {locked && (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
            Still browsable while locked — switch locales to see what was submitted for each.
          </Typography>
        )}
      </Paper>

      <Box component="fieldset" disabled={effectivelyLocked} sx={{ border: 0, m: 0, p: 0, opacity: effectivelyLocked ? 0.65 : 1 }}>
      {locale && (
        <>
          <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
              Campaign heading
            </Typography>
            <Stack spacing={2}>
              <TranslatableField
                label="Campaign heading (One-Click)"
                target={{ kind: "campaignHeading" }}
                existingValue={resolveLocalizedText(baseDefinition.fields.headingBeforeBreakByLocale, locale, defaultLocale)}
                byLocale={baseDefinition.fields.headingBeforeBreakByLocale}
              />
              <TranslatableField
                label="Campaign subheading (One-Click)"
                target={{ kind: "campaignSubheading" }}
                existingValue={resolveLocalizedText(baseDefinition.fields.campaignSubheadingByLocale, locale, defaultLocale)}
                byLocale={baseDefinition.fields.campaignSubheadingByLocale}
              />
              <TranslatableField
                label="Campaign heading (Full Form override)"
                target={{ kind: "campaignHeadingFullForm" }}
                existingValue={resolveLocalizedText(baseDefinition.fields.headingBeforeBreakFFByLocale, locale, defaultLocale)}
                byLocale={baseDefinition.fields.headingBeforeBreakFFByLocale}
              />
              <TranslatableField
                label="Campaign subheading (Full Form override)"
                target={{ kind: "campaignSubheadingFullForm" }}
                existingValue={resolveLocalizedText(baseDefinition.fields.campaignSubheadingFFByLocale, locale, defaultLocale)}
                byLocale={baseDefinition.fields.campaignSubheadingFFByLocale}
              />
              <TranslatableField
                label="Submit button label"
                target={{ kind: "submitButtonLabel" }}
                existingValue={resolveLocalizedText(baseDefinition.fields.submitButton.labelByLocale, locale, defaultLocale)}
                byLocale={baseDefinition.fields.submitButton.labelByLocale}
              />
            </Stack>
          </Paper>

          <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
              Predefined fields
            </Typography>
            <Stack spacing={2}>
              {PROFILE_FIELDS.filter((f) => baseDefinition.fields[f.key]).map((f) => (
                <TranslatableField
                  key={f.key}
                  label={f.label}
                  target={{ kind: "profileLabel", field: f.key }}
                  existingValue={resolveLocalizedText(baseDefinition.fields[f.key]?.labelByLocale, locale, defaultLocale)}
                  byLocale={baseDefinition.fields[f.key]?.labelByLocale}
                />
              ))}
              {PROFILE_FIELDS.every((f) => !baseDefinition.fields[f.key]) && (
                <Typography variant="body2" color="text.secondary">
                  This form has no predefined fields.
                </Typography>
              )}
            </Stack>
          </Paper>

          <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
              Consent
            </Typography>
            <Stack spacing={2}>
              {baseDefinition.fields.privacyPolicy && (
                <Stack spacing={1}>
                  <TranslatableField
                    label="Privacy Policy text"
                    target={{ kind: "privacyPolicyText" }}
                    existingValue={resolveLocalizedText(baseDefinition.fields.privacyPolicy.textByLocale, locale, defaultLocale)}
                    byLocale={baseDefinition.fields.privacyPolicy.textByLocale}
                    multiline
                  />
                  <TranslatableField
                    label="Privacy Policy link text"
                    target={{ kind: "privacyPolicyLinkText" }}
                    existingValue={resolveLocalizedText(baseDefinition.fields.privacyPolicy.linkTextByLocale, locale, defaultLocale)}
                    byLocale={baseDefinition.fields.privacyPolicy.linkTextByLocale}
                  />
                  <TranslatableField
                    label="Privacy Policy link URL"
                    target={{ kind: "privacyPolicyLink" }}
                    existingValue={resolveLocalizedText(baseDefinition.fields.privacyPolicy.linkUrlByLocale, locale, defaultLocale)}
                    isUrl
                  />
                </Stack>
              )}
              {baseDefinition.fields.marketingOptin && (
                <TranslatableField
                  label="Marketing Opt-in label"
                  target={{ kind: "profileLabel", field: "marketingOptin" }}
                  existingValue={resolveLocalizedText(baseDefinition.fields.marketingOptin.labelByLocale, locale, defaultLocale)}
                  byLocale={baseDefinition.fields.marketingOptin.labelByLocale}
                />
              )}
              {baseDefinition.fields.termsAndConditions && (
                <Stack spacing={1}>
                  <TranslatableField
                    label="Terms and Conditions wording"
                    target={{ kind: "termsAndConditionsText" }}
                    existingValue={resolveLocalizedText(baseDefinition.fields.termsAndConditions.textByLocale, locale, defaultLocale)}
                    byLocale={baseDefinition.fields.termsAndConditions.textByLocale}
                    multiline
                  />
                  <TranslatableField
                    label="Terms and Conditions link URL"
                    target={{ kind: "termsAndConditionsUrl" }}
                    existingValue={resolveLocalizedText(baseDefinition.fields.termsAndConditions.urlByLocale, locale, defaultLocale)}
                    isUrl
                  />
                </Stack>
              )}
              {(baseDefinition.fields.additionalConsents ?? []).map((consent) => (
                <Stack key={consent.id} spacing={1}>
                  <TranslatableField
                    label={`Consent (${consent.id}) text`}
                    target={{ kind: "consentText", consentId: consent.id }}
                    existingValue={resolveLocalizedText(consent.textByLocale, locale, defaultLocale)}
                    byLocale={consent.textByLocale}
                    multiline
                  />
                  {consent.linkUrlByLocale && (
                    <TranslatableField
                      label={`Consent (${consent.id}) link URL`}
                      target={{ kind: "consentLink", consentId: consent.id }}
                      existingValue={resolveLocalizedText(consent.linkUrlByLocale, locale, defaultLocale)}
                      isUrl
                    />
                  )}
                </Stack>
              ))}
              {!baseDefinition.fields.privacyPolicy &&
                !baseDefinition.fields.marketingOptin &&
                !baseDefinition.fields.termsAndConditions &&
                !baseDefinition.fields.additionalConsents?.length && (
                <Typography variant="body2" color="text.secondary">
                  This form has no consent checkboxes.
                </Typography>
              )}
            </Stack>
          </Paper>

          <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
              Questions
            </Typography>
            <Stack spacing={2} divider={<Divider />}>
              {baseDefinition.questions.map((q) => {
                const isDeleted = deletedQuestionIds.has(q.id);
                const pendingAnswers = newAnswersForExisting.filter((a) => a.questionId === q.id);
                return (
                  <Stack key={q.id} spacing={1} sx={isDeleted ? { opacity: 0.55 } : undefined}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="body2" fontWeight={600} sx={{ flexGrow: 1 }}>
                        {q.id} · {CONTROL_TYPE_LABEL[q.controlType]}
                      </Typography>
                      {q.lockedFromSubsidiary ? (
                        <Chip size="small" icon={<LockIcon fontSize="small" />} label="Locked by admin" variant="outlined" />
                      ) : isDeleted ? (
                        <Button size="small" onClick={() => toggleQuestionDeleted(q.id)} disabled={effectivelyLocked}>
                          Undo
                        </Button>
                      ) : (
                        <IconButton
                          size="small"
                          onClick={() => toggleQuestionDeleted(q.id)}
                          disabled={effectivelyLocked}
                          aria-label="Delete question"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Stack>
                    {isDeleted && (
                      <Alert severity="warning" sx={{ borderRadius: 2 }}>
                        This question will be removed if approved.
                      </Alert>
                    )}
                    <TranslatableField
                      label="Heading"
                      target={{ kind: "questionHeading", questionId: q.id }}
                      existingValue={resolveLocalizedText(q.headingByLocale, locale, defaultLocale)}
                      byLocale={q.headingByLocale}
                    />
                    <TranslatableField
                      label="Subheading"
                      target={{ kind: "questionSubheading", questionId: q.id }}
                      existingValue={resolveLocalizedText(q.subheadingByLocale, locale, defaultLocale)}
                      byLocale={q.subheadingByLocale}
                    />
                    {q.autoPopulateEligible && (
                      <FormControlLabel
                        control={
                          <Switch
                            size="small"
                            checked={autoPopulateToggles.get(q.id) ?? false}
                            disabled={effectivelyLocked}
                            onChange={(e) => setAutoPopulateToggle(q.id, e.target.checked)}
                          />
                        }
                        label={`Auto-populate from URL parameter "${autoPopulateParamName(q.order)}" (One-Click)`}
                      />
                    )}
                    {q.answers.map((a) => {
                      const answerKey = `${q.id}::${a.id}`;
                      const answerDeleted = deletedAnswerIds.has(answerKey);
                      return (
                        <Stack key={a.id} direction="row" spacing={0.5} alignItems="center" sx={answerDeleted ? { opacity: 0.55 } : undefined}>
                          <Box sx={{ flexGrow: 1 }}>
                            <TranslatableField
                              label={`Option ${a.id}`}
                              target={{ kind: "answerText", questionId: q.id, answerId: a.id }}
                              existingValue={resolveLocalizedText(a.textByLocale, locale, defaultLocale)}
                              byLocale={a.textByLocale}
                            />
                          </Box>
                          {answerDeleted ? (
                            <Button size="small" onClick={() => toggleAnswerDeleted(q.id, a.id)} disabled={effectivelyLocked}>
                              Undo
                            </Button>
                          ) : (
                            <IconButton
                              size="small"
                              onClick={() => toggleAnswerDeleted(q.id, a.id)}
                              disabled={effectivelyLocked}
                              aria-label="Delete option"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Stack>
                      );
                    })}
                    {pendingAnswers.map((pending) => (
                      <Stack key={pending.localId} direction="row" spacing={0.5} alignItems="center">
                        <TextField
                          size="small"
                          fullWidth
                          label={`New option (${locale})`}
                          value={pending.answer.textByLocale[locale] ?? ""}
                          disabled
                          helperText="Added this session — visible after approval."
                        />
                        <IconButton
                          size="small"
                          onClick={() => removeNewAnswer(pending.localId)}
                          disabled={effectivelyLocked}
                          aria-label="Remove new option"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    ))}
                    {(q.controlType === "radio" || q.controlType === "checkbox" || q.controlType === "dropdown") && (
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => setAddAnswerForQuestionId(q.id)}
                        disabled={effectivelyLocked}
                        sx={{ alignSelf: "flex-start" }}
                      >
                        Add option
                      </Button>
                    )}
                  </Stack>
                );
              })}
            </Stack>
          </Paper>
        </>
      )}

      <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
        <Stack direction="row" alignItems="center" sx={{ mb: 1.5 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ flexGrow: 1 }}>
            Additional Question
          </Typography>
          <Button size="small" startIcon={<AddIcon />} onClick={() => setAddQuestionOpen(true)}>
            Add question
          </Button>
        </Stack>
        {newQuestions.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            None yet.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {newQuestions.map((q) => (
              <Box key={q.id} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 1, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                <Typography variant="body2">
                  {resolveLocalizedText(q.headingByLocale, defaultLocale, defaultLocale)} ({CONTROL_TYPE_LABEL[q.controlType]})
                </Typography>
                <IconButton size="small" onClick={() => removeQuestion(q.id)} aria-label="Remove question">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Stack>
        )}
      </Paper>

      <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
        <Stack direction="row" alignItems="center" sx={{ mb: 1.5 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ flexGrow: 1 }}>
            Additional Consents
          </Typography>
          <Button size="small" startIcon={<AddIcon />} onClick={() => setAddConsentOpen(true)}>
            Add consent
          </Button>
        </Stack>
        {newConsents.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            None yet.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {newConsents.map((c) => (
              <Box key={c.id} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 1, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                <Typography variant="body2">{resolveLocalizedText(c.textByLocale, defaultLocale, defaultLocale)}</Typography>
                <IconButton size="small" onClick={() => removeConsent(c.id)} aria-label="Remove consent">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Stack>
        )}
      </Paper>

      {(validation.errors.length > 0 || validation.warnings.length > 0) && (
        <Box sx={{ mb: 2 }}>
          {validation.errors.length > 0 && (
            <Alert severity="error" sx={{ mb: 1, borderRadius: 2 }}>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {validation.errors.map((issue, i) => (
                  <li key={i}>{issue.message}</li>
                ))}
              </ul>
            </Alert>
          )}
          {validation.warnings.length > 0 && (
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {validation.warnings.map((issue, i) => (
                  <li key={i}>{issue.message}</li>
                ))}
              </ul>
            </Alert>
          )}
        </Box>
      )}

      <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
        <TextField
          label="Note for the reviewer (optional)"
          size="small"
          fullWidth
          multiline
          minRows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<SaveIcon />}
            disabled={savingDraft || effectivelyLocked}
            onClick={() => void handleSaveDraft()}
            sx={unsavedChangesBlinkSx(dirty && !savingDraft && !effectivelyLocked)}
          >
            {savingDraft ? "Saving..." : "Save Draft"}
          </Button>
          <Button variant="contained" startIcon={<SendIcon />} disabled={submitting || effectivelyLocked} onClick={handleSubmit}>
            {submitting ? "Submitting..." : "Submit for review"}
          </Button>
        </Stack>
      </Paper>
      </Box>

      {(() => {
        // "draft" rows are this user's own unsent scratch space, not a real
        // submission — never shown in this history list (see syncOwnContributions'
        // own doc comment on why ownContributions still includes it).
        const submittedContributions = ownContributions.filter((c) => c.status !== "draft");
        return (
          submittedContributions.length > 0 && (
            <Paper sx={{ p: 2, borderRadius: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                Your submissions
              </Typography>
              <Stack spacing={1}>
                {submittedContributions.map((c) => (
                  <Stack key={c.id} direction="row" spacing={1.5} alignItems="center">
                    <Chip label={CONTRIBUTION_STATUS_LABEL[c.status]} size="small" color={STATUS_COLOR[c.status]} />
                    <Typography variant="caption" color="text.secondary">
                      {new Date(c.submittedAt).toLocaleString()}
                      {c.reviewNote ? ` · ${c.reviewNote}` : ""}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Paper>
          )
        );
      })()}

      {formId && (
        <>
          <AddQuestionDialog
            open={addQuestionOpen}
            onClose={() => setAddQuestionOpen(false)}
            defaultLocale={defaultLocale}
            locales={baseDefinition.locales.map((l) => l.code)}
          />
          <AddConsentDialog
            open={addConsentOpen}
            onClose={() => setAddConsentOpen(false)}
            defaultLocale={defaultLocale}
            locales={baseDefinition.locales.map((l) => l.code)}
          />
          <AddAnswerDialog
            open={addAnswerForQuestionId !== null}
            onClose={() => setAddAnswerForQuestionId(null)}
            defaultLocale={defaultLocale}
            locales={baseDefinition.locales.map((l) => l.code)}
            onAdd={(answer) => {
              if (addAnswerForQuestionId) addAnswerToQuestion(addAnswerForQuestionId, answer);
            }}
          />
          <ContributionPreviewDialog open={previewOpen} onClose={() => setPreviewOpen(false)} />
        </>
      )}
      <Dialog {...responsiveDialogProps} open={requestOpen} onClose={() => setRequestOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <LockOpenIcon color="primary" fontSize="small" />
          Request update
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Let the admin know what you need to change and why — once approved, you can submit translations,
            questions, or consents again.
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={3}
            label="What do you need to change? (optional)"
            value={requestNote}
            onChange={(e) => setRequestNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRequestOpen(false)} disabled={requestingUpdate}>
            Cancel
          </Button>
          <Button variant="contained" disabled={requestingUpdate} onClick={() => void handleRequestUpdate()}>
            {requestingUpdate ? "Sending..." : "Send Request"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
