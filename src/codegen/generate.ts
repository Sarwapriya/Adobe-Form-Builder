import type { FormDefinition } from "../schema";
import { buildIndexHtml } from "./html/buildIndexHtml";
import { buildStyleCss } from "./css/buildStyleCss";
import { buildAppJs } from "./js/buildAppJs";
import { buildFormJs } from "./js/buildFormJs";

export interface GeneratedFile {
  path: string;
  content: string;
}

// Pure: same FormDefinition in -> byte-identical files out. No DOM access,
// no downloads — those side effects live in zipAndDownload.ts, one layer up.
export function generateSolution(form: FormDefinition): GeneratedFile[] {
  return [
    { path: "index.html", content: buildIndexHtml(form) },
    { path: "css/style.css", content: buildStyleCss() },
    { path: "js/app.js", content: buildAppJs(form) },
    { path: "js/form.js", content: buildFormJs() },
  ];
}
