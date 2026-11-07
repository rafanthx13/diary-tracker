"use client";

import { clearQuickNote, saveQuickNote } from "./actions";
import { startTransition, useState } from "react";

export function QuickNoteEditor({ initialContent }: { initialContent: string }) {
  const [content, setContent] = useState(initialContent);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  function save() {
    const formData = new FormData();
    formData.set("content", content);
    setPending(true);
    setMessage("");
    startTransition(async () => {
      try {
        await saveQuickNote(formData);
        setMessage("Anotação salva.");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Não foi possível salvar.");
      } finally {
        setPending(false);
      }
    });
  }

  function clear() {
    if (!confirm("Apagar todo o conteúdo da anotação rápida?")) return;
    setPending(true);
    setMessage("");
    startTransition(async () => {
      try {
        await clearQuickNote();
        setContent("");
        setMessage("Anotação apagada.");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Não foi possível apagar.");
      } finally {
        setPending(false);
      }
    });
  }

  return <section className="mx-auto max-w-4xl px-5 py-6 sm:px-8"><div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7"><label htmlFor="quick-note-content" className="block text-sm font-semibold">Sua anotação</label><textarea id="quick-note-content" value={content} onChange={(event) => setContent(event.target.value)} maxLength={100000} rows={7} placeholder="Escreva algo rápido para lembrar depois…" className="mt-3 min-h-40 w-full resize-y rounded-2xl border border-stone-300 p-4 leading-7 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100" /><div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-stone-500"><span>{content.length.toLocaleString("pt-BR")} / 100.000 caracteres</span>{message ? <span role="status" className="font-medium text-stone-700">{message}</span> : null}</div><div className="mt-5 flex flex-wrap justify-end gap-3"><button type="button" onClick={clear} disabled={pending || !content} className="rounded-xl border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50">Apagar tudo</button><button type="button" onClick={save} disabled={pending} className="rounded-xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50">{pending ? "Salvando…" : "Salvar anotação"}</button></div></div></section>;
}
