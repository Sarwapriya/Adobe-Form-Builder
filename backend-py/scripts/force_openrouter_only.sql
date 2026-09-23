-- Deterministically forces OpenRouter to be the only enabled provider,
-- regardless of how many other rows (Groq, duplicates, etc.) have
-- accumulated in the table via the admin UI. Disables everything else by
-- name rather than relying on anyone's UI toggle having actually persisted.
UPDATE fq.AiProviders SET isEnabled = 0 WHERE name <> 'OpenRout';
UPDATE fq.AiProviders SET isEnabled = 1 WHERE name = 'OpenRout';
GO

-- Verify: exactly one row should show isEnabled = 1, and apiKeyEncLen should
-- be a large number (a real encrypted key) -- 0 or NULL means the OpenRouter
-- row has no usable key and will be silently skipped even though enabled.
SELECT id, name, model, isEnabled, sortOrder, LEN(apiKeyEnc) AS apiKeyEncLen
FROM fq.AiProviders
ORDER BY sortOrder, createdAt;
GO
