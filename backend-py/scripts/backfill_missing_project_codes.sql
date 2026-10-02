-- fq.ProjectCodes is the admin-managed "picklist" Configuration > Campaign -
-- Project Code shows — but Form.projectCode is a plain text snapshot, not a
-- foreign key into it (see ProjectCode entity's own doc comment), so a form
-- can be using a project code that was never actually added as a row here
-- (e.g. set directly, or carried over from before this admin feature
-- existed). This backfills exactly those: every distinct Form.projectCode in
-- use by a real (non-deleted) form that has no matching fq.ProjectCodes row
-- gets one created — open, unlocked, category "adhoc" by default (re-category
-- any of these to "handRaiser" afterward from Configuration if needed).
-- Idempotent: safe to run any number of times, only ever inserts what's
-- still missing.
--
--   python scripts/run_sql_file.py scripts/backfill_missing_project_codes.sql

-- What's about to be inserted (for visibility in the run output)
SELECT DISTINCT f.projectCode AS missingCode
FROM fq.Forms f
WHERE f.projectCode IS NOT NULL AND f.isDeleted = 0
  AND NOT EXISTS (SELECT 1 FROM fq.ProjectCodes pc WHERE pc.code = f.projectCode);
GO

INSERT INTO fq.ProjectCodes (id, code, isOpen, isLocked, category, createdAt)
SELECT DISTINCT NEWID(), f.projectCode, 1, 0, 'adhoc', SYSDATETIMEOFFSET()
FROM fq.Forms f
WHERE f.projectCode IS NOT NULL AND f.isDeleted = 0
  AND NOT EXISTS (SELECT 1 FROM fq.ProjectCodes pc WHERE pc.code = f.projectCode);
GO

-- Verify — should be 0 remaining
SELECT 'Remaining Form.projectCode values with no ProjectCodes row' AS [check],
       (SELECT COUNT(DISTINCT f.projectCode) FROM fq.Forms f
        WHERE f.projectCode IS NOT NULL AND f.isDeleted = 0
          AND NOT EXISTS (SELECT 1 FROM fq.ProjectCodes pc WHERE pc.code = f.projectCode)) AS result;
GO
