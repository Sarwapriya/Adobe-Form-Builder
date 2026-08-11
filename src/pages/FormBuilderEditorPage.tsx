import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box, CircularProgress, IconButton, Paper, Stack, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DesignServicesIcon from "@mui/icons-material/DesignServices";
import { useFormBuilderStore } from "../store/formBuilderStore";
import { CampaignHeaderPanel } from "../components/formBuilder/CampaignHeaderPanel";
import { BuilderCanvas, PredefinedFieldToggles } from "../components/formBuilder/BuilderCanvas";
import { QuestionEditorPanel } from "../components/formBuilder/QuestionEditorPanel";
import { ProfileFieldEditorPanel } from "../components/formBuilder/ProfileFieldEditorPanel";
import { BuilderValidationPanel } from "../components/formBuilder/BuilderValidationPanel";
import { BuilderActionBar } from "../components/formBuilder/BuilderActionBar";

const PROFILE_FIELD_KEYS = new Set(["firstName", "lastName", "email", "mobileNumber"]);

/**
 * The main builder screen: campaign heading/subheading, predefined-field
 * toggles + the drag-and-drop question canvas on the left, a config panel for
 * whatever's currently selected on the right, and the Preview/Save
 * Draft/Publish/Unpublish action bar pinned at the bottom.
 */
export function FormBuilderEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const loading = useFormBuilderStore((s) => s.loading);
  const error = useFormBuilderStore((s) => s.error);
  const definition = useFormBuilderStore((s) => s.definition);
  const loadForm = useFormBuilderStore((s) => s.loadForm);
  const reset = useFormBuilderStore((s) => s.reset);

  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (id) void loadForm(id);
    return () => reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading || !definition) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        {loading ? <CircularProgress /> : <Typography color="error">{error ?? "Form not found."}</Typography>}
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <IconButton onClick={() => navigate("/admin/form-builder")} aria-label="Back to Form Builder list">
          <ArrowBackIcon />
        </IconButton>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "primary.main",
            color: "primary.contrastText",
          }}
        >
          <DesignServicesIcon />
        </Box>
        <Typography variant="h4" component="h1" sx={{ lineHeight: 1.1 }}>
          Edit Form
        </Typography>
      </Stack>

      <BuilderValidationPanel />

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2, alignItems: "flex-start" }}>
        <Box sx={{ flex: "1 1 auto", minWidth: 0, width: "100%" }}>
          <CampaignHeaderPanel />
          <PredefinedFieldToggles selectedField={selected} onSelectField={setSelected} />
          <BuilderCanvas selectedQuestionId={PROFILE_FIELD_KEYS.has(selected ?? "") ? null : selected} onSelectQuestion={setSelected} />
        </Box>

        <Paper sx={{ p: 2, borderRadius: 3, width: { xs: "100%", md: 340 }, flexShrink: 0, position: "sticky", top: 16 }}>
          {selected && PROFILE_FIELD_KEYS.has(selected) ? (
            <ProfileFieldEditorPanel fieldKey={selected as "firstName" | "lastName" | "email" | "mobileNumber"} />
          ) : selected ? (
            <QuestionEditorPanel questionId={selected} />
          ) : (
            <Typography variant="body2" color="text.secondary">
              Select a field or question to configure it.
            </Typography>
          )}
        </Paper>
      </Stack>

      <BuilderActionBar />
    </Box>
  );
}
