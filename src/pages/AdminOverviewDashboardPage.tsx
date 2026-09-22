import { useEffect, useState } from "react";
import { alpha, Alert, Box, Button, Paper, Typography, useTheme } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import DashboardIcon from "@mui/icons-material/Dashboard";
import DescriptionIcon from "@mui/icons-material/Description";
import EditIcon from "@mui/icons-material/Edit";
import ScheduleIcon from "@mui/icons-material/Schedule";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { ApiError } from "../api/apiClient";
import {
  getAdminDashboardSummary,
  type AdminDashboardSummary,
  type SubsidiaryBucketBreakdown,
} from "../api/formBuilderApi";
import { PageHeader } from "../components/common/PageHeader";
import { SectionHeader } from "../components/common/SectionHeader";
import { LoadingState } from "../components/common/LoadingState";
import { StatCard } from "../components/dashboard/StatCard";
import { StatusDonutChart, type DonutSegment } from "../components/dashboard/StatusDonutChart";
import { CampaignActivityChart } from "../components/dashboard/CampaignActivityChart";
import { SubsidiaryActivityBars } from "../components/dashboard/SubsidiaryActivityBars";
import { PendingApprovalsList } from "../components/dashboard/PendingApprovalsList";
import { ActivityFeedList } from "../components/dashboard/ActivityFeedList";

type StatBucket = "total" | "draft" | "pendingReview" | "approved" | "published";

const BUCKET_LABEL: Record<StatBucket, string> = {
  total: "All Campaigns",
  draft: "Draft",
  pendingReview: "Pending Review",
  approved: "Approved",
  published: "Published",
};

function ShowMoreLink({ to }: { to: string }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
      <Button component={RouterLink} to={to} size="small" endIcon={<ArrowForwardIcon fontSize="small" />}>
        Show more
      </Button>
    </Box>
  );
}

/**
 * Admin's post-login landing page — system/subsidiary-performance oriented
 * (contrast SubsidiaryDashboardPage.tsx, which is oriented around one
 * subsidiary's own campaign creation/tracking). All figures come from
 * `getAdminDashboardSummary()`; see backend's dashboardService.ts for the
 * status-bucketing rule that keeps the stat cards and the donut chart always
 * summing to the same total.
 *
 * The stat cards double as a filter: clicking one selects it (`selectedStat`)
 * and re-scopes the "Subsidiary Activity" charts directly below (Full Form and
 * Ad-hoc campaigns, charted separately) to that status — e.g. selecting
 * "Pending Review" shows which subsidiaries have the most campaigns awaiting
 * review, rather than the all-time total.
 *
 * "Action Required" / "Recent Activity" only show the latest few; "Show more"
 * opens their full-list pages (AdminActionRequiredPage / AdminRecentActivityPage).
 */
export function AdminOverviewDashboardPage() {
  const theme = useTheme();
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedStat, setSelectedStat] = useState<StatBucket>("total");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        setSummary(await getAdminDashboardSummary());
      } catch (err) {
        setLoadError(err instanceof ApiError ? err.message : "Failed to load the dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const donutSegments: DonutSegment[] = summary
    ? [
        { label: "Draft", value: summary.counts.draft, color: theme.palette.grey[500] },
        { label: "Pending Review", value: summary.counts.pendingReview, color: theme.palette.warning.main },
        { label: "Approved", value: summary.counts.approved, color: theme.palette.info.main },
        { label: "Published", value: summary.counts.published, color: theme.palette.success.main },
      ]
    : [];

  const activityRows = (breakdown: SubsidiaryBucketBreakdown[]) =>
    breakdown
      .map((s) => ({ subsidiaryId: s.subsidiaryId, count: s[selectedStat] }))
      .filter((r) => r.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  const fullFormRows = summary ? activityRows(summary.subsidiaryBreakdownByOrigin.fullForm) : [];
  const adHocRows = summary ? activityRows(summary.subsidiaryBreakdownByOrigin.adhoc) : [];

  return (
    <Box>
      <PageHeader icon={<DashboardIcon />} title="Dashboard" subtitle="Overview of all campaigns and subsidiary activity" />

      {loadError && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {loadError}
        </Alert>
      )}

      {loading || !summary ? (
        <LoadingState />
      ) : (
        <>
          <SectionHeader title="Overall Campaign report" subtitle="Totals across every campaign, all subsidiaries" icon={null} sx={{ mb: 1.5 }} />
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(5, 1fr)" }, gap: 2, mb: 3 }}>
            <StatCard
              icon={<DescriptionIcon fontSize="small" />}
              iconBg={`linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`}
              iconColor="#fff"
              label="Total Campaigns"
              value={summary.counts.total}
              onClick={() => setSelectedStat("total")}
              selected={selectedStat === "total"}
            />
            <StatCard
              icon={<EditIcon fontSize="small" />}
              iconBg={theme.palette.action.hover}
              iconColor="text.secondary"
              label="Draft"
              value={summary.counts.draft}
              onClick={() => setSelectedStat("draft")}
              selected={selectedStat === "draft"}
            />
            <StatCard
              icon={<ScheduleIcon fontSize="small" />}
              iconBg={alpha(theme.palette.warning.main, 0.14)}
              iconColor="warning.dark"
              label="Pending Review"
              value={summary.counts.pendingReview}
              onClick={() => setSelectedStat("pendingReview")}
              selected={selectedStat === "pendingReview"}
            />
            <StatCard
              icon={<CheckCircleIcon fontSize="small" />}
              iconBg={alpha(theme.palette.info.main, 0.14)}
              iconColor="info.dark"
              label="Approved"
              value={summary.counts.approved}
              onClick={() => setSelectedStat("approved")}
              selected={selectedStat === "approved"}
            />
            <StatCard
              icon={<CheckCircleIcon fontSize="small" />}
              iconBg={alpha(theme.palette.success.main, 0.14)}
              iconColor="success.dark"
              label="Published"
              value={summary.counts.published}
              onClick={() => setSelectedStat("published")}
              selected={selectedStat === "published"}
            />
          </Box>

          <Paper sx={{ p: 2.5, mb: 2.5 }}>
            <SectionHeader
              title={`Subsidiary Activity — ${BUCKET_LABEL[selectedStat]}`}
              subtitle="Which subsidiaries have the most Full Form and Ad-hoc campaigns in the selected status — click a stat card above to change it"
              icon={null}
              sx={{ mb: 2 }}
            />
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: { xs: 3, md: 4 } }}>
              {(
                [
                  { title: "Full Form campaigns", rows: fullFormRows },
                  { title: "Ad-hoc campaigns", rows: adHocRows },
                ] as const
              ).map(({ title, rows }) => (
                <Box key={title} sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                    {title}
                  </Typography>
                  {rows.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No campaigns in this status yet.
                    </Typography>
                  ) : (
                    <SubsidiaryActivityBars rows={rows} />
                  )}
                </Box>
              ))}
            </Box>
          </Paper>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 2fr" }, gap: 2.5, mb: 2.5, alignItems: "stretch" }}>
            <Paper sx={{ p: 2.5 }}>
              <SectionHeader title="Campaign Status" subtitle="All campaigns, all time" icon={null} sx={{ mb: 2 }} />
              <StatusDonutChart segments={donutSegments} total={summary.counts.total} />
            </Paper>
            <Paper sx={{ p: 2.5 }}>
              <SectionHeader title="Campaign Activity" subtitle="Campaigns created vs. first published, last 6 months" icon={null} sx={{ mb: 2 }} />
              <CampaignActivityChart data={summary.activityByMonth} />
            </Paper>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2.5 }}>
            <Paper sx={{ p: 2.5 }}>
              <SectionHeader title="Action Required" subtitle="Latest pending approvals across subsidiaries" icon={null} sx={{ mb: 1 }} />
              <PendingApprovalsList items={summary.pendingApprovals} />
              {summary.pendingApprovalsHasMore && <ShowMoreLink to="/admin/dashboard/action-required" />}
            </Paper>
            <Paper sx={{ p: 2.5 }}>
              <SectionHeader title="Recent Activity" subtitle="Latest events across the system" icon={null} sx={{ mb: 1 }} />
              <ActivityFeedList items={summary.recentActivity} />
              {summary.recentActivityHasMore && <ShowMoreLink to="/admin/dashboard/recent-activity" />}
            </Paper>
          </Box>
        </>
      )}
    </Box>
  );
}
