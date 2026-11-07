"use server";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function refreshQuickNotes() {
  revalidatePath("/");
  revalidatePath("/quick-notes");
}

export async function saveQuickNote(formData: FormData) {
  const userId = await requireUser();
  const content = String(formData.get("content") ?? "");
  if (content.length > 100000) throw new Error("A anotação deve ter no máximo 100.000 caracteres.");

  const supabase = await createClient();
  const { error } = await supabase.from("quick_notes").upsert({ user_id: userId, content }, { onConflict: "user_id" });
  if (error) throw new Error("Não foi possível salvar a anotação rápida. Execute a migração 20261107010000 no Supabase.");
  refreshQuickNotes();
}

export async function clearQuickNote() {
  const userId = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("quick_notes").upsert({ user_id: userId, content: "" }, { onConflict: "user_id" });
  if (error) throw new Error("Não foi possível apagar a anotação rápida.");
  refreshQuickNotes();
}
