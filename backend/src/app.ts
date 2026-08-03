import express from "express";
import { corsMiddleware } from "./middleware/cors";
import { errorHandler } from "./middleware/errorHandler";
import { authRouter } from "./routes/auth.router";
import { uploadRouter } from "./routes/upload.router";
import { adminRouter } from "./routes/admin.router";
import { downloadRouter } from "./routes/download.router";

export const app = express();

app.use(express.json());
app.use(corsMiddleware);

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/uploads", uploadRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/download", downloadRouter);

app.use(errorHandler);
