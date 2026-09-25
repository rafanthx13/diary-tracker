"use client";

import { initialRestoreBackupState, restorePersonalBackup } from "@/app/admin/actions";
import { useActionState } from "react";

export function RestoreBackupForm() {
  const [state, formAction, pending] = useActionState(restorePersonalBackup, initialRestoreBackupState);

  return (
    <form action={formAction} className="mt-6 space-y-5">
      <label className="block text-sm font-semibold">
        Arquivo de backup JSON
        <input name="backup" type="file" accept="application/json,.json" required className="mt-2 block w-full cursor-pointer rounded-xl border border-stone-300 bg-stone-50 px-3 py-3 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-rose-100 file:px-3 file:py-2 file:font-semibold file:text-rose-800" />
      </label>

      <fieldset className="space-y-3 rounded-2xl border border-stone-200 p-4">
        <legend className="px-1 text-sm font-semibold">Modo de restauração</legend>
        <label className="flex gap-3 text-sm leading-6"><input type="radio" name="mode" value="merge" defaultChecked className="mt-1" /><span><strong>Mesclar dados</strong><br /><span className="text-stone-600">Adiciona ou atualiza os registros do backup e preserva os dados atuais que não aparecem no arquivo.</span></span></label>
        <label className="flex gap-3 text-sm leading-6"><input type="radio" name="mode" value="replace" className="mt-1" /><span><strong>Substituir todos os dados pessoais</strong><br /><span className="text-red-700">Remove os seus registros atuais antes de restaurar o arquivo. Esta opção não pode ser desfeita.</span></span></label>
      </fieldset>

      <label className="block text-sm font-semibold">Para confirmar, digite <code className="rounded bg-stone-100 px-1.5 py-0.5 text-rose-800">RESTAURAR</code><input name="confirmation" required autoComplete="off" className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-3 outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-100" /></label>

      {state.status !== "idle" && <p aria-live="polite" className={`rounded-xl px-4 py-3 text-sm leading-6 ${state.status === "success" ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-900"}`}>{state.message}</p>}
      <button disabled={pending} className="rounded-xl bg-rose-700 px-5 py-3 text-sm font-semibold text-white hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-60">{pending ? "Restaurando…" : "Restaurar backup"}</button>
    </form>
  );
}
