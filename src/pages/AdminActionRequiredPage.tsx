import { useEffect, useState } from "react";
import { Alert, Box, Paper } from "@mui/material";
import AssignmentLateIcon from "@mui/icons-material/AssignmentLate";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../api/apiClient";
import { listAllPendingApprovals, type PendingApprovalItem } from "../api/formBuilderApi";
import { PageHeader } from "../components/common/PageHeader";
import { LoadingState } from "../components/common/LoadingState";
import { PendingApprovalsList } from "../components/dashboard/PendingApprovalsList";

/** Full list behind the admin dashboard's "Action Required" card, which only
 * shows the latest few. Reached via that card's "Show more" link — deliberately
 * not a sidebar menu item. */
export function AdminActionRequiredPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<PendingApprovalItem[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    listAllPendingApprovals()
      .then(setItems)
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "Failed to load pending approvals"));
  }, []);

  return (
    <Box>
      <PageHeader
        icon={<AssignmentLateIcon />}
        title="Action Required"
        subtitle="All pending approvals across subsidiaries, newest first"
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
          <PendingApprovalsList items={items ?? []} />
        </Paper>
      )}
    </Box>
  );
}
