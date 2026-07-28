import { useFormStore } from "../../store/formStore";
import { FIELD_REGISTRY } from "../../fieldRegistry";
import { CommonPropsEditor } from "./CommonPropsEditor";
import { OptionsEditor } from "./OptionsEditor";
import { ValidationEditor } from "./ValidationEditor";
import { ConditionEditor } from "./ConditionEditor";

export function PropertyPanel() {
  const fields = useFormStore((s) => s.fields);
  const selectedFieldId = useFormStore((s) => s.selectedFieldId);
  const field = fields.find((f) => f.id === selectedFieldId);

  if (!field) {
    return (
      <div className="property-panel empty">
        <p>Select a field to edit its properties.</p>
      </div>
    );
  }

  const descriptor = FIELD_REGISTRY[field.type];

  return (
    <div className="property-panel">
      <h3>{descriptor.displayName} properties</h3>
      <CommonPropsEditor field={field} />
      {descriptor.supportsOptions && <OptionsEditor field={field} />}
      {descriptor.availableValidations.length > 0 && <ValidationEditor field={field} />}
      {descriptor.supportsConditions && <ConditionEditor field={field} />}
    </div>
  );
}
