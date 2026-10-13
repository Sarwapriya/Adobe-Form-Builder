import { create } from "zustand";
import { apiClient, getAccessToken, setAccessToken, setOnTokenRefreshed, ApiError } from "../api/apiClient";
import { useAiChatStore } from "../store/aiChatStore";

export type UserRole = "admin" | "standard" | "superadmin";

/** "admin" and "superadmin" both get admin-panel access — "superadmin" is a
 * strict superset (see backend User.isAdminRole, which this mirrors). */
export function isAdminRole(role: UserRole | undefined): boolean {
  return role === "admin" || role === "superadmin";
}

export interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
  /** Scopes a standard user to one subsidiary — the upload form auto-fills
   * and locks its Subsidiary field to this value for them. Null for admins
   * and for standard users not tied to one. */
  subsidiaryId: string | null;
  /** Optional display name, admin/superadmin-set via User Management — see
   * backend User.firstName/lastName's own doc comment. Null until set. */
  firstName: string | null;
  lastName: string | null;
}

export type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

interface AuthState {
  user: AuthUser | null;
  status: AuthStatus;
  error: string | null;

  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Called once on app load: re-establishes a session from the httpOnly
   * refresh cookie alone (no access token survives a page reload, since it's
   * only ever kept in memory), without requiring the user to log in again. */
  silentRefresh: () => Promise<void>;
}

function base64UrlDecode(input: string): string {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  return atob(padded);
}

/** Decodes the (signed, not encrypted) access token's payload client-side to
 * recover the logged-in user's id/username/role/subsidiaryId — used after
 * silentRefresh, whose response body is just `{ accessToken }`. This is
 * display-only trust: every protected backend endpoint still independently
 * verifies the token's signature itself, so a tampered payload here can't
 * grant any real access. */
function decodeAccessToken(token: string): AuthUser | null {
  try {
    const payloadSegment = token.split(".")[1];
    if (!payloadSegment) return null;
    const payload = JSON.parse(base64UrlDecode(payloadSegment));
    if (
      typeof payload.sub !== "string" ||
      typeof payload.username !== "string" ||
      (payload.role !== "admin" && payload.role !== "standard" && payload.role !== "superadmin")
    ) {
      return null;
    }
    return {
      id: payload.sub,
      username: payload.username,
      role: payload.role,
      subsidiaryId: typeof payload.subsidiaryId === "string" ? payload.subsidiaryId : null,
      firstName: typeof payload.firstName === "string" ? payload.firstName : null,
      lastName: typeof payload.lastName === "string" ? payload.lastName : null,
    };
  } catch {
    return null;
  }
}

type AuthBroadcastMessage =
  | { type: "announce"; accessToken: string; user: AuthUser }
  | { type: "request" }
  | { type: "logout" };

/**
 * Lets every open tab of this app share one session instead of each
 * independently re-authenticating against the httpOnly refresh cookie.
 * Without this, a tab opened via `window.open` (e.g. BuilderActionBar.tsx's
 * Edit Files button — the only place this app opens a new tab) has no
 * access token of its own and always called `POST /auth/refresh`
 * immediately on mount, racing any other open tab doing the same against
 * the single-use rotating refresh token and sometimes losing (logged out).
 * Memory-only, same-origin, cleared when every tab closes — nothing here
 * touches disk, so the "access token never persisted" security property
 * (see apiClient.ts) is unchanged. `undefined` on browsers without
 * BroadcastChannel (old Safari); every call site below degrades to the
 * existing cookie-based flow alone in that case.
 */
const AUTH_CHANNEL_NAME = "formiq-auth";
const authChannel: BroadcastChannel | undefined =
  typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(AUTH_CHANNEL_NAME) : undefined;

function broadcastSession(accessToken: string, user: AuthUser): void {
  authChannel?.postMessage({ type: "announce", accessToken, user } satisfies AuthBroadcastMessage);
}

function broadcastLogout(): void {
  authChannel?.postMessage({ type: "logout" } satisfies AuthBroadcastMessage);
}

/** Asks any other open tab "does anyone already have a session?" and waits
 * briefly for an answer instead of immediately spending a refresh-token
 * rotation. Resolves `null` on timeout or when BroadcastChannel isn't
 * available, so callers fall back to the cookie-based flow unconditionally. */
function requestSessionFromOtherTabs(timeoutMs = 200): Promise<{ accessToken: string; user: AuthUser } | null> {
  if (!authChannel) return Promise.resolve(null);
  return new Promise((resolve) => {
    // A separate instance from `authChannel` so this one-off wait never
    // fights over `onmessage` with the persistent listener set up below —
    // both instances share the same channel name, so this still receives
    // every "announce" broadcast from other tabs.
    const responseChannel = new BroadcastChannel(AUTH_CHANNEL_NAME);
    let settled = false;
    const finish = (result: { accessToken: string; user: AuthUser } | null) => {
      if (settled) return;
      settled = true;
      responseChannel.close();
      resolve(result);
    };
    responseChannel.onmessage = (event: MessageEvent<AuthBroadcastMessage>) => {
      if (event.data.type === "announce") finish({ accessToken: event.data.accessToken, user: event.data.user });
    };
    setTimeout(() => finish(null), timeoutMs);
    authChannel.postMessage({ type: "request" } satisfies AuthBroadcastMessage);
  });
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "idle",
  error: null,

  async login(username, password) {
    set({ status: "loading", error: null });
    try {
      const response = await apiClient.post<LoginResponse>("/api/v1/auth/login", { username, password });
      setAccessToken(response.accessToken);
      set({ user: response.user, status: "authenticated", error: null });
      // Defensive: clears any chat transcript left over from a previous
      // user's session in this same browser tab (the primary fix is
      // logout()'s own reset below, but this covers any path that reaches
      // here without going through logout first).
      useAiChatStore.getState().reset();
      broadcastSession(response.accessToken, response.user);
    } catch (err) {
      setAccessToken(null);
      const message = err instanceof ApiError ? err.message : "Login failed";
      set({ user: null, status: "unauthenticated", error: message });
      throw err;
    }
  },

  async logout() {
    try {
      await apiClient.post("/api/v1/auth/logout");
    } catch {
      // Logout must never get "stuck" client-side just because the network
      // call failed — the local session is cleared either way, below.
    } finally {
      setAccessToken(null);
      set({ user: null, status: "unauthenticated", error: null });
      // Clears the AI chat panel's in-memory transcript/conversationId/
      // pending actions — without this, the next person to log in on this
      // same browser tab would inherit this user's chat history (the panel
      // is mounted globally, per-tab, not per-session; see AppLayout.tsx).
      useAiChatStore.getState().reset();
      broadcastLogout();
    }
  },

  async silentRefresh() {
    set({ status: "loading" });

    // Ask any other already-open tab for its session first — avoids
    // spending a refresh-token rotation (and racing any sibling tab doing
    // the same) just because a new tab happened to open. See
    // requestSessionFromOtherTabs's own doc comment.
    const fromOtherTab = await requestSessionFromOtherTabs();
    if (fromOtherTab) {
      setAccessToken(fromOtherTab.accessToken);
      set({ user: fromOtherTab.user, status: "authenticated", error: null });
      return;
    }

    const token = await apiClient.refreshAccessToken();
    if (!token) {
      set({ user: null, status: "unauthenticated" });
      return;
    }

    const user = decodeAccessToken(token);
    if (!user) {
      setAccessToken(null);
      set({ user: null, status: "unauthenticated" });
      return;
    }

    set({ user, status: "authenticated", error: null });
    broadcastSession(token, user);
  },
}));

// Persistent cross-tab listener: answers other tabs' "does anyone have a
// session?" requests, adopts a session another tab just obtained (so this
// tab doesn't need its own refresh later, and stays in sync if the signed-in
// user changed elsewhere), and mirrors an explicit logout from another tab.
authChannel?.addEventListener("message", (event: MessageEvent<AuthBroadcastMessage>) => {
  const data = event.data;
  if (data.type === "request") {
    const state = useAuthStore.getState();
    const token = getAccessToken();
    if (state.status === "authenticated" && state.user && token) {
      broadcastSession(token, state.user);
    }
    return;
  }
  if (data.type === "announce") {
    setAccessToken(data.accessToken);
    useAuthStore.setState({ user: data.user, status: "authenticated", error: null });
    return;
  }
  if (data.type === "logout") {
    setAccessToken(null);
    useAuthStore.setState({ user: null, status: "unauthenticated", error: null });
    useAiChatStore.getState().reset();
  }
});

// Every access token this module obtains outside of login/silentRefresh
// (apiClient.ts's own mid-session 401-retry) also gets decoded and
// broadcast, so a tab that refreshes mid-session — not just at mount —
// still keeps every other open tab in sync.
setOnTokenRefreshed((token) => {
  const user = decodeAccessToken(token);
  if (!user) return;
  useAuthStore.setState({ user, status: "authenticated", error: null });
  broadcastSession(token, user);
});
