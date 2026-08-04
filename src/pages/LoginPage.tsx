import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Alert, Avatar, Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useAuthStore } from "../auth/authStore";

export function LoginPage() {
  const status = useAuthStore((s) => s.status);
  const error = useAuthStore((s) => s.error);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (status === "authenticated") {
    const state = location.state as { from?: { pathname: string } } | null;
    const redirectTo = state?.from?.pathname ?? "/";
    return <Navigate to={redirectTo} replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(username, password);
      navigate("/", { replace: true });
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
        <Stack alignItems="center" spacing={1.5} sx={{ mb: 3, textAlign: "center" }}>
          <Avatar sx={{ bgcolor: "primary.main", width: 48, height: 48 }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography variant="h5" component="h1">
            Form Builder
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sign in to upload workbooks and manage submissions.
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

          {error && (
            <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Button type="submit" variant="contained" fullWidth size="large" sx={{ mt: 3, py: 1.2 }} disabled={submitting}>
            {submitting ? "Signing in..." : "Sign in"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
