-- Canonical schema for the FormBuilder backend (Azure SQL / SQL Server).
-- This is the source of truth; src/migrations mirrors it for `typeorm migration:run`.
-- Apply manually (sqlcmd / Azure Data Studio) before first boot. The app never
-- runs `synchronize: true` against this database.
--
-- NOTE: this file reflects the full current schema for a brand-new database (all
-- Uploads columns declared inline). An already-deployed database should instead run
-- the incremental migrations under src/migrations (starting from InitSchema, then
-- AddUsersAndVersioning, ...) via `npm run typeorm -- migration:run`.

CREATE TABLE Users (
    id           UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    username     NVARCHAR(100) NOT NULL UNIQUE,
    email        NVARCHAR(255) NOT NULL UNIQUE,
    passwordHash NVARCHAR(255) NOT NULL,
    role         NVARCHAR(20) NOT NULL DEFAULT 'standard',
    isActive     BIT NOT NULL DEFAULT 1,
    createdAt    DATETIMEOFFSET(7) DEFAULT SYSDATETIMEOFFSET()
);

CREATE TABLE Uploads (
    id               UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    subsidiaryId     NVARCHAR(50) NOT NULL,
    fileName         NVARCHAR(255) NOT NULL,
    filePath         NVARCHAR(2000) NOT NULL,
    uploadDate       DATETIMEOFFSET(7) DEFAULT SYSDATETIMEOFFSET(),
    submissionCount  INT DEFAULT 0,
    userId           UNIQUEIDENTIFIER NULL REFERENCES Users(id),
    version          INT NOT NULL DEFAULT 1,
    generatedPath    NVARCHAR(2000) NULL,
    status           NVARCHAR(20) NOT NULL DEFAULT 'uploaded',
    submittedAt      DATETIMEOFFSET(7) NULL,
    isDeleted        BIT NOT NULL DEFAULT 0,
    CONSTRAINT UQ_Uploads_subsidiary_version UNIQUE (subsidiaryId, version)
);

CREATE TABLE RefreshTokens (
    id            UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    userId        UNIQUEIDENTIFIER NOT NULL REFERENCES Users(id),
    tokenHash     NVARCHAR(128) NOT NULL UNIQUE,
    expiresAt     DATETIMEOFFSET(7) NOT NULL,
    revokedAt     DATETIMEOFFSET(7) NULL,
    createdByIp   NVARCHAR(45) NULL,
    createdAt     DATETIMEOFFSET(7) DEFAULT SYSDATETIMEOFFSET()
);
CREATE INDEX IX_RefreshTokens_userId ON RefreshTokens(userId);

CREATE TABLE GeneratedFiles (
    id        UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    uploadId  UNIQUEIDENTIFIER NOT NULL REFERENCES Uploads(id),
    fileName  NVARCHAR(255) NOT NULL,
    filePath  NVARCHAR(2000) NOT NULL,
    fileType  NVARCHAR(20) NOT NULL,
    createdAt DATETIMEOFFSET(7) DEFAULT SYSDATETIMEOFFSET()
);
CREATE INDEX IX_GeneratedFiles_uploadId ON GeneratedFiles(uploadId);

CREATE TABLE EmailLogs (
    id           UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    uploadId     UNIQUEIDENTIFIER NOT NULL REFERENCES Uploads(id),
    recipient    NVARCHAR(255) NOT NULL,
    status       NVARCHAR(20) NOT NULL,
    errorMessage NVARCHAR(1000) NULL,
    sentAt       DATETIMEOFFSET(7) DEFAULT SYSDATETIMEOFFSET()
);

CREATE TABLE AdminSettings (
    [key]   NVARCHAR(50) PRIMARY KEY,
    value   NVARCHAR(255) NOT NULL
);

-- Admin-configurable toggle read by the submit endpoint to decide whether
-- submitting an upload locks that version's generated files against further
-- regeneration/re-upload.
INSERT INTO AdminSettings ([key], value) VALUES ('lockGeneratedFilesOnSubmit', 'true');
