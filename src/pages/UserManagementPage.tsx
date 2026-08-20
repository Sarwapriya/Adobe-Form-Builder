import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Popover,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import EditIcon from "@mui/icons-material/Edit";
import { ApiError } from "../api/apiClient";
import {
  createUser,
  listUsers,
  setUserActive,
  setUserNotificationEmail,
  updateUserProfile,
  type AdminUserListItem,
  type AdminUserRole,
} from "../api/adminApi";
import { listSubsidiaries, type Subsidiary } from "../api/subsidiariesApi";
import { useAuthStore } from "../auth/authStore";
import { PageHeader } from "../components/common/PageHeader";
import { NotificationEmailFields } from "../components/common/NotificationEmailFields";

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
  const [editingUser, setEditingUser] = useState<AdminUserListItem | null>(null);

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

  // A superadmin may edit anyone's, including their own. A plain admin may
  // edit their own, any other admin's (same role), and any subsidiary
  // (standard) user's — but not a superadmin's. Enforced authoritatively
  // server-side too — see admin.router.ts's PATCH
  // /users/:id/notification-email.
  function canEditNotificationEmail(target: AdminUserListItem): boolean {
    if (isSuperAdmin) return true;
    if (target.id === currentUser?.id) return true;
    return currentUser?.role === "admin" && (target.role === "admin" || target.role === "standard");
  }

  return (
    <Box>
      <PageHeader
        icon={<PeopleIcon />}
        title="User Management"
        subtitle="Provision new accounts and optionally scope a standard user to one subsidiary."
      />

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
          Create user
        </Typography>

        <Box component="form" onSubmit={handleCreate} sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <TextField
            label="Username"
            size="small"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setCreateSuccess(null);
            }}
            required
          />
          <TextField
            label="Email"
            type="email"
            size="small"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setCreateSuccess(null);
            }}
            required
          />
          <TextField
            label="Password"
            type="password"
            size="small"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setCreateSuccess(null);
            }}
            required
            helperText="At least 8 characters"
          />
          <TextField
            select
            label="Role"
            size="small"
            sx={{ minWidth: 160 }}
            value={role}
            onChange={(e) => {
              setRole(e.target.value as AdminUserRole);
              setCreateSuccess(null);
            }}
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
            onChange={(e) => {
              setSubsidiaryId(e.target.value);
              setCreateSuccess(null);
            }}
            required={subsidiaryRequired}
            error={subsidiaryRequired && !subsidiaryId}
            helperText={
              subsidiaryRequired && !subsidiaryId
                ? "Required for a standard user"
                : "Locks this user's uploads to one subsidiary"
            }
            InputLabelProps={{ shrink: true }}
          >
            {/* Always rendered (just disabled when required) rather than
                omitted — switching Role to "standard" while this was still
                on "" used to remove its only matching MenuItem, leaving the
                Select with no matching child to render and reading blank. */}
            <MenuItem value="" disabled={subsidiaryRequired}>
              {subsidiaryRequired ? "Select a subsidiary" : "No subsidiary"}
            </MenuItem>
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
          <Alert severity="success" sx={{ mt: 2 }} onClose={() => setCreateSuccess(null)}>
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

      <Paper sx={{ overflow: "hidden" }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Username</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Subsidiary</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Notification email</TableCell>
                <TableCell>Created</TableCell>
                {isSuperAdmin && <TableCell align="right">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={isSuperAdmin ? 8 : 7} align="center" sx={{ py: 5 }}>
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isSuperAdmin ? 8 : 7} align="center" sx={{ py: 5 }}>
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
                    <TableCell>
                      <NotificationEmailCell user={u} editable={canEditNotificationEmail(u)} onSaved={refresh} />
                    </TableCell>
                    <TableCell>{new Date(u.createdAt).toLocaleString()}</TableCell>
                    {isSuperAdmin && (
                      <TableCell align="right">
                        <Tooltip title="Edit account details">
                          <IconButton size="small" onClick={() => setEditingUser(u)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {editingUser && (
        <EditUserDialog
          user={editingUser}
          subsidiaries={subsidiaries}
          onClose={() => setEditingUser(null)}
          onSaved={async () => {
            setEditingUser(null);
            await refresh();
          }}
        />
      )}
    </Box>
  );
}

/**
 * Superadmin-only full account-details editor (username/email/role/
 * subsidiary) — distinct from the isActive toggle and the notification-email
 * popover above, both of which stay available to a plain admin for the
 * targets they're allowed to manage. Enforced authoritatively server-side —
 * see admin.router.ts's PATCH /users/:id/profile.
 */
function EditUserDialog({
  user,
  subsidiaries,
  onClose,
  onSaved,
}: {
  user: AdminUserListItem;
  subsidiaries: Subsidiary[];
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState<AdminUserRole>(user.role);
  const [subsidiaryId, setSubsidiaryId] = useState(user.subsidiaryId ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subsidiaryRequired = role === "standard";
  const canSave = !!username.trim() && !!email.trim() && (!subsidiaryRequired || !!subsidiaryId) && !saving;

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      await updateUserProfile(user.id, {
        username: username.trim(),
        email: email.trim(),
        role,
        subsidiaryId: subsidiaryRequired ? subsidiaryId : subsidiaryId.trim() || null,
      });
      await onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Edit user</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
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
            select
            label="Role"
            size="small"
            value={role}
            onChange={(e) => setRole(e.target.value as AdminUserRole)}
          >
            <MenuItem value="standard">standard</MenuItem>
            <MenuItem value="admin">admin</MenuItem>
            <MenuItem value="superadmin">superadmin</MenuItem>
          </TextField>
          <TextField
            select
            label={subsidiaryRequired ? "Subsidiary" : "Subsidiary (optional)"}
            size="small"
            value={subsidiaryId}
            onChange={(e) => setSubsidiaryId(e.target.value)}
            required={subsidiaryRequired}
            error={subsidiaryRequired && !subsidiaryId}
            helperText={subsidiaryRequired && !subsidiaryId ? "Required for a standard user" : undefined}
            InputLabelProps={{ shrink: true }}
          >
            <MenuItem value="" disabled={subsidiaryRequired}>
              {subsidiaryRequired ? "Select a subsidiary" : "No subsidiary"}
            </MenuItem>
            {subsidiaries.map((s) => (
              <MenuItem key={s.id} value={s.name}>
                {s.name}
              </MenuItem>
            ))}
          </TextField>
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" disabled={!canSave} onClick={handleSave}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/** One row's notification-email display: always a compact 2-line read-only
 * value (so every row has the same height regardless of edit permission),
 * plus an Edit icon-button that opens a Popover with the actual editable
 * fields when the viewer is allowed to change it (see
 * canEditNotificationEmail above) — a popover isn't constrained by the
 * table's column width, unlike the fields rendered directly in the cell. */
function NotificationEmailCell({
  user,
  editable,
  onSaved,
}: {
  user: AdminUserListItem;
  editable: boolean;
  onSaved: () => void | Promise<void>;
}) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [value1, setValue1] = useState(user.notificationEmail ?? "");
  const [value2, setValue2] = useState(user.notificationEmail2 ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setValue1(user.notificationEmail ?? "");
    setValue2(user.notificationEmail2 ?? "");
  }, [user.notificationEmail, user.notificationEmail2]);

  const isDirty = value1.trim() !== (user.notificationEmail ?? "") || value2.trim() !== (user.notificationEmail2 ?? "");

  function handleClose() {
    setAnchorEl(null);
    setValue1(user.notificationEmail ?? "");
    setValue2(user.notificationEmail2 ?? "");
    setError(null);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await setUserNotificationEmail(user.id, value1.trim() || null, value2.trim() || null);
      await onSaved();
      setAnchorEl(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Stack direction="row" spacing={0.5} alignItems="center">
      <Stack spacing={0.25}>
        <Typography variant="body2">{user.notificationEmail ?? "—"}</Typography>
        {user.notificationEmail2 && <Typography variant="body2">{user.notificationEmail2}</Typography>}
      </Stack>
      {editable && (
        <>
          <Tooltip title="Edit notification email">
            <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Popover
            open={!!anchorEl}
            anchorEl={anchorEl}
            onClose={handleClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          >
            <Box sx={{ p: 2, width: 320 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                Notification email — {user.username}
              </Typography>
              <NotificationEmailFields
                value1={value1}
                value2={value2}
                onValue1Change={setValue1}
                onValue2Change={setValue2}
                onSave={handleSave}
                saving={saving}
                dirty={isDirty}
                error={error}
                label1="Email 1"
                label2="Email 2"
                containerSx={{
                  flexDirection: "column",
                  alignItems: "stretch",
                  "& .MuiTextField-root": { width: "100%" },
                  "& .MuiButton-root": { alignSelf: "flex-start" },
                }}
              />
            </Box>
          </Popover>
        </>
      )}
    </Stack>
  );
}
