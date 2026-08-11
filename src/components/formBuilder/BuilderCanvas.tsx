import { useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import type { ControlType, QuestionDefinition } from "@formbuilder/shared";
import { resolveLocalizedText } from "@formbuilder/shared";
import { useFormBuilderStore } from "../../store/formBuilderStore";
import { CONTROL_TYPE_LABEL, createQuestion, renumberQuestions } from "./formBuilderHelpers";

const ADD_QUESTION_TYPES: ControlType[] = ["shortText", "text", "dropdown", "radio", "checkbox"];

interface QuestionRowProps {
  question: QuestionDefinition;
  index: number;
  total: number;
  selected: boolean;
  onSelect: () => void;
  onMove: (delta: number) => void;
  onDelete: () => void;
}

function QuestionRow({ question, index, total, selected, onSelect, onMove, onDelete }: QuestionRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: question.id });
  const defaultLocale = useFormBuilderStore((s) => s.definition?.meta.defaultLocale ?? "en_GB");

  return (
    <Box
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 1.5,
        py: 1,
        borderRadius: 2,
        bgcolor: selected ? "rgba(20, 40, 160, 0.06)" : isDragging ? "rgba(20, 40, 160, 0.03)" : "transparent",
        border: "1px solid",
        borderColor: selected ? "primary.main" : "rgba(20, 22, 33, 0.08)",
        cursor: "pointer",
      }}
      onClick={onSelect}
    >
      <IconButton size="small" {...attributes} {...listeners} aria-label="Drag to reorder" sx={{ cursor: "grab" }}>
        <DragIndicatorIcon fontSize="small" />
      </IconButton>
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={600} noWrap>
          {question.id}. {resolveLocalizedText(question.headingByLocale, defaultLocale, defaultLocale) || "(no heading)"}
          {question.required && <span style={{ color: "#c00" }}> *</span>}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {CONTROL_TYPE_LABEL[question.controlType]}
          {question.answers.length > 0 ? ` · ${question.answers.length} option${question.answers.length === 1 ? "" : "s"}` : ""}
        </Typography>
      </Box>
      <Stack direction="row" spacing={0}>
        <IconButton
          size="small"
          aria-label="Move up"
          disabled={index === 0}
          onClick={(e) => {
            e.stopPropagation();
            onMove(-1);
          }}
        >
          <ArrowUpwardIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          aria-label="Move down"
          disabled={index === total - 1}
          onClick={(e) => {
            e.stopPropagation();
            onMove(1);
          }}
        >
          <ArrowDownwardIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          aria-label="Delete question"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Stack>
    </Box>
  );
}

/**
 * The drag-and-drop question list — the dnd-kit integration point. Reordering
 * is available three redundant ways (pointer drag, keyboard via the sortable
 * item's own keyboard sensor once it has focus, and the always-visible
 * up/down buttons), so drag-and-drop is never the *only* way to reorder —
 * satisfies the brief's accessibility requirement without relying on a user
 * discovering a non-obvious keyboard interaction.
 */
export function BuilderCanvas({
  selectedQuestionId,
  onSelectQuestion,
}: {
  selectedQuestionId: string | null;
  onSelectQuestion: (id: string | null) => void;
}) {
  const questions = useFormBuilderStore((s) => s.definition?.questions ?? []);
  const updateDefinition = useFormBuilderStore((s) => s.updateDefinition);
  const [addMenuAnchor, setAddMenuAnchor] = useState<HTMLElement | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function moveQuestion(fromIndex: number, delta: number) {
    const toIndex = fromIndex + delta;
    if (toIndex < 0 || toIndex >= questions.length) return;
    updateDefinition((d) => ({ ...d, questions: renumberQuestions(arrayMove(d.questions, fromIndex, toIndex)) }));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIndex = questions.findIndex((q) => q.id === active.id);
    const toIndex = questions.findIndex((q) => q.id === over.id);
    if (fromIndex === -1 || toIndex === -1) return;
    updateDefinition((d) => ({ ...d, questions: renumberQuestions(arrayMove(d.questions, fromIndex, toIndex)) }));
  }

  function handleAddQuestion(controlType: ControlType) {
    updateDefinition((d) => {
      const question = createQuestion(controlType, d.questions.length + 1);
      return { ...d, questions: [...d.questions, question] };
    });
    setAddMenuAnchor(null);
  }

  function handleDeleteQuestion(id: string) {
    if (!window.confirm("Remove this question?")) return;
    updateDefinition((d) => ({ ...d, questions: renumberQuestions(d.questions.filter((q) => q.id !== id)) }));
    if (selectedQuestionId === id) onSelectQuestion(null);
  }

  return (
    <Paper sx={{ p: 2, borderRadius: 3 }}>
      <Stack direction="row" alignItems="center" sx={{ mb: 1.5 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ flexGrow: 1 }}>
          Questions
        </Typography>
        <Button size="small" startIcon={<AddIcon />} onClick={(e) => setAddMenuAnchor(e.currentTarget)}>
          Add question
        </Button>
        <Menu anchorEl={addMenuAnchor} open={!!addMenuAnchor} onClose={() => setAddMenuAnchor(null)}>
          {ADD_QUESTION_TYPES.map((type) => (
            <MenuItem key={type} onClick={() => handleAddQuestion(type)}>
              {CONTROL_TYPE_LABEL[type]}
            </MenuItem>
          ))}
        </Menu>
      </Stack>

      {questions.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No questions yet — click "Add question" to add one.
        </Typography>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
            <Stack spacing={1}>
              {questions.map((q, i) => (
                <QuestionRow
                  key={q.id}
                  question={q}
                  index={i}
                  total={questions.length}
                  selected={selectedQuestionId === q.id}
                  onSelect={() => onSelectQuestion(q.id)}
                  onMove={(delta) => moveQuestion(i, delta)}
                  onDelete={() => handleDeleteQuestion(q.id)}
                />
              ))}
            </Stack>
          </SortableContext>
        </DndContext>
      )}
    </Paper>
  );
}

/** Presence toggles for the four predefined profile fields — these render in a
 * fixed area of the generated form (`.form_top_group`, always before the
 * question modules) rather than an interleavable position, so they're
 * add/remove toggles here rather than part of the draggable question list;
 * see renderProfileField.ts's own fixed field order. */
export function PredefinedFieldToggles({
  selectedField,
  onSelectField,
}: {
  selectedField: string | null;
  onSelectField: (field: string | null) => void;
}) {
  const fields = useFormBuilderStore((s) => s.definition?.fields);
  const updateDefinition = useFormBuilderStore((s) => s.updateDefinition);

  const items: Array<{ key: "firstName" | "lastName" | "email" | "mobileNumber"; label: string }> = [
    { key: "firstName", label: "First Name" },
    { key: "lastName", label: "Last Name" },
    { key: "email", label: "Email" },
    { key: "mobileNumber", label: "Mobile Number" },
  ];

  function toggle(key: (typeof items)[number]["key"], enabled: boolean) {
    updateDefinition((d) => {
      const nextFields = { ...d.fields };
      if (!enabled) {
        delete nextFields[key];
        if (selectedField === key) onSelectField(null);
      } else if (key === "mobileNumber") {
        nextFields.mobileNumber = { labelByLocale: { [d.meta.defaultLocale]: "Mobile Number" }, dropdownFirstEntryByLocale: {}, countries: [] };
      } else {
        nextFields[key] = { labelByLocale: { [d.meta.defaultLocale]: items.find((i) => i.key === key)!.label } };
      }
      return { ...d, fields: nextFields };
    });
  }

  if (!fields) return null;

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
        Predefined fields
      </Typography>
      <Stack spacing={0.5}>
        {items.map((item, i) => (
          <Box key={item.key}>
            {i > 0 && <Divider sx={{ my: 0.5 }} />}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Chip
                label={item.label}
                size="small"
                variant={selectedField === item.key ? "filled" : "outlined"}
                color={selectedField === item.key ? "primary" : "default"}
                onClick={() => (fields[item.key] ? onSelectField(item.key) : undefined)}
                sx={{ cursor: fields[item.key] ? "pointer" : "default" }}
              />
              <Switch
                size="small"
                checked={!!fields[item.key]}
                onChange={(e) => toggle(item.key, e.target.checked)}
              />
            </Box>
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}
