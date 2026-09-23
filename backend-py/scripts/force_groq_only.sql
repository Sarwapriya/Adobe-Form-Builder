-- Makes Groq the AI assistant's only enabled "other" provider again (reverses
-- force_openrouter_only.sql). Matches Groq rows by their base URL host, not by
-- name, so an admin-renamed row ("Groq - team key", ...) still counts. Only a
-- Groq row that actually has an API key is enabled -- the key is encrypted by
-- app/security/secret_cipher.py and can't be set from raw SQL, so if no row
-- qualifies, add/fix Groq in Configuration > AI Assistant > Other AI Providers
-- (the "Groq" preset) and paste the key there, then re-run this.
-- Safe to re-run.
UPDATE fq.AiProviders SET isEnabled = 0
WHERE baseUrl NOT LIKE N'%api.groq.com%';

UPDATE fq.AiProviders SET isEnabled = 1, sortOrder = 0
WHERE baseUrl LIKE N'%api.groq.com%' AND LEN(apiKeyEnc) > 0;
GO

-- Verify: the Groq row(s) show isEnabled = 1 with a non-zero apiKeyEncLen;
-- every other row shows isEnabled = 0. No rows with isEnabled = 1 means there
-- is no Groq row with a key yet -- see the note at the top.
SELECT id, name, baseUrl, model, isEnabled, sortOrder, LEN(apiKeyEnc) AS apiKeyEncLen
FROM fq.AiProviders
ORDER BY sortOrder, createdAt;
GO
