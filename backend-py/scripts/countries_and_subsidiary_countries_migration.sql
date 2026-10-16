-- New fq.Countries and fq.SubsidiaryCountries tables — the admin-managed
-- country picklist and its many-to-many assignment to subsidiaries, driving
-- both the "assigned countries" display and the dynamic circular
-- flag-composite logo generator (app/services/subsidiary_logo_service.py).
-- Additive only: no existing table is altered. Idempotent: safe to run any
-- number of times — the CREATE TABLE/index guards never re-run once
-- satisfied, and the seed MERGE blocks below only insert a pairing that
-- doesn't already exist, so an admin who later removes a seeded pairing
-- (e.g. SGE no longer serving Kuwait) will NOT have it silently restored by
-- re-running this script. This script is meant to run once, against a
-- fresh/pre-feature database, the same as every other seed script here.
--
--   python scripts/run_sql_file.py scripts/countries_and_subsidiary_countries_migration.sql

IF OBJECT_ID('fq.Countries', 'U') IS NULL
BEGIN
    CREATE TABLE fq.Countries (
        id            UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Countries PRIMARY KEY CONSTRAINT DF_Countries_id DEFAULT NEWID(),
        isoCode       NVARCHAR(2)      NOT NULL,
        countryName   NVARCHAR(100)    NOT NULL,
        flagAssetPath NVARCHAR(255)    NULL,
        isActive      BIT              NOT NULL CONSTRAINT DF_Countries_isActive DEFAULT 1,
        createdAt     DATETIMEOFFSET   NOT NULL CONSTRAINT DF_Countries_createdAt DEFAULT SYSDATETIMEOFFSET(),
        updatedAt     DATETIMEOFFSET   NOT NULL CONSTRAINT DF_Countries_updatedAt DEFAULT SYSDATETIMEOFFSET(),
        CONSTRAINT UQ_Countries_isoCode UNIQUE (isoCode)
    );
END
GO

IF OBJECT_ID('fq.SubsidiaryCountries', 'U') IS NULL
BEGIN
    CREATE TABLE fq.SubsidiaryCountries (
        id           UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_SubsidiaryCountries PRIMARY KEY CONSTRAINT DF_SubsidiaryCountries_id DEFAULT NEWID(),
        subsidiaryId UNIQUEIDENTIFIER NOT NULL,
        countryId    UNIQUEIDENTIFIER NOT NULL,
        sortOrder    INT              NOT NULL CONSTRAINT DF_SubsidiaryCountries_sortOrder DEFAULT 0,
        createdAt    DATETIMEOFFSET   NOT NULL CONSTRAINT DF_SubsidiaryCountries_createdAt DEFAULT SYSDATETIMEOFFSET(),
        updatedAt    DATETIMEOFFSET   NOT NULL CONSTRAINT DF_SubsidiaryCountries_updatedAt DEFAULT SYSDATETIMEOFFSET(),
        CONSTRAINT UQ_SubsidiaryCountries_pair UNIQUE (subsidiaryId, countryId)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_SubsidiaryCountries_subsidiaryId' AND object_id = OBJECT_ID('fq.SubsidiaryCountries'))
    CREATE INDEX IX_SubsidiaryCountries_subsidiaryId ON fq.SubsidiaryCountries (subsidiaryId);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_SubsidiaryCountries_countryId' AND object_id = OBJECT_ID('fq.SubsidiaryCountries'))
    CREATE INDEX IX_SubsidiaryCountries_countryId ON fq.SubsidiaryCountries (countryId);
GO

-- Seed the 17 countries. MERGE on isoCode so re-running never duplicates and
-- never overwrites a name/flag path an admin has since edited.
MERGE fq.Countries AS target
USING (VALUES
    ('SA', N'Saudi Arabia',           '/api/v1/static/flags/sa.svg'),
    ('AE', N'United Arab Emirates',   '/api/v1/static/flags/ae.svg'),
    ('QA', N'Qatar',                  '/api/v1/static/flags/qa.svg'),
    ('OM', N'Oman',                   '/api/v1/static/flags/om.svg'),
    ('BH', N'Bahrain',                '/api/v1/static/flags/bh.svg'),
    ('KW', N'Kuwait',                 '/api/v1/static/flags/kw.svg'),
    ('TR', N'Turkey',                 '/api/v1/static/flags/tr.svg'),
    ('PK', N'Pakistan',               '/api/v1/static/flags/pk.svg'),
    ('IR', N'Iran',                   '/api/v1/static/flags/ir.svg'),
    ('IL', N'Israel',                 '/api/v1/static/flags/il.svg'),
    ('PS', N'Palestine',              '/api/v1/static/flags/ps.svg'),
    ('EG', N'Egypt',                  '/api/v1/static/flags/eg.svg'),
    ('MA', N'Morocco',                '/api/v1/static/flags/ma.svg'),
    ('TN', N'Tunisia',                '/api/v1/static/flags/tn.svg'),
    ('JO', N'Jordan',                 '/api/v1/static/flags/jo.svg'),
    ('IQ', N'Iraq',                   '/api/v1/static/flags/iq.svg'),
    ('LB', N'Lebanon',                '/api/v1/static/flags/lb.svg')
) AS src (isoCode, countryName, flagAssetPath)
ON target.isoCode = src.isoCode
WHEN NOT MATCHED THEN
    INSERT (isoCode, countryName, flagAssetPath) VALUES (src.isoCode, src.countryName, src.flagAssetPath);
GO

-- Corrects any rows a pre-fix run of this script already inserted with the
-- unreachable bare /static/... prefix (idempotent — a no-op once applied;
-- see app/main.py's static mount comment for why /api/v1/static is required).
UPDATE fq.Countries
SET flagAssetPath = '/api/v1' + flagAssetPath
WHERE flagAssetPath LIKE '/static/flags/%';
GO

-- Seed the 17 subsidiary-country pairings, sortOrder matching the spec's
-- listed order per subsidiary. Only inserts a pairing that doesn't already
-- exist for that (subsidiaryId, countryId) pair.
MERGE fq.SubsidiaryCountries AS target
USING (
    SELECT s.id AS subsidiaryId, c.id AS countryId, v.sortOrder
    FROM (VALUES
        ('SESAR', 'SA', 0),
        ('SGE',   'AE', 0),
        ('SGE',   'QA', 1),
        ('SGE',   'OM', 2),
        ('SGE',   'BH', 3),
        ('SGE',   'KW', 4),
        ('SETK',  'TR', 0),
        ('SEPAK', 'PK', 0),
        ('IRAN',  'IR', 0),
        ('SEIL',  'IL', 0),
        ('SEIL',  'PS', 1),
        ('SEEG',  'EG', 0),
        ('SEMAG', 'MA', 0),
        ('SEMAG', 'TN', 1),
        ('SELV',  'JO', 0),
        ('SELV',  'IQ', 1),
        ('SELV',  'LB', 2)
    ) AS v (subsidiaryName, isoCode, sortOrder)
    JOIN fq.Subsidiaries s ON s.name = v.subsidiaryName
    JOIN fq.Countries c ON c.isoCode = v.isoCode
) AS src
ON target.subsidiaryId = src.subsidiaryId AND target.countryId = src.countryId
WHEN NOT MATCHED THEN
    INSERT (subsidiaryId, countryId, sortOrder) VALUES (src.subsidiaryId, src.countryId, src.sortOrder);
GO

-- Verify
SELECT 'Countries table' AS [check], CASE WHEN OBJECT_ID('fq.Countries', 'U') IS NOT NULL THEN 'ok' ELSE 'MISSING' END AS result
UNION ALL SELECT 'SubsidiaryCountries table', CASE WHEN OBJECT_ID('fq.SubsidiaryCountries', 'U') IS NOT NULL THEN 'ok' ELSE 'MISSING' END
UNION ALL SELECT 'Countries rows', CAST((SELECT COUNT(*) FROM fq.Countries) AS VARCHAR(20))
UNION ALL SELECT 'SubsidiaryCountries rows', CAST((SELECT COUNT(*) FROM fq.SubsidiaryCountries) AS VARCHAR(20));
GO
