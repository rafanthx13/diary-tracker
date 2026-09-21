import { hasSupabaseEnv } from "@/lib/supabase/env";
import Link from "next/link";
import { redirect } from "next/navigation";

export default function Home() {
  if (hasSupabaseEnv()) redirect("/today");

  return (
    <main className="grid min-h-screen place-items-center bg-stone-50 px-6 py-12 text-stone-900">
      <section className="w-full max-w-xl rounded-3xl border border-stone-200 bg-white p-7 shadow-sm sm:p-10">
        <p className="text-sm font-semibold tracking-[0.18em] text-emerald-700 uppercase">Diary Tracker</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Conecte o Supabase para começar.</h1>
        <p className="mt-4 leading-7 text-stone-600">A interface e a segurança já estão prontas. Falta informar a URL e a chave pública do seu projeto Supabase.</p>
        <ol className="mt-7 space-y-3 rounded-2xl bg-stone-50 p-5 text-sm leading-6 text-stone-700">
          <li><span className="font-semibold">1.</span> Execute a migração SQL no Supabase.</li>
          <li><span className="font-semibold">2.</span> Crie sua conta privada no painel de autenticação.</li>
          <li><span className="font-semibold">3.</span> Crie o arquivo <code>.env.local</code> a partir de <code>.env.example</code>.</li>
        </ol>
        <Link className="mt-7 inline-flex rounded-xl bg-emerald-700 px-4 py-3 font-medium text-white transition hover:bg-emerald-800" href="https://supabase.com/dashboard">Abrir Supabase</Link>
      </section>
    </main>
  );
}
