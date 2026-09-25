import { AnnotationsHeader } from "@/app/annotations/annotations-header";
import { type MarkdownNote } from "@/lib/annotations";
import { requireUser } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { NoteForm } from "../../note-form";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }> };

export default async function EditNotePage({ params }: Props) {
  if (!hasSupabaseEnv()) redirect("/");
  const userId = await requireUser();
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("markdown_notes")
    .select("id, title, content, created_at, updated_at")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error("Não foi possível carregar a anotação.");
  if (!data) notFound();
  const note = data as MarkdownNote;

  return (
    <main className="min-h-screen bg-stone-50 pb-12 text-stone-900">
      <AnnotationsHeader active="notes" title="Editar anotação" description="Altere o título ou o conteúdo em Markdown." />
      <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8"><section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8"><NoteForm mode="edit" noteId={note.id} initialTitle={note.title} initialContent={note.content} /></section></div>
    </main>
  );
}
