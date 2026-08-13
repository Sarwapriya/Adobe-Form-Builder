import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box, CircularProgress, IconButton, Paper, Stack, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DesignServicesIcon from "@mui/icons-material/DesignServices";
import { useFormBuilderStore } from "../store/formBuilderStore";
import { CampaignHeaderPanel } from "../components/formBuilder/CampaignHeaderPanel";
import { LocaleManagerPanel } from "../components/formBuilder/LocaleManagerPanel";
import { VariantConfigPanel } from "../components/formBuilder/VariantConfigPanel";
import { BuilderCanvas, PredefinedFieldToggles } from "../components/formBuilder/BuilderCanvas";
import { QuestionEditorPanel } from "../components/formBuilder/QuestionEditorPanel";
import { ProfileFieldEditorPanel, type ProfileFieldKey } from "../components/formBuilder/ProfileFieldEditorPanel";
import { ConsentEditorPanel } from "../components/formBuilder/ConsentEditorPanel";
import { BuilderValidationPanel } from "../components/formBuilder/BuilderValidationPanel";
import { BuilderActionBar } from "../components/formBuilder/BuilderActionBar";
import { ContributionReviewPanel } from "../components/formBuilder/ContributionReviewPanel";

const PROFILE_FIELD_KEYS = new Set<string>(["firstName", "lastName", "email", "mobileNumber", "privacyPolicy", "marketingOptin"] satisfies ProfileFieldKey[]);

/** Admin-added consents beyond the two fixed slots above use dynamic
 * "consentExtraN" ids (see formBuilderHelpers.createConsent) rather than a fixed
 * key union, so they're routed by prefix instead of set membership. */
function isConsentId(key: string): boolean {
  return key.startsWith("consentExtra");
}

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
  const name = useFormBuilderStore((s) => s.name);
  const subsidiaryId = useFormBuilderStore((s) => s.subsidiaryId);
  const projectCode = useFormBuilderStore((s) => s.projectCode);
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
        <IconButton onClick={() => navigate("/admin/form-builder")} aria-label="Back to Form Initiator list">
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
        <Stack spacing={0.2} sx={{ minWidth: 0 }}>
          <Typography variant="h4" component="h1" sx={{ lineHeight: 1.1 }} noWrap>
            {name || "Edit Form"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {subsidiaryId}
            {projectCode ? ` · ${projectCode}` : ""}
          </Typography>
        </Stack>
      </Stack>

      <BuilderValidationPanel />

      {id && <ContributionReviewPanel formId={id} />}

      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ mb: 2, alignItems: "flex-start" }}>
        <Box sx={{ flex: "1 1 auto", minWidth: 0, width: "100%" }}>
          <CampaignHeaderPanel />
          <LocaleManagerPanel />
          <VariantConfigPanel />
          <PredefinedFieldToggles selectedField={selected} onSelectField={setSelected} />
          <BuilderCanvas
            selectedQuestionId={PROFILE_FIELD_KEYS.has(selected ?? "") || isConsentId(selected ?? "") ? null : selected}
            onSelectQuestion={setSelected}
          />
        </Box>

        <Paper sx={{ p: 2, borderRadius: 3, width: { xs: "100%", md: 280 }, flexShrink: 0, position: "sticky", top: 16 }}>
          {selected && PROFILE_FIELD_KEYS.has(selected) ? (
            <ProfileFieldEditorPanel fieldKey={selected as ProfileFieldKey} />
          ) : selected && isConsentId(selected) ? (
            <ConsentEditorPanel consentId={selected} onDeleted={() => setSelected(null)} />
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
