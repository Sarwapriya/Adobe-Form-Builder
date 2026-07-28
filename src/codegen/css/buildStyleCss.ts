// Static, form-agnostic stylesheet. Uses logical properties (margin-inline-start,
// text-align: start, etc.) instead of left/right so RTL locales need zero CSS changes.
export function buildStyleCss(): string {
  return `:root {
  --fb-text: #1f2430;
  --fb-muted: #6b7280;
  --fb-border: #d1d5db;
  --fb-accent: #2563eb;
  --fb-error: #dc2626;
  --fb-bg: #ffffff;
  --fb-surface: #f9fafb;
  font-size: 16px;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  color: var(--fb-text);
  background: var(--fb-surface);
}

.app-shell {
  max-width: 720px;
  margin-inline: auto;
  padding: 2rem 1.25rem 4rem;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-block-end: 1.5rem;
  flex-wrap: wrap;
}

.app-header h1 {
  margin: 0 0 0.25rem;
  font-size: 1.5rem;
}

.app-header p {
  margin: 0;
  color: var(--fb-muted);
}

.language-switcher-label {
  display: flex;
  flex-direction: column;
  font-size: 0.8rem;
  color: var(--fb-muted);
  gap: 0.25rem;
}

.language-switcher-label select {
  padding: 0.35rem 0.5rem;
  border-radius: 6px;
  border: 1px solid var(--fb-border);
}

#the-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: var(--fb-bg);
  border: 1px solid var(--fb-border);
  border-radius: 12px;
  padding: 1.5rem;
}

#form-root {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.field-row {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  width: 100%;
}

.field-row[hidden] {
  display: none;
}

.field-row.width-half {
  width: calc(50% - 0.5rem);
}

.field-row.width-third {
  width: calc(33.333% - 0.667rem);
}

@media (max-width: 560px) {
  .field-row.width-half,
  .field-row.width-third {
    width: 100%;
  }
}

.field-label {
  font-weight: 600;
  font-size: 0.9rem;
  text-align: start;
}

.required-marker {
  color: var(--fb-error);
  margin-inline-start: 0.15rem;
}

.field-heading {
  width: 100%;
  margin: 0.5rem 0 0;
}

.field-paragraph {
  width: 100%;
  color: var(--fb-muted);
  margin: 0;
}

input[type="text"],
input[type="email"],
input[type="number"],
textarea,
select {
  width: 100%;
  padding: 0.55rem 0.65rem;
  border: 1px solid var(--fb-border);
  border-radius: 8px;
  font: inherit;
  background: var(--fb-bg);
  color: var(--fb-text);
}

textarea {
  min-height: 5rem;
  resize: vertical;
}

input:disabled,
textarea:disabled,
select:disabled {
  background: var(--fb-surface);
  color: var(--fb-muted);
}

.options-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.option-row,
.checkbox-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 400;
}

.field-help {
  margin: 0;
  font-size: 0.8rem;
  color: var(--fb-muted);
}

.field-error {
  margin: 0;
  font-size: 0.8rem;
  color: var(--fb-error);
  min-height: 1em;
}

.submit-button {
  align-self: flex-start;
  padding: 0.65rem 1.5rem;
  border: none;
  border-radius: 8px;
  background: var(--fb-accent);
  color: #fff;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.submit-button:hover {
  filter: brightness(1.05);
}

.success-panel {
  margin-block-start: 1.25rem;
  padding: 1rem 1.25rem;
  border-radius: 10px;
  background: #ecfdf5;
  border: 1px solid #34d399;
  color: #065f46;
}

[dir="rtl"] .required-marker {
  margin-inline-start: 0.15rem;
  margin-inline-end: 0;
}
`;
}
