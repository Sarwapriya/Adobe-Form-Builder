import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Alert, Box, Button, FormControlLabel, Paper, Stack, Switch, TextField, Typography } from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import { ApiError } from "../../api/apiClient";
import { getSmtpSettings, saveSmtpSettings, sendSmtpTestEmail, type SmtpSettings } from "../../api/adminApi";
import { SectionHeader } from "../common/SectionHeader";
import { LoadingState } from "../common/LoadingState";

/**
 * Admin-only SMTP connection settings — host/port/secure/user/password/from,
 * stored encrypted in the database (see backend smtpSettingsService.ts) and
 * used by every notification email in the app in preference to the SMTP_*
 * env vars (see emailService.ts's resolveSmtpConfig). The password field is
 * write-only: the server never sends the real value back, only whether one
 * is currently set, so this form always starts blank and only overwrites the
 * stored password if the admin actually types a new one.
 */
export function SmtpSettingsManager() {
  const [settings, setSettings] = useState<SmtpSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const [host, setHost] = useState("");
  const [port, setPort] = useState("587");
  const [secure, setSecure] = useState(false);
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [from, setFrom] = useState("");

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const result = await getSmtpSettings();
      setSettings(result);
      setHost(result.host);
      setPort(String(result.port));
      setSecure(result.secure);
      setUser(result.user ?? "");
      setFrom(result.from ?? "");
      setPassword("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load SMTP settings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaveNotice(null);
    setTestResult(null);
    try {
      await saveSmtpSettings({
        host: host.trim(),
        port: Number(port) || 587,
        secure,
        user: user.trim() || null,
        password: password.trim() || undefined,
        from: from.trim() || null,
      });
      setSaveNotice("SMTP settings saved.");
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save SMTP settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await sendSmtpTestEmail();
      setTestResult({ ok: true, message: `Test email sent to ${result.sentTo}.` });
    } catch (err) {
      setTestResult({ ok: false, message: err instanceof ApiError ? err.message : "Failed to send test email" });
    } finally {
      setTesting(false);
    }
  }

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <SectionHeader icon={<EmailIcon fontSize="small" color="primary" />} title="Email / SMTP Settings" />
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
        Connection details for every outgoing notification email (uploads, submissions, form reviews, cutoff
        reminders, project locks). Overrides the server's SMTP_* environment variables when set here.
      </Typography>

      {error && !loading && (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          {error}
        </Alert>
      )}
      {saveNotice && (
        <Alert severity="success" sx={{ mb: 1.5 }} onClose={() => setSaveNotice(null)}>
          {saveNotice}
        </Alert>
      )}
      {testResult && (
        <Alert severity={testResult.ok ? "success" : "error"} sx={{ mb: 1.5 }} onClose={() => setTestResult(null)}>
          {testResult.message}
        </Alert>
      )}

      {loading ? (
        <LoadingState />
      ) : (
        <Box component="form" onSubmit={handleSave}>
          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
            <TextField
              label="SMTP host"
              size="small"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              required
              sx={{ minWidth: 260 }}
            />
            <TextField
              label="Port"
              size="small"
              type="number"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              sx={{ minWidth: 100 }}
            />
            <FormControlLabel
              control={<Switch checked={secure} onChange={(e) => setSecure(e.target.checked)} />}
              label="Secure (port 465)"
            />
          </Stack>
          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
            <TextField label="Username" size="small" value={user} onChange={(e) => setUser(e.target.value)} sx={{ minWidth: 260 }} />
            <TextField
              label="Password"
              size="small"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={settings?.hasPassword ? "configured — leave blank to keep" : "not set"}
              sx={{ minWidth: 260 }}
            />
          </Stack>
          <TextField
            label="From address"
            size="small"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            helperText="Falls back to the username, then to the recipient's own address, if left blank."
            fullWidth
            sx={{ mb: 2, maxWidth: 400 }}
          />
          <Stack direction="row" spacing={1.5}>
            <Button type="submit" variant="contained" disabled={!host.trim() || saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button variant="outlined" onClick={handleTest} disabled={testing || !settings?.host}>
              {testing ? "Sending..." : "Send test email"}
            </Button>
          </Stack>
        </Box>
      )}
    </Paper>
  );
}
