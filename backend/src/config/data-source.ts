import "reflect-metadata";
import { DataSource } from "typeorm";
import { Upload } from "../entities/Upload";
import { AdminSetting } from "../entities/AdminSetting";
import { User } from "../entities/User";
import { RefreshToken } from "../entities/RefreshToken";
import { GeneratedFile } from "../entities/GeneratedFile";
import { EmailLog } from "../entities/EmailLog";
import { InitSchema1700000000000 } from "../migrations/1700000000000-InitSchema";
import { AddUsersAndVersioning1710000000000 } from "../migrations/1710000000000-AddUsersAndVersioning";

export const AppDataSource = new DataSource({
  type: "mssql",
  url: process.env.SQL_CONNECTION_STRING,
  synchronize: false,
  logging: false,
  entities: [Upload, AdminSetting, User, RefreshToken, GeneratedFile, EmailLog],
  migrations: [InitSchema1700000000000, AddUsersAndVersioning1710000000000],
  options: {
    encrypt: true,
    // Only for local/dev SQL Server instances presenting a self-signed
    // certificate — disables certificate validation, so this must stay unset
    // (false) in production (e.g. against Azure SQL, which has a valid cert).
    trustServerCertificate: process.env.SQL_TRUST_SERVER_CERTIFICATE === "true",
  },
});
