"use server";

import { requireUser } from "@/lib/auth";
import { saoPauloDate } from "@/lib/tasks";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function entryDate(formData: FormData) {
  const value = String(formData.get("entryDate") ?? "").trim();
  const parsed = new Date(`${value}T12:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value || value > saoPauloDate()) {
    throw new Error("Informe uma data válida que não esteja no futuro.");
  }
  return value;
}

function notes(formData: FormData) {
  const value = String(formData.get("notes") ?? "").trim();
  if (value.length > 10_000) throw new Error("A anotação pode ter no máximo 10.000 caracteres.");
  return value;
}

export async function saveMonthlyDiaryEntry(formData: FormData) {
  const userId = await requireUser();
  const entryDateValue = entryDate(formData);
  const entryNotes = notes(formData);
  const didKlap = formData.get("didKlap") === "true";
  const didExercise = formData.get("didExercise") === "true";
  const supabase = await createClient();

  if (!entryNotes && !didKlap && !didExercise) {
    const { error } = await supabase.from("monthly_diary_entries").delete().eq("user_id", userId).eq("entry_date", entryDateValue);
    if (error) throw new Error("Não foi possível limpar o registro do dia.");
  } else {
    const { error } = await supabase.from("monthly_diary_entries").upsert({
      user_id: userId,
      entry_date: entryDateValue,
      notes: entryNotes,
      did_klap: didKlap,
      did_exercise: didExercise,
    }, { onConflict: "user_id,entry_date" });
    if (error) throw new Error("Não foi possível salvar o registro do dia. Execute a migração mais recente.");
  }

  revalidatePath("/monthly-diary");
}
