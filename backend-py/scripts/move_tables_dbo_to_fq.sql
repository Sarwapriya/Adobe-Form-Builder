-- One-time migration: move every application table from [dbo] to a new [fq]
-- schema (FormIQ), to match the app's rebrand. ALTER SCHEMA ... TRANSFER only
-- reassigns which schema owns the table — it does not touch, copy, or lock
-- out any rows, so this is safe to run against a live database with real data
-- and completes almost instantly regardless of table size.
--
-- Idempotent: safe to re-run — each TRANSFER is guarded so it's skipped once
-- the table is already in [fq].
--
-- Run with, e.g.:
--   sqlcmd -S JANITHA-PC\SQLEXPRESS -d Adobe-FC -E -i move_tables_dbo_to_fq.sql

IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'fq')
BEGIN
    EXEC('CREATE SCHEMA [fq]');
END
GO

DECLARE @tables TABLE (name sysname);
INSERT INTO @tables (name) VALUES
    ('AdminSettings'),
    ('AIActions'),
    ('AIConversationMessages'),
    ('AIConversations'),
    ('EmailLogs'),
    ('FabrixModels'),
    ('FormContributions'),
    ('Forms'),
    ('FormVersions'),
    ('GeneratedFiles'),
    ('migrations'),
    ('OtherAiModels'),
    ('ProjectCodes'),
    ('QaRuns'),
    ('QaTestCaseResults'),
    ('QuestionMasterVersions'),
    ('RefreshTokens'),
    ('Subsidiaries'),
    ('SubsidiaryLocales'),
    ('SubsidiaryProjectBlocks'),
    ('Uploads'),
    ('Users');

DECLARE @name sysname, @sql nvarchar(max);
DECLARE cur CURSOR LOCAL FOR SELECT name FROM @tables;
OPEN cur;
FETCH NEXT FROM cur INTO @name;
WHILE @@FETCH_STATUS = 0
BEGIN
    IF EXISTS (
        SELECT 1 FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id
        WHERE s.name = 'dbo' AND t.name = @name
    )
    BEGIN
        SET @sql = N'ALTER SCHEMA [fq] TRANSFER [dbo].[' + @name + N']';
        PRINT @sql;
        EXEC sp_executesql @sql;
    END
    ELSE
    BEGIN
        PRINT '-- skipped (not in dbo, already moved or missing): ' + @name;
    END
    FETCH NEXT FROM cur INTO @name;
END
CLOSE cur;
DEALLOCATE cur;
GO

-- Verify: every one of the 22 tables should now report schema 'fq'.
SELECT s.name AS [schema], t.name AS [table]
FROM sys.tables t
JOIN sys.schemas s ON t.schema_id = s.schema_id
WHERE t.name IN (
    'AdminSettings','AIActions','AIConversationMessages','AIConversations','EmailLogs',
    'FabrixModels','FormContributions','Forms','FormVersions','GeneratedFiles','migrations',
    'OtherAiModels','ProjectCodes','QaRuns','QaTestCaseResults','QuestionMasterVersions',
    'RefreshTokens','Subsidiaries','SubsidiaryLocales','SubsidiaryProjectBlocks','Uploads','Users'
)
ORDER BY t.name;
