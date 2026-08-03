-- Canonical schema for the FormBuilder backend (Azure SQL / SQL Server).
-- This is the source of truth; src/migrations mirrors it for `typeorm migration:run`.
-- Apply manually (sqlcmd / Azure Data Studio) before first boot. The app never
-- runs `synchronize: true` against this database.

CREATE TABLE Uploads (
    id               UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    subsidiaryId     NVARCHAR(50) NOT NULL,
    fileName         NVARCHAR(255) NOT NULL,
    filePath         NVARCHAR(2000) NOT NULL,
    uploadDate       DATETIMEOFFSET(7) DEFAULT SYSDATETIMEOFFSET(),
    submissionCount INT DEFAULT 0
);

CREATE TABLE AdminSettings (
    [key]   NVARCHAR(50) PRIMARY KEY,
    value   NVARCHAR(255) NOT NULL
);
