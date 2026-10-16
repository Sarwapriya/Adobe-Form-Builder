import { Box } from "@mui/material";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import { PageHeader } from "../components/common/PageHeader";
import { TemplateManager } from "../components/admin/TemplateManager";

/** Admin's Template Management screen — every template visible to them
 * (their own, every subsidiary's, and every GLOBAL one), with Edit/Delete
 * restricted client-side to templates they actually own (or any, for a
 * superadmin) — see TemplateManager's own doc comment for why that's only a
 * convenience, not the real authorization boundary. */
export function TemplateManagementPage() {
  return (
    <Box>
      <PageHeader
        icon={<ViewModuleIcon />}
        title="Templates"
        subtitle={`Reusable form configurations — use one from any "New Form" dialog, or save the form you're editing as a new template.`}
      />
      <TemplateManager />
    </Box>
  );
}
