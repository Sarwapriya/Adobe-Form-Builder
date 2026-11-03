import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { useAuthStore } from "../auth/authStore";
import { showToast } from "../store/toastStore";
import { useThemeModeStore } from "../store/themeModeStore";

export function LoginPage() {
  const status = useAuthStore((s) => s.status);
  const error = useAuthStore((s) => s.error);
  const login = useAuthStore((s) => s.login);
  const mode = useThemeModeStore((s) => s.mode);
  const location = useLocation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (error) showToast(error, "error");
  }, [error]);

  // ProtectedRoute redirects an unauthenticated visit to a deep link (e.g. a
  // link from a notification email) here with `state: { from: location }` —
  // the branch below is what sends the user back to that exact page once
  // `login()` flips `status` to "authenticated" and this component
  // re-renders. `handleSubmit` must NOT also call `navigate()` itself on
  // success: an explicit navigate() there fired before this reactive branch
  // ever got a chance to run, unconditionally overriding it with "/" and
  // silently dropping the deep link — exactly the bug reported against the
  // cutoff-reminder email's "Open this form" button landing on the
  // dashboard instead of the form it was actually about.
  if (status === "authenticated") {
    const state = location.state as { from?: { pathname: string; search?: string } } | null;
    const redirectTo = state?.from ? `${state.from.pathname}${state.from.search ?? ""}` : "/";
    return <Navigate to={redirectTo} replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(username, password);
      // No navigate() here — see the doc comment above the `status ===
      // "authenticated"` branch, which handles the redirect reactively.
    } catch {
      // The error is already surfaced via the store's `error` field below;
      // nothing further to do here besides letting the user try again.
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        px: 2,
      }}
    >
      <Paper
        sx={{
          p: 5,
          width: 380,
          borderRadius: 4,
          boxShadow: "0 20px 50px rgba(20, 40, 160, 0.12)",
        }}
      >
        <Stack alignItems="center" spacing={1} sx={{ mb: 3, textAlign: "center" }}>
          <Box
            component="img"
            src={`${import.meta.env.BASE_URL}${mode === "dark" ? "logo-dark.png" : "logo.png"}`}
            alt="FormIQ"
            sx={{ width: 180, height: 180, objectFit: "contain" }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ pt: 1 }}>
            Sign in to create and manage campaign forms from one place.
          </Typography>
        </Stack>

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            fullWidth
            required
            autoFocus
            margin="normal"
            autoComplete="username"
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            required
            margin="normal"
            autoComplete="current-password"
          />

          <Button type="submit" variant="contained" fullWidth size="large" sx={{ mt: 3, py: 1.2 }} disabled={submitting}>
            {submitting ? "Signing in..." : "Sign in"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
