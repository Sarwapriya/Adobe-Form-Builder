-- Canonical schema for the FormBuilder backend (Azure SQL / SQL Server).
-- This is the source of truth; src/migrations mirrors it for `typeorm migration:run`.
-- Apply manually (sqlcmd / Azure Data Studio) before first boot. The app never
-- runs `synchronize: true` against this database.
--
-- NOTE: this file reflects the full current schema for a brand-new database (all
-- Uploads columns declared inline). An already-deployed database should instead run
-- the incremental migrations under src/migrations (starting from InitSchema, then
-- AddUsersAndVersioning, ...) via `npm run typeorm -- migration:run`.

-- subsidiaryId scopes a standard user to one subsidiary: the upload form
-- auto-fills and locks the Subsidiary field to it for them, and the backend
-- overrides whatever the client sends with this value regardless (see
-- upload.router.ts). NULL for admins and for standard users not tied to one.
CREATE TABLE Users (
    id           UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    username     NVARCHAR(100) NOT NULL UNIQUE,
    email        NVARCHAR(255) NOT NULL UNIQUE,
    passwordHash NVARCHAR(255) NOT NULL,
    role         NVARCHAR(20) NOT NULL DEFAULT 'standard',
    subsidiaryId NVARCHAR(50) NULL,
    isActive     BIT NOT NULL DEFAULT 1,
    createdAt    DATETIMEOFFSET(7) DEFAULT SYSDATETIMEOFFSET()
);

-- version is NULL until the upload is submitted (see submissionService.ts) —
-- an in-progress or failed upload never consumes a version number, only a
-- submitted one does. The filtered unique index below (not a table
-- CONSTRAINT, which SQL Server would only allow one NULL for) enforces
-- uniqueness only among assigned version numbers, per subsidiary.
-- projectCode is a text snapshot (like subsidiaryId) of whichever ProjectCodes
-- row was selected in the upload form's dropdown at upload time, not a
-- foreign key — see ProjectCodes below.
CREATE TABLE Uploads (
    id               UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    subsidiaryId     NVARCHAR(50) NOT NULL,
    projectCode      NVARCHAR(100) NULL,
    fileName         NVARCHAR(255) NOT NULL,
    filePath         NVARCHAR(2000) NOT NULL,
    uploadDate       DATETIMEOFFSET(7) DEFAULT SYSDATETIMEOFFSET(),
    submissionCount  INT DEFAULT 0,
    userId           UNIQUEIDENTIFIER NULL REFERENCES Users(id),
    version          INT NULL,
    generatedPath    NVARCHAR(2000) NULL,
    status           NVARCHAR(20) NOT NULL DEFAULT 'uploaded',
    submittedAt      DATETIMEOFFSET(7) NULL,
    isDeleted        BIT NOT NULL DEFAULT 0,
    -- JSON-encoded Record<questionId, boolean> of which questions the
    -- uploader marked optional at upload time — see
    -- generationService.generateFromWorkbook's requiredOverrides param.
    questionOverrides NVARCHAR(MAX) NULL
);
CREATE UNIQUE INDEX UQ_Uploads_subsidiary_version ON Uploads(subsidiaryId, version) WHERE version IS NOT NULL;

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

-- The admin-managed picklist behind the upload form's "Project Code" dropdown.
-- isOpen gates whether new uploads may select it (see projectCodeService.ts);
-- never deleted, so historical uploads that used a since-closed code keep an
-- intact (denormalized) record via Uploads.projectCode above.
CREATE TABLE ProjectCodes (
    id        UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    code      NVARCHAR(100) NOT NULL UNIQUE,
    isOpen    BIT NOT NULL DEFAULT 1,
    createdAt DATETIMEOFFSET(7) DEFAULT SYSDATETIMEOFFSET()
);

-- Admin-configurable toggle read by the submit endpoint to decide whether
-- submitting an upload locks that version's generated files against further
-- regeneration/re-upload.
INSERT INTO AdminSettings ([key], value) VALUES ('lockGeneratedFilesOnSubmit', 'true');
