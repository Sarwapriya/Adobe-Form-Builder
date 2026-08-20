import { useState } from "react";
import { Box } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import { ProjectCodeManager } from "../components/admin/ProjectCodeManager";
import { SubsidiaryManager } from "../components/admin/SubsidiaryManager";
import { SubsidiaryProjectBlockManager } from "../components/admin/SubsidiaryProjectBlockManager";
import { SubsidiaryProjectBulkBlockManager } from "../components/admin/SubsidiaryProjectBulkBlockManager";
import { SubsidiaryLocaleManager } from "../components/admin/SubsidiaryLocaleManager";
import { SmtpSettingsManager } from "../components/admin/SmtpSettingsManager";
import { PageHeader } from "../components/common/PageHeader";

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
 *
 * The site-wide "global notification emails" setting that used to live here
 * has been retired — the upload/submission notification recipients are now
 * every admin/superadmin's own notification email(s), set on their own row
 * in User Management (see emailService.ts's resolveRecipients and
 * authService.listAdminNotificationEmails).
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

      <ProjectCodeManager onChange={bumpRestrictionsRefresh} />
      <SubsidiaryManager onChange={bumpRestrictionsRefresh} />
      <SubsidiaryProjectBlockManager refreshSignal={restrictionsRefreshSignal} />
      <SubsidiaryProjectBulkBlockManager
        refreshSignal={restrictionsRefreshSignal}
        onChange={bumpRestrictionsRefresh}
      />
      <SubsidiaryLocaleManager />
      <SmtpSettingsManager />
    </Box>
  );
}
