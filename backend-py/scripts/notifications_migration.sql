-- New fq.Notifications table: in-app notifications, one row per recipient
-- per event, mirroring the same events/recipients email_service.py already
-- sends emails for. See app/models/notification.py and
-- app/services/notification_service.py. Idempotent: safe to run any number
-- of times.
--
-- Run BEFORE starting the backend that includes the notification bell:
--   python scripts/run_sql_file.py scripts/notifications_migration.sql

IF OBJECT_ID('fq.Notifications', 'U') IS NULL
BEGIN
    CREATE TABLE fq.Notifications (
        id        UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Notifications PRIMARY KEY CONSTRAINT DF_Notifications_id DEFAULT NEWID(),
        userId    UNIQUEIDENTIFIER NOT NULL,
        [type]    NVARCHAR(50)     NOT NULL,
        title     NVARCHAR(200)    NOT NULL,
        message   NVARCHAR(MAX)    NOT NULL,
        link      NVARCHAR(500)    NULL,
        isRead    BIT              NOT NULL CONSTRAINT DF_Notifications_isRead DEFAULT 0,
        createdAt DATETIMEOFFSET   NOT NULL CONSTRAINT DF_Notifications_createdAt DEFAULT SYSDATETIMEOFFSET()
    );
    CREATE INDEX IX_Notifications_user ON fq.Notifications (userId, createdAt DESC);
    CREATE INDEX IX_Notifications_user_unread ON fq.Notifications (userId, isRead);
END
GO
