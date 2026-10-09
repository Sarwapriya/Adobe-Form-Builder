-- fq.Subsidiaries.reportSuiteId: Adobe Analytics Report Suite ID for that
-- subsidiary's traffic, injected into every published form's data file
-- (param.analytics.reportSuiteID) at publish time — see
-- app/models/subsidiary.py and form_builder_service.publish_form.
-- Idempotent: safe to run any number of times.
--
--   python scripts/run_sql_file.py scripts/subsidiary_report_suite_id_migration.sql

IF COL_LENGTH('fq.Subsidiaries', 'reportSuiteId') IS NULL
    ALTER TABLE fq.Subsidiaries ADD reportSuiteId NVARCHAR(100) NULL;
GO

-- Known report suite IDs, by subsidiary name. Only sets a row that's
-- currently NULL, so it never overwrites a value an admin already set by
-- hand. SESAR/SEPAK/SEMAG/SELV/SEIL/SEEG/IRAN match this system's existing
-- subsidiary names exactly; "UAE" and "TR" from the source list did not
-- match any existing subsidiary name (this system has "SGE" and "SETK"
-- instead) so those two are deliberately left out here rather than guessed
-- — see the "UAE"/"TR" mapping and set SGE/SETK's reportSuiteId by hand
-- (Configuration > Subsidiaries) once confirmed.
UPDATE fq.Subsidiaries SET reportSuiteId = 'sssamsung4sa' WHERE name = 'SESAR' AND reportSuiteId IS NULL;
UPDATE fq.Subsidiaries SET reportSuiteId = 'sssamsung4pk' WHERE name = 'SEPAK' AND reportSuiteId IS NULL;
UPDATE fq.Subsidiaries SET reportSuiteId = 'sssamsung4ma' WHERE name = 'SEMAG' AND reportSuiteId IS NULL;
UPDATE fq.Subsidiaries SET reportSuiteId = 'sssamsung4levant' WHERE name = 'SELV' AND reportSuiteId IS NULL;
UPDATE fq.Subsidiaries SET reportSuiteId = 'sssamsung4il' WHERE name = 'SEIL' AND reportSuiteId IS NULL;
UPDATE fq.Subsidiaries SET reportSuiteId = 'sssamsung4eg' WHERE name = 'SEEG' AND reportSuiteId IS NULL;
UPDATE fq.Subsidiaries SET reportSuiteId = 'ssamsung4iran' WHERE name = 'IRAN' AND reportSuiteId IS NULL;
GO

-- Verify
SELECT name, reportSuiteId FROM fq.Subsidiaries WHERE isDeleted = 0 ORDER BY name;
GO
