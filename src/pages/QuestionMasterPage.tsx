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
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { ApiError } from "../api/apiClient";
import { listAllProjectCodes, type ProjectCode } from "../api/adminApi";
import {
  downloadQuestionMasterVersion,
  generateQuestionMaster,
  generateQuestionMasterFromUploads,
  getQuestionMasterReadiness,
  getQuestionMasterUploadReadiness,
  listQuestionMasterVersions,
  type QuestionMasterReadinessItem,
  type QuestionMasterUploadReadinessItem,
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
 *
 * Also offers a second, independent "Excel upload readiness" section + "Generate
 * from Excel Uploads" action — the same compilation, sourced instead from
 * submitted Excel-upload workbooks under the project code (see backend
 * questionMasterService.generateQuestionMasterFromUploads). Both write into the
 * same version history below, distinguished by the Source column; neither
 * process changes or depends on the other.
 */
export function QuestionMasterPage() {
  const [projectCodes, setProjectCodes] = useState<ProjectCode[]>([]);
  const [projectCode, setProjectCode] = useState("");

  const [readiness, setReadiness] = useState<QuestionMasterReadinessItem[]>([]);
  const [uploadReadiness, setUploadReadiness] = useState<QuestionMasterUploadReadinessItem[]>([]);
  const [versions, setVersions] = useState<QuestionMasterVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [generateOpen, setGenerateOpen] = useState(false);
  const [division, setDivision] = useState("");
  const [generating, setGenerating] = useState(false);

  // Additive "Generate from Excel Uploads" flow — entirely separate state from the
  // Form-Initiator-based Generate dialog above, so neither can interfere with the other.
  const [generateFromUploadsOpen, setGenerateFromUploadsOpen] = useState(false);
  const [uploadDivision, setUploadDivision] = useState("");
  const [generatingFromUploads, setGeneratingFromUploads] = useState(false);

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Shown once, right when an admin picks a project code that isn't locked yet —
  // the inline "isn't locked" Alerts further down stay as a persistent reminder
  // while this panel is open, but a popup at the moment of selection makes sure
  // it isn't missed.
  const [notLockedNoticeOpen, setNotLockedNoticeOpen] = useState(false);

  useEffect(() => {
    listAllProjectCodes()
      .then(setProjectCodes)
      .catch(() => undefined);
  }, []);

  function handleProjectCodeChange(code: string) {
    setProjectCode(code);
    const selected = projectCodes.find((pc) => pc.code === code);
    if (code && selected && !selected.isLocked) {
      setNotLockedNoticeOpen(true);
    }
  }

  function refresh(code: string) {
    setLoading(true);
    setError(null);
    Promise.all([getQuestionMasterReadiness(code), getQuestionMasterUploadReadiness(code), listQuestionMasterVersions(code)])
      .then(([readinessResult, uploadReadinessResult, versionsResult]) => {
        setReadiness(readinessResult);
        setUploadReadiness(uploadReadinessResult);
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
  const notReadyUploadCount = uploadReadiness.filter((r) => !r.readyForExport).length;
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

  async function handleGenerateFromUploads() {
    setGeneratingFromUploads(true);
    setError(null);
    try {
      await generateQuestionMasterFromUploads(projectCode, uploadDivision.trim());
      setGenerateFromUploadsOpen(false);
      setUploadDivision("");
      refresh(projectCode);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to generate Question Master from Excel uploads");
    } finally {
      setGeneratingFromUploads(false);
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
          onChange={(e) => handleProjectCodeChange(e.target.value)}
          InputLabelProps={{ shrink: true }}
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

          <Paper sx={{ p: 2, mb: 3 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
              <Typography variant="overline" color="text.secondary">
                Excel upload readiness
              </Typography>
              <Tooltip title={isLocked ? "" : "Lock this project code in Configuration before generating"}>
                <span>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<PlayArrowIcon />}
                    disabled={uploadReadiness.length === 0 || !isLocked}
                    onClick={() => setGenerateFromUploadsOpen(true)}
                  >
                    Generate from Excel Uploads
                  </Button>
                </span>
              </Tooltip>
            </Stack>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              A separate compilation, sourced from submitted Excel-upload workbooks under this project code instead of
              published Form Initiator forms — use this for campaigns run entirely through the upload flow.
            </Typography>

            {!isLocked && uploadReadiness.length > 0 && (
              <Alert severity="info" sx={{ mb: 1.5, borderRadius: 2 }}>
                This project code isn't locked yet — lock it in Configuration → Campaign - Project Code before generating a
                Question Master, so nothing can still change out from under the snapshot.
              </Alert>
            )}

            {notReadyUploadCount > 0 && (
              <Alert severity="warning" sx={{ mb: 1.5, borderRadius: 2 }}>
                {notReadyUploadCount} of {uploadReadiness.length} subsidiary upload{uploadReadiness.length === 1 ? "" : "s"}{" "}
                under this project {notReadyUploadCount === 1 ? "isn't" : "aren't"} submitted yet — generating now will
                only include the ones that are.
              </Alert>
            )}

            {uploadReadiness.length === 0 ? (
              <Typography color="text.secondary">No active subsidiary has an Excel upload under this project code yet.</Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Subsidiary</TableCell>
                      <TableCell>File</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Version</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {uploadReadiness.map((r) => (
                      <TableRow key={r.uploadId}>
                        <TableCell>{r.subsidiaryId}</TableCell>
                        <TableCell>{r.fileName}</TableCell>
                        <TableCell>
                          <Chip
                            label={r.readyForExport ? "Submitted" : r.status === "failed" ? "Failed" : "Not submitted"}
                            color={r.readyForExport ? "success" : r.status === "failed" ? "error" : "default"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{r.version != null ? `v${r.version}` : "—"}</TableCell>
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
                      <TableCell>Source</TableCell>
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
                        <TableCell>
                          <Chip
                            label={v.source === "excel_upload" ? "Excel Upload" : "Form Initiator"}
                            size="small"
                            variant="outlined"
                            color={v.source === "excel_upload" ? "secondary" : "primary"}
                          />
                        </TableCell>
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

      <Dialog
        open={generateFromUploadsOpen}
        onClose={() => (!generatingFromUploads ? setGenerateFromUploadsOpen(false) : undefined)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Generate Question Master from Excel Uploads — {projectCode}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Compiles every submitted Excel-upload workbook under this project code into a new version, independent of
            the Form Initiator-based export above. Division has no saved default — enter it for this export.
          </Typography>
          <TextField
            label="Division"
            placeholder="e.g. MX, VD"
            size="small"
            fullWidth
            value={uploadDivision}
            onChange={(e) => setUploadDivision(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGenerateFromUploadsOpen(false)} disabled={generatingFromUploads}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleGenerateFromUploads} disabled={generatingFromUploads}>
            {generatingFromUploads ? "Generating…" : "Generate"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={notLockedNoticeOpen} onClose={() => setNotLockedNoticeOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <WarningAmberIcon color="warning" />
          Still not locked this project
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            "{projectCode}" hasn't been locked yet, so forms and Excel uploads under it can still change. You can still
            browse readiness and past versions here, but generating a new Question Master is blocked until you lock it
            in Configuration → Campaign - Project Code — that guarantees the export reflects a final, stable snapshot
            instead of one something could still change out from under.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setNotLockedNoticeOpen(false)}>
            Got it
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
