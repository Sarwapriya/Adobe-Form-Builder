import { useState } from "react";
import { Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import type {
  AIActionSummary,
  AddQuestionArgs,
  CloneCampaignArgs,
  CreateCampaignArgs,
  DeleteQuestionArgs,
  ReorderQuestionsArgs,
  UpdateQuestionArgs,
} from "@formbuilder/shared";
import { CONTROL_TYPE_LABEL } from "../formBuilder/formBuilderHelpers";
import { useAiChatStore } from "../../store/aiChatStore";
import { useFormBuilderStore } from "../../store/formBuilderStore";
import { AIConfirmationDialog } from "./AIConfirmationDialog";

const PRIMARY_LABEL: Partial<Record<AIActionSummary["actionType"], string>> = {
  ADD_QUESTION: "Add",
  UPDATE_QUESTION: "Apply",
  DELETE_QUESTION: "Delete",
  REORDER_QUESTIONS: "Apply",
  CREATE_CAMPAIGN: "Create",
  CLONE_CAMPAIGN: "Clone",
};

/** Compact per-type preview line(s) — reads the *current* draft off
 * useFormBuilderStore where useful (e.g. showing a question's existing
 * heading for UPDATE_QUESTION/DELETE_QUESTION) since `action.data` alone
 * only carries the proposed id/patch, not the current content. */
function ActionPreview({ action }: { action: AIActionSummary }) {
  const defaultLocale = useFormBuilderStore((s) => s.definition?.meta.defaultLocale ?? "en_GB");
  const questions = useFormBuilderStore((s) => s.definition?.questions ?? []);

  switch (action.actionType) {
    case "ADD_QUESTION": {
      const { question } = action.data as AddQuestionArgs;
      const heading = question.headingByLocale[defaultLocale] ?? Object.values(question.headingByLocale)[0] ?? "(untitled)";
      return (
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip label={CONTROL_TYPE_LABEL[question.controlType]} size="small" />
          <Typography variant="body2">{heading}</Typography>
        </Stack>
      );
    }
    case "UPDATE_QUESTION": {
      const { questionId, patch } = action.data as UpdateQuestionArgs;
      const current = questions.find((q) => q.id === questionId);
      const currentHeading = current?.headingByLocale[defaultLocale] ?? current?.id ?? questionId;
      const newHeading = patch.headingByLocale?.[defaultLocale];
      return (
        <Typography variant="body2">
          Update &quot;{currentHeading}&quot;{newHeading ? ` → "${newHeading}"` : ""}
        </Typography>
      );
    }
    case "DELETE_QUESTION": {
      const { questionId } = action.data as DeleteQuestionArgs;
      const current = questions.find((q) => q.id === questionId);
      const heading = current?.headingByLocale[defaultLocale] ?? current?.id ?? questionId;
      return <Typography variant="body2">Delete question &quot;{heading}&quot;</Typography>;
    }
    case "REORDER_QUESTIONS": {
      const { orderedQuestionIds } = action.data as ReorderQuestionsArgs;
      return <Typography variant="body2">Reorder {orderedQuestionIds.length} questions</Typography>;
    }
    case "CREATE_CAMPAIGN": {
      const { name, subsidiaryId } = action.data as CreateCampaignArgs;
      return (
        <Typography variant="body2">
          Create campaign &quot;{name}&quot; for subsidiary {subsidiaryId}
        </Typography>
      );
    }
    case "CLONE_CAMPAIGN": {
      const { name, subsidiaryId } = action.data as CloneCampaignArgs;
      return (
        <Typography variant="body2">
          Clone as &quot;{name}&quot; for subsidiary {subsidiaryId}
        </Typography>
      );
    }
    default:
      return <Typography variant="body2">{action.actionType}</Typography>;
  }
}

/**
 * Generic pending-action card for every AIToolName not routed through the
 * more specific QuestionSuggestionCard (SUGGEST_QUESTIONS-derived
 * ADD_QUESTION batches — see AIChatPanel's own grouping logic). Switches on
 * `action.actionType` for a compact preview plus a primary button whose
 * label follows the type (Add/Apply/Clone/Delete/Create) and a Cancel.
 * Destructive types (`action.requiresConfirmation === true`, i.e.
 * DELETE_QUESTION) route the primary click through AIConfirmationDialog
 * first instead of confirming immediately.
 *
 * A server-executed confirm (CREATE_CAMPAIGN/CLONE_CAMPAIGN) returns a
 * `formId` in its response — this component is the one place that reads that
 * and navigates, since aiChatStore.confirmAction deliberately stops at
 * removing the action / applying a client-side edit and leaves navigation to
 * the caller (per the plan, `useFormBuilderStore` shouldn't know about
 * routing).
 */
export function AIActionCard({ action }: { action: AIActionSummary }) {
  const confirmAction = useAiChatStore((s) => s.confirmAction);
  const rejectAction = useAiChatStore((s) => s.rejectAction);
  const navigate = useNavigate();
  const location = useLocation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function doConfirm() {
    setBusy(true);
    try {
      const response = await confirmAction(action.id);
      if (response?.formId) {
        const basePrefix = location.pathname.startsWith("/my-forms/adhoc") ? "/my-forms/adhoc" : "/admin/form-builder";
        navigate(`${basePrefix}/${response.formId}`);
      }
    } finally {
      setBusy(false);
      setConfirmOpen(false);
    }
  }

  function handlePrimaryClick() {
    if (action.requiresConfirmation) {
      setConfirmOpen(true);
    } else {
      void doConfirm();
    }
  }

  const primaryLabel = PRIMARY_LABEL[action.actionType] ?? "Confirm";

  return (
    <Paper variant="outlined" sx={{ p: 1.25, mb: 1 }}>
      <ActionPreview action={action} />
      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
        <Button
          size="small"
          variant="contained"
          color={action.requiresConfirmation ? "error" : "primary"}
          disabled={busy}
          onClick={handlePrimaryClick}
        >
          {busy ? "Working..." : primaryLabel}
        </Button>
        <Button size="small" color="inherit" disabled={busy} onClick={() => void rejectAction(action.id)}>
          Cancel
        </Button>
      </Stack>

      <AIConfirmationDialog
        open={confirmOpen}
        actionType={action.actionType}
        loading={busy}
        onConfirm={() => void doConfirm()}
        onCancel={() => setConfirmOpen(false)}
      />
    </Paper>
  );
}
