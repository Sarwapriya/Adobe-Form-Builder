import { useEffect, useState } from "react";
import { Alert, Box, MenuItem, Paper, Stack, Switch, TextField, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import TuneIcon from "@mui/icons-material/Tune";
import { ApiError } from "../../api/apiClient";
import {
  createSubsidiaryProjectBlock,
  deleteSubsidiaryProjectBlock,
  listSubsidiaryProjectBlocks,
  type SubsidiaryProjectBlock,
} from "../../api/adminApi";
import { listSubsidiaries, type Subsidiary } from "../../api/subsidiariesApi";
import { listOpenProjectCodes, type ProjectCode } from "../../api/projectCodesApi";
import { SectionHeader } from "../common/SectionHeader";
import { LoadingState } from "../common/LoadingState";

/**
 * Per-subsidiary project code access — pick a subsidiary, then toggle which
 * currently-open project codes it may use. This is the same
 * SubsidiaryProjectBlock data/API the (now-hidden) "Subsidiary upload
 * restrictions" panel used, just reframed subsidiary-first with an
 * enable/disable switch per code instead of a standalone block list, and
 * moved under Subsidiaries per the feature's own requirement — a code
 * toggled off here becomes a block row (createSubsidiaryProjectBlock), and
 * toggling it back on deletes that row.
 *
 * This directly drives Form Initiator's own subsidiary → project code
 * cascade (HrFormInitiatorListPage's create dialog, AdHocReviewPanel's
 * approve dialog) — both call listOpenProjectCodes(subsidiaryId), which
 * already excludes whatever's blocked here — and, independently, the same
 * assertNotBlocked check formBuilderService.createForm/approveAdHocForm run
 * server-side, so this can never be bypassed by a stale client-side list.
 *
 * A code closed globally (ProjectCodeManager) or a subsidiary disabled
 * globally (SubsidiaryManager) never appears here — both already gate
 * everything themselves, so a per-pair toggle on top would be meaningless.
 */
export function SubsidiaryProjectCodeAccessManager({ refreshSignal }: { refreshSignal?: number } = {}) {
  const [subsidiaries, setSubsidiaries] = useState<Subsidiary[]>([]);
  const [projectCodes, setProjectCodes] = useState<ProjectCode[]>([]);
  const [blocks, setBlocks] = useState<SubsidiaryProjectBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [subsidiaryName, setSubsidiaryName] = useState("");
  const [togglingCode, setTogglingCode] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const [subsidiaryRows, codeRows, blockRows] = await Promise.all([
        listSubsidiaries(),
        listOpenProjectCodes(),
        listSubsidiaryProjectBlocks(),
      ]);
      setSubsidiaries(subsidiaryRows);
      setProjectCodes(codeRows);
      setBlocks(blockRows);
      setSubsidiaryName((current) => (subsidiaryRows.some((s) => s.name === current) ? current : ""));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load project code access");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    // Same "refreshSignal is the only way to hear about it" reasoning as the
    // panel this replaces — ProjectCodeManager/SubsidiaryManager keep their
    // own independent lists in state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshSignal]);

  async function handleToggle(code: string, existingBlock: SubsidiaryProjectBlock | undefined) {
    setTogglingCode(code);
    setError(null);
    try {
      if (existingBlock) {
        await deleteSubsidiaryProjectBlock(existingBlock.id);
      } else {
        await createSubsidiaryProjectBlock(subsidiaryName, code);
      }
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update project code access");
    } finally {
      setTogglingCode(null);
    }
  }

  const blocksForSubsidiary = blocks.filter((b) => b.subsidiaryName === subsidiaryName);

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <SectionHeader
        icon={<TuneIcon fontSize="small" color="primary" />}
        title="Subsidiary project code access"
        subtitle="Choose a subsidiary, then enable or disable which open project codes it can use when creating Form Initiator forms."
      />

      <Box sx={{ mb: 1.5 }}>
        <TextField
          select
          label="Subsidiary"
          size="small"
          sx={{ minWidth: 220 }}
          value={subsidiaryName}
          onChange={(e) => setSubsidiaryName(e.target.value)}
          disabled={subsidiaries.length === 0}
          helperText={subsidiaries.length === 0 ? "No active subsidiaries yet" : undefined}
        >
          {subsidiaries.map((s) => (
            <MenuItem key={s.id} value={s.name}>
              {s.name}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {error && !loading && (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <LoadingState />
      ) : !subsidiaryName ? (
        <Typography variant="body2" color="text.secondary">
          Pick a subsidiary above to manage which open project codes it can use.
        </Typography>
      ) : projectCodes.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No open project codes yet — open one in Project Codes above first.
        </Typography>
      ) : (
        <Stack spacing={0.5}>
          {projectCodes.map((pc) => {
            const block = blocksForSubsidiary.find((b) => b.projectCode === pc.code);
            const enabled = !block;
            return (
              <Stack
                key={pc.id}
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={(t) => ({ px: 1.5, py: 0.5, borderRadius: 2, bgcolor: alpha(t.palette.text.primary, 0.04) })}
              >
                <Typography variant="body2" fontWeight={600}>
                  {pc.code}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={0.75}>
                  <Typography variant="caption" color={enabled ? "success.main" : "text.secondary"}>
                    {enabled ? "Enabled" : "Disabled"}
                  </Typography>
                  <Switch
                    size="small"
                    checked={enabled}
                    disabled={togglingCode === pc.code}
                    onChange={() => handleToggle(pc.code, block)}
                  />
                </Stack>
              </Stack>
            );
          })}
        </Stack>
      )}
    </Paper>
  );
}
