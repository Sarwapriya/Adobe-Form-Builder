import { IconButton, Stack, Tooltip } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";

/**
 * The Copy/Delete row-action icons shared by every Form Initiator / My Forms
 * list (HrFormInitiatorListPage, AdHocFormInitiatorListPage,
 * MyAdHocFormsListPage) — one place so admin and subsidiary users see the
 * exact same icon style for the same actions, instead of each page having
 * independently drifted (previously a labeled Button on the admin side vs. a
 * bare IconButton on the subsidiary side). Either handler being omitted
 * simply omits that icon — e.g. a published ad-hoc form has no Delete.
 */
export function FormRowIconActions({
  onCopy,
  onDelete,
  deleteDisabled,
  copyTooltip = "Copy into a new form",
  deleteTooltip = "Delete",
}: {
  onCopy?: () => void;
  onDelete?: () => void;
  deleteDisabled?: boolean;
  copyTooltip?: string;
  deleteTooltip?: string;
}) {
  return (
    <Stack direction="row" spacing={0.5} alignItems="center">
      {onCopy && (
        <Tooltip title={copyTooltip}>
          <IconButton
            size="small"
            aria-label="Copy"
            onClick={(e) => {
              e.stopPropagation();
              onCopy();
            }}
          >
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {onDelete && (
        <Tooltip title={deleteTooltip}>
          <span>
            <IconButton
              size="small"
              aria-label="Delete"
              color="error"
              disabled={deleteDisabled}
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      )}
    </Stack>
  );
}
