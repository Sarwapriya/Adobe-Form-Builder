import type { FormDefinition } from "../../schema";
import { defaultLocaleOf, resolveLocalizedText } from "../../schema";

export function buildIndexHtml(form: FormDefinition): string {
  const defaultLocale = defaultLocaleOf(form.locales);
  const title = resolveLocalizedText(form.metadata.title, defaultLocale.code, defaultLocale.code) || "Form";

  return `<!doctype html>
<html lang="${defaultLocale.code}" dir="${defaultLocale.direction}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<link rel="stylesheet" href="css/style.css">
</head>
<body>
<div class="app-shell">
  <header class="app-header">
    <div class="app-header-text">
      <h1 id="form-title"></h1>
      <p id="form-description"></p>
    </div>
    <label class="language-switcher-label">
      <span>Language</span>
      <select id="language-switcher"></select>
    </label>
  </header>

  <form id="the-form" novalidate>
    <div id="form-root"></div>
    <button type="submit" id="submit-button" class="submit-button"></button>
  </form>

  <div id="success-panel" class="success-panel" hidden></div>
</div>

<script src="js/app.js" defer></script>
<script src="js/form.js" defer></script>
</body>
</html>
`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);
}
