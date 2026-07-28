import type { FieldType, ValidationType } from "../schema";

export type InputTag = "input" | "textarea" | "select" | "none";

export interface FieldTypeDescriptor {
  type: FieldType;
  displayName: string;
  inputTag: InputTag;
  inputType?: string;
  supportsOptions: boolean;
  supportsPlaceholder: boolean;
  supportsRequired: boolean;
  supportsConditions: boolean;
  availableValidations: ValidationType[];
  isStructural: boolean; // heading/paragraph: no value, not part of submitted data
}
