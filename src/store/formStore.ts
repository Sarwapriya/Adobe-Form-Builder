import { create } from "zustand";
<<<<<<< HEAD
import type { FieldDefinition, FieldType, FormDefinition, LocaleConfig } from "../schema";
import { createEmptyForm } from "../schema";
import { createDefaultField } from "../fieldRegistry/createField";
=======
import type { CountryConfig, FieldDefinition, FieldType, FormDefinition, LocaleConfig } from "../schema";
import { createEmptyForm } from "../schema";
import { createDefaultField } from "../fieldRegistry/createField";
import { newId } from "../utils/id";
>>>>>>> 569474c (update project)

interface FormStore {
  metadata: FormDefinition["metadata"];
  locales: LocaleConfig[];
<<<<<<< HEAD
=======
  countries: CountryConfig[];
>>>>>>> 569474c (update project)
  fields: FieldDefinition[];
  selectedFieldId: string | null;

  addField: (type: FieldType, atIndex?: number) => void;
  removeField: (id: string) => void;
  updateField: (id: string, patch: Partial<FieldDefinition>) => void;
  reorderFields: (activeId: string, overId: string) => void;
  selectField: (id: string | null) => void;

<<<<<<< HEAD
=======
  addCountry: () => void;
  updateCountry: (id: string, patch: Partial<CountryConfig>) => void;
  removeCountry: (id: string) => void;

>>>>>>> 569474c (update project)
  setTitle: (title: FormDefinition["metadata"]["title"]) => void;
  setLocales: (locales: LocaleConfig[]) => void;
  loadForm: (form: FormDefinition) => void;
  exportForm: () => FormDefinition;
  resetForm: () => void;
}

const initial = createEmptyForm();

export const useFormStore = create<FormStore>((set, get) => ({
  metadata: initial.metadata,
  locales: initial.locales,
<<<<<<< HEAD
=======
  countries: initial.countries,
>>>>>>> 569474c (update project)
  fields: initial.fields,
  selectedFieldId: null,

  addField: (type, atIndex) => {
    set((state) => {
      const insertAt = atIndex ?? state.fields.length;
      const newField = createDefaultField(type, insertAt);
      const fields = [...state.fields];
      fields.splice(insertAt, 0, newField);
      const reindexed = fields.map((f, i) => ({ ...f, order: i }));
      return { fields: reindexed, selectedFieldId: newField.id };
    });
  },

  removeField: (id) => {
    set((state) => {
      const fields = state.fields.filter((f) => f.id !== id).map((f, i) => ({ ...f, order: i }));
      return {
        fields,
        selectedFieldId: state.selectedFieldId === id ? null : state.selectedFieldId,
      };
    });
  },

  updateField: (id, patch) => {
    set((state) => ({
      fields: state.fields.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    }));
  },

  reorderFields: (activeId, overId) => {
    set((state) => {
      const fields = [...state.fields].sort((a, b) => a.order - b.order);
      const fromIndex = fields.findIndex((f) => f.id === activeId);
      const toIndex = fields.findIndex((f) => f.id === overId);
      if (fromIndex === -1 || toIndex === -1) return {};
      const [moved] = fields.splice(fromIndex, 1);
      fields.splice(toIndex, 0, moved);
      return { fields: fields.map((f, i) => ({ ...f, order: i })) };
    });
  },

  selectField: (id) => set({ selectedFieldId: id }),

<<<<<<< HEAD
=======
  addCountry: () => {
    set((state) => {
      const country: CountryConfig = {
        id: newId("country"),
        countryCode: "",
        name: { en: "New Country" },
        callingCode: "",
        languages: [],
        isDefault: state.countries.length === 0,
      };
      return { countries: [...state.countries, country] };
    });
  },

  updateCountry: (id, patch) => {
    set((state) => ({
      countries: state.countries.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  },

  removeCountry: (id) => {
    set((state) => ({
      countries: state.countries.filter((c) => c.id !== id),
    }));
  },

>>>>>>> 569474c (update project)
  setTitle: (title) => {
    set((state) => ({ metadata: { ...state.metadata, title, updatedAt: new Date().toISOString() } }));
  },

  setLocales: (locales) => set({ locales }),

  loadForm: (form) => {
    set({
      metadata: form.metadata,
      locales: form.locales,
<<<<<<< HEAD
=======
      countries: form.countries,
>>>>>>> 569474c (update project)
      fields: [...form.fields].sort((a, b) => a.order - b.order),
      selectedFieldId: null,
    });
  },

  exportForm: () => {
    const state = get();
    return {
      schemaVersion: 1,
      metadata: { ...state.metadata, updatedAt: new Date().toISOString() },
      locales: state.locales,
<<<<<<< HEAD
=======
      countries: state.countries,
>>>>>>> 569474c (update project)
      fields: [...state.fields].sort((a, b) => a.order - b.order),
    };
  },

  resetForm: () => {
    const empty = createEmptyForm();
<<<<<<< HEAD
    set({ metadata: empty.metadata, locales: empty.locales, fields: empty.fields, selectedFieldId: null });
=======
    set({ metadata: empty.metadata, locales: empty.locales, countries: empty.countries, fields: empty.fields, selectedFieldId: null });
>>>>>>> 569474c (update project)
  },
}));
