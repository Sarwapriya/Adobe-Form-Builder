import type { FieldDefinition, FieldType } from "../schema";
import { newId } from "../utils/id";
import { FIELD_REGISTRY } from "./index";

export function createDefaultField(type: FieldType, order: number): FieldDefinition {
  const descriptor = FIELD_REGISTRY[type];
  const id = newId("field");
  const base: FieldDefinition = {
    id,
    type,
    name: `${type}_${id.slice(-6)}`,
    label: { en: descriptor.displayName },
    required: false,
    width: "full",
    order,
<<<<<<< HEAD
=======
    group: "profile",
>>>>>>> 569474c (update project)
    validations: [],
    conditions: [],
  };

  if (descriptor.supportsPlaceholder) {
    base.placeholder = { en: "" };
  }

  if (descriptor.supportsOptions) {
    base.options = [
      { id: newId("opt"), value: "option1", label: { en: "Option 1" } },
      { id: newId("opt"), value: "option2", label: { en: "Option 2" } },
    ];
  }

  return base;
}
