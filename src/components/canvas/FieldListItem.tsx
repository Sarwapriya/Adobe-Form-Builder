import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { FieldDefinition } from "../../schema";
import { defaultLocaleOf, resolveLocalizedText } from "../../schema";
import { FIELD_REGISTRY } from "../../fieldRegistry";
import { useFormStore } from "../../store/formStore";

interface Props {
  field: FieldDefinition;
}

export function FieldListItem({ field }: Props) {
  const locales = useFormStore((s) => s.locales);
  const selectedFieldId = useFormStore((s) => s.selectedFieldId);
  const selectField = useFormStore((s) => s.selectField);
  const removeField = useFormStore((s) => s.removeField);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const defaultLocale = defaultLocaleOf(locales).code;
  const label = resolveLocalizedText(field.label, defaultLocale, defaultLocale) || FIELD_REGISTRY[field.type].displayName;
  const isSelected = selectedFieldId === field.id;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={"field-list-item" + (isSelected ? " selected" : "")}
      onClick={() => selectField(field.id)}
    >
      <button type="button" className="drag-handle" aria-label="Reorder field" {...attributes} {...listeners}>
        ⠿
      </button>
      <div className="field-list-item-body">
        <span className="field-type-tag">{FIELD_REGISTRY[field.type].displayName}</span>
        <span className="field-label-preview">{label}</span>
      </div>
      <button
        type="button"
        className="delete-field-button"
        aria-label="Delete field"
        onClick={(e) => {
          e.stopPropagation();
          removeField(field.id);
        }}
      >
        ✕
      </button>
    </div>
  );
}
