"use client";

import { recordClientError } from "@/app/diagnostics/actions";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    void recordClientError(error.digest ?? "unhandled_global_error");
  }, [error]);

  return (
    <html lang="pt-BR">
      <body className="m-0 grid min-h-screen place-items-center bg-stone-50 px-6 py-12 font-sans text-stone-900">
        <main className="w-full max-w-xl rounded-3xl border border-amber-200 bg-white p-7 shadow-sm sm:p-10">
          <p className="text-sm font-semibold tracking-[0.18em] text-amber-700 uppercase">Diary Tracker</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">Ocorreu um problema inesperado.</h1>
          <p className="mt-4 leading-7 text-stone-600">Nenhum dado pessoal é mostrado nesta tela. Tente abrir a aplicação novamente.</p>
          <button type="button" onClick={reset} className="mt-7 rounded-xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white hover:bg-stone-700">Tentar novamente</button>
        </main>
      </body>
    </html>
  );
}
