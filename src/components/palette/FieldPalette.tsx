import { FIELD_REGISTRY, FIELD_TYPES_IN_PALETTE_ORDER } from "../../fieldRegistry";
import { useFormStore } from "../../store/formStore";

export function FieldPalette() {
  const addField = useFormStore((s) => s.addField);

  return (
    <div className="field-palette">
      <h3>Add Field</h3>
      <div className="palette-grid">
        {FIELD_TYPES_IN_PALETTE_ORDER.map((type) => (
          <button key={type} type="button" className="palette-button" onClick={() => addField(type)}>
            {FIELD_REGISTRY[type].displayName}
          </button>
        ))}
      </div>
    </div>
  );
}
