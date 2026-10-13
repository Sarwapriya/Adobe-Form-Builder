import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { ApiError } from "../../api/apiClient";
import {
  deletePageErrorDefault,
  listPageErrorDefaults,
  upsertPageErrorDefault,
  type PageErrorLocaleDefault,
} from "../../api/adminApi";
import { SectionHeader } from "../common/SectionHeader";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { LoadingState } from "../common/LoadingState";
import { showToast } from "../../store/toastStore";

const LOCALE_CODE_PATTERN = /^[a-zA-Z]{2,3}_[A-Z]{2}$/;

const EMPTY_FORM = { localeCode: "", heading: "", subHeading: "", subHeadingUrl: "", subHeadingUrlText: "" };

/**
 * Reference table of each locale's default "page error" copy (shown if a
 * published form fails to load/initialize — `page_error[locale].hrErr` in
 * the master data JS file). No builder screen lets an admin type this per
 * form, so it used to be hand-edited into the generated file after every
 * publish; publish_form now auto-fills it from this table instead, for
 * every locale the form actually has (see
 * form_builder_service._resolve_page_error_updates). Purely locale-keyed —
 * the same regional copy applies to every form/subsidiary at that locale.
 * Adding the same locale again replaces its copy in place, so there's no
 * separate "edit" action beyond loading a row back into the form below.
 */
export function PageErrorDefaultsManager() {
  const [rows, setRows] = useState<PageErrorLocaleDefault[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<PageErrorLocaleDefault | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      setRows(await listPageErrorDefaults());
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to load page error defaults", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const trimmedUrl = form.subHeadingUrl.trim();
  const isUrlValid = trimmedUrl.startsWith("http://") || trimmedUrl.startsWith("https://");
  const canSave =
    LOCALE_CODE_PATTERN.test(form.localeCode.trim()) &&
    !!form.heading.trim() &&
    !!form.subHeading.trim() &&
    isUrlValid &&
    !!form.subHeadingUrlText.trim();

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    try {
      await upsertPageErrorDefault(
        form.localeCode.trim(),
        form.heading.trim(),
        form.subHeading.trim(),
        trimmedUrl,
        form.subHeadingUrlText.trim(),
      );
      setForm(EMPTY_FORM);
      await refresh();
      showToast("Saved.", "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to save page error default", "error");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(row: PageErrorLocaleDefault) {
    setForm({
      localeCode: row.localeCode,
      heading: row.heading,
      subHeading: row.subHeading,
      subHeadingUrl: row.subHeadingUrl,
      subHeadingUrlText: row.subHeadingUrlText,
    });
  }

  async function handleConfirmDelete() {
    if (!confirmDelete) return;
    const id = confirmDelete.id;
    setDeletingId(id);
    try {
      await deletePageErrorDefault(id);
      setConfirmDelete(null);
      await refresh();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to remove page error default", "error");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <SectionHeader
        icon={<ErrorOutlineIcon fontSize="small" color="primary" />}
        title="Page error defaults"
        subtitle="The default 'something went wrong' copy for each locale — automatically written into every published form's master data file for each locale the form has, so it never needs hand-editing in afterward."
      />

      <Box component="form" onSubmit={handleSave} sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
          <TextField
            label="Locale code"
            size="small"
            placeholder="ar_AE"
            sx={{ minWidth: 120 }}
            value={form.localeCode}
            onChange={(e) => setForm((f) => ({ ...f, localeCode: e.target.value }))}
          />
          <TextField
            label="Heading"
            size="small"
            sx={{ minWidth: 220, flex: 1 }}
            value={form.heading}
            onChange={(e) => setForm((f) => ({ ...f, heading: e.target.value }))}
          />
        </Stack>
        <TextField
          label="Sub-heading"
          size="small"
          fullWidth
          sx={{ mb: 1.5 }}
          value={form.subHeading}
          onChange={(e) => setForm((f) => ({ ...f, subHeading: e.target.value }))}
        />
        <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap alignItems="center">
          <TextField
            label="Link URL"
            size="small"
            placeholder="https://www.samsung.com/ae/galaxy-ai/"
            sx={{ minWidth: 320, flex: 1 }}
            value={form.subHeadingUrl}
            onChange={(e) => setForm((f) => ({ ...f, subHeadingUrl: e.target.value }))}
          />
          <TextField
            label="Link text"
            size="small"
            placeholder="Why Galaxy?"
            sx={{ minWidth: 160 }}
            value={form.subHeadingUrlText}
            onChange={(e) => setForm((f) => ({ ...f, subHeadingUrlText: e.target.value }))}
          />
          <Button type="submit" variant="outlined" disabled={!canSave || saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
          {Object.values(form).some(Boolean) && (
            <Button size="small" onClick={() => setForm(EMPTY_FORM)}>
              Clear
            </Button>
          )}
        </Stack>
      </Box>

      {loading ? (
        <LoadingState />
      ) : rows.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No page error defaults configured yet.
        </Typography>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Locale</TableCell>
              <TableCell>Heading</TableCell>
              <TableCell>Sub-heading</TableCell>
              <TableCell>Link text</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id} hover>
                <TableCell sx={{ fontFamily: "monospace" }}>{r.localeCode}</TableCell>
                <TableCell>{r.heading}</TableCell>
                <TableCell sx={{ maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {r.subHeading}
                </TableCell>
                <TableCell>
                  <Tooltip title={r.subHeadingUrl}>
                    <span>{r.subHeadingUrlText}</span>
                  </Tooltip>
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Load into the form above to edit">
                    <IconButton size="small" onClick={() => handleEdit(r)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Remove">
                    <span>
                      <IconButton size="small" disabled={deletingId === r.id} onClick={() => setConfirmDelete(r)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Remove page error default"
        message={
          <>
            Remove the page error default for <strong>{confirmDelete?.localeCode}</strong>? Forms published after this
            will no longer auto-fill it for that locale.
          </>
        }
        confirmLabel="Remove"
        loading={!!confirmDelete && deletingId === confirmDelete.id}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </Paper>
  );
}
