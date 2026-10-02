-- fq.ProjectCodes.category: "adhoc" (default, open to subsidiary self-service
-- campaigns — same behavior every project code had before this column
-- existed) or "handRaiser" (reserved for HR Form Initiator/admin-authored
-- campaigns). See app/models/project_code.py and
-- app/services/project_code_service.py's assert_project_code_open
-- (exclude_hand_raiser). Also categorizes the existing F1H26/F2H26/TV2H26
-- codes as "handRaiser" (every other existing code keeps the "adhoc"
-- default). Idempotent: safe to run any number of times.
--
-- Run BEFORE starting a backend that includes this feature:
--   python scripts/run_sql_file.py scripts/project_code_category_migration.sql

IF COL_LENGTH('fq.ProjectCodes', 'category') IS NULL
    ALTER TABLE fq.ProjectCodes ADD category NVARCHAR(20) NOT NULL CONSTRAINT DF_ProjectCodes_category DEFAULT 'adhoc';
GO

-- Existing real campaign codes that should be Hand-Raiser-only (admin/HR
-- Form Initiator) going forward — everything else already defaults to
-- "adhoc" and needs no change. Safe to re-run: a no-op once already set.
UPDATE fq.ProjectCodes SET category = 'handRaiser' WHERE code IN ('F1H26', 'F2H26', 'TV2H26');
GO

-- Verify
SELECT 'ProjectCodes.category column' AS [check], CASE WHEN COL_LENGTH('fq.ProjectCodes', 'category') IS NOT NULL THEN 'ok' ELSE 'MISSING' END AS result
UNION ALL
SELECT 'F1H26/F2H26/TV2H26 categorized handRaiser',
       CASE WHEN (SELECT COUNT(*) FROM fq.ProjectCodes WHERE code IN ('F1H26', 'F2H26', 'TV2H26') AND category <> 'handRaiser') = 0
            THEN 'ok' ELSE 'MISSING' END;
GO
