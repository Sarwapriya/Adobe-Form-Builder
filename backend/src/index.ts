import "reflect-metadata";
import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import { app } from "./app";
import { AppDataSource } from "./config/data-source";
import { startCutoffReminderScheduler } from "./services/cutoffReminderService";

async function main(): Promise<void> {
  const uploadDir = process.env.UPLOAD_DIR ?? "./uploads";
  fs.mkdirSync(uploadDir, { recursive: true });

  await AppDataSource.initialize();
  startCutoffReminderScheduler();

  const port = Number(process.env.PORT ?? 4000);
  app.listen(port, () => {
    console.log(`FormBuilder backend listening on port ${port}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});
