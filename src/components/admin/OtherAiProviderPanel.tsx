import { useState } from "react";
import type { FormEvent } from "react";
import { Box, Button, Chip, FormControlLabel, Stack, Switch, TextField, Typography } from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { ApiError } from "../../api/apiClient";
import {
  createAiProvider,
  sendAiProviderTestMessage,
  updateAiProvider,
  type AiProvider,
} from "../../api/adminApi";
import { showToast } from "../../store/toastStore";

/** Starting points for the "Add provider" form — every one is just an
 * OpenAI-compatible base URL + a sensible default model, so any other service
 * works too by typing its own. */
const PRESETS = [
  { label: "Groq", baseUrl: "https://api.groq.com/openai/v1", model: "openai/gpt-oss-120b" },
  { label: "OpenAI", baseUrl: "https://api.openai.com/v1", model: "gpt-4o-mini" },
  { label: "OpenRouter", baseUrl: "https://openrouter.ai/api/v1", model: "openai/gpt-oss-120b" },
];

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

/**
 * One saved "other" AI provider (see OtherAiProvidersManager) — its own name,
 * connection settings and Enabled switch. Providers are never deleted: the
 * switch (saved immediately) is the on/off control, and a disabled provider is
 * simply skipped when the assistant falls back after FabriX.
 */
export function AiProviderPanel({ provider, onChanged }: { provider: AiProvider; onChanged: () => void | Promise<void> }) {
  const [name, setName] = useState(provider.name);
  const [baseUrl, setBaseUrl] = useState(provider.baseUrl);
  const [model, setModel] = useState(provider.model);
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [testing, setTesting] = useState(false);

  const dirty =
    name.trim() !== provider.name || baseUrl.trim() !== provider.baseUrl || model.trim() !== provider.model || !!apiKey.trim();

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateAiProvider(provider.id, {
        name: name.trim(),
        baseUrl: baseUrl.trim(),
        model: model.trim(),
        apiKey: apiKey.trim() || undefined,
      });
      showToast(`"${name.trim()}" saved.`, "success");
      setApiKey("");
      await onChanged();
    } catch (err) {
      showToast(errorMessage(err, "Failed to save provider"), "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(next: boolean) {
    setToggling(true);
    try {
      await updateAiProvider(provider.id, { isEnabled: next });
      await onChanged();
    } catch (err) {
      showToast(errorMessage(err, "Failed to update provider"), "error");
    } finally {
      setToggling(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    try {
      const result = await sendAiProviderTestMessage(provider.id);
      showToast(
        result.ok ? `Test message to "${provider.name}" succeeded.` : (result.error ?? "Test message failed."),
        result.ok ? "success" : "error",
      );
    } catch (err) {
      showToast(errorMessage(err, "Failed to send test message"), "error");
    } finally {
      setTesting(false);
    }
  }

  return (
    <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 2, opacity: provider.isEnabled ? 1 : 0.75 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
        <AutoAwesomeIcon fontSize="small" color={provider.isEnabled ? "primary" : "disabled"} />
        <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
          {provider.name}
        </Typography>
        <Chip
          label={provider.isEnabled ? "Enabled" : "Disabled"}
          size="small"
          color={provider.isEnabled ? "success" : "default"}
          variant="outlined"
        />
        <FormControlLabel
          sx={{ mr: 0 }}
          control={
            <Switch
              size="small"
              checked={provider.isEnabled}
              disabled={toggling}
              onChange={(e) => void handleToggle(e.target.checked)}
              inputProps={{ "aria-label": `Enable ${provider.name}` }}
            />
          }
          label=""
        />
      </Stack>

      <Box component="form" onSubmit={handleSave}>
        <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap alignItems="flex-start" sx={{ mb: 1.5 }}>
          <TextField
            label="Provider name"
            size="small"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            helperText="Shown in this list and in server logs"
            sx={{ minWidth: 220 }}
          />
          <TextField
            label="Base URL"
            size="small"
            required
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            helperText="OpenAI-compatible, without /chat/completions"
            sx={{ minWidth: 300, flex: 1 }}
          />
          <TextField label="Model" size="small" required value={model} onChange={(e) => setModel(e.target.value)} sx={{ minWidth: 220 }} />
          <TextField
            label="API Key"
            size="small"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={provider.hasApiKey ? "configured — leave blank to keep" : "not set"}
            autoComplete="new-password"
            sx={{ minWidth: 260 }}
          />
        </Stack>
        <Stack direction="row" spacing={1.5}>
          <Button type="submit" variant="contained" disabled={!dirty || !name.trim() || !baseUrl.trim() || !model.trim() || saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
          <Button variant="outlined" onClick={handleTest} disabled={testing || dirty || !provider.hasApiKey}>
            {testing ? "Sending..." : "Send test message"}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}

/** The "Add provider" form — creates one more provider, enabled, after the existing ones. */
export function NewAiProviderForm({ onCreated, onCancel }: { onCreated: () => void | Promise<void>; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [creating, setCreating] = useState(false);

  function applyPreset(preset: (typeof PRESETS)[number]) {
    setBaseUrl(preset.baseUrl);
    setModel(preset.model);
    setName((current) => current || preset.label);
  }

  const canCreate = !!name.trim() && !!baseUrl.trim() && !!model.trim() && !!apiKey.trim() && !creating;

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!canCreate) return;
    setCreating(true);
    try {
      await createAiProvider({ name: name.trim(), baseUrl: baseUrl.trim(), model: model.trim(), apiKey: apiKey.trim() });
      showToast(`"${name.trim()}" added.`, "success");
      await onCreated();
    } catch (err) {
      showToast(errorMessage(err, "Failed to add provider"), "error");
    } finally {
      setCreating(false);
    }
  }

  return (
    <Box sx={{ border: 1, borderColor: "primary.main", borderStyle: "dashed", borderRadius: 1, p: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
        New AI provider
      </Typography>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
        <Typography variant="caption" color="text.secondary">
          Start from:
        </Typography>
        {PRESETS.map((preset) => (
          <Chip key={preset.label} label={preset.label} size="small" variant="outlined" onClick={() => applyPreset(preset)} />
        ))}
        <Typography variant="caption" color="text.secondary">
          or fill in any OpenAI-compatible service
        </Typography>
      </Stack>
      <Box component="form" onSubmit={handleCreate}>
        <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap alignItems="flex-start" sx={{ mb: 1.5 }}>
          <TextField
            label="Provider name"
            size="small"
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            helperText="e.g. Groq, OpenAI - team key"
            sx={{ minWidth: 220 }}
          />
          <TextField
            label="Base URL"
            size="small"
            required
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            helperText="e.g. https://api.groq.com/openai/v1"
            sx={{ minWidth: 300, flex: 1 }}
          />
          <TextField label="Model" size="small" required value={model} onChange={(e) => setModel(e.target.value)} sx={{ minWidth: 220 }} />
          <TextField
            label="API Key"
            size="small"
            type="password"
            required
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            autoComplete="new-password"
            sx={{ minWidth: 260 }}
          />
        </Stack>
        <Stack direction="row" spacing={1.5}>
          <Button type="submit" variant="contained" disabled={!canCreate}>
            {creating ? "Adding..." : "Add provider"}
          </Button>
          <Button onClick={onCancel} disabled={creating}>
            Cancel
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
