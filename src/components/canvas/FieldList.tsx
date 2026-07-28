import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useFormStore } from "../../store/formStore";
import { FieldListItem } from "./FieldListItem";

export function FieldList() {
  const fields = useFormStore((s) => s.fields);
  const reorderFields = useFormStore((s) => s.reorderFields);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderFields(String(active.id), String(over.id));
    }
  }

  if (fields.length === 0) {
    return (
      <div className="field-list empty">
        <p>No fields yet. Add one from the palette on the left.</p>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
        <div className="field-list">
          {fields.map((field) => (
            <FieldListItem key={field.id} field={field} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
