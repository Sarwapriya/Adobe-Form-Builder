import "reflect-metadata";
import { DataSource } from "typeorm";
import { Upload } from "../entities/Upload";
import { AdminSetting } from "../entities/AdminSetting";
import { InitSchema1700000000000 } from "../migrations/1700000000000-InitSchema";

export const AppDataSource = new DataSource({
  type: "mssql",
  url: process.env.SQL_CONNECTION_STRING,
  synchronize: false,
  logging: false,
  entities: [Upload, AdminSetting],
  migrations: [InitSchema1700000000000],
  options: {
    encrypt: true,
  },
});
