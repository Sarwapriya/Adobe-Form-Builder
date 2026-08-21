import { Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import type { AICampaignReference } from "@formbuilder/shared";
import { isAdminRole, useAuthStore } from "../../auth/authStore";

const STATUS_COLOR: Record<string, "default" | "success" | "warning"> = {
  draft: "default",
  published: "success",
  unpublished: "warning",
};

/**
 * One AICampaignReference search-result card (name, status chip, question
 * count, locales, updated date) — [View] navigates straight to the form's
 * editor; [Use as Template] is left as a callback prop the parent supplies
 * rather than this component owning any clone logic itself (e.g. the parent
 * might synthesize a "clone this campaign" chat message via
 * useAiChatStore.getState().sendMessage, or trigger a CLONE_CAMPAIGN
 * proposal some other way — deliberately left open per the plan).
 *
 * [View] routes off the caller's own role plus `reference.origin`, not the
 * current page — the AI panel is a master-page fixture reachable from any
 * screen (see AppLayout.tsx), so a reference surfaced while browsing, say,
 * Upload History still needs to land on the right editor. An admin always
 * lands on FormBuilderEditorPage (it handles both origins); a subsidiary
 * user lands on their own ad-hoc editor only for their own ad-hoc-origin
 * forms, and on the translate/contribution page for admin-origin forms
 * shared with their subsidiary (they can't open FormBuilderEditorPage at
 * all — that route is admin-only).
 */
export function CampaignReferenceCard({
  reference,
  onUseAsTemplate,
}: {
  reference: AICampaignReference;
  /** Meant to kick off "clone this campaign as a new form" — left as a plain
   * callback for the parent to wire up (see doc comment above). */
  onUseAsTemplate?: (formId: string) => void;
}) {
  const navigate = useNavigate();
  const isAdmin = useAuthStore((s) => isAdminRole(s.user?.role));

  function handleView() {
    if (isAdmin) {
      navigate(`/admin/form-builder/${reference.formId}`);
    } else if (reference.origin === "adhoc") {
      navigate(`/my-forms/adhoc/${reference.formId}`);
    } else {
      navigate(`/my-forms/${reference.formId}`);
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: 1.25 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
        <Typography variant="body2" fontWeight={700} sx={{ flexGrow: 1, minWidth: 0 }} noWrap>
          {reference.name}
        </Typography>
        <Chip label={reference.status} size="small" color={STATUS_COLOR[reference.status] ?? "default"} />
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
        {reference.questionCount} question{reference.questionCount === 1 ? "" : "s"} ·{" "}
        {reference.locales.length > 0 ? reference.locales.join(", ") : "no locales"} · updated{" "}
        {new Date(reference.updatedAt).toLocaleDateString()}
      </Typography>
      <Stack direction="row" spacing={1}>
        <Button size="small" onClick={handleView}>
          View
        </Button>
        {onUseAsTemplate && (
          <Button size="small" variant="outlined" onClick={() => onUseAsTemplate(reference.formId)}>
            Use as Template
          </Button>
        )}
      </Stack>
    </Paper>
  );
}
