-- New fq.FormTemplates table — reusable, saved form-builder configurations
-- a new campaign can be started from (Template Management). Additive only:
-- no existing table is altered. Idempotent: safe to run any number of times.
--
-- Run with, e.g.:
--   sqlcmd -S <server> -d <database> -E -i form_templates_migration.sql

IF OBJECT_ID('fq.FormTemplates', 'U') IS NULL
BEGIN
    CREATE TABLE fq.FormTemplates (
        id               UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_FormTemplates PRIMARY KEY CONSTRAINT DF_FormTemplates_id DEFAULT NEWID(),
        name             NVARCHAR(200)    NOT NULL,
        description      NVARCHAR(2000)   NULL,
        category         NVARCHAR(100)    NULL,
        definitionJson   NVARCHAR(MAX)    NOT NULL,
        configJson       NVARCHAR(MAX)    NOT NULL,
        scope            NVARCHAR(20)     NOT NULL CONSTRAINT DF_FormTemplates_scope DEFAULT 'USER',
        subsidiaryName   NVARCHAR(100)    NULL,
        createdByUserId  UNIQUEIDENTIFIER NOT NULL,
        updatedByUserId  UNIQUEIDENTIFIER NULL,
        createdAt        DATETIMEOFFSET   NOT NULL CONSTRAINT DF_FormTemplates_createdAt DEFAULT SYSDATETIMEOFFSET(),
        updatedAt        DATETIMEOFFSET   NOT NULL CONSTRAINT DF_FormTemplates_updatedAt DEFAULT SYSDATETIMEOFFSET(),
        isDeleted        BIT              NOT NULL CONSTRAINT DF_FormTemplates_isDeleted DEFAULT 0
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_FormTemplates_scope' AND object_id = OBJECT_ID('fq.FormTemplates'))
    CREATE INDEX IX_FormTemplates_scope ON fq.FormTemplates (scope);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_FormTemplates_subsidiaryName' AND object_id = OBJECT_ID('fq.FormTemplates'))
    CREATE INDEX IX_FormTemplates_subsidiaryName ON fq.FormTemplates (subsidiaryName);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_FormTemplates_createdByUserId' AND object_id = OBJECT_ID('fq.FormTemplates'))
    CREATE INDEX IX_FormTemplates_createdByUserId ON fq.FormTemplates (createdByUserId);
GO

-- Verify
SELECT 'FormTemplates table' AS [check], CASE WHEN OBJECT_ID('fq.FormTemplates', 'U') IS NOT NULL THEN 'ok' ELSE 'MISSING' END AS result
UNION ALL SELECT 'FormTemplates rows', CAST((SELECT COUNT(*) FROM fq.FormTemplates) AS VARCHAR(20));
GO
