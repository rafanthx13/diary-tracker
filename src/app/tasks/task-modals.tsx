"use client";

import { deleteTask, updateTaskTitle } from "@/app/actions";
import type { Task } from "@/lib/tasks";
import { useRef, type FormEvent } from "react";

export function EditTaskModal({ task }: { task: Task }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  function closeAfterSaving(event: FormEvent<HTMLFormElement>) {
    event.currentTarget.closest("dialog")?.close();
  }

  return (
    <>
      <button type="button" onClick={() => dialogRef.current?.showModal()} aria-label={`Editar ${task.title}`} title="Editar tarefa" className="grid size-9 place-items-center rounded-xl border-2 border-stone-300 text-stone-600 transition hover:border-emerald-600 hover:bg-emerald-50 hover:text-emerald-800">
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 fill-none stroke-current stroke-2"><path d="m4 16.5-.8 4.3 4.3-.8L18.8 8.7a2.1 2.1 0 0 0-3-3L4.5 17Z" /><path d="m14.5 7 3 3" /></svg>
      </button>
      <dialog ref={dialogRef} className="m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl border border-stone-200 bg-white p-0 text-stone-900 shadow-2xl backdrop:bg-stone-950/50">
        <div className="flex items-start justify-between gap-4 border-b border-stone-200 px-5 py-4 sm:px-6">
          <div><h2 className="text-xl font-semibold">Editar tarefa</h2><p className="mt-1 text-sm leading-6 text-stone-600">Altere o nome desta tarefa.</p></div>
          <button type="button" onClick={() => dialogRef.current?.close()} aria-label="Fechar" className="grid size-9 shrink-0 place-items-center rounded-xl bg-stone-100 text-lg hover:bg-stone-200">×</button>
        </div>
        <form action={updateTaskTitle} onSubmit={closeAfterSaving} className="space-y-4 p-5 sm:p-6">
          <input type="hidden" name="taskId" value={task.id} />
          <label className="block text-sm font-medium">Nome da tarefa<input name="title" required maxLength={240} defaultValue={task.title} className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></label>
          <div className="flex justify-end gap-2"><button type="button" onClick={() => dialogRef.current?.close()} className="rounded-xl px-4 py-3 text-sm font-medium hover:bg-stone-100">Cancelar</button><button className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800">Salvar</button></div>
        </form>
      </dialog>
    </>
  );
}

export function DeleteTaskButton({ task }: { task: Task }) {
  function confirmDeletion(event: FormEvent<HTMLFormElement>) {
    if (!window.confirm(`Excluir a tarefa “${task.title}”? Essa ação não pode ser desfeita.`)) event.preventDefault();
  }

  return <form action={deleteTask} onSubmit={confirmDeletion}><input type="hidden" name="taskId" value={task.id} /><button aria-label={`Excluir ${task.title}`} title="Excluir tarefa" className="grid size-9 place-items-center rounded-xl border-2 border-red-200 text-red-700 transition hover:border-red-600 hover:bg-red-50"><svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 fill-none stroke-current stroke-2"><path d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v5m4-5v5" /></svg></button></form>;
}
