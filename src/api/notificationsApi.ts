import { apiClient } from "./apiClient";

/**
 * In-app notifications (NotificationBell.tsx) — mirrors every event
 * backend's email_service.py already sends an email for; see
 * backend's notification_service.py for the full list. Every route is
 * scoped to the caller's own account (`/api/v1/notifications`, `require_auth`
 * only — no admin-only surface here).
 */
export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  /** App-relative path to navigate to on click, e.g. "/my-forms" — never
   * includes the origin or the SUBPATH prefix (the router already applies
   * both), unlike the equivalent link in the matching email. */
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export function listNotifications(limit = 50): Promise<AppNotification[]> {
  return apiClient.get<AppNotification[]>(`/api/v1/notifications?limit=${limit}`);
}

export function getUnreadNotificationCount(): Promise<{ count: number }> {
  return apiClient.get<{ count: number }>("/api/v1/notifications/unread-count");
}

export function markNotificationRead(id: string): Promise<void> {
  return apiClient.post<void>(`/api/v1/notifications/${id}/read`);
}

export function markAllNotificationsRead(): Promise<{ count: number }> {
  return apiClient.post<{ count: number }>("/api/v1/notifications/read-all");
}
