-- fq.RefreshTokens.replacedByTokenHash: lets a refresh token that was
-- revoked BY A ROTATION be redeemed once more within a short grace window
-- (two browser tabs racing to refresh the same session at once — e.g.
-- opening the Edit Files window next to an already-open form editor tab —
-- no longer logs the loser out). A token revoked by logout/deactivation
-- leaves this column NULL and is never eligible, regardless of timing. See
-- app/models/refresh_token.py and app/services/auth_service.rotate_refresh_token.
-- Idempotent: safe to run any number of times.
--
--   python scripts/run_sql_file.py scripts/refresh_token_grace_migration.sql

IF COL_LENGTH('fq.RefreshTokens', 'replacedByTokenHash') IS NULL
    ALTER TABLE fq.RefreshTokens ADD replacedByTokenHash NVARCHAR(128) NULL;
GO
