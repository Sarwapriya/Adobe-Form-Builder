-- Read-only check of the live fq.ProjectCodes table and how it compares to
-- the project codes real (non-deleted) forms are actually using. Safe to run
-- any number of times against any environment — makes no changes.
--
--   python scripts/run_sql_file.py scripts/check_project_codes.sql

SELECT 'category column on fq.ProjectCodes' AS [check],
       CASE WHEN COL_LENGTH('fq.ProjectCodes', 'category') IS NOT NULL THEN 'present' ELSE 'MISSING' END AS result;
GO

-- Every row currently in the admin-managed picklist (SELECT * so this works
-- whether or not the category column exists yet)
SELECT * FROM fq.ProjectCodes ORDER BY code;
GO

-- Every project code real forms are actually using
SELECT projectCode, COUNT(*) AS formCount
FROM fq.Forms
WHERE projectCode IS NOT NULL AND isDeleted = 0
GROUP BY projectCode
ORDER BY projectCode;
GO

-- Forms using a project code with no matching fq.ProjectCodes row (what
-- backfill_missing_project_codes.sql would insert)
SELECT DISTINCT f.projectCode AS missingCode
FROM fq.Forms f
WHERE f.projectCode IS NOT NULL AND f.isDeleted = 0
  AND NOT EXISTS (SELECT 1 FROM fq.ProjectCodes pc WHERE pc.code = f.projectCode);
GO
