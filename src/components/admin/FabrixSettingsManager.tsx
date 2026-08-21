import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Alert, Box, Button, FormControlLabel, Paper, Stack, Switch, TextField, Typography } from "@mui/material";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import { ApiError } from "../../api/apiClient";
import { getFabrixSettings, saveFabrixSettings, sendFabrixTestMessage, type FabrixSettings } from "../../api/adminApi";
import { SectionHeader } from "../common/SectionHeader";
import { LoadingState } from "../common/LoadingState";

/**
 * Admin-only FabriXAI Agent connection settings — Base URL / Agent ID /
 * Enabled switch, plus three secrets (API Key, Client Header, OpenAPI
 * Token — all DB-stored encrypted server-side, see backend
 * fabrixSettingsService.ts), used by the AI copilot chat (`/api/v1/ai/chat`)
 * in preference to the server's FABRIX_* environment variables when set
 * here. Mirrors SmtpSettingsManager.tsx's exact shape: every secret field is
 * write-only — the server never sends the real value back, only whether one
 * is currently set (`hasApiKey`/`hasClientHeader`/`hasOpenApiToken`), so
 * this form always starts blank and only overwrites a stored secret if the
 * admin actually types a new one.
 */
export function FabrixSettingsManager() {
  const [settings, setSettings] = useState<FabrixSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const [baseUrl, setBaseUrl] = useState("");
  const [agentId, setAgentId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [clientHeader, setClientHeader] = useState("");
  const [openApiToken, setOpenApiToken] = useState("");
  const [enabled, setEnabled] = useState(true);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const result = await getFabrixSettings();
      setSettings(result);
      setBaseUrl(result.baseUrl);
      setAgentId(result.agentId);
      setEnabled(result.enabled);
      setApiKey("");
      setClientHeader("");
      setOpenApiToken("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load FabriXAI settings");
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
      await saveFabrixSettings({
        baseUrl: baseUrl.trim(),
        agentId: agentId.trim(),
        enabled,
        apiKey: apiKey.trim() || undefined,
        clientHeader: clientHeader.trim() || undefined,
        openApiToken: openApiToken.trim() || undefined,
      });
      setSaveNotice("FabriXAI settings saved.");
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save FabriXAI settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await sendFabrixTestMessage();
      setTestResult(
        result.ok
          ? { ok: true, message: "Test message sent successfully." }
          : { ok: false, message: result.error ?? "Test message failed." },
      );
    } catch (err) {
      setTestResult({ ok: false, message: err instanceof ApiError ? err.message : "Failed to send test message" });
    } finally {
      setTesting(false);
    }
  }

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <SectionHeader icon={<SmartToyIcon fontSize="small" color="primary" />} title="AI Assistant (FabriXAI) Settings" />
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
        Connection details for the FabriXAI Agent API backing the Form Builder's AI copilot chat panel. Overrides the
        server's FABRIX_* environment variables when set here.
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
              label="Base URL"
              size="small"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              required
              sx={{ minWidth: 320 }}
            />
            <TextField
              label="Agent ID"
              size="small"
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              required
              sx={{ minWidth: 240 }}
            />
            <FormControlLabel
              control={<Switch checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />}
              label="Enabled"
            />
          </Stack>
          <TextField
            label="API Key"
            size="small"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={settings?.hasApiKey ? "configured — leave blank to keep" : "not set"}
            fullWidth
            sx={{ mb: 1.5, maxWidth: 400 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
            Some FabriXAI deployments (a gateway in front of the real agent API) need these two extra headers as well
            — leave both blank if your endpoint only needs the API key above.
          </Typography>
          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
            <TextField
              label="Client Header"
              size="small"
              type="password"
              value={clientHeader}
              onChange={(e) => setClientHeader(e.target.value)}
              placeholder={settings?.hasClientHeader ? "configured — leave blank to keep" : "not set"}
              sx={{ minWidth: 320, flex: 1 }}
            />
            <TextField
              label="OpenAPI Token"
              size="small"
              type="password"
              value={openApiToken}
              onChange={(e) => setOpenApiToken(e.target.value)}
              placeholder={settings?.hasOpenApiToken ? "configured — leave blank to keep" : "not set"}
              sx={{ minWidth: 320, flex: 1 }}
            />
          </Stack>
          <Stack direction="row" spacing={1.5}>
            <Button type="submit" variant="contained" disabled={!baseUrl.trim() || !agentId.trim() || saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button variant="outlined" onClick={handleTest} disabled={testing || !settings?.baseUrl}>
              {testing ? "Sending..." : "Send test message"}
            </Button>
          </Stack>
        </Box>
      )}
    </Paper>
  );
}
