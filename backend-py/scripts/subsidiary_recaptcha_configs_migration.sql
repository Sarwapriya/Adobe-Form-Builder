-- New fq.SubsidiaryRecaptchaConfigs table (subsidiaryName -> Google reCAPTCHA
-- v2 site key) so the form builder can toggle reCAPTCHA on for a campaign
-- without a user typing/guessing a site key. No seed data here (unlike
-- subsidiary_privacy_links_migration.sql) -- site keys are added one at a
-- time by an admin via Configuration > Access & Locales as each subsidiary
-- signs up with Google. Idempotent: safe to run any number of times.
--
-- Run with, e.g.:
--   sqlcmd -S <server> -d <database> -E -i subsidiary_recaptcha_configs_migration.sql

IF OBJECT_ID('fq.SubsidiaryRecaptchaConfigs', 'U') IS NULL
BEGIN
    CREATE TABLE fq.SubsidiaryRecaptchaConfigs (
        id             UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_SubsidiaryRecaptchaConfigs PRIMARY KEY CONSTRAINT DF_SubsidiaryRecaptchaConfigs_id DEFAULT NEWID(),
        subsidiaryName NVARCHAR(100)    NOT NULL,
        siteKey        NVARCHAR(200)    NOT NULL,
        createdAt      DATETIMEOFFSET   NOT NULL CONSTRAINT DF_SubsidiaryRecaptchaConfigs_createdAt DEFAULT SYSDATETIMEOFFSET(),
        CONSTRAINT UQ_SubsidiaryRecaptchaConfigs_subsidiaryName UNIQUE (subsidiaryName)
    );
END
GO

-- Verify
SELECT 'SubsidiaryRecaptchaConfigs table' AS [check], CASE WHEN OBJECT_ID('fq.SubsidiaryRecaptchaConfigs', 'U') IS NOT NULL THEN 'ok' ELSE 'MISSING' END AS result
UNION ALL SELECT 'SubsidiaryRecaptchaConfigs rows', CAST((SELECT COUNT(*) FROM fq.SubsidiaryRecaptchaConfigs) AS VARCHAR(20));
GO
