/**
 * One-time script to create the first admin account from the ADMIN_USER/
 * ADMIN_EMAIL/ADMIN_PASSWORD_HASH env vars. Run manually once per environment
 * after the AddUsersAndVersioning migration has been applied — not run
 * automatically as part of migrations (migrations shouldn't depend on env
 * vars), and not run automatically on every server boot (seeding is a
 * deliberate, one-time action, not startup logic).
 *
 * Usage (from the backend/ directory, with .env populated):
 *   npm run seed:admin
 */
import "reflect-metadata";
import dotenv from "dotenv";
dotenv.config();

import { AppDataSource } from "../src/config/data-source";
import { User } from "../src/entities/User";
import { requireEnv } from "../src/utils/env";

async function main(): Promise<void> {
  const username = requireEnv("ADMIN_USER");
  const email = requireEnv("ADMIN_EMAIL");
  const passwordHash = requireEnv("ADMIN_PASSWORD_HASH");

  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(User);

  try {
    const existingAdmin = await repo.findOne({ where: { role: "admin" } });
    if (existingAdmin) {
      console.log(`An admin user already exists (username: "${existingAdmin.username}") — nothing to do.`);
      return;
    }

    const existingUsername = await repo.findOne({ where: { username } });
    if (existingUsername) {
      console.error(
        `A user with username "${username}" already exists but is not an admin. Refusing to overwrite it — ` +
          `either promote it manually or set ADMIN_USER to a different value.`,
      );
      process.exitCode = 1;
      return;
    }

    const admin = repo.create({
      username,
      email,
      passwordHash,
      role: "admin",
      isActive: true,
    });
    await repo.save(admin);

    console.log(`Created admin user "${username}" (id: ${admin.id}).`);
  } finally {
    await AppDataSource.destroy();
  }
}

main().catch((err) => {
  console.error("Failed to seed admin user", err);
  process.exitCode = 1;
});
