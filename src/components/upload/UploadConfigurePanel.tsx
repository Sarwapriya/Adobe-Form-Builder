import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Divider,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import {
  mapWorkbook,
  parseWorkbook,
  resolveLocalizedText,
  validateWorkbook,
  type FormDefinition,
  type FormVariant,
  type ValidationResult,
} from "@formbuilder/shared";

interface Props {
  file: File;
  /** The subsidiary typed (or, for a subsidiary-scoped user, auto-filled and
   * locked — see UploadHistoryPage.tsx) into the upload form — cross-checked
   * client-side here for immediate feedback; the server re-validates this
   * exact same way regardless (uploadService.createUpload), so this is a UX
   * head start, not the authoritative check. */
  subsidiaryId: string;
  /** The project code selected in the upload form's dropdown — same
   * cross-check treatment as subsidiaryId above. */
  projectCode: string;
  onCancel: () => void;
  onConfirm: (requiredOverrides: Record<string, boolean>, variants: FormVariant[]) => void;
  confirming: boolean;
}

interface ParsedPreview {
  form: FormDefinition;
  validation: ValidationResult;
  workbookSubsidiary: string;
  workbookProjectCode: string;
}

function normalizeForMatch(s: string): string {
  return s.trim().toLowerCase();
}

function matches(a: string, b: string): boolean {
  return normalizeForMatch(a) === normalizeForMatch(b);
}

/**
 * The upload form's "configure" step: parses the selected workbook entirely
 * client-side (the same DOM-free @formbuilder/shared pipeline the /local
 * wizard and the backend both use — parseWorkbook -> mapWorkbook ->
 * validateWorkbook, no server round-trip yet) so the uploader can see which
 * questions the workbook produced and mark any of them optional before
 * anything is actually uploaded. Confirming sends the file plus the chosen
 * required/optional map in one request (uploadsApi.uploadWorkbook) — the
 * server re-parses and re-validates independently, this is a preview only.
 */
export function UploadConfigurePanel({ file, subsidiaryId, projectCode, onCancel, onConfirm, confirming }: Props) {
  const [preview, setPreview] = useState<ParsedPreview | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [requiredById, setRequiredById] = useState<Record<string, boolean>>({});
  const [variants, setVariants] = useState<FormVariant[]>(["ff", "oc"]);

  function toggleVariant(variant: FormVariant, checked: boolean) {
    setVariants((prev) => {
      if (checked) return prev.includes(variant) ? prev : [...prev, variant];
      // At least one variant must always stay selected — unchecking the last
      // one is simply ignored rather than needing its own disabled-state
      // juggling per checkbox.
      return prev.length > 1 ? prev.filter((v) => v !== variant) : prev;
    });
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setParseError(null);
    setPreview(null);

    file
      .arrayBuffer()
      .then((buffer) => {
        if (cancelled) return;
        const parsed = parseWorkbook(buffer, file.name);
        const mapped = mapWorkbook(parsed);
        const validation = validateWorkbook(mapped, parsed.issues);
        const workbookProjectCode = parsed.meta.projectCode.C || parsed.meta.projectCode.D || "";

        setPreview({
          form: mapped.form,
          validation,
          // mapper.ts already resolves parsed.meta.subsidiary (C-preferred,
          // D-fallback) into form.meta.subsidiary — reused here rather than
          // re-deriving the same value a second way.
          workbookSubsidiary: mapped.form.meta.subsidiary,
          workbookProjectCode,
        });
        setRequiredById(Object.fromEntries(mapped.form.questions.map((q) => [q.id, q.required])));
      })
      .catch(() => {
        if (!cancelled) setParseError("Could not read this file — is it a valid .xlsx/.xls workbook?");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [file]);

  if (loading) {
    return (
      <Paper sx={{ p: 3, mb: 4, borderRadius: 3, display: "flex", alignItems: "center", gap: 1.5 }}>
        <CircularProgress size={20} />
        <Typography color="text.secondary">Reading {file.name}...</Typography>
      </Paper>
    );
  }

  if (parseError || !preview) {
    return (
      <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }}>
        <Alert severity="error">{parseError ?? "Could not read this file."}</Alert>
        <Button sx={{ mt: 2 }} onClick={onCancel}>
          Choose a different file
        </Button>
      </Paper>
    );
  }

  const { form, validation, workbookSubsidiary, workbookProjectCode } = preview;
  const hasBlockingErrors = validation.errors.length > 0;
  const subsidiaryMatches = matches(workbookSubsidiary, subsidiaryId);
  const projectCodeMatches = matches(workbookProjectCode, projectCode);
  // The button is disabled outright whenever either mismatch banner below is
  // showing — not just re-checked on click — so there's no way to click
  // through while a visible error is on screen.
  const canConfirm = !hasBlockingErrors && subsidiaryMatches && projectCodeMatches && !confirming;

  return (
    <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }}>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
        Configure before uploading
      </Typography>

      <MetadataMatchCheck
        label="Subsidiary"
        workbookValue={workbookSubsidiary}
        selectedValue={subsidiaryId}
        isMatch={subsidiaryMatches}
      />
      <MetadataMatchCheck
        label="Project Code"
        workbookValue={workbookProjectCode}
        selectedValue={projectCode}
        isMatch={projectCodeMatches}
      />

      <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
        Form type to generate
      </Typography>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={variants.includes("ff")}
              onChange={(e) => toggleVariant("ff", e.target.checked)}
            />
          }
          label="Full Form"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={variants.includes("oc")}
              onChange={(e) => toggleVariant("oc", e.target.checked)}
            />
          }
          label="One-Click"
        />
      </Stack>

      {validation.errors.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {validation.errors.length} blocking error(s) — this file can't be uploaded until they're fixed:
          <ul style={{ margin: "4px 0 0", paddingLeft: 20 }}>
            {validation.errors.map((issue, i) => (
              <li key={i}>{issue.message}</li>
            ))}
          </ul>
        </Alert>
      )}
      {validation.warnings.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {validation.warnings.length} warning(s):
          <ul style={{ margin: "4px 0 0", paddingLeft: 20 }}>
            {validation.warnings.map((issue, i) => (
              <li key={i}>{issue.message}</li>
            ))}
          </ul>
        </Alert>
      )}

      {form.questions.length > 0 && (
        <>
          <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
            Mandatory questions
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
            Every question defaults to required — turn any off to make it optional in the generated form.
          </Typography>
          <Box sx={{ maxHeight: 280, overflowY: "auto", border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
            {form.questions.map((q, i) => (
              <Box key={q.id}>
                {i > 0 && <Divider />}
                <FormControlLabel
                  sx={{ width: "100%", m: 0, px: 1.5, py: 0.75, justifyContent: "space-between" }}
                  labelPlacement="start"
                  label={
                    <Typography variant="body2" sx={{ pr: 2 }}>
                      <strong>{q.id}.</strong>{" "}
                      {resolveLocalizedText(q.headingByLocale, form.meta.defaultLocale, form.meta.defaultLocale)}
                    </Typography>
                  }
                  control={
                    <Switch
                      checked={requiredById[q.id] ?? true}
                      onChange={(e) => setRequiredById((prev) => ({ ...prev, [q.id]: e.target.checked }))}
                    />
                  }
                />
              </Box>
            ))}
          </Box>
        </>
      )}

      <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
        <Button variant="contained" disabled={!canConfirm} onClick={() => onConfirm(requiredById, variants)}>
          {confirming ? "Uploading..." : "Confirm & Upload"}
        </Button>
        <Button variant="text" onClick={onCancel} disabled={confirming}>
          Cancel
        </Button>
      </Stack>
    </Paper>
  );
}

/** Purely presentational — the match itself is computed once by the parent
 * (canConfirm's own gate uses the exact same values) so the banner and the
 * button disablement can never disagree with each other. */
function MetadataMatchCheck({
  label,
  workbookValue,
  selectedValue,
  isMatch,
}: {
  label: string;
  workbookValue: string;
  selectedValue: string;
  isMatch: boolean;
}) {
  if (isMatch) {
    return (
      <Alert severity="success" sx={{ mb: 2 }}>
        {label} matches: the workbook's own "{workbookValue}" row matches the selected {label.toLowerCase()}.
      </Alert>
    );
  }

  return (
    <Alert severity="error" sx={{ mb: 2 }}>
      {workbookValue
        ? `This workbook's ${label} is "${workbookValue}", which doesn't match "${selectedValue}" selected above.`
        : `This workbook has no "${label}" row, so it can't be matched against "${selectedValue}" selected above.`}
    </Alert>
  );
}
