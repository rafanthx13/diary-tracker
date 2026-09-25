import { createNote, updateNote } from "@/app/annotations/actions";
import Link from "next/link";

type Props = {
  mode: "create" | "edit";
  noteId?: string;
  initialTitle?: string;
  initialContent?: string;
};

export function NoteForm({ mode, noteId, initialTitle = "", initialContent = "" }: Props) {
  const cancelHref = mode === "edit" && noteId ? `/annotations/notes/${noteId}` : "/annotations/notes";

  return (
    <form action={mode === "create" ? createNote : updateNote} className="space-y-6">
      {noteId && <input type="hidden" name="noteId" value={noteId} />}
      <label className="block text-sm font-semibold text-stone-800">
        Título <span className="text-red-600">*</span>
        <input name="title" required maxLength={160} defaultValue={initialTitle} autoFocus placeholder="Ex.: Ideias para o próximo projeto" className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-base outline-none transition focus:border-violet-600 focus:ring-2 focus:ring-violet-100" />
      </label>
      <label className="block text-sm font-semibold text-stone-800">
        Conteúdo em Markdown
        <textarea
          name="content"
          maxLength={100000}
          defaultValue={initialContent}
          rows={20}
          spellCheck
          placeholder={"# Título\n\nEscreva sua anotação usando **Markdown**.\n\n- Item 1\n- Item 2"}
          className="mt-2 min-h-96 w-full resize-y rounded-2xl border border-stone-300 bg-stone-950 px-4 py-4 font-mono text-sm leading-7 text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
        />
        <span className="mt-2 block text-xs font-normal leading-5 text-stone-500">Use títulos, listas, links, citações, tabelas e blocos de código. O Markdown será formatado na visualização.</span>
      </label>
      <div className="flex flex-wrap justify-end gap-3 border-t border-stone-200 pt-6">
        <Link href={cancelHref} className="rounded-xl px-5 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-100">Cancelar</Link>
        <button className="rounded-xl bg-violet-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-800">{mode === "create" ? "Criar anotação" : "Salvar alterações"}</button>
      </div>
    </form>
  );
}
