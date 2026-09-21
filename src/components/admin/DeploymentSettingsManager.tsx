import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  Box,
  Button,
  Chip,
  FormControlLabel,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { ApiError } from "../../api/apiClient";
import {
  getDeploymentSettings,
  saveDeploymentTarget,
  setActiveDeploymentEnvironment,
  type SftpDeploymentSettings,
  type SftpEnvironment,
  type SftpTargetConfig,
  type SftpTargetView,
} from "../../api/adminApi";
import { SectionHeader } from "../common/SectionHeader";
import { LoadingState } from "../common/LoadingState";
import { showToast } from "../../store/toastStore";

/** One environment's own connection form (Staging or Production) — kept as
 * its own component so each side has independent field state and its own
 * Save button, matching this page's other settings panels (e.g.
 * FabrixSettingsManager). Saving here only ever updates that one
 * environment's row; it does not change which environment is active. */
function SftpTargetPanel({
  environment,
  target,
  onSaved,
}: {
  environment: SftpEnvironment;
  target: SftpTargetView;
  onSaved: (settings: SftpDeploymentSettings) => void;
}) {
  const [form, setForm] = useState<SftpTargetConfig>(target);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(target);
  }, [target]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const settings = await saveDeploymentTarget(environment, {
        host: form.host,
        port: form.port,
        username: form.username,
        privateKeyPath: form.privateKeyPath,
        remotePath: form.remotePath,
      });
      onSaved(settings);
      showToast("Saved.", "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to save deployment target", "error");
    } finally {
      setSaving(false);
    }
  }

  const label = environment === "staging" ? "Staging" : "Production";

  return (
    <Paper variant="outlined" sx={{ p: 2, flex: 1, minWidth: 320 }}>
      <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
        {label}
      </Typography>

      <Box component="form" onSubmit={handleSave}>
        <Stack spacing={1.5} sx={{ mb: 1.5 }}>
          <TextField
            label="Host"
            size="small"
            value={form.host}
            onChange={(e) => setForm((f) => ({ ...f, host: e.target.value }))}
            required
            placeholder="e.g. samsung-mena-mkt-prod6-1.campaign.adobe.com"
          />
          <Stack direction="row" spacing={1.5}>
            <TextField
              label="Port"
              size="small"
              type="number"
              value={form.port}
              onChange={(e) => setForm((f) => ({ ...f, port: Number(e.target.value) || 22 }))}
              sx={{ width: 120 }}
            />
            <TextField
              label="Username"
              size="small"
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              required
              sx={{ flex: 1 }}
            />
          </Stack>
          <TextField
            label="Private Key Path"
            size="small"
            value={form.privateKeyPath}
            onChange={(e) => setForm((f) => ({ ...f, privateKeyPath: e.target.value }))}
            required
            placeholder="/app/keys/adobe_sftp_key"
            error={Boolean(target.privateKeyPath) && !target.privateKeyFound}
            helperText={
              !target.privateKeyPath
                ? "Path to the key file inside the backend container (e.g. /app/keys/adobe_sftp_key) — saved in the database; the key's contents are never stored"
                : target.privateKeyFound
                  ? "Key file found on the backend — saved in the database; the key's contents are never stored"
                  : "Saved path, but no key file exists there on the backend. Mount the key into the container and save this path (see DEPLOYMENT.md)"
            }
          />
          <TextField
            label="Remote Path"
            size="small"
            value={form.remotePath}
            onChange={(e) => setForm((f) => ({ ...f, remotePath: e.target.value }))}
            required
            placeholder="/incoming/ACC/Operations/HRForms/ToProcess"
          />
        </Stack>
        <Button type="submit" size="small" variant="contained" disabled={!form.host.trim() || !form.username.trim() || !form.privateKeyPath.trim() || saving}>
          {saving ? "Saving..." : `Save ${label}`}
        </Button>
      </Box>
    </Paper>
  );
}

/**
 * Admin-only Adobe Campaign SFTP deployment settings (Configuration >
 * Deployment) — two independent targets (Staging/Production), each with its
 * own host/port/username/private-key-path/remote-path, plus a switch
 * choosing which one Publish/Deploy actually pushes generated files to (see
 * backend's sftpService.ts/sftpSettingsService.ts). Everything here is
 * stored in the database (AdminSettings rows) rather than env vars, since an
 * admin should be able to change it without redeploying the backend.
 *
 * The private key file itself is never uploaded or stored here — only the
 * local path to it on whichever machine runs the backend, so switching
 * environments/hosts still requires the right key file to already exist at
 * that path on that machine.
 */
export function DeploymentSettingsManager() {
  const [settings, setSettings] = useState<SftpDeploymentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      setSettings(await getDeploymentSettings());
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to load deployment settings", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function handleActiveEnvironmentChange(next: SftpEnvironment) {
    if (!settings || next === settings.activeEnvironment) return;
    if (next === "production" && !window.confirm("Switch live deployment to Production? Every Publish/Deploy from now on will push to the production server.")) {
      return;
    }
    setSwitching(true);
    try {
      setSettings(await setActiveDeploymentEnvironment(next));
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to switch active environment", "error");
    } finally {
      setSwitching(false);
    }
  }

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <SectionHeader icon={<CloudUploadIcon fontSize="small" color="primary" />} title="Deployment" />
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
        On every Publish/Deploy, the generated form files are pushed over SFTP to whichever target is active below.
        This is best-effort — a failed push never fails the publish itself, and the configured host is typically only
        reachable from the office network/VPN.
      </Typography>

      {loading || !settings ? (
        <LoadingState />
      ) : (
        <>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="body2">Active environment:</Typography>
            <RadioGroup
              row
              value={settings.activeEnvironment}
              onChange={(e) => void handleActiveEnvironmentChange(e.target.value as SftpEnvironment)}
            >
              <FormControlLabel value="staging" control={<Radio size="small" disabled={switching} />} label="Staging" />
              <FormControlLabel value="production" control={<Radio size="small" disabled={switching} />} label="Production" />
            </RadioGroup>
            <Chip
              size="small"
              label={settings.activeEnvironment === "production" ? "Deploying to Production" : "Deploying to Staging"}
              color={settings.activeEnvironment === "production" ? "warning" : "default"}
            />
          </Stack>

          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <SftpTargetPanel environment="staging" target={settings.staging} onSaved={setSettings} />
            <SftpTargetPanel environment="production" target={settings.production} onSaved={setSettings} />
          </Stack>
        </>
      )}
    </Paper>
  );
}
