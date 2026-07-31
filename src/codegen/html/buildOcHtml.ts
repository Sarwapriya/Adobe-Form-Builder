import type { FormDefinition } from "../../form/formDefinition.ts";
import type { FileNames } from "../fileNames.ts";
import type { BuilderConfig, GeneratedFile } from "../types.ts";
import { renderPage } from "./pageTemplate.ts";

export function buildOcHtml(form: FormDefinition, config: BuilderConfig, fileNames: FileNames): GeneratedFile {
  return { path: fileNames.ocHtml, contents: renderPage(form, config, "oc", fileNames) };
}
