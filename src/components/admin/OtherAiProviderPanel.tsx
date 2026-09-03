import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { ApiError } from "../../api/apiClient";
import {
  getClaudeSettings,
  listOtherAiModels,
  saveClaudeSettings,
  sendClaudeTestMessage,
  type OtherAiModel,
  type ClaudeSettings,
} from "../../api/adminApi";
import { LoadingState } from "../common/LoadingState";

const DEFAULT_MODEL = "claude-opus-5";

/** Recognizes which provider an API key belongs to, from its shape alone, so
 * the interface never hardcodes a provider name up front — it only names one
 * once a key is actually typed (or was already saved). Written as a small
 * lookup rather than an inline string compare so it reads the same way for
 * whatever provider is behind this panel, not specifically "Claude" — the
 * label is data here, not UI copy. Only one entry exists today because only
 * one provider (Claude/Anthropic) is actually wired up server-side. */
const KEY_SHAPE = { label: "Claude (Anthropic)", test: (key: string) => key.startsWith("sk-ant-") };

function describeKeyShape(key: string): { ok: boolean; label: string } | null {
  const trimmed = key.trim();
  if (!trimmed) return null;
  return KEY_SHAPE.test(trimmed) ? { ok: true, label: KEY_SHAPE.label } : { ok: false, label: KEY_SHAPE.label };
}

/**
 * One subsection of OtherAiProvidersManager — connection settings for a
 * fallback AI provider, used automatically whenever FabriX can't be reached
 * (see backend aiProviderService.ts). The heading itself stays generic
 * ("Provider") until a key identifies it, rather than being labeled ahead of
 * time — see describeKeyShape above. Backed by the Anthropic Claude Messages
 * API specifically (see backend claudeSettingsService.ts) — one API key
 * (DB-stored encrypted server-side) and one model string, since Claude takes
 * exactly one `model` per request, not an array, so there's no separate
 * enable-and-reorder models manager like FabriX's. The Model field is a
 * free-text-capable Autocomplete backed by the read-only OtherAiModels
 * catalog (Anthropic's own known model ids), so a newer id not yet in that
 * list can still be typed directly.
 */
export function AiProviderPanel() {
  const [settings, setSettings] = useState<ClaudeSettings | null>(null);
  const [modelOptions, setModelOptions] = useState<OtherAiModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const [model, setModel] = useState(DEFAULT_MODEL);
  const [apiKey, setApiKey] = useState("");
  const [enabled, setEnabled] = useState(true);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [result, models] = await Promise.all([getClaudeSettings(), listOtherAiModels()]);
      setSettings(result);
      setModelOptions(models);
      setModel(result.model || DEFAULT_MODEL);
      setEnabled(result.enabled);
      setApiKey("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load Claude settings");
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
      await saveClaudeSettings({ model: model.trim(), enabled, apiKey: apiKey.trim() || undefined });
      setSaveNotice("Claude settings saved.");
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save Claude settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await sendClaudeTestMessage();
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

  const keyShape = describeKeyShape(apiKey);
  // The heading names the provider only once it's known — from what's
  // currently typed, or (if nothing's being typed right now) from the fact
  // that a key was already saved through this panel before.
  const identity = keyShape?.ok ? keyShape.label : settings?.hasApiKey ? KEY_SHAPE.label : null;

  return (
    <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
        <AutoAwesomeIcon fontSize="small" color="primary" />
        <Typography variant="subtitle2">{identity ?? "Provider"}</Typography>
        {settings?.hasApiKey && <Chip label="Configured" size="small" color="success" variant="outlined" />}
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
        Add an API key below — it's identified automatically once entered. Only called when FabriX is unavailable.
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
          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap alignItems="flex-start" sx={{ mb: 1.5 }}>
            <Autocomplete
              freeSolo
              size="small"
              options={modelOptions.map((m) => m.modelId)}
              value={model}
              onInputChange={(_e, value) => setModel(value)}
              getOptionLabel={(option) => {
                const match = modelOptions.find((m) => m.modelId === option);
                return match ? `${match.name} (${match.modelId})` : option;
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Model"
                  required
                  helperText="Pick a known model, or type any model id"
                />
              )}
              sx={{ minWidth: 300 }}
            />
            <Box sx={{ minWidth: 320, flex: 1 }}>
              <TextField
                label="API Key"
                size="small"
                type="password"
                fullWidth
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={settings?.hasApiKey ? "configured — leave blank to keep" : "not set"}
              />
              {keyShape && (
                <Chip
                  sx={{ mt: 0.5 }}
                  size="small"
                  color={keyShape.ok ? "success" : "warning"}
                  label={keyShape.ok ? `Detected: ${keyShape.label}` : `Doesn't look like a ${keyShape.label} key`}
                />
              )}
            </Box>
            <FormControlLabel
              control={<Switch checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />}
              label="Enabled"
            />
          </Stack>
          <Stack direction="row" spacing={1.5}>
            <Button type="submit" variant="contained" disabled={!model.trim() || saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button variant="outlined" onClick={handleTest} disabled={testing || !settings?.hasApiKey}>
              {testing ? "Sending..." : "Send test message"}
            </Button>
          </Stack>
        </Box>
      )}
    </Box>
  );
}
