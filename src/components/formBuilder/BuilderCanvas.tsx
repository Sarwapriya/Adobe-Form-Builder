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
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import type { ControlType, FormVariant, QuestionDefinition } from "@formbuilder/shared";
import { resolveLocalizedText } from "@formbuilder/shared";
import { useFormBuilderStore } from "../../store/formBuilderStore";
import { CONTROL_TYPE_LABEL, consentVariants, createConsent, createQuestion, questionVariants, renumberConsents, renumberQuestions } from "./formBuilderHelpers";

const ADD_QUESTION_TYPES: ControlType[] = ["shortText", "text", "dropdown", "radio", "checkbox"];
const VARIANT_LABEL: Record<FormVariant, string> = { ff: "Full Form", oc: "One-Click" };

/** Clickable "Full Form" / "One-Click" tags shared by question rows and consent
 * rows alike — a tag is disabled (not hidden) when the form itself doesn't have
 * that variant enabled (see VariantConfigPanel), so there's always a visible
 * reason a tag can't be toggled rather than it silently disappearing. Renders
 * nothing at all when the form only has one variant to begin with (every ad-hoc
 * form, always Full Form only — see MyAdHocFormEditorPage/FormBuilderEditorPage,
 * neither of which ever renders VariantConfigPanel for an ad-hoc form) — with
 * nothing to pick between, a permanently-disabled "One-Click" tag is clutter, not
 * a real choice (same reasoning as ConsentVisibilityControls's own "Shown in"
 * section). */
function VariantChips({
  shownIn,
  formVariants,
  onToggle,
}: {
  shownIn: FormVariant[];
  formVariants: FormVariant[];
  onToggle: (variant: FormVariant, checked: boolean) => void;
}) {
  if (formVariants.length <= 1) return null;
  return (
    <Stack direction="row" spacing={0.5} onClick={(e) => e.stopPropagation()}>
      {(["ff", "oc"] as FormVariant[]).map((variant) => {
        const enabledForForm = formVariants.includes(variant);
        const shown = shownIn.includes(variant);
        const chip = (
          <Chip
            key={variant}
            label={VARIANT_LABEL[variant]}
            size="small"
            clickable={enabledForForm}
            variant={shown ? "filled" : "outlined"}
            color={shown && enabledForForm ? "primary" : "default"}
            sx={{ opacity: enabledForForm ? 1 : 0.4 }}
            onClick={enabledForForm ? () => onToggle(variant, !shown) : undefined}
          />
        );
        return enabledForForm ? (
          chip
        ) : (
          <Tooltip key={variant} title={`${VARIANT_LABEL[variant]} is disabled for this form — enable it under Form variants above.`}>
            <span>{chip}</span>
          </Tooltip>
        );
      })}
    </Stack>
  );
}

interface QuestionRowProps {
  question: QuestionDefinition;
  index: number;
  total: number;
  selected: boolean;
  formVariants: FormVariant[];
  onSelect: () => void;
  onMove: (delta: number) => void;
  onDelete: () => void;
  onToggleVariant: (variant: FormVariant, checked: boolean) => void;
}

function QuestionRow({ question, index, total, selected, formVariants, onSelect, onMove, onDelete, onToggleVariant }: QuestionRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: question.id });
  const defaultLocale = useFormBuilderStore((s) => s.definition?.meta.defaultLocale ?? "en_GB");
  const shownIn = questionVariants(question);

  return (
    <Box
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      sx={(t) => ({
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 1.5,
        py: 1,
        borderRadius: 2,
        bgcolor: selected ? alpha(t.palette.primary.main, 0.16) : isDragging ? alpha(t.palette.primary.main, 0.08) : "transparent",
        border: "1px solid",
        borderColor: selected ? "primary.main" : "divider",
        cursor: "pointer",
      })}
      onClick={onSelect}
    >
      <IconButton size="small" {...attributes} {...listeners} aria-label="Drag to reorder" sx={{ cursor: "grab" }}>
        <DragIndicatorIcon fontSize="small" />
      </IconButton>
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={600} noWrap>
          {question.id}. {resolveLocalizedText(question.headingByLocale, defaultLocale, defaultLocale) || "(no heading)"}
          {question.required && (
            <Box component="span" sx={{ color: "error.main" }}>
              {" "}
              *
            </Box>
          )}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {CONTROL_TYPE_LABEL[question.controlType]}
          {question.answers.length > 0 ? ` · ${question.answers.length} option${question.answers.length === 1 ? "" : "s"}` : ""}
        </Typography>
      </Box>
      <VariantChips shownIn={shownIn} formVariants={formVariants} onToggle={onToggleVariant} />
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
  const formVariants = useFormBuilderStore((s): FormVariant[] => s.config?.variants ?? ["ff", "oc"]);
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

  function handleToggleVariant(id: string, variant: FormVariant, checked: boolean) {
    updateDefinition((d) => ({
      ...d,
      questions: d.questions.map((q) => {
        if (q.id !== id) return q;
        const current = questionVariants(q);
        const next = checked ? [...current, variant] : current.filter((v) => v !== variant);
        return { ...q, visibleInVariants: next };
      }),
    }));
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
        <>
          {formVariants.length > 1 && (
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
              Click a question's "Full Form" / "One-Click" tag to control which variant(s) it appears in.
            </Typography>
          )}
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
                    formVariants={formVariants}
                    onSelect={() => onSelectQuestion(q.id)}
                    onMove={(delta) => moveQuestion(i, delta)}
                    onDelete={() => handleDeleteQuestion(q.id)}
                    onToggleVariant={(variant, checked) => handleToggleVariant(q.id, variant, checked)}
                  />
                ))}
              </Stack>
            </SortableContext>
          </DndContext>
        </>
      )}
    </Paper>
  );
}

interface PredefinedFieldItem {
  key: "firstName" | "lastName" | "email" | "mobileNumber";
  label: string;
  shownIn: string;
}

interface ConsentToggleItem {
  key: "privacyPolicy" | "marketingOptin";
  label: string;
}

/** Presence toggles for the predefined profile fields — these render in a fixed
 * area of the generated form (`.form_top_group`, always before the question
 * modules — see renderProfileField.ts) rather than an interleavable position, so
 * they're add/remove toggles here rather than part of the draggable question
 * list. Which variant(s) show each of these is fixed by pageTemplate.ts (Full
 * Form: all four; One-Click: Mobile Number only) — not admin-configurable, so the
 * caption is purely informational. Consent checkboxes (Privacy Policy, Marketing
 * Opt-in, and any admin-added ones below) render in the same "before submit"
 * `.form_bottom_check_group` but, unlike these four, their variant visibility
 * *is* configurable — see VariantChips/ConsentVisibilityControls. */
export function PredefinedFieldToggles({
  selectedField,
  onSelectField,
}: {
  selectedField: string | null;
  onSelectField: (field: string | null) => void;
}) {
  const fields = useFormBuilderStore((s) => s.definition?.fields);
  const defaultLocale = useFormBuilderStore((s) => s.definition?.meta.defaultLocale ?? "en_GB");
  const formVariants = useFormBuilderStore((s): FormVariant[] => s.config?.variants ?? ["ff", "oc"]);
  const updateDefinition = useFormBuilderStore((s) => s.updateDefinition);

  const profileItems: PredefinedFieldItem[] = [
    { key: "firstName", label: "First Name", shownIn: "Full Form only" },
    { key: "lastName", label: "Last Name", shownIn: "Full Form only" },
    { key: "email", label: "Email", shownIn: "Full Form only" },
    { key: "mobileNumber", label: "Mobile Number", shownIn: "Full Form + One-Click" },
  ];
  const consentToggleItems: ConsentToggleItem[] = [
    { key: "privacyPolicy", label: "Privacy Policy Consent" },
    { key: "marketingOptin", label: "Marketing Opt-in" },
  ];

  function toggleProfileField(key: PredefinedFieldItem["key"], enabled: boolean) {
    updateDefinition((d) => {
      const nextFields = { ...d.fields };
      if (!enabled) {
        delete nextFields[key];
        if (selectedField === key) onSelectField(null);
      } else if (key === "mobileNumber") {
        nextFields.mobileNumber = { labelByLocale: { [d.meta.defaultLocale]: "Mobile Number" }, dropdownFirstEntryByLocale: {}, countries: [] };
      } else {
        const label = profileItems.find((i) => i.key === key)!.label;
        nextFields[key] = { labelByLocale: { [d.meta.defaultLocale]: label } };
      }
      return { ...d, fields: nextFields };
    });
  }

  function toggleConsentField(key: ConsentToggleItem["key"], enabled: boolean) {
    updateDefinition((d) => {
      const nextFields = { ...d.fields };
      if (!enabled) {
        delete nextFields[key];
        if (selectedField === key) onSelectField(null);
      } else if (key === "privacyPolicy") {
        nextFields.privacyPolicy = { textByLocale: { [d.meta.defaultLocale]: "I agree to the" }, linkUrlByLocale: {}, linkTextByLocale: {} };
      } else {
        const label = consentToggleItems.find((i) => i.key === key)!.label;
        nextFields[key] = { labelByLocale: { [d.meta.defaultLocale]: label } };
      }
      return { ...d, fields: nextFields };
    });
  }

  function toggleConsentVariant(key: ConsentToggleItem["key"], variant: FormVariant, checked: boolean) {
    updateDefinition((d) => {
      const current = d.fields[key];
      if (!current) return d;
      const currentVariants = consentVariants(current);
      const next = checked ? [...currentVariants, variant] : currentVariants.filter((v) => v !== variant);
      return { ...d, fields: { ...d.fields, [key]: { ...current, visibleInVariants: next } } };
    });
  }

  // Terms & Conditions is an informational link, not a consent checkbox — no
  // required/visibleInVariants knobs (see TermsAndConditionsMeta's own doc
  // comment), so it gets its own simple on/off toggle rather than joining
  // consentToggleItems above.
  function toggleTermsAndConditions(enabled: boolean) {
    updateDefinition((d) => {
      const nextFields = { ...d.fields };
      if (!enabled) {
        delete nextFields.termsAndConditions;
        if (selectedField === "termsAndConditions") onSelectField(null);
      } else {
        nextFields.termsAndConditions = { textByLocale: {}, urlByLocale: {} };
      }
      return { ...d, fields: nextFields };
    });
  }

  if (!fields) return null;
  const currentFields = fields;
  const additionalConsents = currentFields.additionalConsents ?? [];

  function addConsent() {
    updateDefinition((d) => {
      const consent = createConsent((d.fields.additionalConsents?.length ?? 0) + 1);
      onSelectField(consent.id);
      return { ...d, fields: { ...d.fields, additionalConsents: [...(d.fields.additionalConsents ?? []), consent] } };
    });
  }

  function moveConsent(index: number, delta: number) {
    const toIndex = index + delta;
    if (toIndex < 0 || toIndex >= additionalConsents.length) return;
    updateDefinition((d) => {
      const list = [...(d.fields.additionalConsents ?? [])];
      const [moved] = list.splice(index, 1);
      list.splice(toIndex, 0, moved);
      return { ...d, fields: { ...d.fields, additionalConsents: renumberConsents(list) } };
    });
  }

  function handleToggleAdditionalConsentVariant(id: string, variant: FormVariant, checked: boolean) {
    updateDefinition((d) => ({
      ...d,
      fields: {
        ...d.fields,
        additionalConsents: (d.fields.additionalConsents ?? []).map((c) => {
          if (c.id !== id) return c;
          const current = consentVariants(c);
          const next = checked ? [...current, variant] : current.filter((v) => v !== variant);
          return { ...c, visibleInVariants: next };
        }),
      },
    }));
  }

  function renderItem(item: PredefinedFieldItem, i: number) {
    return (
      <Box key={item.key}>
        {i > 0 && <Divider sx={{ my: 0.5 }} />}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box>
            <Chip
              label={item.label}
              size="small"
              variant={selectedField === item.key ? "filled" : "outlined"}
              color={selectedField === item.key ? "primary" : "default"}
              onClick={() => (currentFields[item.key] ? onSelectField(item.key) : undefined)}
              sx={{ cursor: currentFields[item.key] ? "pointer" : "default" }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              {item.shownIn}
            </Typography>
          </Box>
          <Switch size="small" checked={!!currentFields[item.key]} onChange={(e) => toggleProfileField(item.key, e.target.checked)} />
        </Box>
      </Box>
    );
  }

  function renderConsentToggleItem(item: ConsentToggleItem, i: number) {
    const value = currentFields[item.key];
    return (
      <Box key={item.key}>
        {i > 0 && <Divider sx={{ my: 0.5 }} />}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
          <Chip
            label={item.label}
            size="small"
            variant={selectedField === item.key ? "filled" : "outlined"}
            color={selectedField === item.key ? "primary" : "default"}
            onClick={() => (value ? onSelectField(item.key) : undefined)}
            sx={{ cursor: value ? "pointer" : "default" }}
          />
          {value && (
            <VariantChips
              shownIn={consentVariants(value)}
              formVariants={formVariants}
              onToggle={(variant, checked) => toggleConsentVariant(item.key, variant, checked)}
            />
          )}
          <Switch size="small" checked={!!value} onChange={(e) => toggleConsentField(item.key, e.target.checked)} sx={{ ml: "auto" }} />
        </Box>
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
        Predefined fields
      </Typography>
      <Stack spacing={0.5}>{profileItems.map(renderItem)}</Stack>

      <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 2.5, mb: 0.25 }}>
        Submit Button
      </Typography>
      <Chip
        label="Submit Button"
        size="small"
        variant={selectedField === "submitButton" ? "filled" : "outlined"}
        color={selectedField === "submitButton" ? "primary" : "default"}
        onClick={() => onSelectField("submitButton")}
        sx={{ cursor: "pointer" }}
      />

      <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 2.5, mb: 0.25 }}>
        Consent
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
        Shown just before the Submit button.
        {formVariants.length > 1 && ' Click a "Full Form" / "One-Click" tag to control which variant(s) show it.'}
      </Typography>
      <Stack spacing={0.5}>{consentToggleItems.map(renderConsentToggleItem)}</Stack>

      {additionalConsents.length > 0 && (
        <Stack spacing={0.5} sx={{ mt: 0.5 }}>
          {additionalConsents.map((consent, i) => (
            <Box key={consent.id}>
              <Divider sx={{ my: 0.5 }} />
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                <Chip
                  label={resolveLocalizedText(consent.textByLocale, defaultLocale, defaultLocale) || consent.id}
                  size="small"
                  variant={selectedField === consent.id ? "filled" : "outlined"}
                  color={selectedField === consent.id ? "primary" : "default"}
                  onClick={() => onSelectField(consent.id)}
                  sx={{ cursor: "pointer", maxWidth: 140 }}
                />
                <VariantChips
                  shownIn={consentVariants(consent)}
                  formVariants={formVariants}
                  onToggle={(variant, checked) => handleToggleAdditionalConsentVariant(consent.id, variant, checked)}
                />
                <Stack direction="row" spacing={0} sx={{ ml: "auto" }}>
                  <IconButton size="small" aria-label="Move up" disabled={i === 0} onClick={() => moveConsent(i, -1)}>
                    <ArrowUpwardIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    aria-label="Move down"
                    disabled={i === additionalConsents.length - 1}
                    onClick={() => moveConsent(i, 1)}
                  >
                    <ArrowDownwardIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Box>
            </Box>
          ))}
        </Stack>
      )}

      <Button size="small" startIcon={<AddIcon />} onClick={addConsent} sx={{ mt: 1 }}>
        Add another consent
      </Button>

      <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 2.5, mb: 0.25 }}>
        Terms & Conditions
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
        An optional informational link shown next to the Submit button. You can publish without setting it — a
        subsidiary user can also add their own locale's wording/link later.
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Chip
          label="Terms and Conditions"
          size="small"
          variant={selectedField === "termsAndConditions" ? "filled" : "outlined"}
          color={selectedField === "termsAndConditions" ? "primary" : "default"}
          onClick={() => (currentFields.termsAndConditions ? onSelectField("termsAndConditions") : undefined)}
          sx={{ cursor: currentFields.termsAndConditions ? "pointer" : "default" }}
        />
        <Switch
          size="small"
          checked={!!currentFields.termsAndConditions}
          onChange={(e) => toggleTermsAndConditions(e.target.checked)}
        />
      </Box>
    </Paper>
  );
}
