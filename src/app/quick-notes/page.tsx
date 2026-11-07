import { QuickNoteEditor } from "./quick-note-editor";
import { requireUser } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function QuickNotesPage() {
  if (!hasSupabaseEnv()) redirect("/");
  const userId = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase.from("quick_notes").select("content").eq("user_id", userId).maybeSingle();
  if (error) throw new Error("Não foi possível carregar a anotação rápida. Execute a migração 20261107010000 no Supabase.");

  return <main className="min-h-screen bg-stone-50 pb-12 text-stone-900"><header className="border-b border-stone-200 bg-white"><div className="mx-auto max-w-4xl px-5 py-4 sm:px-8"><p className="text-xs font-semibold tracking-[0.18em] text-sky-700 uppercase">Quick Notes</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">Anotações rápidas</h1><p className="mt-1 text-sm leading-6 text-stone-600">Um único espaço simples para registrar o que você não quer esquecer.</p></div></header><QuickNoteEditor initialContent={data?.content ?? ""} /></main>;
}
