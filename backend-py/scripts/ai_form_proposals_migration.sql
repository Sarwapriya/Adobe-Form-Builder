-- New fq.AIFormProposals table: validated form drafts proposed by the AI
-- chatbot, and the one-time approval token (hashed) the user's explicit
-- "Approve & Save" click issues for exactly one of them. See
-- app/models/ai_form_proposal.py and app/services/ai_proposal_service.py.
-- Idempotent: safe to run any number of times.
--
-- Run BEFORE starting the backend that includes the chatbot proposal flow:
--   python scripts/run_sql_file.py scripts/ai_form_proposals_migration.sql

IF OBJECT_ID('fq.AIFormProposals', 'U') IS NULL
BEGIN
    CREATE TABLE fq.AIFormProposals (
        id                UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AIFormProposals PRIMARY KEY CONSTRAINT DF_AIFormProposals_id DEFAULT NEWID(),
        conversationId    UNIQUEIDENTIFIER NOT NULL,
        userId            UNIQUEIDENTIFIER NOT NULL,
        subsidiaryId      NVARCHAR(50)     NOT NULL,
        version           INT              NOT NULL,
        proposalJson      NVARCHAR(MAX)    NOT NULL,
        contentHash       NVARCHAR(64)     NOT NULL,
        approvalTokenHash NVARCHAR(64)     NULL,
        approvalExpiresAt DATETIMEOFFSET   NULL,
        approvedAt        DATETIMEOFFSET   NULL,
        consumedAt        DATETIMEOFFSET   NULL,
        savedFormId       UNIQUEIDENTIFIER NULL,
        createdAt         DATETIMEOFFSET   NOT NULL CONSTRAINT DF_AIFormProposals_createdAt DEFAULT SYSDATETIMEOFFSET()
    );
    CREATE INDEX IX_AIFormProposals_conversation ON fq.AIFormProposals (conversationId, version);
END
GO

-- Verify
SELECT 'AIFormProposals table' AS [check], CASE WHEN OBJECT_ID('fq.AIFormProposals', 'U') IS NOT NULL THEN 'ok' ELSE 'MISSING' END AS result;
GO
