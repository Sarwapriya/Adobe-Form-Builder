import type { FormDefinition } from "../../form/formDefinition.ts";
import type { BuilderConfig, GeneratedFile } from "../types.ts";
import { renderPage } from "./pageTemplate.ts";

export function buildFfHtml(form: FormDefinition, config: BuilderConfig): GeneratedFile {
  return { path: "ff.html", contents: renderPage(form, config, "ff") };
}
