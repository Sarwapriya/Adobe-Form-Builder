-- New fq.ResourceChecks / fq.ResourceCheckResults tables: availability checks
-- of a published form's files on the Adobe Campaign MENA frontal servers,
-- run automatically after each SFTP deploy (and on demand). See
-- app/models/resource_check.py and app/services/resource_check_service.py.
-- Idempotent: safe to run any number of times.
--
-- Run BEFORE starting the backend that includes the availability checks:
--   python scripts/run_sql_file.py scripts/resource_checks_migration.sql

IF OBJECT_ID('fq.ResourceChecks', 'U') IS NULL
BEGIN
    CREATE TABLE fq.ResourceChecks (
        id                UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_ResourceChecks PRIMARY KEY CONSTRAINT DF_ResourceChecks_id DEFAULT NEWID(),
        formId            UNIQUEIDENTIFIER NOT NULL,
        formVersionId     UNIQUEIDENTIFIER NOT NULL,
        [trigger]         NVARCHAR(20)     NOT NULL,
        status            NVARCHAR(20)     NOT NULL CONSTRAINT DF_ResourceChecks_status DEFAULT 'scheduled',
        scheduledFor      DATETIMEOFFSET   NOT NULL,
        startedAt         DATETIMEOFFSET   NULL,
        completedAt       DATETIMEOFFSET   NULL,
        fileNames         NVARCHAR(MAX)    NOT NULL,
        hosts             NVARCHAR(MAX)    NOT NULL,
        totalUrls         INT              NOT NULL CONSTRAINT DF_ResourceChecks_totalUrls DEFAULT 0,
        okUrls            INT              NOT NULL CONSTRAINT DF_ResourceChecks_okUrls DEFAULT 0,
        failedUrls        INT              NOT NULL CONSTRAINT DF_ResourceChecks_failedUrls DEFAULT 0,
        triggeredByUserId UNIQUEIDENTIFIER NULL,
        errorMessage      NVARCHAR(2000)   NULL,
        notifiedAt        DATETIMEOFFSET   NULL,
        createdAt         DATETIMEOFFSET   NOT NULL CONSTRAINT DF_ResourceChecks_createdAt DEFAULT SYSDATETIMEOFFSET()
    );
    CREATE INDEX IX_ResourceChecks_form ON fq.ResourceChecks (formId, createdAt);
    CREATE INDEX IX_ResourceChecks_due ON fq.ResourceChecks (status, scheduledFor);
END
GO

IF OBJECT_ID('fq.ResourceCheckResults', 'U') IS NULL
BEGIN
    CREATE TABLE fq.ResourceCheckResults (
        id         UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_ResourceCheckResults PRIMARY KEY CONSTRAINT DF_ResourceCheckResults_id DEFAULT NEWID(),
        checkId    UNIQUEIDENTIFIER NOT NULL,
        fileName   NVARCHAR(260)    NOT NULL,
        host       NVARCHAR(255)    NOT NULL,
        url        NVARCHAR(1000)   NOT NULL,
        statusCode INT              NULL,
        ok         BIT              NOT NULL CONSTRAINT DF_ResourceCheckResults_ok DEFAULT 0,
        elapsedMs  FLOAT            NULL,
        error      NVARCHAR(500)    NULL
    );
    CREATE INDEX IX_ResourceCheckResults_check ON fq.ResourceCheckResults (checkId);
END
GO

-- Verify
SELECT 'ResourceChecks table' AS [check], CASE WHEN OBJECT_ID('fq.ResourceChecks', 'U') IS NOT NULL THEN 'ok' ELSE 'MISSING' END AS result
UNION ALL
SELECT 'ResourceCheckResults table', CASE WHEN OBJECT_ID('fq.ResourceCheckResults', 'U') IS NOT NULL THEN 'ok' ELSE 'MISSING' END;
GO
