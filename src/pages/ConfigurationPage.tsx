import { Box, Stack, Typography } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import { ProjectCodeManager } from "../components/admin/ProjectCodeManager";
import { SubsidiaryManager } from "../components/admin/SubsidiaryManager";
import { SubsidiaryProjectBlockManager } from "../components/admin/SubsidiaryProjectBlockManager";

/**
 * Admin configuration hub: project codes and subsidiaries, each independently
 * toggleable open/closed — either one being closed blocks a new upload (see
 * uploadService.createUpload's assertProjectCodeOpenForUpload /
 * assertSubsidiaryOpenForUpload). Kept as its own page (rather than inline on
 * the dashboard) so it reads as a distinct "settings" area as more
 * admin-configurable toggles get added here.
 */
export function ConfigurationPage() {
  return (
    <Box>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
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
          <SettingsIcon />
        </Box>
        <Stack spacing={0.2}>
          <Typography variant="h4" component="h1" sx={{ lineHeight: 1.1 }}>
            Configuration
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage project codes and subsidiaries, and control which are open for upload.
          </Typography>
        </Stack>
      </Stack>

      <ProjectCodeManager />
      <SubsidiaryManager />
      <SubsidiaryProjectBlockManager />
    </Box>
  );
}
