import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import { ApiError } from "../api/apiClient";
import { createUser, listUsers, setUserActive, type AdminUserListItem, type AdminUserRole } from "../api/adminApi";
import { listSubsidiaries, type Subsidiary } from "../api/subsidiariesApi";
import { useAuthStore } from "../auth/authStore";

const ROLE_COLOR: Record<AdminUserRole, "default" | "primary" | "secondary"> = {
  standard: "default",
  admin: "primary",
  superadmin: "secondary",
};

/**
 * Admin-only user provisioning: there is no self-service signup anywhere in
 * this system (see backend authService.ts) — every account is created here.
 * Which roles can be assigned depends on the *creator's* own role: a
 * superadmin may create standard/admin/superadmin accounts, while a plain
 * admin may only create standard ones (enforced authoritatively server-side
 * in admin.router.ts's POST /users — this UI just doesn't offer the options
 * a plain admin isn't allowed to submit).
 */
export function UserManagementPage() {
  const currentUser = useAuthStore((s) => s.user);
  const isSuperAdmin = currentUser?.role === "superadmin";
  const assignableRoles: AdminUserRole[] = isSuperAdmin ? ["standard", "admin", "superadmin"] : ["standard"];

  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [subsidiaries, setSubsidiaries] = useState<Subsidiary[]>([]);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AdminUserRole>("standard");
  const [subsidiaryId, setSubsidiaryId] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setLoadError(null);
    try {
      setUsers(await listUsers());
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    listSubsidiaries()
      .then(setSubsidiaries)
      .catch(() => undefined);
  }, []);

  // A standard user must be scoped to a subsidiary at creation time — without
  // one they'd fall back to the free-text Subsidiary field on every upload,
  // defeating the point of scoping them. Admin/superadmin accounts aren't
  // restricted to one subsidiary, so it stays optional for those. Mirrored
  // authoritatively server-side in admin.router.ts's createUserSchema.
  const subsidiaryRequired = role === "standard";
  const canCreate =
    !!username.trim() && !!email.trim() && !!password && (!subsidiaryRequired || !!subsidiaryId) && !creating;

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!canCreate) return;

    setCreating(true);
    setCreateError(null);
    setCreateSuccess(null);
    try {
      const created = await createUser({
        username: username.trim(),
        email: email.trim(),
        password,
        role,
        subsidiaryId: subsidiaryId.trim() || undefined,
      });
      setCreateSuccess(`Created ${created.role} account "${created.username}".`);
      setUsername("");
      setEmail("");
      setPassword("");
      setRole("standard");
      setSubsidiaryId("");
      await refresh();
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : "Failed to create user");
    } finally {
      setCreating(false);
    }
  }

  // A plain admin can only toggle standard accounts (enforced authoritatively
  // server-side too — see admin.router.ts's PATCH /users/:id); nobody can
  // toggle their own row, to avoid locking themselves out of the admin panel.
  function canToggle(target: AdminUserListItem): boolean {
    if (target.id === currentUser?.id) return false;
    return isSuperAdmin || target.role === "standard";
  }

  async function handleToggleActive(target: AdminUserListItem) {
    setTogglingId(target.id);
    setToggleError(null);
    try {
      await setUserActive(target.id, !target.isActive);
      await refresh();
    } catch (err) {
      setToggleError(err instanceof ApiError ? err.message : "Failed to update user");
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <Box>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "primary.main",
            color: "primary.contrastText",
          }}
        >
          <PeopleIcon />
        </Box>
        <Stack spacing={0.2}>
          <Typography variant="h4" component="h1" sx={{ lineHeight: 1.1 }}>
            User Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Provision new accounts and optionally scope a standard user to one subsidiary.
          </Typography>
        </Stack>
      </Stack>

      <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
          Create user
        </Typography>

        <Box component="form" onSubmit={handleCreate} sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <TextField
            label="Username"
            size="small"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <TextField
            label="Email"
            type="email"
            size="small"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TextField
            label="Password"
            type="password"
            size="small"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            helperText="At least 8 characters"
          />
          <TextField
            select
            label="Role"
            size="small"
            sx={{ minWidth: 160 }}
            value={role}
            onChange={(e) => setRole(e.target.value as AdminUserRole)}
          >
            {assignableRoles.map((r) => (
              <MenuItem key={r} value={r}>
                {r}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label={subsidiaryRequired ? "Subsidiary" : "Subsidiary (optional)"}
            size="small"
            sx={{ minWidth: 180 }}
            value={subsidiaryId}
            onChange={(e) => setSubsidiaryId(e.target.value)}
            required={subsidiaryRequired}
            error={subsidiaryRequired && !subsidiaryId}
            helperText={
              subsidiaryRequired && !subsidiaryId
                ? "Required for a standard user"
                : "Locks this user's uploads to one subsidiary"
            }
          >
            {!subsidiaryRequired && <MenuItem value="">No subsidiary</MenuItem>}
            {subsidiaries.map((s) => (
              <MenuItem key={s.id} value={s.name}>
                {s.name}
              </MenuItem>
            ))}
          </TextField>
          <Button type="submit" variant="contained" disabled={!canCreate}>
            {creating ? "Creating..." : "Create user"}
          </Button>
        </Box>

        {!isSuperAdmin && (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
            Only a superadmin can provision admin or superadmin accounts — you can create standard users only.
          </Typography>
        )}

        {createError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {createError}
          </Alert>
        )}
        {createSuccess && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {createSuccess}
          </Alert>
        )}
      </Paper>

      {loadError && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {loadError}
        </Alert>
      )}
      {toggleError && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {toggleError}
        </Alert>
      )}

      <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Username</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Subsidiary</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                    <Typography color="text.secondary">No users yet.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.id} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                    <TableCell sx={{ fontWeight: 600 }}>{u.username}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Chip label={u.role} color={ROLE_COLOR[u.role]} size="small" />
                    </TableCell>
                    <TableCell>{u.subsidiaryId ?? "—"}</TableCell>
                    <TableCell>
                      <Chip
                        label={u.isActive ? "active" : "inactive"}
                        color={u.isActive ? "success" : "default"}
                        size="small"
                        onClick={canToggle(u) ? () => handleToggleActive(u) : undefined}
                        disabled={togglingId === u.id}
                        title={
                          canToggle(u)
                            ? u.isActive
                              ? "Active — click to disable"
                              : "Disabled — click to enable"
                            : u.id === currentUser?.id
                              ? "You cannot disable your own account"
                              : "Only a superadmin can enable/disable this account"
                        }
                      />
                    </TableCell>
                    <TableCell>{new Date(u.createdAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
