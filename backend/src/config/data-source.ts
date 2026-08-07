import "reflect-metadata";
import { DataSource } from "typeorm";
import { Upload } from "../entities/Upload";
import { AdminSetting } from "../entities/AdminSetting";
import { User } from "../entities/User";
import { RefreshToken } from "../entities/RefreshToken";
import { GeneratedFile } from "../entities/GeneratedFile";
import { EmailLog } from "../entities/EmailLog";
import { ProjectCode } from "../entities/ProjectCode";
import { Subsidiary } from "../entities/Subsidiary";
import { SubsidiaryProjectBlock } from "../entities/SubsidiaryProjectBlock";
import { QaRun } from "../entities/QaRun";
import { QaTestCaseResult } from "../entities/QaTestCaseResult";
import { InitSchema1700000000000 } from "../migrations/1700000000000-InitSchema";
import { AddUsersAndVersioning1710000000000 } from "../migrations/1710000000000-AddUsersAndVersioning";
import { SubmittedOnlyVersioning1720000000000 } from "../migrations/1720000000000-SubmittedOnlyVersioning";
import { AddProjectCodes1730000000000 } from "../migrations/1730000000000-AddProjectCodes";
import { AddQuestionOverrides1740000000000 } from "../migrations/1740000000000-AddQuestionOverrides";
import { AddUserSubsidiary1750000000000 } from "../migrations/1750000000000-AddUserSubsidiary";
import { AddSubsidiaries1760000000000 } from "../migrations/1760000000000-AddSubsidiaries";
import { AddSubsidiaryProjectBlocks1770000000000 } from "../migrations/1770000000000-AddSubsidiaryProjectBlocks";
import { AddSubsidiaryIsActive1780000000000 } from "../migrations/1780000000000-AddSubsidiaryIsActive";
import { AddQaRuns1790000000000 } from "../migrations/1790000000000-AddQaRuns";

const entities = [
  Upload,
  AdminSetting,
  User,
  RefreshToken,
  GeneratedFile,
  EmailLog,
  ProjectCode,
  Subsidiary,
  SubsidiaryProjectBlock,
  QaRun,
  QaTestCaseResult,
];
const migrations = [
  InitSchema1700000000000,
  AddUsersAndVersioning1710000000000,
  SubmittedOnlyVersioning1720000000000,
  AddProjectCodes1730000000000,
  AddQuestionOverrides1740000000000,
  AddUserSubsidiary1750000000000,
  AddSubsidiaries1760000000000,
  AddSubsidiaryProjectBlocks1770000000000,
  AddSubsidiaryIsActive1780000000000,
  AddQaRuns1790000000000,
];

/**
 * Windows/trusted-connection auth (local dev against a named instance, e.g.
 * JANITHA-PC\SQLEXPRESS) needs the native msnodesqlv8 driver — tedious (the
 * default mssql driver, used below for SQL_CONNECTION_STRING) has no concept
 * of a real trusted connection, only NTLM with an explicit domain/user/password.
 *
 * mssql's own msnodesqlv8 connection-string builder hardcodes the ODBC driver
 * name "SQL Server Native Client 11.0" on Windows, which isn't installed on
 * most current machines (this one only has "ODBC Driver 17 for SQL Server") —
 * so a raw `connectionString` is passed via `extra` instead of letting it
 * auto-build one, naming the driver that's actually present.
 */
function buildTrustedConnectionDataSource(): DataSource {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const msnodesqlv8Driver = require("mssql/msnodesqlv8");
  const server = process.env.SQL_SERVER ?? "localhost";
  const instance = process.env.SQL_INSTANCE;
  const database = process.env.SQL_DATABASE;
  const serverSegment = instance ? `${server}\\${instance}` : server;

  return new DataSource({
    type: "mssql",
    driver: msnodesqlv8Driver,
    database,
    synchronize: false,
    logging: false,
    entities,
    migrations,
    extra: {
      connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=${serverSegment};Database=${database};Trusted_Connection=Yes;Encrypt=yes;TrustServerCertificate=yes;`,
    },
  });
}

export const AppDataSource =
  process.env.SQL_TRUSTED_CONNECTION === "true"
    ? buildTrustedConnectionDataSource()
    : new DataSource({
        type: "mssql",
        url: process.env.SQL_CONNECTION_STRING,
        synchronize: false,
        logging: false,
        entities,
        migrations,
        options: {
          encrypt: true,
          // Only for local/dev SQL Server instances presenting a self-signed
          // certificate — disables certificate validation, so this must stay unset
          // (false) in production (e.g. against Azure SQL, which has a valid cert).
          trustServerCertificate: process.env.SQL_TRUST_SERVER_CERTIFICATE === "true",
        },
      });
