"use client";

import { saveMonthlyDiaryEntry } from "./actions";
import type { MonthlyDiaryEntry } from "@/lib/monthly-diary";
import { useMemo, useState, useTransition } from "react";

type Draft = Pick<MonthlyDiaryEntry, "notes" | "did_klap" | "did_exercise">;

export function MonthlyDiaryGrid({ days, initialEntries, today }: { days: { date: string; label: string; isFuture: boolean }[]; initialEntries: MonthlyDiaryEntry[]; today: string }) {
  const initialDrafts = useMemo(() => new Map(initialEntries.map((entry) => [entry.entry_date, { notes: entry.notes, did_klap: entry.did_klap, did_exercise: entry.did_exercise }])), [initialEntries]);
  const [drafts, setDrafts] = useState(() => new Map(initialDrafts));
  const [savingDate, setSavingDate] = useState<string | null>(null);
  const [saveError, setSaveError] = useState("");
  const [, startTransition] = useTransition();

  function draftFor(date: string): Draft {
    return drafts.get(date) ?? { notes: "", did_klap: false, did_exercise: false };
  }

  function update(date: string, change: Partial<Draft>) {
    setDrafts((current) => {
      const next = new Map(current);
      next.set(date, { ...(current.get(date) ?? { notes: "", did_klap: false, did_exercise: false }), ...change });
      return next;
    });
  }

  function save(date: string, draftOverride?: Draft) {
    const draft = draftOverride ?? draftFor(date);
    setSavingDate(date);
    setSaveError("");
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("entryDate", date);
        formData.set("notes", draft.notes);
        formData.set("didKlap", String(draft.did_klap));
        formData.set("didExercise", String(draft.did_exercise));
        await saveMonthlyDiaryEntry(formData);
      } catch {
        setSaveError("Não foi possível salvar uma alteração. Confira sua conexão e tente novamente.");
      } finally {
        setSavingDate((current) => current === date ? null : current);
      }
    });
  }

  return <><p aria-live="polite" className={saveError ? "mb-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800" : "sr-only"}>{saveError}</p><div className="overflow-x-auto rounded-2xl border border-stone-200"><table className="min-w-[720px] w-full border-collapse text-left"><thead className="bg-stone-100 text-xs font-semibold tracking-wide text-stone-600 uppercase"><tr><th className="w-36 px-4 py-3">Dia</th><th className="min-w-96 px-4 py-3">O que aconteceu</th><th className="w-24 px-3 py-3 text-center">Klap</th><th className="w-24 px-3 py-3 text-center">Exe</th></tr></thead><tbody className="divide-y divide-stone-200 bg-white">{days.map((day) => { const draft = draftFor(day.date); const disabled = day.isFuture; return <tr key={day.date} className={disabled ? "bg-stone-50 text-stone-400" : "align-top"}><th scope="row" className="px-4 py-4 text-sm font-semibold"><time dateTime={day.date}>{day.label}</time>{day.date === today && <span className="mt-1 block text-xs font-medium text-fuchsia-700">Hoje</span>}</th><td className="px-3 py-3"><label className="sr-only" htmlFor={`notes-${day.date}`}>Anotação de {day.label}</label><textarea id={`notes-${day.date}`} value={draft.notes} disabled={disabled} maxLength={10000} rows={Math.max(2, Math.min(7, draft.notes.split("\n").length + 1))} onChange={(event) => update(day.date, { notes: event.target.value })} onBlur={() => save(day.date)} placeholder={disabled ? "Dia futuro" : "Clique aqui e escreva livremente…"} className="w-full resize-y rounded-xl border border-transparent bg-transparent px-3 py-2 leading-6 outline-none transition placeholder:text-stone-400 hover:border-stone-200 focus:border-fuchsia-500 focus:bg-white focus:ring-2 focus:ring-fuchsia-100 disabled:cursor-not-allowed" /></td><td className="px-3 py-3 text-center"><Toggle date={day.date} label="Klap" checked={draft.did_klap} disabled={disabled} saving={savingDate === day.date} onChange={(checked) => { const next = { ...draft, did_klap: checked }; update(day.date, next); save(day.date, next); }} /></td><td className="px-3 py-3 text-center"><Toggle date={day.date} label="Exercício" checked={draft.did_exercise} disabled={disabled} saving={savingDate === day.date} onChange={(checked) => { const next = { ...draft, did_exercise: checked }; update(day.date, next); save(day.date, next); }} /></td></tr>; })}</tbody></table></div></>;
}

function Toggle({ date, label, checked, disabled, saving, onChange }: { date: string; label: string; checked: boolean; disabled: boolean; saving: boolean; onChange: (checked: boolean) => void }) {
  return <label className="inline-flex cursor-pointer items-center justify-center"><input aria-label={`${label} em ${date}`} type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} className="peer sr-only" /><span aria-hidden="true" className="grid size-9 place-items-center rounded-xl border border-stone-300 bg-white text-sm font-bold text-transparent transition peer-checked:border-fuchsia-700 peer-checked:bg-fuchsia-700 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-fuchsia-300 peer-disabled:cursor-not-allowed peer-disabled:opacity-50">{saving ? "…" : "✓"}</span></label>;
}
