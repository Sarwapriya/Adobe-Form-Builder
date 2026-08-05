const BASE_URL = import.meta.env.VITE_API_BASE_URL;

let accessToken: string | null = null;

/**
 * The in-memory access token every request attaches as `Authorization: Bearer
 * <token>`. Deliberately never persisted (no localStorage/sessionStorage) — a
 * page reload always re-authenticates via the httpOnly refresh cookie instead
 * (see authStore.ts's silentRefresh), so an XSS payload can't read a
 * long-lived credential out of storage.
 */
export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export class ApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Reads the `csrfToken` cookie the backend sets on login/refresh (see
 * backend/src/middleware/csrf.ts — it's deliberately Path=/, non-httpOnly, so
 * JS on any of this app's pages can read it here). Echoed back as the
 * `X-CSRF-Token` header on every request below: harmless on requests that
 * don't check it, required on the cookie-authenticated POST /auth/refresh and
 * POST /auth/logout.
 */
function readCsrfToken(): string | null {
  const match = document.cookie.match(/(?:^|; )csrfToken=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  /** Set true for multipart/form-data uploads — `body` must already be a
   * FormData instance, and Content-Type is left for the browser to set itself
   * (it needs to include the multipart boundary). */
  isFormData?: boolean;
  /** Set true when the response body is binary (zip downloads) rather than JSON. */
  expectBlob?: boolean;
}

async function rawFetch(path: string, options: RequestOptions, token: string | null): Promise<Response> {
  const headers: Record<string, string> = {};
  if (!options.isFormData) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const csrfToken = readCsrfToken();
  if (csrfToken) {
    headers["X-CSRF-Token"] = csrfToken;
  }

  return fetch(`${BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    // Required for the httpOnly refresh-token cookie to be sent/received —
    // every request goes through this, not just /auth/*.
    credentials: "include",
    body: options.isFormData
      ? (options.body as FormData)
      : options.body !== undefined
        ? JSON.stringify(options.body)
        : undefined,
  });
}

// Coalesces concurrent refresh attempts into one in-flight request. Without
// this, two requests that both 401 at nearly the same moment would each try
// to rotate the single-use refresh token — the second would lose the race
// against the first's rotation and fail even though the session is valid.
let refreshPromise: Promise<string | null> | null = null;

/** Calls POST /auth/refresh directly (bypassing `request()` to avoid infinite
 * recursion), updating the in-memory access token on success. Returns the new
 * token, or null if the refresh cookie is missing/expired/revoked. */
function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const csrfToken = readCsrfToken();
      const response = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: csrfToken ? { "X-CSRF-Token": csrfToken } : undefined,
      });
      if (!response.ok) {
        setAccessToken(null);
        return null;
      }
      const data = (await response.json()) as { accessToken: string };
      setAccessToken(data.accessToken);
      return data.accessToken;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const data = await response.json();
    if (data && typeof data.error === "string") return data.error;
  } catch {
    // Response body wasn't JSON — fall through to the generic message.
  }
  return `Request failed with status ${response.status}`;
}

/**
 * Core request helper: attaches the current access token, and on a 401
 * response (the access token expired mid-session) transparently tries exactly
 * one silent refresh-and-retry before giving up — callers never have to think
 * about token expiry themselves.
 */
async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let response = await rawFetch(path, options, accessToken);

  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      response = await rawFetch(path, options, refreshed);
    }
  }

  if (!response.ok) {
    throw new ApiError(response.status, await extractErrorMessage(response));
  }

  if (options.expectBlob) {
    return (await response.blob()) as unknown as T;
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export const apiClient = {
  get: <T>(path: string): Promise<T> => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown): Promise<T> => request<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown): Promise<T> => request<T>(path, { method: "PATCH", body }),
  postForm: <T>(path: string, formData: FormData): Promise<T> =>
    request<T>(path, { method: "POST", body: formData, isFormData: true }),
  delete: <T>(path: string): Promise<T> => request<T>(path, { method: "DELETE" }),
  getBlob: (path: string): Promise<Blob> => request<Blob>(path, { method: "GET", expectBlob: true }),
  refreshAccessToken,
};
