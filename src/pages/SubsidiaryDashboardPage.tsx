import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Alert, Box, Button, Paper, Stack, Typography, useTheme } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AddIcon from "@mui/icons-material/Add";
import { ApiError } from "../api/apiClient";
import { useAuthStore } from "../auth/authStore";
import { getMyDashboardSummary, type SubsidiaryDashboardSummary } from "../api/subsidiaryFormsApi";
import { PageHeader } from "../components/common/PageHeader";
import { SectionHeader } from "../components/common/SectionHeader";
import { LoadingState } from "../components/common/LoadingState";
import { StatCard } from "../components/dashboard/StatCard";
import { StatusDonutChart, type DonutSegment } from "../components/dashboard/StatusDonutChart";
import { RecentCampaignsList } from "../components/dashboard/RecentCampaignsList";
import { ContinueWorkingCard } from "../components/dashboard/ContinueWorkingCard";
import { ActionRequiredList } from "../components/dashboard/ActionRequiredList";
import EditIcon from "@mui/icons-material/Edit";
import ScheduleIcon from "@mui/icons-material/Schedule";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { alpha } from "@mui/material/styles";

/**
 * A subsidiary user's post-login landing page — oriented around creating,
 * managing, and tracking their own campaigns (contrast
 * AdminOverviewDashboardPage.tsx, which is system/subsidiary-performance
 * oriented). Scoped entirely to the caller's own ad-hoc forms — see backend's
 * dashboardService.getSubsidiaryDashboardSummary.
 */
export function SubsidiaryDashboardPage() {
  const theme = useTheme();
  const user = useAuthStore((s) => s.user);
  const [summary, setSummary] = useState<SubsidiaryDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        setSummary(await getMyDashboardSummary());
      } catch (err) {
        setLoadError(err instanceof ApiError ? err.message : "Failed to load your dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const donutSegments: DonutSegment[] = summary
    ? [
        { label: "Drafts", value: summary.counts.drafts, color: theme.palette.grey[500] },
        { label: "Pending Review", value: summary.counts.pendingReview, color: theme.palette.warning.main },
        { label: "Changes Requested", value: summary.counts.changesRequested, color: theme.palette.error.main },
        { label: "Published", value: summary.counts.published, color: theme.palette.success.main },
      ]
    : [];

  return (
    <Box>
      <PageHeader
        icon={<DashboardIcon />}
        title={user ? `Welcome back, ${user.firstName || user.username}` : "Dashboard"}
        subtitle={user?.subsidiaryId ? `Here's what's happening with your campaigns — ${user.subsidiaryId}` : "Here's what's happening with your campaigns"}
        action={
          <Button component={RouterLink} to="/my-forms/adhoc" variant="contained" startIcon={<AddIcon />}>
            New Campaign
          </Button>
        }
      />

      {loadError && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {loadError}
        </Alert>
      )}

      {loading || !summary ? (
        <LoadingState />
      ) : (
        <>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(5, 1fr)" }, gap: 2, mb: 3 }}>
            <StatCard
              icon={<DashboardIcon fontSize="small" />}
              iconBg={`linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`}
              iconColor="#fff"
              label="My Campaigns"
              value={summary.counts.total}
            />
            <StatCard icon={<EditIcon fontSize="small" />} iconBg={theme.palette.action.hover} iconColor="text.secondary" label="Drafts" value={summary.counts.drafts} />
            <StatCard
              icon={<ScheduleIcon fontSize="small" />}
              iconBg={alpha(theme.palette.warning.main, 0.14)}
              iconColor="warning.dark"
              label="Pending Review"
              value={summary.counts.pendingReview}
            />
            <StatCard
              icon={<ErrorOutlineIcon fontSize="small" />}
              iconBg={alpha(theme.palette.error.main, 0.14)}
              iconColor="error.dark"
              label="Changes Requested"
              value={summary.counts.changesRequested}
            />
            <StatCard
              icon={<CheckCircleIcon fontSize="small" />}
              iconBg={alpha(theme.palette.success.main, 0.14)}
              iconColor="success.dark"
              label="Published"
              value={summary.counts.published}
            />
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 2fr" }, gap: 2.5, mb: 2.5, alignItems: "stretch" }}>
            <Paper sx={{ p: 2.5 }}>
              <SectionHeader title="Campaign Status" subtitle="All your campaigns" icon={null} sx={{ mb: 2 }} />
              <StatusDonutChart segments={donutSegments} total={summary.counts.total} />
            </Paper>
            <Paper sx={{ p: 2.5 }}>
              <SectionHeader title="Recent Campaigns" subtitle="Your most recently updated campaigns" icon={null} sx={{ mb: 1 }} />
              <RecentCampaignsList items={summary.recentCampaigns} />
            </Paper>
          </Box>

          <Paper sx={{ p: 2.5, mb: 2.5 }}>
            <SectionHeader title="Continue Working" subtitle="Pick up where you left off" icon={null} sx={{ mb: 2 }} />
            {summary.continueWorking.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No drafts in progress.
              </Typography>
            ) : (
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                {summary.continueWorking.map((item) => (
                  <Box key={item.id} sx={{ flex: 1, minWidth: 0 }}>
                    <ContinueWorkingCard item={item} />
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>

          <Paper sx={{ p: 2.5 }}>
            <SectionHeader title="Action Required" subtitle="Items that need your attention" icon={null} sx={{ mb: 1 }} />
            <ActionRequiredList items={summary.actionRequired} />
          </Paper>
        </>
      )}
    </Box>
  );
}
