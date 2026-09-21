"use client";

import { createManualActivity, updateActivity } from "@/app/actions";
import type { Activity } from "@/lib/diary";
import { toDateTimeLocal } from "@/lib/diary";
import { useRef, type FormEvent, type MouseEvent, type ReactNode } from "react";

type ClassificationOption = {
  id: string;
  name: string;
  categoryName: string | null;
};

function Modal({ trigger, title, description, children }: { trigger: ReactNode; title: string; description: string; children: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button type="button" onClick={() => dialogRef.current?.showModal()} className="contents">{trigger}</button>
      <dialog ref={dialogRef} className="m-auto w-[calc(100%-2rem)] max-w-xl rounded-3xl border border-stone-200 bg-white p-0 text-stone-900 shadow-2xl backdrop:bg-stone-950/50">
        <div className="flex items-start justify-between gap-4 border-b border-stone-200 px-5 py-4 sm:px-6">
          <div><h2 className="text-xl font-semibold">{title}</h2><p className="mt-1 text-sm leading-6 text-stone-600">{description}</p></div>
          <button type="button" onClick={() => dialogRef.current?.close()} aria-label="Fechar" className="grid size-9 shrink-0 place-items-center rounded-xl bg-stone-100 text-lg hover:bg-stone-200">×</button>
        </div>
        {children}
      </dialog>
    </>
  );
}

function closeFromForm(event: FormEvent<HTMLFormElement>) { event.currentTarget.closest("dialog")?.close(); }
function closeFromButton(event: MouseEvent<HTMLButtonElement>) { event.currentTarget.closest("dialog")?.close(); }

function ClassificationSelect({ options, defaultValue }: { options: ClassificationOption[]; defaultValue?: string }) {
  return <label className="block text-sm font-medium">Classificação<select name="classificationId" required defaultValue={defaultValue ?? ""} className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"><option value="" disabled>Escolha uma classificação</option>{options.map((option) => <option key={option.id} value={option.id}>{option.name}{option.categoryName ? ` · ${option.categoryName}` : ""}</option>)}</select></label>;
}

export function ManualActivityModal({ options, defaultStart, defaultEnd, dateLabel }: { options: ClassificationOption[]; defaultStart: string; defaultEnd: string; dateLabel: string }) {
  return (
    <Modal trigger={<span className="inline-flex w-full items-center justify-center rounded-xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white hover:bg-stone-700">+ Adicionar manualmente</span>} title="Registrar um período" description={`Adicione uma atividade que já aconteceu em ${dateLabel}.`}>
      <form action={createManualActivity} onSubmit={closeFromForm} className="space-y-4 p-5 sm:p-6"><label className="block text-sm font-medium">Atividade<input name="title" required placeholder="Ex.: Arrumar quarto" className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></label><ClassificationSelect options={options} /><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium">Início<input name="startedAt" type="datetime-local" defaultValue={defaultStart} required className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></label><label className="block text-sm font-medium">Fim<input name="endedAt" type="datetime-local" defaultValue={defaultEnd} required className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></label></div><div className="flex justify-end gap-2 pt-2"><button type="button" onClick={closeFromButton} className="rounded-xl px-4 py-3 text-sm font-medium hover:bg-stone-100">Cancelar</button><button disabled={!options.length} className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">Salvar período</button></div></form>
    </Modal>
  );
}

export function EditActivityModal({ activity, options }: { activity: Activity; options: ClassificationOption[] }) {
  return (
    <Modal trigger={<span className="inline-flex items-center rounded-lg bg-stone-100 px-2.5 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-200">Editar</span>} title="Editar atividade" description="Altere o nome, a classificação e os horários deste registro.">
      <form action={updateActivity} onSubmit={closeFromForm} className="space-y-4 p-5 sm:p-6"><input type="hidden" name="activityId" value={activity.id} /><label className="block text-sm font-medium">Atividade<input name="title" required defaultValue={activity.title} className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></label><ClassificationSelect options={options} defaultValue={activity.classification?.id} /><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium">Início<input name="startedAt" type="datetime-local" defaultValue={toDateTimeLocal(new Date(activity.started_at))} required className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></label><label className="block text-sm font-medium">Fim<input name="endedAt" type="datetime-local" defaultValue={activity.ended_at ? toDateTimeLocal(new Date(activity.ended_at)) : ""} required={Boolean(activity.ended_at)} className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></label></div>{!activity.ended_at && <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">Deixe o fim vazio para manter a atividade em andamento.</p>}<div className="flex justify-end gap-2 pt-2"><button type="button" onClick={closeFromButton} className="rounded-xl px-4 py-3 text-sm font-medium hover:bg-stone-100">Cancelar</button><button className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800">Salvar alterações</button></div></form>
    </Modal>
  );
}
