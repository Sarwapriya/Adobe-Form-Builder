<<<<<<< HEAD
// Static, form-agnostic stylesheet. Uses logical properties (margin-inline-start,
// text-align: start, etc.) instead of left/right so RTL locales need zero CSS changes.
export function buildStyleCss(): string {
  return `:root {
  --fb-text: #1f2430;
  --fb-muted: #6b7280;
  --fb-border: #d1d5db;
  --fb-accent: #2563eb;
=======
// Structural/markup conventions ported from the Samsung SGE campaign reference
// (Final_forms_format/EN-F2H26.css): .container / .top_cont / .form_top_group /
// .form_text_bx / .form_check_group / .form_check_module / .radio_wrap / .star, etc.
// Kept dependency-free: no external fonts, images, or CDN assets (the reference's
// custom font-face, popup/modal, and PNG-based checkbox/clear-button styling were
// dropped in favor of system fonts and CSS-only equivalents, e.g. accent-color).
export function buildStyleCss(): string {
  return `:root {
  --fb-text: #1f2430;
  --fb-muted: #555555;
  --fb-border: #d1d5db;
  --fb-accent: #2189ff;
  --fb-star: #006bea;
>>>>>>> 569474c (update project)
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

<<<<<<< HEAD
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
=======
.container {
  margin: 0 auto;
  max-width: 1160px;
  padding: 2rem 1.25rem 4rem;
  width: 95%;
}

.top_cont {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-block-end: 1.5rem;
}

.top_cont h1 {
  margin: 0;
  font-size: 1.75rem;
}

.top_cont p {
  margin: 0;
  color: var(--fb-muted);
  font-size: 0.85rem;
}

.star {
  color: var(--fb-star);
  margin-inline-start: 0.15rem;
}

.main {
  margin-block-start: 2rem;
>>>>>>> 569474c (update project)
}

#the-form {
  display: flex;
  flex-direction: column;
<<<<<<< HEAD
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
=======
  gap: 3rem;
}

.form_top_group {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form_text_group {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.form_text_bx {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  font-size: 0.85rem;
  width: 100%;
}

.form_text_bx[hidden] {
  display: none;
}

.form_text_bx.width-half {
  width: calc(50% - 0.5rem);
}

.form_text_bx.width-third {
  width: calc(33.333% - 0.667rem);
}

.form_label {
  color: var(--fb-muted);
  font-weight: 600;
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 400;
  font-size: 0.85rem;
}

.checkbox-row input {
  accent-color: var(--fb-accent);
  cursor: pointer;
  height: 20px;
  width: 20px;
  flex-shrink: 0;
}

.select_wrap,
.input_wrap {
  position: relative;
  width: 100%;
}

.phone-field-row {
  display: flex;
  gap: 0.5rem;
}

.phone-field-row .select_wrap {
  width: auto;
  flex: 0 0 auto;
}

.phone-field-row .input_wrap {
  flex: 1;
}

input[type="text"],
input[type="email"],
input[type="number"],
input[type="tel"],
textarea,
select {
  width: 100%;
  padding: 0.55rem 0.65rem;
  border: none;
  border-bottom: 1px solid var(--fb-muted);
  font: inherit;
  background: transparent;
  color: var(--fb-text);
}

textarea {
  min-height: 5rem;
  resize: vertical;
  border: 1px solid var(--fb-border);
  border-radius: 8px;
}

input:disabled,
textarea:disabled,
select:disabled {
  color: var(--fb-muted);
  opacity: 0.6;
}

.form_check_group {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.form_check_module {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form_check_module[hidden] {
  display: none;
}

.form_check_title {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.form_check_title h3 {
  margin: 0;
  font-size: 1.15rem;
}

.form_check_title p {
  margin: 0;
  font-size: 0.8rem;
  color: var(--fb-muted);
}

.radio_group,
.form_check_list_wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.radio_wrap,
.form_check_list {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.radio_wrap input,
.form_check_list input {
  accent-color: var(--fb-accent);
  cursor: pointer;
  height: 22px;
  width: 22px;
  flex-shrink: 0;
}

.radio_wrap label,
.form_check_list label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  cursor: pointer;
}

.form_check_list img {
  height: 48px;
  width: 48px;
  object-fit: contain;
>>>>>>> 569474c (update project)
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

<<<<<<< HEAD
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

=======
>>>>>>> 569474c (update project)
.field-help {
  margin: 0;
  font-size: 0.8rem;
  color: var(--fb-muted);
}

<<<<<<< HEAD
.field-error {
=======
.error {
>>>>>>> 569474c (update project)
  margin: 0;
  font-size: 0.8rem;
  color: var(--fb-error);
  min-height: 1em;
}

<<<<<<< HEAD
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
=======
.form_bottom_group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1rem;
}

.submit-button {
  align-items: center;
  background-color: #000;
  border-radius: 50px;
  border: none;
  color: #fff;
  cursor: pointer;
  display: flex;
  font: inherit;
  font-weight: 700;
  height: 40px;
  justify-content: center;
  padding: 0 1.5rem;
}

.submit-button:hover {
  background-color: #fff;
  border: 1px solid #000;
  color: #000;
>>>>>>> 569474c (update project)
}

.success-panel {
  margin-block-start: 1.25rem;
  padding: 1rem 1.25rem;
  border-radius: 10px;
  background: #ecfdf5;
  border: 1px solid #34d399;
  color: #065f46;
}

<<<<<<< HEAD
[dir="rtl"] .required-marker {
=======
.language-switcher-label {
  display: flex;
  flex-direction: column;
  font-size: 0.8rem;
  color: var(--fb-muted);
  gap: 0.25rem;
}

@media screen and (max-width: 767px) {
  .container {
    padding: 0 1.5rem 3rem;
  }

  .form_top_group,
  .form_check_group {
    gap: 2rem;
  }

  .form_text_group {
    flex-direction: column;
  }

  .form_text_bx.width-half,
  .form_text_bx.width-third {
    width: 100%;
  }

  .radio_group,
  .form_check_list_wrap {
    flex-direction: column;
    gap: 1rem;
  }
}

[dir="rtl"] .star {
>>>>>>> 569474c (update project)
  margin-inline-start: 0.15rem;
  margin-inline-end: 0;
}
`;
}
