"use client";

import { saveSleepEntry } from "@/app/health-data/actions";
import type { SleepEntry } from "@/lib/health";
import { useState } from "react";
import { useFormStatus } from "react-dom";

type Props = {
  today: string;
  entry?: SleepEntry;
};

function SaveButton() {
  const { pending } = useFormStatus();

  return <button disabled={pending} className="w-full rounded-xl bg-indigo-700 px-5 py-3 font-semibold text-white hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-50">{pending ? "Salvando..." : "Salvar sono"}</button>;
}

export function SleepEntryForm({ today, entry }: Props) {
  const [qualityScore, setQualityScore] = useState(entry?.quality_score?.toString() ?? "");

  async function saveEntry(formData: FormData) {
    await saveSleepEntry(formData);
    setQualityScore("");
  }

  return (
    <form action={saveEntry} className="mt-5 space-y-4">
      <label className="block text-sm font-medium">Dia em que acordou<input type="date" name="sleptOn" required max={today} defaultValue={today} className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-3 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100" /></label>
      <div className="grid grid-cols-2 gap-3"><label className="block text-sm font-medium">Dormiu às<input type="time" name="sleepTime" required defaultValue={entry?.sleep_time.slice(0, 5)} className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-3 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100" /></label><label className="block text-sm font-medium">Acordou às<input type="time" name="wakeTime" required defaultValue={entry?.wake_time.slice(0, 5)} className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-3 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100" /></label></div>
      <label className="block text-sm font-medium">Nota do sono (0 a 10)<input type="number" name="qualityScore" required min="0" max="10" step="1" value={qualityScore} onChange={(event) => setQualityScore(event.target.value)} placeholder="Ex.: 8" className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-3 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100" /></label>
      <label className="block text-sm font-medium">Descrição <span className="font-normal text-stone-400">(opcional)</span><textarea name="description" maxLength={500} rows={3} defaultValue={entry?.description} placeholder="Ex.: acordei uma vez durante a noite" className="mt-2 w-full resize-none rounded-xl border border-stone-300 px-3 py-3 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100" /></label>
      <SaveButton />
    </form>
  );
}
