import { useState } from "react";
import { Box, Divider, Typography } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import { ProjectCodeManager } from "../components/admin/ProjectCodeManager";
import { SubsidiaryManager } from "../components/admin/SubsidiaryManager";
import { SubsidiaryProjectBlockManager } from "../components/admin/SubsidiaryProjectBlockManager";
import { SubsidiaryProjectBulkBlockManager } from "../components/admin/SubsidiaryProjectBulkBlockManager";
import { GlobalNotificationSettings } from "../components/admin/GlobalNotificationSettings";
import { PageHeader } from "../components/common/PageHeader";

/**
 * Admin configuration hub: project codes (globally open/closed), subsidiaries
 * (a plain named list), and per-(subsidiary, project code) upload
 * restrictions layered on top of both. Kept as its own page (rather than
 * inline on the dashboard) so it reads as a distinct "settings" area as more
 * admin-configurable toggles get added here. Grouped into two labeled
 * clusters below ("Notifications" and "Access Control") so the real
 * functional dependency between the Access Control panels (a project code
 * closed or a subsidiary disabled in the first two panels immediately
 * affects the dropdowns in the two block-restriction panels below them, via
 * `restrictionsRefreshSignal`) reads as intentional rather than 5 unrelated
 * boxes stacked in an arbitrary order.
 */
export function ConfigurationPage() {
  const [restrictionsRefreshSignal, setRestrictionsRefreshSignal] = useState(0);
  const bumpRestrictionsRefresh = () => setRestrictionsRefreshSignal((n) => n + 1);

  return (
    <Box>
      <PageHeader
        icon={<SettingsIcon />}
        title="Configuration"
        subtitle="Manage project codes and subsidiaries, and control which are open for upload."
      />

      <Typography variant="overline" color="text.secondary" sx={{ display: "block", mb: 1 }}>
        Notifications
      </Typography>
      <GlobalNotificationSettings />

      <Divider sx={{ my: 3 }} />

      <Typography variant="overline" color="text.secondary" sx={{ display: "block", mb: 1 }}>
        Access Control
      </Typography>
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
