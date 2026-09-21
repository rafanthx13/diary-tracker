"use client";

import {
  createClassificationWithFeedback,
} from "@/app/actions";
import { initialClassificationFormState, type ClassificationFormState } from "@/lib/classification-form-state";
import { useActionState } from "react";

type CategoryOption = { id: string; name: string };

export function CreateClassificationForm({ categories }: { categories: CategoryOption[] }) {
  const [state, formAction, isPending] = useActionState<ClassificationFormState, FormData>(
    createClassificationWithFeedback,
    initialClassificationFormState,
  );
  return (
    <>
      {state.status !== "idle" && (
        <div
          role="status"
          className={`fixed right-4 bottom-4 z-50 max-w-sm rounded-2xl px-4 py-3 text-sm font-medium shadow-lg ${state.status === "success" ? "bg-emerald-700 text-white" : "bg-red-700 text-white"}`}
        >
          {state.message}
        </div>
      )}
      <form action={formAction} className="mt-5 space-y-4">
        <label className="block text-sm font-medium">
          Nome
          <input name="name" required maxLength={120} placeholder="Ex.: Ler um livro" className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-3 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />
        </label>
        <label className="block text-sm font-medium">
          Categoria
          <select name="categoryId" required defaultValue="" className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-3 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100">
            <option value="" disabled>Escolha uma categoria</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </label>
        <button disabled={!categories.length || isPending} className="w-full rounded-xl bg-emerald-700 px-4 py-3 font-medium text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50">
          {isPending ? "Criando..." : "Criar classificação"}
        </button>
      </form>
    </>
  );
}
