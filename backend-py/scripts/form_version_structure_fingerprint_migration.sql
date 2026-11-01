-- fq.FormVersions.structureFingerprint: a digest of "which question ids
-- exist, which optional profile fields are present" at the point a
-- version's generated files were last fully (re)generated — see
-- app/models/form_version.py and
-- form_builder_service.compute_structure_fingerprint/publish_form. Null for
-- every existing row (their files were generated before this column
-- existed) -- publish_form treats a null fingerprint as "nothing to compare
-- against yet", so no hand-edit conflict is ever reported for a version
-- that predates this column. Idempotent: safe to run any number of times.
--
--   python scripts/run_sql_file.py scripts/form_version_structure_fingerprint_migration.sql

IF COL_LENGTH('fq.FormVersions', 'structureFingerprint') IS NULL
    ALTER TABLE fq.FormVersions ADD structureFingerprint NVARCHAR(1000) NULL;
GO
