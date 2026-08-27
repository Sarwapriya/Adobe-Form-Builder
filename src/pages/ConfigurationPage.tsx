import { useState } from "react";
import type { ReactNode, SyntheticEvent } from "react";
import { Box, Tab, Tabs } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import { ProjectCodeManager } from "../components/admin/ProjectCodeManager";
import { SubsidiaryManager } from "../components/admin/SubsidiaryManager";
import { SubsidiaryProjectCodeAccessManager } from "../components/admin/SubsidiaryProjectCodeAccessManager";
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
 * (a plain named list) plus their per-project-code access, subsidiary locale
 * approval, notification email delivery, and the AI Assistant connection.
 * Split into tabs (rather than one long scroll) purely for navigability —
 * each manager below is otherwise unchanged and independent.
 *
 * The old standalone "Subsidiary upload restrictions" block-list UI
 * (SubsidiaryProjectBlockManager/SubsidiaryProjectBulkBlockManager) has been
 * replaced by SubsidiaryProjectCodeAccessManager below, in the Subsidiaries
 * section — same underlying SubsidiaryProjectBlock data/API, reframed
 * subsidiary-first with an enable/disable switch per project code, since
 * governance now targets Form Initiator (project code open + subsidiary
 * active + not-blocked, enforced in
 * formBuilderService.createForm/approveAdHocForm) rather than the
 * now-unlinked Excel-upload flow.
 *
 * `restrictionsRefreshSignal` is bumped whenever ProjectCodeManager or
 * SubsidiaryManager change something — SubsidiaryProjectCodeAccessManager's
 * own subsidiary/project-code lists are otherwise independent state with no
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
        subtitle="Manage project codes and subsidiaries, and control which are open for Form Initiator campaigns."
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
        <SubsidiaryProjectCodeAccessManager refreshSignal={restrictionsRefreshSignal} />
      </TabPanel>

      <TabPanel active={tab === "access"}>
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
