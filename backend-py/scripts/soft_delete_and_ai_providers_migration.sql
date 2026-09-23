-- Schema changes for two features. Idempotent: safe to run any number of times,
-- each step is skipped once already applied. Nothing here drops or rewrites
-- existing data.
--
--   1. Soft delete. "Delete" on a user / subsidiary / subsidiary locale no
--      longer removes the row — it sets isDeleted = 1 (and deletedAt). Forms
--      already had isDeleted.
--   2. Multiple "other" AI providers. New fq.AiProviders table (any
--      OpenAI-compatible endpoint, each with its own name). The single Groq
--      entry that used to live in fq.AdminSettings (groqApiKeyEnc / groqModel /
--      groqEnabled) is copied into it as a provider named "Groq". The old
--      AdminSettings rows are left in place, unused.
--
-- Run with, e.g.:
--   sqlcmd -S <server> -d <database> -E -i soft_delete_and_ai_providers_migration.sql
-- (use -U/-P instead of -E for SQL authentication). Back up first if the
-- database holds real data.

-- ---------------------------------------------------------------------------
-- 1. Soft-delete columns
-- ---------------------------------------------------------------------------

IF COL_LENGTH('fq.Users', 'isDeleted') IS NULL
    ALTER TABLE fq.Users ADD isDeleted BIT NOT NULL CONSTRAINT DF_Users_isDeleted DEFAULT 0;
GO
IF COL_LENGTH('fq.Users', 'deletedAt') IS NULL
    ALTER TABLE fq.Users ADD deletedAt DATETIMEOFFSET NULL;
GO

IF COL_LENGTH('fq.Subsidiaries', 'isDeleted') IS NULL
    ALTER TABLE fq.Subsidiaries ADD isDeleted BIT NOT NULL CONSTRAINT DF_Subsidiaries_isDeleted DEFAULT 0;
GO
IF COL_LENGTH('fq.Subsidiaries', 'deletedAt') IS NULL
    ALTER TABLE fq.Subsidiaries ADD deletedAt DATETIMEOFFSET NULL;
GO

IF COL_LENGTH('fq.SubsidiaryLocales', 'isDeleted') IS NULL
    ALTER TABLE fq.SubsidiaryLocales ADD isDeleted BIT NOT NULL CONSTRAINT DF_SubsidiaryLocales_isDeleted DEFAULT 0;
GO
IF COL_LENGTH('fq.SubsidiaryLocales', 'deletedAt') IS NULL
    ALTER TABLE fq.SubsidiaryLocales ADD deletedAt DATETIMEOFFSET NULL;
GO

-- ---------------------------------------------------------------------------
-- 2. Other AI providers
-- ---------------------------------------------------------------------------

IF OBJECT_ID('fq.AiProviders', 'U') IS NULL
BEGIN
    CREATE TABLE fq.AiProviders (
        id          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AiProviders PRIMARY KEY CONSTRAINT DF_AiProviders_id DEFAULT NEWID(),
        name        NVARCHAR(100)    NOT NULL,
        baseUrl     NVARCHAR(500)    NOT NULL,
        model       NVARCHAR(200)    NOT NULL,
        apiKeyEnc   NVARCHAR(MAX)    NOT NULL,
        isEnabled   BIT              NOT NULL CONSTRAINT DF_AiProviders_isEnabled DEFAULT 1,
        sortOrder   INT              NOT NULL CONSTRAINT DF_AiProviders_sortOrder DEFAULT 0,
        createdAt   DATETIMEOFFSET   NOT NULL CONSTRAINT DF_AiProviders_createdAt DEFAULT SYSDATETIMEOFFSET()
    );
END
GO

-- Carry the existing Groq fallback over (only while the table is still empty, so
-- re-running never duplicates it or resurrects a provider you've since changed).
IF NOT EXISTS (SELECT 1 FROM fq.AiProviders)
   AND EXISTS (SELECT 1 FROM fq.AdminSettings WHERE [key] = 'groqApiKeyEnc' AND LEN([value]) > 0)
BEGIN
    INSERT INTO fq.AiProviders (name, baseUrl, model, apiKeyEnc, isEnabled, sortOrder)
    SELECT
        N'Groq',
        N'https://api.groq.com/openai/v1',
        COALESCE(NULLIF((SELECT [value] FROM fq.AdminSettings WHERE [key] = 'groqModel'), N''), N'openai/gpt-oss-120b'),
        (SELECT [value] FROM fq.AdminSettings WHERE [key] = 'groqApiKeyEnc'),
        CASE WHEN (SELECT [value] FROM fq.AdminSettings WHERE [key] = 'groqEnabled') = N'false' THEN 0 ELSE 1 END,
        0;
END
GO

-- Verify
SELECT 'Users.isDeleted' AS [check], CASE WHEN COL_LENGTH('fq.Users', 'isDeleted') IS NOT NULL THEN 'ok' ELSE 'MISSING' END AS result
UNION ALL SELECT 'Subsidiaries.isDeleted', CASE WHEN COL_LENGTH('fq.Subsidiaries', 'isDeleted') IS NOT NULL THEN 'ok' ELSE 'MISSING' END
UNION ALL SELECT 'SubsidiaryLocales.isDeleted', CASE WHEN COL_LENGTH('fq.SubsidiaryLocales', 'isDeleted') IS NOT NULL THEN 'ok' ELSE 'MISSING' END
UNION ALL SELECT 'AiProviders table', CASE WHEN OBJECT_ID('fq.AiProviders', 'U') IS NOT NULL THEN 'ok' ELSE 'MISSING' END
UNION ALL SELECT 'AiProviders rows', CAST((SELECT COUNT(*) FROM fq.AiProviders) AS VARCHAR(20));
GO
