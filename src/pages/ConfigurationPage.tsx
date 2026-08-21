import { useState } from "react";
import type { ReactNode, SyntheticEvent } from "react";
import { Box, Tab, Tabs } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import { ProjectCodeManager } from "../components/admin/ProjectCodeManager";
import { SubsidiaryManager } from "../components/admin/SubsidiaryManager";
import { SubsidiaryProjectBlockManager } from "../components/admin/SubsidiaryProjectBlockManager";
import { SubsidiaryProjectBulkBlockManager } from "../components/admin/SubsidiaryProjectBulkBlockManager";
import { SubsidiaryLocaleManager } from "../components/admin/SubsidiaryLocaleManager";
import { SmtpSettingsManager } from "../components/admin/SmtpSettingsManager";
import { FabrixSettingsManager } from "../components/admin/FabrixSettingsManager";
import { FabrixModelManager } from "../components/admin/FabrixModelManager";
import { OtherAiProvidersManager } from "../components/admin/OtherAiProvidersManager";
import { PageHeader } from "../components/common/PageHeader";

type ConfigTab = "campaigns" | "access" | "notifications" | "ai";

/** One tab's content, kept mounted (just visually hidden) rather than
 * unmounted when its tab isn't active — each manager below fetches its own
 * list on mount, so switching tabs back and forth would otherwise refetch
 * and flicker every time. */
function TabPanel({ active, children }: { active: boolean; children: ReactNode }) {
  return <Box sx={{ display: active ? "block" : "none" }}>{children}</Box>;
}

/**
 * Admin configuration hub: project codes (globally open/closed), subsidiaries
 * (a plain named list), per-(subsidiary, project code) upload restrictions
 * layered on top of both, notification email delivery, and the AI Assistant
 * connection. Split into tabs (rather than one long scroll) purely for
 * navigability — each manager below is otherwise unchanged and independent.
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
  const [tab, setTab] = useState<ConfigTab>("campaigns");

  function handleTabChange(_e: SyntheticEvent, value: ConfigTab) {
    setTab(value);
  }

  return (
    <Box>
      <PageHeader
        icon={<SettingsIcon />}
        title="Configuration"
        subtitle="Manage project codes and subsidiaries, and control which are open for upload."
      />

      <Tabs value={tab} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab value="campaigns" label="Campaigns" />
        <Tab value="access" label="Access & Locales" />
        <Tab value="notifications" label="Notifications" />
        <Tab value="ai" label="AI Assistant" />
      </Tabs>

      <TabPanel active={tab === "campaigns"}>
        <ProjectCodeManager onChange={bumpRestrictionsRefresh} />
        <SubsidiaryManager onChange={bumpRestrictionsRefresh} />
      </TabPanel>

      <TabPanel active={tab === "access"}>
        <SubsidiaryProjectBlockManager refreshSignal={restrictionsRefreshSignal} />
        <SubsidiaryProjectBulkBlockManager
          refreshSignal={restrictionsRefreshSignal}
          onChange={bumpRestrictionsRefresh}
        />
        <SubsidiaryLocaleManager />
      </TabPanel>

      <TabPanel active={tab === "notifications"}>
        <SmtpSettingsManager />
      </TabPanel>

      <TabPanel active={tab === "ai"}>
        <FabrixSettingsManager />
        <FabrixModelManager />
        <OtherAiProvidersManager />
      </TabPanel>
    </Box>
  );
}
