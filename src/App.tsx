import { useEffect } from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { theme } from "./app/theme.ts";
import { AppLayout } from "./app/AppLayout.tsx";
import { AppShell } from "./components/AppShell.tsx";
import { AdminRoute } from "./auth/AdminRoute.tsx";
import { ProtectedRoute } from "./auth/ProtectedRoute.tsx";
import { useAuthStore } from "./auth/authStore.ts";
import { AdminDashboardPage } from "./pages/AdminDashboardPage.tsx";
import { AdminHistoryPage } from "./pages/AdminHistoryPage.tsx";
import { ConfigurationPage } from "./pages/ConfigurationPage.tsx";
import { UserManagementPage } from "./pages/UserManagementPage.tsx";
import { LoginPage } from "./pages/LoginPage.tsx";
import { UploadHistoryPage } from "./pages/UploadHistoryPage.tsx";
import { FormBuilderListPage } from "./pages/FormBuilderListPage.tsx";
import { FormBuilderEditorPage } from "./pages/FormBuilderEditorPage.tsx";
import { MyFormsListPage } from "./pages/MyFormsListPage.tsx";
import { MyFormTranslatePage } from "./pages/MyFormTranslatePage.tsx";
import { MySubmissionsPage } from "./pages/MySubmissionsPage.tsx";

export default function App() {
  const silentRefresh = useAuthStore((s) => s.silentRefresh);

  useEffect(() => {
    void silentRefresh();
    // Runs exactly once at app startup — the Zustand action reference is
    // stable across renders, so this effect never re-fires afterward.
  }, [silentRefresh]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
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
              <Route path="my-forms" element={<MyFormsListPage />} />
              <Route path="my-forms/:id" element={<MyFormTranslatePage />} />
              <Route path="my-submissions" element={<MySubmissionsPage />} />
              <Route element={<AdminRoute />}>
                <Route path="admin" element={<AdminDashboardPage />} />
                <Route path="admin/history" element={<AdminHistoryPage />} />
                <Route path="admin/configuration" element={<ConfigurationPage />} />
                <Route path="admin/users" element={<UserManagementPage />} />
                <Route path="admin/form-builder" element={<FormBuilderListPage />} />
                <Route path="admin/form-builder/:id" element={<FormBuilderEditorPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
