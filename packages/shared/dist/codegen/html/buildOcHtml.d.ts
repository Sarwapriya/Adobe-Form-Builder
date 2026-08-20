import type { FormDefinition, LocaleInfo } from "../../form/formDefinition";
import type { FileNames } from "../fileNames";
import type { BuilderConfig, GeneratedFile } from "../types";
export declare function buildOcHtml(form: FormDefinition, config: BuilderConfig, fileNames: FileNames, targetLocale?: LocaleInfo): GeneratedFile;
