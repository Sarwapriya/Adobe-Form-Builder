import { useRef, useState } from "react";
import { Alert, Box, CircularProgress, Stack, Typography } from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { ApiError } from "../../api/apiClient";
import { uploadConsentDocument, type ConsentDocumentKind } from "../../api/formBuilderApi";
import { uploadAdHocConsentDocument } from "../../api/subsidiaryFormsApi";

/**
 * Drag-and-drop (or click-to-browse) PDF upload for the Terms & Conditions /
 * Privacy Policy "Link URL" fields in ProfileFieldEditorPanel.tsx. On a
 * successful upload the server has already renamed the file and set this
 * form's own `urlByLocale`/`linkUrlByLocale` (every locale, this form only —
 * see form_builder_service.upload_consent_document) to the document's
 * resolved Adobe frontal-server URL; `onUploaded` just mirrors that into the
 * builder's local state so the Link URL field updates immediately without a
 * reload. That URL is a *sample* until the next Deploy actually pushes the
 * file to Adobe — ConsentUrlSampleNote (rendered by the caller next to the
 * Link URL field) carries that disclaimer, not this component.
 *
 * No drag-and-drop library — plain HTML5 drag events, since nothing else in
 * this app needed one yet.
 */
export function ConsentDocumentUpload({
  formId,
  mode,
  kind,
  disabled = false,
  onUploaded,
}: {
  formId: string;
  mode: "admin" | "adhoc";
  kind: ConsentDocumentKind;
  disabled?: boolean;
  onUploaded: (fileName: string, url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are supported.");
      return;
    }
    setUploading(true);
    try {
      const result =
        mode === "adhoc" ? await uploadAdHocConsentDocument(formId, kind, file) : await uploadConsentDocument(formId, kind, file);
      onUploaded(result.fileName, result.url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed — please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Stack spacing={1}>
      <Box
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled && !uploading) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (disabled || uploading) return;
          const file = e.dataTransfer.files?.[0];
          if (file) void handleFile(file);
        }}
        sx={{
          border: "2px dashed",
          borderColor: dragOver ? "primary.main" : "divider",
          borderRadius: 2,
          p: 2,
          textAlign: "center",
          cursor: disabled || uploading ? "default" : "pointer",
          opacity: disabled ? 0.5 : 1,
          bgcolor: dragOver ? "action.hover" : "transparent",
          transition: "border-color 0.15s, background-color 0.15s",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          hidden
          disabled={disabled || uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = ""; // lets the same file be re-selected after an error
            if (file) void handleFile(file);
          }}
        />
        {uploading ? (
          <CircularProgress size={20} />
        ) : (
          <Stack spacing={0.5} alignItems="center">
            <UploadFileIcon fontSize="small" color={disabled ? "disabled" : "action"} />
            <Typography variant="caption" color="text.secondary">
              {disabled ? "Upload unavailable right now" : "Drag and drop a PDF here, or click to browse"}
            </Typography>
          </Stack>
        )}
      </Box>
      {error && (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      )}
    </Stack>
  );
}
