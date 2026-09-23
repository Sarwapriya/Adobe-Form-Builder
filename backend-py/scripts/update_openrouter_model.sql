-- One-off: point the existing "OpenRout" provider row at a different
-- OpenRouter model. Safe to run directly -- `model` is stored in plain text
-- (unlike apiKeyEnc, which must go through app/security/secret_cipher.py and
-- can't be set via raw SQL).
UPDATE fq.AiProviders
SET model = 'google/gemma-4-26b-a4b-it:free'
WHERE name = 'OpenRout';
GO

-- Verify
SELECT id, name, model, isEnabled, sortOrder FROM fq.AiProviders;
GO
