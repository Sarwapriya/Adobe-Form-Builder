import type { AIToolName } from "@formbuilder/shared";
import { ConfirmDialog } from "../common/ConfirmDialog";

const MESSAGE: Partial<Record<AIToolName, string>> = {
  DELETE_QUESTION:
    "This will remove the question from your draft once confirmed. Nothing publishes until you Save Draft/Publish as usual, so this stays undoable until then.",
};

/**
 * Thin wrapper around the existing (currently under-used) ConfirmDialog for
 * destructive AI-proposed action types — DELETE_QUESTION today, any future
 * type AIActionCard marks `requiresConfirmation` for — reusing the same
 * modal pattern as every other destructive action in this app instead of
 * introducing a new one.
 */
export function AIConfirmationDialog({
  open,
  actionType,
  loading,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  actionType: AIToolName;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <ConfirmDialog
      open={open}
      title="Confirm AI-proposed change"
      message={MESSAGE[actionType] ?? "Are you sure you want to apply this AI-proposed change?"}
      confirmLabel="Confirm"
      loading={loading}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
