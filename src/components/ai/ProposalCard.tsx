import { useNavigate } from "react-router-dom";
import { Alert, Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import type { AIFormProposal } from "@formbuilder/shared";
import { CONTROL_TYPE_LABEL } from "../formBuilder/formBuilderHelpers";
import { useAiChatStore } from "../../store/aiChatStore";

/**
 * Preview of a new campaign draft the assistant proposed. The backend has
 * already validated it (validate_form) before it can reach this card. Nothing
 * is saved until the user clicks "Approve & Save", which approves exactly this
 * version and saves it (aiChatStore.approveAndSaveProposal); asking for
 * changes in the chat produces a new version that replaces this one.
 */
export function ProposalCard({ proposal }: { proposal: AIFormProposal }) {
  const navigate = useNavigate();
  const approveAndSave = useAiChatStore((s) => s.approveAndSaveProposal);
  const saving = useAiChatStore((s) => s.savingProposal);
  const reusedCount = proposal.questions.filter((q) => q.reused).length;

  async function handleApprove() {
    const result = await approveAndSave(proposal.id);
    if (result) navigate(result.route);
  }

  return (
    <Paper variant="outlined" sx={{ p: 1.25, mt: 1 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
        <Typography variant="subtitle2" fontWeight={700} sx={{ flexGrow: 1 }}>
          {proposal.name}
        </Typography>
        <Chip label={`v${proposal.version}`} size="small" />
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
        {proposal.subsidiary}
        {proposal.projectCode ? ` · ${proposal.projectCode}` : ""} · {proposal.questions.length} question
        {proposal.questions.length === 1 ? "" : "s"} ({reusedCount} reused from existing campaigns)
      </Typography>

      <Box component="ol" sx={{ pl: 2.5, m: 0, mb: 1 }}>
        {proposal.questions.map((q, index) => (
          <Box component="li" key={`${proposal.id}-${index}`} sx={{ mb: 0.75 }}>
            <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="body2" fontWeight={600}>
                {q.heading}
                {q.required ? " *" : ""}
              </Typography>
              <Chip label={CONTROL_TYPE_LABEL[q.controlType]} size="small" variant="outlined" />
              {q.reused && <Chip label="Reused" size="small" color="info" variant="outlined" />}
            </Stack>
            {q.answers.length > 0 && (
              <Typography variant="caption" color="text.secondary">
                Options: {q.answers.join(", ")}
              </Typography>
            )}
          </Box>
        ))}
      </Box>

      {proposal.warnings.length > 0 && (
        <Alert severity="info" sx={{ mb: 1, py: 0 }}>
          {proposal.warnings.join(" ")}
        </Alert>
      )}

      {proposal.saved ? (
        <Typography variant="caption" color="success.main">
          Saved as a draft.
        </Typography>
      ) : (
        <Stack spacing={0.5}>
          <Button size="small" variant="contained" disabled={saving} onClick={() => void handleApprove()}>
            {saving ? "Saving..." : "Approve & Save"}
          </Button>
          <Typography variant="caption" color="text.secondary">
            Want changes? Tell the assistant what to change and it will send an updated version.
          </Typography>
        </Stack>
      )}
    </Paper>
  );
}
