import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import LayersIcon from "@mui/icons-material/Layers";
import { ApiError } from "../../api/apiClient";
import {
  createSubsidiaryProjectBlock,
  listSubsidiaryProjectBlocks,
  type SubsidiaryProjectBlock,
} from "../../api/adminApi";
import { listSubsidiaries, type Subsidiary } from "../../api/subsidiariesApi";
import { listOpenProjectCodes, type ProjectCode } from "../../api/projectCodesApi";

/**
 * Bulk version of SubsidiaryProjectBlockManager above: pick several
 * subsidiaries and several project codes and block every combination
 * (cross-product) in one action, instead of one (subsidiary, project code)
 * pair at a time. Shares the same underlying restriction — a
 * SubsidiaryProjectBlock row per pair — so blocks created here show up in,
 * and can be individually removed from, the single-pair panel's list above;
 * this panel is create-only (bulk creation is the point; removal stays a
 * one-at-a-time action there). Pairs already blocked are silently skipped
 * rather than erroring, so re-running an overlapping selection is safe.
 *
 * `refreshSignal` is bumped by ConfigurationPage whenever ProjectCodeManager
 * or SubsidiaryManager change something, same as SubsidiaryProjectBlockManager;
 * `onChange` bumps it back so that panel's own list picks up the blocks this
 * one just created.
 */
export function SubsidiaryProjectBulkBlockManager(
  { refreshSignal, onChange }: { refreshSignal?: number; onChange?: () => void } = {},
) {
  const [blocks, setBlocks] = useState<SubsidiaryProjectBlock[]>([]);
  const [subsidiaries, setSubsidiaries] = useState<Subsidiary[]>([]);
  const [projectCodes, setProjectCodes] = useState<ProjectCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedSubsidiaries, setSelectedSubsidiaries] = useState<string[]>([]);
  const [selectedProjectCodes, setSelectedProjectCodes] = useState<string[]>([]);
  const [blocking, setBlocking] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const [blockRows, subsidiaryRows, codeRows] = await Promise.all([
        listSubsidiaryProjectBlocks(),
        listSubsidiaries(),
        listOpenProjectCodes(),
      ]);
      setBlocks(blockRows);
      setSubsidiaries(subsidiaryRows);
      setProjectCodes(codeRows);
      const subsidiaryNames = new Set(subsidiaryRows.map((s) => s.name));
      const codeValues = new Set(codeRows.map((c) => c.code));
      setSelectedSubsidiaries((current) => current.filter((name) => subsidiaryNames.has(name)));
      setSelectedProjectCodes((current) => current.filter((code) => codeValues.has(code)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load subsidiaries / project codes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshSignal]);

  const pairCount = selectedSubsidiaries.length * selectedProjectCodes.length;
  const alreadyBlockedCount = selectedSubsidiaries.reduce(
    (count, subsidiaryName) =>
      count +
      selectedProjectCodes.filter((code) =>
        blocks.some((b) => b.subsidiaryName === subsidiaryName && b.projectCode === code),
      ).length,
    0,
  );
  const newPairCount = pairCount - alreadyBlockedCount;

  async function handleBulkBlock(e: FormEvent) {
    e.preventDefault();
    if (selectedSubsidiaries.length === 0 || selectedProjectCodes.length === 0) return;

    setBlocking(true);
    setError(null);
    setLastResult(null);
    try {
      const pairsToCreate = selectedSubsidiaries.flatMap((subsidiaryName) =>
        selectedProjectCodes
          .filter((code) => !blocks.some((b) => b.subsidiaryName === subsidiaryName && b.projectCode === code))
          .map((code) => ({ subsidiaryName, code })),
      );
      await Promise.all(pairsToCreate.map((p) => createSubsidiaryProjectBlock(p.subsidiaryName, p.code)));
      setLastResult(
        pairsToCreate.length === 0
          ? "Every selected pair was already blocked — nothing to do."
          : `Blocked ${pairsToCreate.length} pair${pairsToCreate.length === 1 ? "" : "s"}.`,
      );
      setSelectedSubsidiaries([]);
      setSelectedProjectCodes([]);
      await refresh();
      onChange?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create restrictions");
    } finally {
      setBlocking(false);
    }
  }

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
        <LayersIcon fontSize="small" color="primary" />
        <Typography variant="subtitle1" fontWeight={700}>
          Bulk subsidiary / project code restrictions
        </Typography>
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
        Select several subsidiaries and several project codes to block every combination at once — e.g. 3
        subsidiaries x 2 project codes blocks all 6 pairs in one click.
      </Typography>

      {loading ? (
        <CircularProgress size={20} />
      ) : (
        <Box component="form" onSubmit={handleBulkBlock}>
          <Stack direction="row" spacing={1.5} sx={{ mb: 1.5, flexWrap: "wrap" }}>
            <TextField
              select
              label="Subsidiaries"
              size="small"
              sx={{ minWidth: 220 }}
              slotProps={{
                select: {
                  multiple: true,
                  value: selectedSubsidiaries,
                  onChange: (e) => setSelectedSubsidiaries(e.target.value as unknown as string[]),
                  renderValue: (selected) => (
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                      {(selected as string[]).map((name) => (
                        <Chip key={name} label={name} size="small" />
                      ))}
                    </Stack>
                  ),
                },
              }}
              disabled={subsidiaries.length === 0}
            >
              {subsidiaries.map((s) => (
                <MenuItem key={s.id} value={s.name}>
                  <Checkbox checked={selectedSubsidiaries.includes(s.name)} size="small" />
                  <ListItemText primary={s.name} />
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Project codes"
              size="small"
              sx={{ minWidth: 220 }}
              slotProps={{
                select: {
                  multiple: true,
                  value: selectedProjectCodes,
                  onChange: (e) => setSelectedProjectCodes(e.target.value as unknown as string[]),
                  renderValue: (selected) => (
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                      {(selected as string[]).map((code) => (
                        <Chip key={code} label={code} size="small" />
                      ))}
                    </Stack>
                  ),
                },
              }}
              disabled={projectCodes.length === 0}
            >
              {projectCodes.map((pc) => (
                <MenuItem key={pc.id} value={pc.code}>
                  <Checkbox checked={selectedProjectCodes.includes(pc.code)} size="small" />
                  <ListItemText primary={pc.code} />
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5, flexWrap: "wrap" }}>
            <Button
              type="submit"
              variant="contained"
              disabled={selectedSubsidiaries.length === 0 || selectedProjectCodes.length === 0 || blocking}
            >
              {blocking ? "Blocking..." : "Block selected pairs"}
            </Button>
            {pairCount > 0 && (
              <Typography variant="caption" color="text.secondary">
                {newPairCount} new pair{newPairCount === 1 ? "" : "s"} to block
                {alreadyBlockedCount > 0 ? ` (${alreadyBlockedCount} already blocked)` : ""}
              </Typography>
            )}
          </Stack>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          {error}
        </Alert>
      )}
      {lastResult && !error && (
        <Alert severity="success" sx={{ mb: 1.5 }} onClose={() => setLastResult(null)}>
          {lastResult}
        </Alert>
      )}
    </Paper>
  );
}
