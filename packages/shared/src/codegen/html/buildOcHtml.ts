import type { FormDefinition } from "../../form/formDefinition";
import type { FileNames } from "../fileNames";
import type { BuilderConfig, GeneratedFile } from "../types";
import { renderPage } from "./pageTemplate";

export function buildOcHtml(form: FormDefinition, config: BuilderConfig, fileNames: FileNames): GeneratedFile {
  return { path: fileNames.ocHtml, contents: renderPage(form, config, "oc", fileNames) };
}
