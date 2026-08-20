import rateLimit from "express-rate-limit";

/** Applied globally (see app.ts) — generous enough not to bother normal
 * usage, but caps abusive/scripted traffic hitting any endpoint. */
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

/** Applied only to /auth/login and /auth/refresh (see auth.router.ts) — much
 * tighter than the general limiter, since these are the credential-stuffing /
 * brute-force / refresh-token-guessing surface. Keyed by IP (the package's
 * default). */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts, please try again later." },
});

/** Applied only to POST /ai/chat (see ai.router.ts) — each call costs real
 * FabriXAI tokens/money, so this stays tight like authRateLimiter rather
 * than the generous general limiter, but keyed per-user rather than the
 * package's IP default isn't needed here (IP-based is fine — the general
 * limiter already caps abusive traffic at a higher volume; this just caps
 * spend). */
export const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many AI requests, please try again later." },
});
