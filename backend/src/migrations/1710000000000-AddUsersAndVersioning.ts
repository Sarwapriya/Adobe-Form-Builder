import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUsersAndVersioning1710000000000 implements MigrationInterface {
  name = "AddUsersAndVersioning1710000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE Users (
          id           UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
          username     NVARCHAR(100) NOT NULL UNIQUE,
          email        NVARCHAR(255) NOT NULL UNIQUE,
          passwordHash NVARCHAR(255) NOT NULL,
          role         NVARCHAR(20) NOT NULL DEFAULT 'standard',
          isActive     BIT NOT NULL DEFAULT 1,
          createdAt    DATETIMEOFFSET(7) DEFAULT SYSDATETIMEOFFSET()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE RefreshTokens (
          id            UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
          userId        UNIQUEIDENTIFIER NOT NULL REFERENCES Users(id),
          tokenHash     NVARCHAR(128) NOT NULL UNIQUE,
          expiresAt     DATETIMEOFFSET(7) NOT NULL,
          revokedAt     DATETIMEOFFSET(7) NULL,
          createdByIp   NVARCHAR(45) NULL,
          createdAt     DATETIMEOFFSET(7) DEFAULT SYSDATETIMEOFFSET()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IX_RefreshTokens_userId ON RefreshTokens(userId)
    `);

    await queryRunner.query(`ALTER TABLE Uploads ADD userId UNIQUEIDENTIFIER NULL REFERENCES Users(id)`);
    await queryRunner.query(`ALTER TABLE Uploads ADD version INT NOT NULL DEFAULT 1`);
    await queryRunner.query(`ALTER TABLE Uploads ADD generatedPath NVARCHAR(2000) NULL`);
    await queryRunner.query(`ALTER TABLE Uploads ADD status NVARCHAR(20) NOT NULL DEFAULT 'uploaded'`);
    await queryRunner.query(`ALTER TABLE Uploads ADD submittedAt DATETIMEOFFSET(7) NULL`);
    await queryRunner.query(`ALTER TABLE Uploads ADD isDeleted BIT NOT NULL DEFAULT 0`);
    await queryRunner.query(`
      ALTER TABLE Uploads ADD CONSTRAINT UQ_Uploads_subsidiary_version UNIQUE (subsidiaryId, version)
    `);

    await queryRunner.query(`
      CREATE TABLE GeneratedFiles (
          id        UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
          uploadId  UNIQUEIDENTIFIER NOT NULL REFERENCES Uploads(id),
          fileName  NVARCHAR(255) NOT NULL,
          filePath  NVARCHAR(2000) NOT NULL,
          fileType  NVARCHAR(20) NOT NULL,
          createdAt DATETIMEOFFSET(7) DEFAULT SYSDATETIMEOFFSET()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IX_GeneratedFiles_uploadId ON GeneratedFiles(uploadId)
    `);

    await queryRunner.query(`
      CREATE TABLE EmailLogs (
          id           UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
          uploadId     UNIQUEIDENTIFIER NOT NULL REFERENCES Uploads(id),
          recipient    NVARCHAR(255) NOT NULL,
          status       NVARCHAR(20) NOT NULL,
          errorMessage NVARCHAR(1000) NULL,
          sentAt       DATETIMEOFFSET(7) DEFAULT SYSDATETIMEOFFSET()
      )
    `);

    // Admin-configurable toggle read by the submit endpoint (Phase 3) to decide
    // whether submitting an upload locks that version's generated files.
    await queryRunner.query(`
      INSERT INTO AdminSettings ([key], value) VALUES ('lockGeneratedFilesOnSubmit', 'true')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM AdminSettings WHERE [key] = 'lockGeneratedFilesOnSubmit'`);
    await queryRunner.query(`DROP TABLE EmailLogs`);
    await queryRunner.query(`DROP TABLE GeneratedFiles`);
    await queryRunner.query(`ALTER TABLE Uploads DROP CONSTRAINT UQ_Uploads_subsidiary_version`);
    await queryRunner.query(
      `ALTER TABLE Uploads DROP COLUMN isDeleted, submittedAt, status, generatedPath, version, userId`,
    );
    await queryRunner.query(`DROP TABLE RefreshTokens`);
    await queryRunner.query(`DROP TABLE Users`);
  }
}
