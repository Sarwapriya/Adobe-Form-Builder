import type { FormDefinition, LocaleCode } from "../../form/formDefinition";
import { languageFileNames, type FileNames } from "../fileNames";
import type { BuilderConfig, GeneratedFile } from "../types";
import { renderPage } from "./pageTemplate";

/** The Full Form page for one language (the form's default language when `locale` is omitted). */
export function buildFfHtml(form: FormDefinition, config: BuilderConfig, fileNames: FileNames, locale?: LocaleCode): GeneratedFile {
  return { path: languageFileNames(fileNames, locale).ffHtml, contents: renderPage(form, config, "ff", fileNames, locale) };
}
