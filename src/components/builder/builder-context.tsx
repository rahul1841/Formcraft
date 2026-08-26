"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/lib/api-client";
import { createField, duplicateField } from "@/lib/fields";
import { useToast } from "@/components/ui/Toast";
import type {
  FieldType,
  Form,
  FormField,
  FormSettings,
  FormStatus,
  FormTheme,
  PublicForm,
} from "@/lib/types";

const AUTOSAVE_DELAY = 1200;
const AUTOSAVE_RETRY_DELAY = 5000;
const AUTOSAVE_RETRIES = 3;
const HISTORY_LIMIT = 60;

export interface BuilderApi {
  form: Form;
  previewForm: PublicForm;
  selectedFieldId: string | null;
  selectedField: FormField | null;
  select: (id: string | null) => void;

  updateForm: (patch: Partial<Form>) => void;
  updateTheme: (patch: Partial<FormTheme>) => void;
  updateSettings: (patch: Partial<FormSettings>) => void;

  addField: (type: FieldType, index?: number) => string;
  updateField: (id: string, patch: Partial<FormField>) => void;
  removeField: (id: string) => void;
  copyField: (id: string) => void;
  moveField: (from: number, to: number) => void;

  save: () => Promise<void>;
  setStatus: (status: FormStatus) => Promise<void>;

  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;

  dirty: boolean;
  saving: boolean;
  lastSavedAt: string | null;
}

const BuilderContext = createContext<BuilderApi | null>(null);

export function toPublicForm(form: Form): PublicForm {
  return {
    id: form.id,
    title: form.title,
    description: form.description,
    slug: form.slug,
    status: form.status,
    fields: form.fields,
    theme: form.theme,
    settings: {
      submitButtonText: form.settings.submitButtonText,
      successMessage: form.settings.successMessage,
      redirectUrl: form.settings.redirectUrl,
      showProgressBar: form.settings.showProgressBar,
    },
  };
}

export function BuilderProvider({
  initialForm,
  children,
}: {
  initialForm: Form;
  children: ReactNode;
}) {
  const toast = useToast();
  const [form, setForm] = useState<Form>(initialForm);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(
    initialForm.fields[0]?.id ?? null,
  );
  const [past, setPast] = useState<Form[]>([]);
  const [future, setFuture] = useState<Form[]>([]);
  const [dirty, setDirty] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(
    initialForm.updatedAt,
  );

  const formRef = useRef(form);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Serialises saves so a second one queues behind the first instead of being dropped. */
  const inFlight = useRef<Promise<void> | null>(null);
  /** Bumped on every edit, so a save can tell whether the form moved under it. */
  const editSeq = useRef(0);
  const failures = useRef(0);

  // Declared before the autosave effect so the ref is fresh when it fires.
  useEffect(() => {
    formRef.current = form;
  }, [form]);

  /* ------------------------------- mutations ------------------------------- */

  const commit = useCallback((next: Form | ((prev: Form) => Form)) => {
    editSeq.current += 1;
    setAttempt(0);
    setForm((prev) => {
      const resolved = typeof next === "function" ? next(prev) : next;
      if (resolved === prev) return prev;
      setPast((p) => [...p.slice(-HISTORY_LIMIT), prev]);
      setFuture([]);
      setDirty(true);
      return resolved;
    });
  }, []);

  const updateForm = useCallback(
    (patch: Partial<Form>) => commit((prev) => ({ ...prev, ...patch })),
    [commit],
  );

  const updateTheme = useCallback(
    (patch: Partial<FormTheme>) =>
      commit((prev) => ({ ...prev, theme: { ...prev.theme, ...patch } })),
    [commit],
  );

  const updateSettings = useCallback(
    (patch: Partial<FormSettings>) =>
      commit((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } })),
    [commit],
  );

  const addField = useCallback(
    (type: FieldType, index?: number) => {
      const field = createField(type);
      commit((prev) => {
        const fields = [...prev.fields];
        const at = index === undefined ? fields.length : Math.max(0, Math.min(index, fields.length));
        fields.splice(at, 0, field);
        return { ...prev, fields };
      });
      setSelectedFieldId(field.id);
      return field.id;
    },
    [commit],
  );

  const updateField = useCallback(
    (id: string, patch: Partial<FormField>) =>
      commit((prev) => ({
        ...prev,
        fields: prev.fields.map((f) => (f.id === id ? { ...f, ...patch } : f)),
      })),
    [commit],
  );

  const removeField = useCallback(
    (id: string) => {
      commit((prev) => ({ ...prev, fields: prev.fields.filter((f) => f.id !== id) }));
      setSelectedFieldId((current) => (current === id ? null : current));
    },
    [commit],
  );

  const copyField = useCallback(
    (id: string) => {
      const source = formRef.current.fields.find((f) => f.id === id);
      if (!source) return;
      const clone = duplicateField(source);
      commit((prev) => {
        const index = prev.fields.findIndex((f) => f.id === id);
        const fields = [...prev.fields];
        fields.splice(index + 1, 0, clone);
        return { ...prev, fields };
      });
      setSelectedFieldId(clone.id);
    },
    [commit],
  );

  const moveField = useCallback(
    (from: number, to: number) =>
      commit((prev) => {
        if (from === to || from < 0 || to < 0 || from >= prev.fields.length) return prev;
        const fields = [...prev.fields];
        const [moved] = fields.splice(from, 1);
        fields.splice(Math.min(to, fields.length), 0, moved);
        return { ...prev, fields };
      }),
    [commit],
  );

  /* --------------------------------- saving -------------------------------- */

  const persist = useCallback(
    async (override?: Partial<Form>) => {
      const run = async () => {
        const current = { ...formRef.current, ...override };
        const seqAtStart = editSeq.current;
        setSaving(true);
        try {
          const { form: saved } = await api.patch<{ form: Form }>(
            `/api/forms/${current.id}`,
            {
              // A transient blank title would fail the schema and wedge autosave.
              title: current.title.trim() || "Untitled form",
              description: current.description,
              fields: current.fields,
              theme: current.theme,
              settings: current.settings,
              ...(override?.status ? { status: override.status } : {}),
            },
          );
          failures.current = 0;
          setLastSavedAt(saved.updatedAt);
          // Anything typed while the request was in flight is still unsaved.
          setDirty(editSeq.current !== seqAtStart);
          setForm((prev) => ({
            ...prev,
            slug: saved.slug,
            status: saved.status,
            updatedAt: saved.updatedAt,
            publishedAt: saved.publishedAt,
            responseCount: saved.responseCount,
          }));
        } catch (err) {
          failures.current += 1;
          toast.error(
            "Couldn't save your changes",
            err instanceof Error ? err.message : undefined,
          );
          throw err;
        } finally {
          setSaving(false);
        }
      };

      // Chain onto any save already running so nothing is silently discarded.
      const next = (inFlight.current ?? Promise.resolve())
        .catch(() => {})
        .then(run);
      inFlight.current = next.catch(() => {});
      return next;
    },
    [toast],
  );

  const save = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    await persist();
  }, [persist]);

  const setStatus = useCallback(
    async (status: FormStatus) => {
      if (timer.current) clearTimeout(timer.current);
      // persist() queues behind any autosave, and folds the saved status back in.
      await persist({ status });
    },
    [persist],
  );

  // Debounced autosave. `attempt` lets a failed save schedule one retry pass
  // instead of going idle until the author happens to type again.
  useEffect(() => {
    if (!dirty) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(
      () => {
        void persist().catch(() => {
          if (failures.current <= AUTOSAVE_RETRIES) {
            setAttempt((a) => a + 1);
          }
        });
      },
      attempt > 0 ? AUTOSAVE_RETRY_DELAY : AUTOSAVE_DELAY,
    );
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [form, dirty, attempt, persist]);

  // Warn before losing unsaved edits.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  /* -------------------------------- history -------------------------------- */

  const undo = useCallback(() => {
    editSeq.current += 1;
    setPast((p) => {
      if (!p.length) return p;
      const previous = p[p.length - 1];
      setFuture((f) => [formRef.current, ...f].slice(0, HISTORY_LIMIT));
      setForm(previous);
      setDirty(true);
      return p.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    editSeq.current += 1;
    setFuture((f) => {
      if (!f.length) return f;
      const next = f[0];
      setPast((p) => [...p, formRef.current].slice(-HISTORY_LIMIT));
      setForm(next);
      setDirty(true);
      return f.slice(1);
    });
  }, []);

  // Keyboard shortcuts: ⌘/Ctrl+S save, ⌘/Ctrl+Z undo, ⇧⌘/Ctrl+Z redo.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key === "s") {
        e.preventDefault();
        void save().catch(() => {});
      } else if (key === "z") {
        const target = e.target as HTMLElement | null;
        const tag = target?.tagName?.toLowerCase();
        if (tag === "input" || tag === "textarea" || target?.isContentEditable) return;
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save, undo, redo]);

  const value = useMemo<BuilderApi>(
    () => ({
      form,
      previewForm: toPublicForm(form),
      selectedFieldId,
      selectedField: form.fields.find((f) => f.id === selectedFieldId) ?? null,
      select: setSelectedFieldId,
      updateForm,
      updateTheme,
      updateSettings,
      addField,
      updateField,
      removeField,
      copyField,
      moveField,
      save,
      setStatus,
      undo,
      redo,
      canUndo: past.length > 0,
      canRedo: future.length > 0,
      dirty,
      saving,
      lastSavedAt,
    }),
    [
      form,
      selectedFieldId,
      updateForm,
      updateTheme,
      updateSettings,
      addField,
      updateField,
      removeField,
      copyField,
      moveField,
      save,
      setStatus,
      undo,
      redo,
      past.length,
      future.length,
      dirty,
      saving,
      lastSavedAt,
    ],
  );

  return <BuilderContext.Provider value={value}>{children}</BuilderContext.Provider>;
}

export function useBuilder(): BuilderApi {
  const ctx = useContext(BuilderContext);
  if (!ctx) throw new Error("useBuilder must be used inside <BuilderProvider>");
  return ctx;
}
