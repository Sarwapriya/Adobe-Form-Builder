import { useState } from "react";
import { Box, Stack, Typography } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import { ProjectCodeManager } from "../components/admin/ProjectCodeManager";
import { SubsidiaryManager } from "../components/admin/SubsidiaryManager";
import { SubsidiaryProjectBlockManager } from "../components/admin/SubsidiaryProjectBlockManager";
import { SubsidiaryProjectBulkBlockManager } from "../components/admin/SubsidiaryProjectBulkBlockManager";

/**
 * Admin configuration hub: project codes (globally open/closed), subsidiaries
 * (a plain named list), and per-(subsidiary, project code) upload
 * restrictions layered on top of both. Kept as its own page (rather than
 * inline on the dashboard) so it reads as a distinct "settings" area as more
 * admin-configurable toggles get added here.
 *
 * `restrictionsRefreshSignal` is bumped whenever ProjectCodeManager or
 * SubsidiaryManager change something — SubsidiaryProjectBlockManager's own
 * Project Code/Subsidiary dropdowns are otherwise independent state with no
 * way to notice a code being closed or a subsidiary being added elsewhere on
 * this page.
 */
export function ConfigurationPage() {
  const [restrictionsRefreshSignal, setRestrictionsRefreshSignal] = useState(0);
  const bumpRestrictionsRefresh = () => setRestrictionsRefreshSignal((n) => n + 1);

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

      <ProjectCodeManager onChange={bumpRestrictionsRefresh} />
      <SubsidiaryManager onChange={bumpRestrictionsRefresh} />
      <SubsidiaryProjectBlockManager refreshSignal={restrictionsRefreshSignal} />
      <SubsidiaryProjectBulkBlockManager
        refreshSignal={restrictionsRefreshSignal}
        onChange={bumpRestrictionsRefresh}
      />
    </Box>
  );
}
