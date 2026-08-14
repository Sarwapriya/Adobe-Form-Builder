import type { ReactNode } from "react";
import { Button, Stack, TextField, Typography, type SxProps, type Theme } from "@mui/material";

/**
 * The "2 email fields + Save button" widget, shared by UserManagementPage's
 * per-user notification-email popover, SubsidiaryManager's
 * SubsidiaryNotificationRow, and MySubsidiaryPage.
 * `dirty` is caller-computed rather than derived internally, since different
 * call sites use different dirty-check semantics (trimmed vs untrimmed vs
 * always-dirty) — keeping that logic in the caller keeps this component
 * behavior-agnostic.
 */
export function NotificationEmailFields({
  value1,
  value2,
  onValue1Change,
  onValue2Change,
  onSave,
  saving,
  dirty,
  error,
  label1 = "Notification email 1",
  label2 = "Notification email 2",
  saveLabel = "Save",
  savingLabel = "Saving...",
  saveButtonVariant = "text",
  leading,
  containerSx,
}: {
  value1: string;
  value2: string;
  onValue1Change: (value: string) => void;
  onValue2Change: (value: string) => void;
  onSave: () => void;
  saving: boolean;
  dirty: boolean;
  error?: string | null;
  label1?: string;
  label2?: string;
  saveLabel?: string;
  savingLabel?: string;
  saveButtonVariant?: "text" | "outlined";
  leading?: ReactNode;
  containerSx?: SxProps<Theme>;
}) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={containerSx}>
      {leading}
      <TextField
        size="small"
        type="email"
        label={label1}
        placeholder="Not set"
        value={value1}
        onChange={(e) => onValue1Change(e.target.value)}
        error={!!error}
      />
      <TextField
        size="small"
        type="email"
        label={label2}
        placeholder="Not set"
        value={value2}
        onChange={(e) => onValue2Change(e.target.value)}
      />
      <Button size="small" variant={saveButtonVariant} disabled={!dirty || saving} onClick={onSave}>
        {saving ? savingLabel : saveLabel}
      </Button>
      {error && (
        <Typography variant="caption" color="error" sx={{ width: "100%" }}>
          {error}
        </Typography>
      )}
    </Stack>
  );
}
