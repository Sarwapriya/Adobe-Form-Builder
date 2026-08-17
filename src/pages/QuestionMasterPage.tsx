import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ListAltIcon from "@mui/icons-material/ListAlt";
import DownloadIcon from "@mui/icons-material/Download";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { ApiError } from "../api/apiClient";
import { listAllProjectCodes, type ProjectCode } from "../api/adminApi";
import {
  downloadQuestionMasterVersion,
  generateQuestionMaster,
  getQuestionMasterReadiness,
  listQuestionMasterVersions,
  type QuestionMasterReadinessItem,
  type QuestionMasterVersion,
} from "../api/questionMasterApi";
import { downloadBlob } from "../utils/download";
import { PageHeader } from "../components/common/PageHeader";

/**
 * Admin-only: generates a versioned "Question Master" .xlsx per project code —
 * a flat, one-row-per-(subsidiary, locale, question/field) compilation of every
 * currently *published* Form under that project (see backend
 * questionMasterService.ts), matching the column layout of the hand-maintained
 * reference workbooks it replaces. Pure export/reporting — nothing here feeds back
 * into the Form Builder or generated forms.
 */
export function QuestionMasterPage() {
  const [projectCodes, setProjectCodes] = useState<ProjectCode[]>([]);
  const [projectCode, setProjectCode] = useState("");

  const [readiness, setReadiness] = useState<QuestionMasterReadinessItem[]>([]);
  const [versions, setVersions] = useState<QuestionMasterVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [generateOpen, setGenerateOpen] = useState(false);
  const [division, setDivision] = useState("");
  const [generating, setGenerating] = useState(false);

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    listAllProjectCodes()
      .then(setProjectCodes)
      .catch(() => undefined);
  }, []);

  function refresh(code: string) {
    setLoading(true);
    setError(null);
    Promise.all([getQuestionMasterReadiness(code), listQuestionMasterVersions(code)])
      .then(([readinessResult, versionsResult]) => {
        setReadiness(readinessResult);
        setVersions(versionsResult);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Failed to load Question Master data");
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!projectCode) {
      setReadiness([]);
      setVersions([]);
      return;
    }
    refresh(projectCode);
    // Only re-runs when the selected project code changes — refresh() itself is
    // re-created every render but isn't a dependency, same pattern other pages in
    // this app use for a single "load on selection change" effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectCode]);

  const notReadyCount = readiness.filter((r) => !r.readyForExport).length;
  const selectedProjectCode = projectCodes.find((pc) => pc.code === projectCode);
  const isLocked = selectedProjectCode?.isLocked ?? false;

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      await generateQuestionMaster(projectCode, division.trim());
      setGenerateOpen(false);
      setDivision("");
      refresh(projectCode);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to generate Question Master");
    } finally {
      setGenerating(false);
    }
  }

  async function handleDownload(version: QuestionMasterVersion) {
    setDownloadingId(version.id);
    try {
      const blob = await downloadQuestionMasterVersion(version.id);
      downloadBlob(blob, `QuestionMaster_${version.projectCode}_v${version.version}.xlsx`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Download failed");
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <Box>
      <PageHeader
        icon={<ListAltIcon />}
        title="Question Master"
        subtitle="Generate a versioned, project-wise export of every question and field currently in use, compiled from published forms."
      />

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          select
          label="Project Code"
          size="small"
          sx={{ minWidth: 240 }}
          value={projectCode}
          onChange={(e) => setProjectCode(e.target.value)}
        >
          <MenuItem value="">
            <em>Select a project code</em>
          </MenuItem>
          {projectCodes.map((pc) => (
            <MenuItem key={pc.id} value={pc.code}>
              {pc.code}
            </MenuItem>
          ))}
        </TextField>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {!projectCode && (
        <Typography color="text.secondary">Select a project code to see subsidiary readiness and past versions.</Typography>
      )}

      {projectCode && loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {projectCode && !loading && (
        <>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
              <Typography variant="overline" color="text.secondary">
                Subsidiary readiness
              </Typography>
              <Tooltip title={isLocked ? "" : "Lock this project code in Configuration before generating"}>
                <span>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<PlayArrowIcon />}
                    disabled={readiness.length === 0 || !isLocked}
                    onClick={() => setGenerateOpen(true)}
                  >
                    Generate
                  </Button>
                </span>
              </Tooltip>
            </Stack>

            {!isLocked && (
              <Alert severity="info" sx={{ mb: 1.5, borderRadius: 2 }}>
                This project code isn't locked yet — lock it in Configuration → Campaign - Project Code before generating a
                Question Master, so nothing can still change out from under the snapshot.
              </Alert>
            )}

            {notReadyCount > 0 && (
              <Alert severity="warning" sx={{ mb: 1.5, borderRadius: 2 }}>
                {notReadyCount} of {readiness.length} subsidiary form{readiness.length === 1 ? "" : "s"} under this project
                {notReadyCount === 1 ? " isn't" : " aren't"} ready yet (not published, or has a translation still awaiting
                approval) — generating now will only include the forms that are.
              </Alert>
            )}

            {readiness.length === 0 ? (
              <Typography color="text.secondary">No active subsidiary has a form under this project code yet.</Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Subsidiary</TableCell>
                      <TableCell>Form</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Locales in published version</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {readiness.map((r) => (
                      <TableRow key={r.formId}>
                        <TableCell>{r.subsidiaryId}</TableCell>
                        <TableCell>{r.formName}</TableCell>
                        <TableCell>
                          <Chip
                            label={
                              r.readyForExport
                                ? "Published"
                                : r.published && r.pendingContribution
                                  ? "Pending translation approval"
                                  : "Not published"
                            }
                            color={r.readyForExport ? "success" : r.published && r.pendingContribution ? "warning" : "default"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {r.locales.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
                              —
                            </Typography>
                          ) : (
                            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                              {r.locales.map((locale) => (
                                <Chip key={locale} label={locale} size="small" variant="outlined" />
                              ))}
                            </Stack>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="overline" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
              Version history
            </Typography>
            {versions.length === 0 ? (
              <Typography color="text.secondary">No Question Master has been generated for this project yet.</Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Version</TableCell>
                      <TableCell>Division</TableCell>
                      <TableCell>Subsidiaries</TableCell>
                      <TableCell>Rows</TableCell>
                      <TableCell>Generated</TableCell>
                      <TableCell align="right">Download</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {versions.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell>v{v.version}</TableCell>
                        <TableCell>{v.division || "—"}</TableCell>
                        <TableCell>{v.subsidiaryCount}</TableCell>
                        <TableCell>{v.totalRows}</TableCell>
                        <TableCell>{new Date(v.generatedAt).toLocaleString()}</TableCell>
                        <TableCell align="right">
                          <Tooltip title="Download">
                            <span>
                              <IconButton size="small" disabled={downloadingId === v.id} onClick={() => handleDownload(v)}>
                                <DownloadIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </>
      )}

      <Dialog open={generateOpen} onClose={() => (!generating ? setGenerateOpen(false) : undefined)} maxWidth="xs" fullWidth>
        <DialogTitle>Generate Question Master — {projectCode}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Compiles every published form under this project code into a new version. Division has no saved default —
            enter it for this export.
          </Typography>
          <TextField
            label="Division"
            placeholder="e.g. MX, VD"
            size="small"
            fullWidth
            value={division}
            onChange={(e) => setDivision(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGenerateOpen(false)} disabled={generating}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleGenerate} disabled={generating}>
            {generating ? "Generating…" : "Generate"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
