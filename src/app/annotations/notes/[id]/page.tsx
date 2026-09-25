import { AnnotationsHeader } from "@/app/annotations/annotations-header";
import { MarkdownContent } from "@/components/markdown-content";
import { formatAnnotationDate, type MarkdownNote } from "@/lib/annotations";
import { requireUser } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }> };

export default async function NoteDetailPage({ params }: Props) {
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
      <AnnotationsHeader active="notes" title={note.title} description={`Atualizada em ${formatAnnotationDate(note.updated_at)}`} />
      <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8">
        <div className="mb-5 flex flex-wrap justify-between gap-3">
          <Link href="/annotations/notes" className="rounded-xl px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-200">← Voltar às anotações</Link>
          <Link href={`/annotations/notes/${note.id}/edit`} className="rounded-xl bg-violet-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-800">Editar anotação</Link>
        </div>
        <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8 md:p-10"><MarkdownContent content={note.content} /></article>
      </div>
    </main>
  );
}
