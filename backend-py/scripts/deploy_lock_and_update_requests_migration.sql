-- Two additions supporting the "subsidiary user can't edit a form once it's
-- actually been deployed to Adobe" feature:
--   1. fq.Forms.lastDeployedVersionId/lastDeployedAt -- which FormVersion (if
--      any) was actually successfully pushed over SFTP, and when. Distinct
--      from publishedVersionId/status, which flip at Publish/Approve time,
--      well before any SFTP activity -- see form_builder_service.deploy_form
--      and is_edit_locked_post_deploy.
--   2. fq.FormUpdateRequests -- a subsidiary user's request to edit a form
--      that's currently locked this way (or an ad-hoc form that's simply
--      already published), reviewed by an admin -- see
--      form_update_request_service.py.
-- Idempotent: safe to run any number of times.
--
--   python scripts/run_sql_file.py scripts/deploy_lock_and_update_requests_migration.sql

IF COL_LENGTH('fq.Forms', 'lastDeployedVersionId') IS NULL
    ALTER TABLE fq.Forms ADD lastDeployedVersionId UNIQUEIDENTIFIER NULL;
GO

IF COL_LENGTH('fq.Forms', 'lastDeployedAt') IS NULL
    ALTER TABLE fq.Forms ADD lastDeployedAt DATETIMEOFFSET NULL;
GO

IF OBJECT_ID('fq.FormUpdateRequests', 'U') IS NULL
BEGIN
    CREATE TABLE fq.FormUpdateRequests (
        id                UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_FormUpdateRequests PRIMARY KEY CONSTRAINT DF_FormUpdateRequests_id DEFAULT NEWID(),
        formId            UNIQUEIDENTIFIER NOT NULL,
        subsidiaryId      NVARCHAR(50)     NOT NULL,
        requestedByUserId UNIQUEIDENTIFIER NOT NULL,
        status            NVARCHAR(20)     NOT NULL CONSTRAINT DF_FormUpdateRequests_status DEFAULT 'pending',
        note              NVARCHAR(MAX)    NULL,
        reviewNote        NVARCHAR(MAX)    NULL,
        reviewedByUserId  UNIQUEIDENTIFIER NULL,
        requestedAt       DATETIMEOFFSET   NOT NULL CONSTRAINT DF_FormUpdateRequests_requestedAt DEFAULT SYSDATETIMEOFFSET(),
        reviewedAt        DATETIMEOFFSET   NULL,
        consumedAt        DATETIMEOFFSET   NULL
    );
    CREATE INDEX IX_FormUpdateRequests_formId_subsidiaryId ON fq.FormUpdateRequests (formId, subsidiaryId);
END
GO

-- Verify
SELECT 'Forms.lastDeployedVersionId' AS [check], CASE WHEN COL_LENGTH('fq.Forms', 'lastDeployedVersionId') IS NOT NULL THEN 'ok' ELSE 'MISSING' END AS result
UNION ALL SELECT 'Forms.lastDeployedAt', CASE WHEN COL_LENGTH('fq.Forms', 'lastDeployedAt') IS NOT NULL THEN 'ok' ELSE 'MISSING' END
UNION ALL SELECT 'FormUpdateRequests table', CASE WHEN OBJECT_ID('fq.FormUpdateRequests', 'U') IS NOT NULL THEN 'ok' ELSE 'MISSING' END
UNION ALL SELECT 'FormUpdateRequests rows', CAST((SELECT COUNT(*) FROM fq.FormUpdateRequests) AS VARCHAR(20));
GO
