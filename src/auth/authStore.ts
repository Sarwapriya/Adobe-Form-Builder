import { create } from "zustand";
import { apiClient, setAccessToken, ApiError } from "../api/apiClient";

export type UserRole = "admin" | "standard";

export interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
  /** Scopes a standard user to one subsidiary — the upload form auto-fills
   * and locks its Subsidiary field to this value for them. Null for admins
   * and for standard users not tied to one. */
  subsidiaryId: string | null;
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
      (payload.role !== "admin" && payload.role !== "standard")
    ) {
      return null;
    }
    return {
      id: payload.sub,
      username: payload.username,
      role: payload.role,
      subsidiaryId: typeof payload.subsidiaryId === "string" ? payload.subsidiaryId : null,
    };
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "idle",
  error: null,

  async login(username, password) {
    set({ status: "loading", error: null });
    try {
      const response = await apiClient.post<LoginResponse>("/api/v1/auth/login", { username, password });
      console.log(response);
      setAccessToken(response.accessToken);
      set({ user: response.user, status: "authenticated", error: null });
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
    }
  },

  async silentRefresh() {
    set({ status: "loading" });
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
  },
}));
