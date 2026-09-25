import { AnnotationsHeader } from "@/app/annotations/annotations-header";
import { requireUser } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { redirect } from "next/navigation";
import { NoteForm } from "../note-form";

export default async function NewNotePage() {
  if (!hasSupabaseEnv()) redirect("/");
  await requireUser();

  return (
    <main className="min-h-screen bg-stone-50 pb-12 text-stone-900">
      <AnnotationsHeader active="notes" title="Nova anotação" description="Escreva em Markdown; a formatação aparecerá na tela de visualização." />
      <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8"><section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8"><NoteForm mode="create" /></section></div>
    </main>
  );
}
