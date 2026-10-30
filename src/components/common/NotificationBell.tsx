import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Box, Button, IconButton, List, ListItemButton, ListItemText, Menu, Typography } from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { showToast } from "../../store/toastStore";
import {
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "../../api/notificationsApi";

const POLL_INTERVAL_MS = 60_000;

/**
 * The notification bell — mirrors every event backend's email_service.py
 * already emails for (see notificationsApi.ts), so something is always
 * visible in-app even when SMTP isn't configured or delivery fails. Polls
 * the unread count (a single setTimeout re-armed after each request
 * settles, same pattern QaRunDialog.tsx already uses for its own polling —
 * not setInterval, which would stack a new timer on top of a slow request).
 * A poll whose count went up since the last one also fires the app's
 * existing global toast (toastStore.ts) for the newest item, instead of
 * building a second popup mechanism.
 *
 * Rendered in AppLayout.tsx's sidebar header (desktop) and the mobile
 * AppBar — same component both places, sized via the `size` prop.
 */
export function NotificationBell({ color }: { color?: string }) {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingList, setLoadingList] = useState(false);
  const lastCountRef = useRef(0);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const { count } = await getUnreadNotificationCount();
        if (cancelled) return;
        if (count > lastCountRef.current) {
          listNotifications(1)
            .then((latest) => {
              if (latest[0]) showToast(latest[0].title, "info");
            })
            .catch(() => undefined);
        }
        lastCountRef.current = count;
        setUnreadCount(count);
      } catch {
        // Silent — a failed poll just tries again next interval; no need to
        // surface a toast/error for a background check like this one.
      } finally {
        if (!cancelled) pollTimer.current = setTimeout(poll, POLL_INTERVAL_MS);
      }
    }

    poll();
    return () => {
      cancelled = true;
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
  }, []);

  function handleOpen(e: React.MouseEvent<HTMLElement>) {
    setAnchorEl(e.currentTarget);
    setLoadingList(true);
    listNotifications()
      .then(setNotifications)
      .catch(() => setNotifications([]))
      .finally(() => setLoadingList(false));
  }

  function handleClose() {
    setAnchorEl(null);
  }

  function handleItemClick(n: AppNotification) {
    if (!n.isRead) {
      markNotificationRead(n.id).catch(() => undefined);
      setNotifications((prev) => prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item)));
      setUnreadCount((c) => Math.max(0, c - 1));
      lastCountRef.current = Math.max(0, lastCountRef.current - 1);
    }
    handleClose();
    if (n.link) navigate(n.link);
  }

  function handleMarkAllRead() {
    markAllNotificationsRead()
      .then(() => {
        setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
        setUnreadCount(0);
        lastCountRef.current = 0;
      })
      .catch(() => undefined);
  }

  return (
    <>
      <IconButton onClick={handleOpen} aria-label="Notifications" sx={{ color: color ?? "inherit" }}>
        <Badge badgeContent={unreadCount} color="error" max={99}>
          <NotificationsIcon fontSize="small" />
        </Badge>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { width: 360, maxHeight: 440 } } }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1 }}>
          <Typography variant="subtitle2" fontWeight={700}>
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={handleMarkAllRead}>
              Mark all read
            </Button>
          )}
        </Box>
        {loadingList ? (
          <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 2 }}>
            Loading…
          </Typography>
        ) : notifications.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 2 }}>
            You're all caught up.
          </Typography>
        ) : (
          <List dense disablePadding>
            {notifications.map((n) => (
              <ListItemButton key={n.id} onClick={() => handleItemClick(n)} sx={{ alignItems: "flex-start", py: 1, px: 2 }}>
                <ListItemText
                  primary={
                    <Typography variant="body2" fontWeight={n.isRead ? 400 : 700} noWrap>
                      {n.title}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography variant="caption" color="text.secondary" component="span" sx={{ display: "block" }} noWrap>
                        {n.message}
                      </Typography>
                      <Typography variant="caption" color="text.disabled" component="span">
                        {new Date(n.createdAt).toLocaleString()}
                      </Typography>
                    </>
                  }
                />
              </ListItemButton>
            ))}
          </List>
        )}
      </Menu>
    </>
  );
}
