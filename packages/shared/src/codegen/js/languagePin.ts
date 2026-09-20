/**
 * The line each language's behavior JS starts with, before the byte-identical reference
 * script. The shared data file's `param.fallbackLanguage` is the *form-wide* default
 * locale; the reference script resolves its active language as
 * `frameUrlParam.get("lang") || param["fallbackLanguage"]`, so pinning this language's
 * own code there makes each language's page render in its own language by default while
 * leaving `?lang=<localeCode>` free to switch it. Kept out of the reference script itself
 * (which must stay byte-identical — see buildFfJs.ts) by being a separate leading block.
 */
export function languagePin(locale: string): string {
  return (
    `// This page's own language — the data file's fallbackLanguage is the form-wide default.\n` +
    `// A ?lang=<localeCode> URL parameter still overrides it.\n` +
    `param["fallbackLanguage"] = ${JSON.stringify(locale)};\n\n`
  );
}
