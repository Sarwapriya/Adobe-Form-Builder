-- New fq.SubsidiaryPrivacyLinks table (subsidiaryName + localeCode -> real
-- Privacy Policy URL) plus a seed of the URLs already known, so the form
-- builder can auto-fill the Privacy Policy consent's Link URL instead of a
-- user typing/guessing it. Idempotent: safe to run any number of times —
-- the seed only inserts a (subsidiary, locale) pair that isn't already
-- present, so any URL an admin has since edited via Configuration is left
-- alone.
--
-- Run with, e.g.:
--   sqlcmd -S <server> -d <database> -E -i subsidiary_privacy_links_migration.sql

IF OBJECT_ID('fq.SubsidiaryPrivacyLinks', 'U') IS NULL
BEGIN
    CREATE TABLE fq.SubsidiaryPrivacyLinks (
        id             UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_SubsidiaryPrivacyLinks PRIMARY KEY CONSTRAINT DF_SubsidiaryPrivacyLinks_id DEFAULT NEWID(),
        subsidiaryName NVARCHAR(100)    NOT NULL,
        localeCode     NVARCHAR(20)     NOT NULL,
        url            NVARCHAR(500)    NOT NULL,
        createdAt      DATETIMEOFFSET   NOT NULL CONSTRAINT DF_SubsidiaryPrivacyLinks_createdAt DEFAULT SYSDATETIMEOFFSET(),
        CONSTRAINT UQ_SubsidiaryPrivacyLinks_pair UNIQUE (subsidiaryName, localeCode)
    );
END
GO

MERGE fq.SubsidiaryPrivacyLinks AS target
USING (VALUES
    (N'SGE',   N'ar_AE', N'https://www.samsung.com/ae_ar/info/privacy/'),
    (N'SGE',   N'en_AE', N'https://www.samsung.com/ae/info/privacy/'),
    (N'SETK',  N'tr_TR', N'https://www.samsung.com/tr/info/privacy/'),
    (N'SEPAK', N'en_PK', N'https://www.samsung.com/pk/info/privacy/'),
    (N'SEMAG', N'fr_MA', N'https://www.samsung.com/n_africa/info/privacy/'),
    (N'SELV',  N'en_JO', N'https://www.samsung.com/levant/info/privacy/'),
    (N'SELV',  N'en_LB', N'https://www.samsung.com/lb/info/privacy/'),
    (N'SELV',  N'ar_JO', N'https://www.samsung.com/levant_ar/info/privacy/'),
    (N'SELV',  N'ar_IQ', N'https://www.samsung.com/iq_ar/info/privacy/'),
    (N'SELV',  N'ku_IQ', N'https://www.samsung.com/iq_ku/info/privacy/'),
    (N'SEIL',  N'he_IL', N'https://www.samsung.com/il/info/privacy/'),
    (N'SEIL',  N'ar_PS', N'https://www.samsung.com/ps/info/privacy/'),
    (N'SEEG',  N'ar_EG', N'https://www.samsung.com/eg/info/privacy/'),
    (N'SEEG',  N'en_EG', N'https://www.samsung.com/eg/info/privacy/')
) AS seed (subsidiaryName, localeCode, url)
ON target.subsidiaryName = seed.subsidiaryName AND target.localeCode = seed.localeCode
WHEN NOT MATCHED THEN
    INSERT (subsidiaryName, localeCode, url) VALUES (seed.subsidiaryName, seed.localeCode, seed.url);
GO

-- Verify
SELECT 'SubsidiaryPrivacyLinks table' AS [check], CASE WHEN OBJECT_ID('fq.SubsidiaryPrivacyLinks', 'U') IS NOT NULL THEN 'ok' ELSE 'MISSING' END AS result
UNION ALL SELECT 'SubsidiaryPrivacyLinks rows', CAST((SELECT COUNT(*) FROM fq.SubsidiaryPrivacyLinks) AS VARCHAR(20));
GO
