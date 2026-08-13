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
    questionOverrides NVARCHAR(MAX) NULL,
    -- JSON-encoded FormVariant[] (e.g. '["ff"]') the uploader chose to
    -- generate — NULL means both (the default, and the implicit value for
    -- every row created before this feature existed).
    variants NVARCHAR(50) NULL
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

-- A builder-authored form/campaign — the schema-authored counterpart to Uploads,
-- kept as its own table/lifecycle (draft/published/unpublished) rather than folded
-- into Uploads, since a builder form has no source .xlsx and is repeatedly editable
-- (see Form.ts's own doc comment). subsidiaryId/projectCode are text snapshots,
-- mirroring Uploads' own convention.
CREATE TABLE Forms (
    id                    UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name                  NVARCHAR(200) NOT NULL,
    subsidiaryId          NVARCHAR(50) NOT NULL,
    projectCode           NVARCHAR(100) NULL,
    status                NVARCHAR(20) NOT NULL DEFAULT 'draft',
    currentDraftVersionId UNIQUEIDENTIFIER NULL,
    publishedVersionId    UNIQUEIDENTIFIER NULL,
    isDeleted             BIT NOT NULL DEFAULT 0,
    createdByUserId       UNIQUEIDENTIFIER NOT NULL REFERENCES Users(id),
    createdAt             DATETIMEOFFSET(7) DEFAULT SYSDATETIMEOFFSET(),
    updatedAt             DATETIMEOFFSET(7) DEFAULT SYSDATETIMEOFFSET()
);

-- One snapshot of a builder-authored form's content — see FormVersion.ts's own doc
-- comment for the full draft/publish/unpublish lifecycle. versionNumber is NULL
-- until published, mirroring Uploads.version's own null-until-submitted contract.
CREATE TABLE FormVersions (
    id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    formId          UNIQUEIDENTIFIER NOT NULL REFERENCES Forms(id),
    versionNumber   INT NULL,
    definition      NVARCHAR(MAX) NOT NULL,
    config          NVARCHAR(MAX) NOT NULL,
    status          NVARCHAR(20) NOT NULL DEFAULT 'draft',
    createdByUserId UNIQUEIDENTIFIER NOT NULL REFERENCES Users(id),
    createdAt       DATETIMEOFFSET(7) DEFAULT SYSDATETIMEOFFSET(),
    publishedAt     DATETIMEOFFSET(7) NULL,
    unpublishedAt   DATETIMEOFFSET(7) NULL
);
ALTER TABLE Forms ADD CONSTRAINT FK_Forms_currentDraftVersionId FOREIGN KEY (currentDraftVersionId) REFERENCES FormVersions(id);
ALTER TABLE Forms ADD CONSTRAINT FK_Forms_publishedVersionId FOREIGN KEY (publishedVersionId) REFERENCES FormVersions(id);
CREATE INDEX IX_FormVersions_formId ON FormVersions(formId);
CREATE INDEX IX_Forms_subsidiaryId ON Forms(subsidiaryId);

-- A subsidiary-scoped standard user's proposed translations/additions to a
-- *published* Form — see FormContribution.ts's own doc comment. content is JSON
-- (@formbuilder/shared's ContributionContent); approving one merges it onto the
-- form's current draft and republishes (formContributionService.approveContribution).
CREATE TABLE FormContributions (
    id                UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    formId            UNIQUEIDENTIFIER NOT NULL REFERENCES Forms(id),
    submittedByUserId UNIQUEIDENTIFIER NOT NULL REFERENCES Users(id),
    baseVersionId     UNIQUEIDENTIFIER NULL REFERENCES FormVersions(id),
    status            NVARCHAR(20) NOT NULL DEFAULT 'pending',
    content           NVARCHAR(MAX) NOT NULL,
    note              NVARCHAR(MAX) NULL,
    reviewNote        NVARCHAR(MAX) NULL,
    reviewedByUserId  UNIQUEIDENTIFIER NULL REFERENCES Users(id),
    submittedAt       DATETIMEOFFSET(7) DEFAULT SYSDATETIMEOFFSET(),
    reviewedAt        DATETIMEOFFSET(7) NULL,
    publishedAt       DATETIMEOFFSET(7) NULL
);
CREATE INDEX IX_FormContributions_formId ON FormContributions(formId);
CREATE INDEX IX_FormContributions_submittedByUserId ON FormContributions(submittedByUserId);
CREATE INDEX IX_FormContributions_status ON FormContributions(status);

-- Owned by either an Upload (Excel-authored) or a FormVersion (builder-authored) —
-- exactly one of uploadId/formVersionId is set, enforced by the CHECK constraint
-- below (Forms/FormVersions are declared further down this file).
CREATE TABLE GeneratedFiles (
    id            UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    uploadId      UNIQUEIDENTIFIER NULL REFERENCES Uploads(id),
    formVersionId UNIQUEIDENTIFIER NULL CONSTRAINT FK_GeneratedFiles_formVersionId REFERENCES FormVersions(id),
    fileName      NVARCHAR(255) NOT NULL,
    filePath      NVARCHAR(2000) NOT NULL,
    fileType      NVARCHAR(20) NOT NULL,
    createdAt     DATETIMEOFFSET(7) DEFAULT SYSDATETIMEOFFSET(),
    CONSTRAINT CK_GeneratedFiles_owner CHECK (
        (uploadId IS NOT NULL AND formVersionId IS NULL) OR (uploadId IS NULL AND formVersionId IS NOT NULL)
    )
);
CREATE INDEX IX_GeneratedFiles_uploadId ON GeneratedFiles(uploadId);
CREATE INDEX IX_GeneratedFiles_formVersionId ON GeneratedFiles(formVersionId);

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
    startDate DATE NULL,
    endDate   DATE NULL,
    createdAt DATETIMEOFFSET(7) DEFAULT SYSDATETIMEOFFSET()
);

-- The admin-managed picklist behind the upload form's "Subsidiary" dropdown
-- and the user-creation form's subsidiary scoping. isActive blocks *every*
-- project for it in one step (independent of, and layered above,
-- SubsidiaryProjectBlocks below, which scopes a restriction to one project
-- code); deleting the row is the permanent alternative to disabling it.
CREATE TABLE Subsidiaries (
    id        UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name      NVARCHAR(100) NOT NULL UNIQUE,
    isActive  BIT NOT NULL DEFAULT 1,
    createdAt DATETIMEOFFSET(7) DEFAULT SYSDATETIMEOFFSET()
);

-- A specific (subsidiary, project code) pair blocked from new uploads — e.g.
-- closing "F2H26" for "SGE" only, while every other subsidiary can still
-- upload it. Row presence *is* the block (see uploadService.createUpload's
-- assertNotBlocked); independent of, and layered on top of, ProjectCodes.isOpen.
CREATE TABLE SubsidiaryProjectBlocks (
    id             UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    subsidiaryName NVARCHAR(100) NOT NULL,
    projectCode    NVARCHAR(100) NOT NULL,
    createdAt      DATETIMEOFFSET(7) DEFAULT SYSDATETIMEOFFSET()
);
CREATE UNIQUE INDEX UQ_SubsidiaryProjectBlocks_pair ON SubsidiaryProjectBlocks(subsidiaryName, projectCode);

-- One QA automation run (admin-triggered, Playwright-driven) against one
-- generated form variant of one upload — see qaRunService.ts. status starts
-- 'pending', flips to 'running', lands on 'passed'/'failed' (test outcome) or
-- 'error' (the run itself couldn't complete).
CREATE TABLE QaRuns (
    id                UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    uploadId          UNIQUEIDENTIFIER NOT NULL REFERENCES Uploads(id),
    variant           NVARCHAR(10) NOT NULL,
    status            NVARCHAR(20) NOT NULL DEFAULT 'pending',
    triggeredByUserId UNIQUEIDENTIFIER NOT NULL REFERENCES Users(id),
    totalTests        INT NOT NULL DEFAULT 0,
    passedTests       INT NOT NULL DEFAULT 0,
    failedTests       INT NOT NULL DEFAULT 0,
    errorMessage      NVARCHAR(MAX) NULL,
    reportPath        NVARCHAR(2000) NULL,
    createdAt         DATETIMEOFFSET(7) DEFAULT SYSDATETIMEOFFSET(),
    startedAt         DATETIMEOFFSET(7) NULL,
    completedAt       DATETIMEOFFSET(7) NULL
);
CREATE INDEX IX_QaRuns_uploadId ON QaRuns(uploadId);

-- One individual assertion within a QaRun — fieldId (when set) is the
-- generated form's own DOM id for the field the check concerns, which is
-- what lets the admin dashboard answer "which fields should be fixed".
CREATE TABLE QaTestCaseResults (
    id        UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    qaRunId   UNIQUEIDENTIFIER NOT NULL REFERENCES QaRuns(id),
    category  NVARCHAR(40) NOT NULL,
    name      NVARCHAR(255) NOT NULL,
    status    NVARCHAR(10) NOT NULL,
    fieldId   NVARCHAR(100) NULL,
    message   NVARCHAR(2000) NULL,
    createdAt DATETIMEOFFSET(7) DEFAULT SYSDATETIMEOFFSET()
);
CREATE INDEX IX_QaTestCaseResults_qaRunId ON QaTestCaseResults(qaRunId);

-- Admin-configurable toggle read by the submit endpoint to decide whether
-- submitting an upload locks that version's generated files against further
-- regeneration/re-upload.
INSERT INTO AdminSettings ([key], value) VALUES ('lockGeneratedFilesOnSubmit', 'true');
