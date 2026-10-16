-- fq.Subsidiaries gains three logo-related columns: logoAssetPath,
-- logoSource ("upload" | "generated"), logoVersion (a content hash used to
-- cache-bust the frontend's <img src>). See app/models/subsidiary.py and
-- app/services/subsidiary_logo_service.py. Idempotent: safe to run any
-- number of times.
--
--   python scripts/run_sql_file.py scripts/subsidiary_logo_columns_migration.sql

IF COL_LENGTH('fq.Subsidiaries', 'logoAssetPath') IS NULL
    ALTER TABLE fq.Subsidiaries ADD logoAssetPath NVARCHAR(255) NULL;
GO

IF COL_LENGTH('fq.Subsidiaries', 'logoSource') IS NULL
    ALTER TABLE fq.Subsidiaries ADD logoSource NVARCHAR(20) NULL CONSTRAINT DF_Subsidiaries_logoSource DEFAULT 'upload';
GO

IF COL_LENGTH('fq.Subsidiaries', 'logoVersion') IS NULL
    ALTER TABLE fq.Subsidiaries ADD logoVersion NVARCHAR(32) NULL;
GO

-- Point the nine originally-supplied subsidiaries at their committed PNG
-- badges (backend-py/app/static/subsidiary-logos/<name>.png, served at
-- /static/subsidiary-logos/<name>.png). Only fills rows that are currently
-- NULL, so it never overwrites an admin's later change (e.g. after they
-- click "Regenerate logo", which sets logoSource='generated' instead).
UPDATE fq.Subsidiaries
SET logoAssetPath = '/static/subsidiary-logos/' + name + '.png',
    logoSource = 'upload'
WHERE name IN ('SESAR', 'SGE', 'SETK', 'SEPAK', 'IRAN', 'SEIL', 'SEEG', 'SEMAG', 'SELV')
  AND logoAssetPath IS NULL;
GO

-- Verify
SELECT name, logoSource, logoAssetPath FROM fq.Subsidiaries WHERE isDeleted = 0 ORDER BY name;
GO
