-- Read-only diagnostic: shows the exact fq.AiProviders rows the AI assistant
-- actually sees, in the same fallback order aiProviderService.py uses. Run
-- this whenever the admin UI's Enabled toggle doesn't seem to be taking
-- effect -- it will immediately reveal a duplicate row (e.g. two rows named
-- "Groq", one disabled and one still enabled) or a toggle that silently
-- didn't persist, without relying on the UI at all.
SELECT id, name, baseUrl, model, isEnabled, sortOrder, createdAt
FROM fq.AiProviders
ORDER BY sortOrder ASC, createdAt ASC;
GO
