import { useEffect, useState } from "react";
import { Button, Paper, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import { ApiError } from "../../api/apiClient";
import { listAiProviders, type AiProvider } from "../../api/adminApi";
import { SectionHeader } from "../common/SectionHeader";
import { LoadingState } from "../common/LoadingState";
import { showToast } from "../../store/toastStore";
import { AiProviderPanel, NewAiProviderForm } from "./OtherAiProviderPanel";

/**
 * Fallback AI providers — used automatically, in the order listed, whenever
 * FabriX (the primary provider, configured in the section above) is disabled or
 * unreachable, per backend aiProviderService.py. Any number can be added: each
 * is any OpenAI-compatible chat-completions service, identified by the name the
 * admin gives it. Each provider's own "Enabled" switch (and FabriX's above) is
 * the entire "which API should be used" control — there's no separate priority
 * setting, and providers are never deleted, only switched off.
 */
export function OtherAiProvidersManager() {
  const [providers, setProviders] = useState<AiProvider[] | null>(null);
  const [adding, setAdding] = useState(false);

  async function refresh() {
    try {
      setProviders(await listAiProviders());
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to load AI providers", "error");
      setProviders((current) => current ?? []);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <SectionHeader
        icon={<SwapHorizIcon fontSize="small" color="primary" />}
        title="Other AI Providers"
        action={
          <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => setAdding(true)} disabled={adding}>
            Add provider
          </Button>
        }
      />
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
        Used automatically, in the order listed, whenever FabriX is disabled or unreachable. Add as many providers as you
        like — give each a name so it's easy to tell apart — and use its own switch to turn it off. Providers are never
        deleted, only disabled.
      </Typography>

      {providers === null ? (
        <LoadingState />
      ) : (
        <Stack spacing={2}>
          {providers.length === 0 && !adding && (
            <Typography variant="body2" color="text.secondary">
              No other AI providers yet — click "Add provider".
            </Typography>
          )}
          {providers.map((provider) => (
            // Keyed on the saved values too, so a refresh after Save re-seeds the form fields.
            <AiProviderPanel
              key={`${provider.id}:${provider.name}:${provider.baseUrl}:${provider.model}`}
              provider={provider}
              onChanged={refresh}
            />
          ))}
          {adding && (
            <NewAiProviderForm
              onCreated={async () => {
                setAdding(false);
                await refresh();
              }}
              onCancel={() => setAdding(false)}
            />
          )}
        </Stack>
      )}
    </Paper>
  );
}
