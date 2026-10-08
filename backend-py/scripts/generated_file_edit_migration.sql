-- fq.GeneratedFiles.editedAt / editedByUserId: set once an admin hand-edits
-- a published form's generated file content from the Edit Files window (see
-- app/models/generated_file.py, form_builder_service.update_generated_file_content).
-- Null for every file that's never been touched there. Idempotent: safe to
-- run any number of times.
--
--   python scripts/run_sql_file.py scripts/generated_file_edit_migration.sql

IF COL_LENGTH('fq.GeneratedFiles', 'editedAt') IS NULL
    ALTER TABLE fq.GeneratedFiles ADD editedAt DATETIMEOFFSET NULL;
GO

IF COL_LENGTH('fq.GeneratedFiles', 'editedByUserId') IS NULL
    ALTER TABLE fq.GeneratedFiles ADD editedByUserId UNIQUEIDENTIFIER NULL;
GO

-- Verify
SELECT 'GeneratedFiles.editedAt column' AS [check], CASE WHEN COL_LENGTH('fq.GeneratedFiles', 'editedAt') IS NOT NULL THEN 'ok' ELSE 'MISSING' END AS result
UNION ALL
SELECT 'GeneratedFiles.editedByUserId column', CASE WHEN COL_LENGTH('fq.GeneratedFiles', 'editedByUserId') IS NOT NULL THEN 'ok' ELSE 'MISSING' END;
GO
