import { useEffect, useState } from "react";
import { Alert, Paper } from "@mui/material";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import { ApiError } from "../../api/apiClient";
import { getGlobalNotificationEmails, setGlobalNotificationEmails } from "../../api/adminApi";
import { SectionHeader } from "../common/SectionHeader";
import { LoadingState } from "../common/LoadingState";
import { NotificationEmailFields } from "../common/NotificationEmailFields";

/**
 * Inline admin panel for the two global notification recipient addresses —
 * distinct from each subsidiary's own two extra addresses managed in
 * SubsidiaryManager. These receive the existing upload/submission
 * notification emails (see backend emailService.ts's resolveRecipients).
 * `FORMBUILDER_NOTIFY_EMAIL`, if set as an env var, overrides both of these
 * entirely — that's a deployment-level hard override, not something this UI
 * can see or change.
 */
export function GlobalNotificationSettings() {
  const [email1, setEmail1] = useState("");
  const [email2, setEmail2] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const emails = await getGlobalNotificationEmails();
      setEmail1(emails.notificationEmail1 ?? "");
      setEmail2(emails.notificationEmail2 ?? "");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load notification settings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const emails = await setGlobalNotificationEmails(email1.trim() || null, email2.trim() || null);
      setEmail1(emails.notificationEmail1 ?? "");
      setEmail2(emails.notificationEmail2 ?? "");
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save notification settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <SectionHeader
        icon={<MailOutlineIcon fontSize="small" color="primary" />}
        title="Global notification emails"
        subtitle="Up to two addresses that receive upload/submission notification emails site-wide. Leave a field blank to clear it."
      />

      {error && !loading && (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          {error}
        </Alert>
      )}
      {saved && !error && (
        <Alert severity="success" sx={{ mb: 1.5 }} onClose={() => setSaved(false)}>
          Saved.
        </Alert>
      )}

      {loading ? (
        <LoadingState />
      ) : (
        <NotificationEmailFields
          value1={email1}
          value2={email2}
          onValue1Change={(v) => {
            setEmail1(v);
            setSaved(false);
          }}
          onValue2Change={(v) => {
            setEmail2(v);
            setSaved(false);
          }}
          onSave={handleSave}
          saving={saving}
          dirty={true}
          saveButtonVariant="outlined"
        />
      )}
    </Paper>
  );
}
