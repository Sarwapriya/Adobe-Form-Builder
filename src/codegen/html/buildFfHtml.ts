import type { FormDefinition } from "../../form/formDefinition.ts";
import type { FileNames } from "../fileNames.ts";
import type { BuilderConfig, GeneratedFile } from "../types.ts";
import { renderPage } from "./pageTemplate.ts";

export function buildFfHtml(form: FormDefinition, config: BuilderConfig, fileNames: FileNames): GeneratedFile {
  return { path: fileNames.ffHtml, contents: renderPage(form, config, "ff", fileNames) };
}
