import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import DesignServicesIcon from "@mui/icons-material/DesignServices";
import { useFormBuilderStore } from "../store/formBuilderStore";
import { PageHeader } from "../components/common/PageHeader";
import { CampaignHeaderPanel } from "../components/formBuilder/CampaignHeaderPanel";
import { SubsidiaryLocalePicker } from "../components/formBuilder/SubsidiaryLocalePicker";
import { LocaleEditingSwitcher } from "../components/formBuilder/LocaleEditingSwitcher";
import { BuilderCanvas, PredefinedFieldToggles } from "../components/formBuilder/BuilderCanvas";
import { QuestionEditorPanel } from "../components/formBuilder/QuestionEditorPanel";
import { ProfileFieldEditorPanel, type ProfileFieldKey } from "../components/formBuilder/ProfileFieldEditorPanel";
import { ConsentEditorPanel } from "../components/formBuilder/ConsentEditorPanel";
import { BuilderValidationPanel } from "../components/formBuilder/BuilderValidationPanel";
import { AdHocActionBar } from "../components/formBuilder/AdHocActionBar";

const PROFILE_FIELD_KEYS = new Set<string>([
  "firstName",
  "lastName",
  "email",
  "mobileNumber",
  "privacyPolicy",
  "marketingOptin",
  "termsAndConditions",
  "submitButton",
] satisfies ProfileFieldKey[]);

function isConsentId(key: string): boolean {
  return key.startsWith("consentExtra");
}

/**
 * A subsidiary user's own self-service form builder — same editing surface as
 * admin's FormBuilderEditorPage (BuilderCanvas + editor panels, reused
 * unmodified), but with SubsidiaryLocalePicker instead of LocaleManagerPanel
 * (restricted to this subsidiary's admin-managed master locale list, no free
 * text) and AdHocActionBar instead of BuilderActionBar (Submit for Review, not
 * Publish — an admin publishes it via AdHocReviewPanel after picking a Project
 * Code, never asked here). CampaignHeaderPanel is reused as-is for the
 * heading/subheading/submit-button-label copy. SubsidiaryLocalePicker stays
 * enable/disable-only (which locales the form includes); LocaleEditingSwitcher,
 * shown once more than one locale is enabled, is the separate control for
 * which locale's text every field below (heading, questions, profile fields,
 * consents) currently reads/writes — so a subsidiary user can translate the
 * whole form into Arabic or any other enabled locale, not just the default.
 * Only the form's name is fixed at creation and subsidiary/project code aren't
 * editable by the subsidiary user at all.
 * No VariantConfigPanel either — an ad-hoc form is always Full Form only (no
 * One-Click), enforced both here (the panel that would add "oc" is simply
 * never rendered) and server-side (formBuilderService's defaultConfig seeds
 * `variants: ["ff"]` for origin: "adhoc" forms at creation time).
 */
export function MyAdHocFormEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const loading = useFormBuilderStore((s) => s.loading);
  const error = useFormBuilderStore((s) => s.error);
  const definition = useFormBuilderStore((s) => s.definition);
  const name = useFormBuilderStore((s) => s.name);
  const subsidiaryId = useFormBuilderStore((s) => s.subsidiaryId);
  const pendingReview = useFormBuilderStore((s) => s.pendingReview);
  const loadForm = useFormBuilderStore((s) => s.loadForm);
  const reset = useFormBuilderStore((s) => s.reset);

  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (id) void loadForm(id, "adhoc");
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
      <PageHeader
        icon={<DesignServicesIcon />}
        title={name || "Edit Form"}
        subtitle={subsidiaryId}
        titleNoWrap
        onBack={() => navigate("/my-forms")}
        backLabel="Back to My Forms"
      />

      <BuilderValidationPanel />

      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ mb: 2, alignItems: "flex-start" }}>
        <Box sx={{ flex: "1 1 auto", minWidth: 0, width: "100%" }}>
          <SubsidiaryLocalePicker subsidiaryName={subsidiaryId} />
          <LocaleEditingSwitcher />
          <CampaignHeaderPanel />
          <PredefinedFieldToggles selectedField={selected} onSelectField={pendingReview ? () => {} : setSelected} />
          <BuilderCanvas
            selectedQuestionId={PROFILE_FIELD_KEYS.has(selected ?? "") || isConsentId(selected ?? "") ? null : selected}
            onSelectQuestion={pendingReview ? () => {} : setSelected}
          />
        </Box>

        <Paper sx={{ p: 2, width: { xs: "100%", md: 280 }, flexShrink: 0, position: "sticky", top: 16 }}>
          {pendingReview ? (
            <Typography variant="body2" color="text.secondary">
              This form is awaiting admin review — editing is locked.
            </Typography>
          ) : selected && PROFILE_FIELD_KEYS.has(selected) ? (
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

      <AdHocActionBar />
    </Box>
  );
}
