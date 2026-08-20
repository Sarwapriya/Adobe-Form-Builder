import { useEffect, useMemo } from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { createAppTheme } from "./app/theme.ts";
import { ErrorBoundary } from "./app/ErrorBoundary.tsx";
import { AppLayout } from "./app/AppLayout.tsx";
import { AppShell } from "./components/AppShell.tsx";
import { AdminRoute } from "./auth/AdminRoute.tsx";
import { ProtectedRoute } from "./auth/ProtectedRoute.tsx";
import { isAdminRole, useAuthStore } from "./auth/authStore.ts";
import { AdminDashboardPage } from "./pages/AdminDashboardPage.tsx";
import { AdminHistoryPage } from "./pages/AdminHistoryPage.tsx";
import { ConfigurationPage } from "./pages/ConfigurationPage.tsx";
import { UserManagementPage } from "./pages/UserManagementPage.tsx";
import { LoginPage } from "./pages/LoginPage.tsx";
import { UploadHistoryPage } from "./pages/UploadHistoryPage.tsx";
import { HrFormInitiatorListPage } from "./pages/HrFormInitiatorListPage.tsx";
import { AdHocFormInitiatorListPage } from "./pages/AdHocFormInitiatorListPage.tsx";
import { FormBuilderEditorPage } from "./pages/FormBuilderEditorPage.tsx";
import { MyAdHocFormsListPage } from "./pages/MyAdHocFormsListPage.tsx";
import { MyHrFormsListPage } from "./pages/MyHrFormsListPage.tsx";
import { MyFormTranslatePage } from "./pages/MyFormTranslatePage.tsx";
import { MyAdHocFormEditorPage } from "./pages/MyAdHocFormEditorPage.tsx";
import { MySubmissionsPage } from "./pages/MySubmissionsPage.tsx";
import { MySubsidiaryPage } from "./pages/MySubsidiaryPage.tsx";
import { QuestionMasterPage } from "./pages/QuestionMasterPage.tsx";

export default function App() {
  const silentRefresh = useAuthStore((s) => s.silentRefresh);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    void silentRefresh();
    // Runs exactly once at app startup — the Zustand action reference is
    // stable across renders, so this effect never re-fires afterward.
  }, [silentRefresh]);

  // Matches AppLayout.tsx's sidebar accent: red/maroon once we know the
  // signed-in user is an admin, brand blue for a subsidiary user or before
  // login, so the whole app — not just the sidebar — reads as one theme.
  const theme = useMemo(
    () => createAppTheme(!user ? "default" : isAdminRole(user.role) ? "admin" : "subsidiary"),
    [user],
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            {/* The original no-login, fully client-side wizard — kept as a
                quick/offline generator alongside the authenticated flow below,
                not gated behind a session. */}
            <Route path="/local" element={<AppShell />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route index element={<UploadHistoryPage />} />
                <Route path="my-forms" element={<Navigate to="/my-forms/hr" replace />} />
                <Route path="my-forms/hr" element={<MyHrFormsListPage />} />
                <Route path="my-forms/adhoc" element={<MyAdHocFormsListPage />} />
                <Route path="my-forms/adhoc/:id" element={<MyAdHocFormEditorPage />} />
                <Route path="my-forms/:id" element={<MyFormTranslatePage />} />
                <Route path="my-submissions" element={<MySubmissionsPage />} />
                <Route path="my-subsidiary" element={<MySubsidiaryPage />} />
                <Route element={<AdminRoute />}>
                  <Route path="admin" element={<AdminDashboardPage />} />
                  <Route path="admin/history" element={<AdminHistoryPage />} />
                  <Route path="admin/configuration" element={<ConfigurationPage />} />
                  <Route path="admin/users" element={<UserManagementPage />} />
                  <Route path="admin/form-builder" element={<Navigate to="/admin/form-builder/hr" replace />} />
                  <Route path="admin/form-builder/hr" element={<HrFormInitiatorListPage />} />
                  <Route path="admin/form-builder/adhoc" element={<AdHocFormInitiatorListPage />} />
                  <Route path="admin/form-builder/:id" element={<FormBuilderEditorPage />} />
                  <Route path="admin/question-master" element={<QuestionMasterPage />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    </ThemeProvider>
  );
}
