import type { FormDefinition } from "../../form/formDefinition.ts";
import type { BuilderConfig, GeneratedFile } from "../types.ts";
import { renderPage } from "./pageTemplate.ts";

export function buildOcHtml(form: FormDefinition, config: BuilderConfig): GeneratedFile {
  return { path: "oc.html", contents: renderPage(form, config, "oc") };
}
