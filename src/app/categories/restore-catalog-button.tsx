"use client";

import { restoreInitialCatalogWithFeedback } from "@/app/actions";
import { initialClassificationFormState, type ClassificationFormState } from "@/lib/classification-form-state";
import { useActionState } from "react";

export function RestoreCatalogButton() {
  const [state, formAction, isPending] = useActionState<ClassificationFormState, FormData>(
    restoreInitialCatalogWithFeedback,
    initialClassificationFormState,
  );

  return (
    <>
      {state.status !== "idle" && (
        <div role="status" className={`fixed right-4 bottom-4 z-50 max-w-sm rounded-2xl px-4 py-3 text-sm font-medium shadow-lg ${state.status === "success" ? "bg-emerald-700 text-white" : "bg-red-700 text-white"}`}>
          {state.message}
        </div>
      )}
      <form action={formAction}>
        <button disabled={isPending} className="mt-3 rounded-xl bg-amber-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-50">
          {isPending ? "Restaurando..." : "Restaurar catálogo inicial"}
        </button>
      </form>
    </>
  );
}
