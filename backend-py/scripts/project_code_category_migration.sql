-- fq.ProjectCodes.category: "adhoc" (default, open to subsidiary self-service
-- campaigns — same behavior every project code had before this column
-- existed) or "handRaiser" (reserved for HR Form Initiator/admin-authored
-- campaigns). See app/models/project_code.py and
-- app/services/project_code_service.py's assert_project_code_open
-- (exclude_hand_raiser). Idempotent: safe to run any number of times.
--
-- Run BEFORE starting a backend that includes this feature:
--   python scripts/run_sql_file.py scripts/project_code_category_migration.sql

IF COL_LENGTH('fq.ProjectCodes', 'category') IS NULL
    ALTER TABLE fq.ProjectCodes ADD category NVARCHAR(20) NOT NULL CONSTRAINT DF_ProjectCodes_category DEFAULT 'adhoc';
GO

-- Verify
SELECT 'ProjectCodes.category column' AS [check], CASE WHEN COL_LENGTH('fq.ProjectCodes', 'category') IS NOT NULL THEN 'ok' ELSE 'MISSING' END AS result;
GO
