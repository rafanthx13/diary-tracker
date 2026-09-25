import { AnnotationsHeader } from "@/app/annotations/annotations-header";
import { formatAnnotationDate, type MarkdownNote } from "@/lib/annotations";
import { requireUser } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function contentPreview(content: string) {
  const plainText = content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`~\[\]()-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return plainText || "Anotação sem conteúdo.";
}

export default async function NotesPage() {
  if (!hasSupabaseEnv()) redirect("/");
  const userId = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("markdown_notes")
    .select("id, title, content, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw new Error("Não foi possível carregar as anotações. Execute a migração 20260925000000 no Supabase.");
  const notes = (data ?? []) as MarkdownNote[];

  return (
    <main className="min-h-screen bg-stone-50 pb-12 text-stone-900">
      <AnnotationsHeader active="notes" title="Anotações" description="Textos livres escritos em Markdown e exibidos com formatação." />
      <section className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><h2 className="text-xl font-semibold">Todas as anotações</h2><p className="mt-1 text-sm text-stone-600">{notes.length} {notes.length === 1 ? "anotação criada" : "anotações criadas"}</p></div>
          <Link href="/annotations/notes/new" className="rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-800">+ Nova anotação</Link>
        </div>

        {notes.length ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {notes.map((note) => (
              <Link key={note.id} href={`/annotations/notes/${note.id}`} className="group flex min-h-56 flex-col rounded-3xl border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md">
                <span className="text-xs font-semibold tracking-[0.14em] text-fuchsia-700 uppercase">Markdown</span>
                <h3 className="mt-3 text-xl font-semibold leading-7 group-hover:text-violet-800">{note.title}</h3>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-stone-600">{contentPreview(note.content)}</p>
                <p className="mt-auto pt-6 text-xs text-stone-500">Atualizada em {formatAnnotationDate(note.updated_at)}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-14 text-center">
            <h3 className="text-lg font-semibold">Nenhuma anotação criada</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-600">Registre ideias, referências ou qualquer conteúdo usando Markdown.</p>
            <Link href="/annotations/notes/new" className="mt-5 inline-flex rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-800">Criar primeira anotação</Link>
          </div>
        )}
      </section>
    </main>
  );
}
