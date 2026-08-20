import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { corsMiddleware } from "./middleware/cors";
import { errorHandler } from "./middleware/errorHandler";
import { generalRateLimiter } from "./middleware/rateLimit";
import { authRouter } from "./routes/auth.router";
import { uploadRouter } from "./routes/upload.router";
import { generateRouter } from "./routes/generate.router";
import { submitRouter } from "./routes/submit.router";
import { adminRouter } from "./routes/admin.router";
import { downloadRouter } from "./routes/download.router";
import { projectCodeRouter } from "./routes/projectCode.router";
import { subsidiaryRouter } from "./routes/subsidiary.router";
import { formBuilderRouter } from "./routes/formBuilder.router";
import { subsidiaryFormsRouter } from "./routes/subsidiaryForms.router";
import { subsidiaryLocaleRouter } from "./routes/subsidiaryLocale.router";
import { aiRouter } from "./routes/ai.router";

export const app = express();

// crossOriginResourcePolicy defaults to "same-origin" in helmet v8+, which
// would make browsers block the frontend (a different origin/port in dev,
// likely a different origin in production too) from reading *any* response
// here — JSON included — regardless of what corsMiddleware below allows.
// CORP and CORS are separate browser mechanisms; this API is deliberately
// called cross-origin, so CORP must be relaxed to match.
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(express.json());
app.use(cookieParser());
app.use(corsMiddleware);
app.use(generalRateLimiter);

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/uploads", uploadRouter);
app.use("/api/v1/generate", generateRouter);
app.use("/api/v1/submit", submitRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/download", downloadRouter);
app.use("/api/v1/project-codes", projectCodeRouter);
app.use("/api/v1/subsidiaries", subsidiaryRouter);
app.use("/api/v1/admin/forms", formBuilderRouter);
app.use("/api/v1/forms", subsidiaryFormsRouter);
app.use("/api/v1/subsidiary-locales", subsidiaryLocaleRouter);
app.use("/api/v1/ai", aiRouter);

app.use(errorHandler);
