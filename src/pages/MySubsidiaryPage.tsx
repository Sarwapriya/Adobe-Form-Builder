import { useEffect, useState } from "react";
import { Alert, Box, Paper, Typography } from "@mui/material";
import DomainIcon from "@mui/icons-material/Domain";
import { ApiError } from "../api/apiClient";
import { getMySubsidiary, setMySubsidiaryNotificationEmail, type Subsidiary } from "../api/subsidiariesApi";
import { PageHeader } from "../components/common/PageHeader";
import { SectionHeader } from "../components/common/SectionHeader";
import { LoadingState } from "../components/common/LoadingState";
import { NotificationEmailFields } from "../components/common/NotificationEmailFields";

/**
 * Self-service page for a subsidiary-scoped standard user to manage their
 * *own* subsidiary's two extra notification-email addresses (see
 * Subsidiary.notificationEmail1/2's own doc comment) — the admin-only
 * equivalent (every subsidiary, full read/write) lives in SubsidiaryManager
 * on the Configuration page and is unaffected by this page existing.
 */
export function MySubsidiaryPage() {
  const [subsidiary, setSubsidiary] = useState<Subsidiary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [email1, setEmail1] = useState("");
  const [email2, setEmail2] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function refresh() {
    setLoading(true);
    setLoadError(null);
    try {
      const result = await getMySubsidiary();
      setSubsidiary(result);
      setEmail1(result.notificationEmail1 ?? "");
      setEmail2(result.notificationEmail2 ?? "");
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "Failed to load your subsidiary");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      const updated = await setMySubsidiaryNotificationEmail(email1.trim() || null, email2.trim() || null);
      setSubsidiary(updated);
      setEmail1(updated.notificationEmail1 ?? "");
      setEmail2(updated.notificationEmail2 ?? "");
      setSaved(true);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Failed to save notification emails");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box>
      <PageHeader
        icon={<DomainIcon />}
        title="My Subsidiary"
        subtitle="Manage the extra notification email addresses for your own subsidiary."
      />

      {loadError && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {loadError}
        </Alert>
      )}

      {loading ? (
        <LoadingState />
      ) : subsidiary ? (
        <Paper sx={{ p: 2 }}>
          <SectionHeader
            icon={<DomainIcon fontSize="small" color="primary" />}
            title={subsidiary.name}
            subtitle="Up to two addresses that receive notifications for this subsidiary, in addition to whichever of your subsidiary's own users already receive one. Leave a field blank to clear it."
          />

          {saveError && (
            <Alert severity="error" sx={{ mb: 1.5 }}>
              {saveError}
            </Alert>
          )}
          {saved && !saveError && (
            <Alert severity="success" sx={{ mb: 1.5 }} onClose={() => setSaved(false)}>
              Saved.
            </Alert>
          )}

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
        </Paper>
      ) : (
        !loadError && (
          <Typography variant="body2" color="text.secondary">
            No subsidiary information available.
          </Typography>
        )
      )}
    </Box>
  );
}
