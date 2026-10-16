import { Box } from "@mui/material";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import { PageHeader } from "../components/common/PageHeader";
import { TemplateManager } from "../components/admin/TemplateManager";

/** A subsidiary user's own Template Management screen — their own
 * templates, their subsidiary's shared ones, and any GLOBAL template an
 * admin has published; identical TemplateManager component to the admin
 * side, since the backend's own visibility rules already scope the list
 * correctly for this caller. */
export function MyTemplatesPage() {
  return (
    <Box>
      <PageHeader
        icon={<ViewModuleIcon />}
        title="Templates"
        subtitle={`Reusable form configurations — use one from a "New Form" dialog, or save the form you're editing as a new template.`}
      />
      <TemplateManager />
    </Box>
  );
}
