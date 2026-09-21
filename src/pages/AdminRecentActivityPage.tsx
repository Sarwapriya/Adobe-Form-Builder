import { useEffect, useState } from "react";
import { Alert, Box, Paper } from "@mui/material";
import HistoryIcon from "@mui/icons-material/History";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../api/apiClient";
import { listAllRecentActivity, type RecentActivityItem } from "../api/formBuilderApi";
import { PageHeader } from "../components/common/PageHeader";
import { LoadingState } from "../components/common/LoadingState";
import { ActivityFeedList } from "../components/dashboard/ActivityFeedList";

/** Full list behind the admin dashboard's "Recent Activity" card, which only
 * shows the latest few. Reached via that card's "Show more" link — deliberately
 * not a sidebar menu item. */
export function AdminRecentActivityPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<RecentActivityItem[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    listAllRecentActivity()
      .then(setItems)
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "Failed to load recent activity"));
  }, []);

  return (
    <Box>
      <PageHeader
        icon={<HistoryIcon />}
        title="Recent Activity"
        subtitle="Latest events across the system, newest first"
        onBack={() => navigate("/admin/dashboard")}
        backLabel="Back to dashboard"
      />
      {loadError && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {loadError}
        </Alert>
      )}
      {items === null && !loadError ? (
        <LoadingState />
      ) : (
        <Paper sx={{ p: 2.5 }}>
          <ActivityFeedList items={items ?? []} />
        </Paper>
      )}
    </Box>
  );
}
