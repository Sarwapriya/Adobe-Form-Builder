/** One-off: lists the Users table's columns to confirm firstName/lastName exist. Delete after running. */
import "reflect-metadata";
import dotenv from "dotenv";
dotenv.config();

import { AppDataSource } from "../src/config/data-source";

async function main(): Promise<void> {
  await AppDataSource.initialize();
  try {
    const rows = await AppDataSource.manager.query(
      `SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Users' ORDER BY ORDINAL_POSITION`,
    );
    console.log(JSON.stringify(rows, null, 2));
  } finally {
    await AppDataSource.destroy();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
