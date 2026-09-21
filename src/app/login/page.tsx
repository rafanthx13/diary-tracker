import { signIn } from "@/app/actions";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import Link from "next/link";
import { redirect } from "next/navigation";

type LoginPageProps = { searchParams: Promise<{ erro?: string }> };

export default async function LoginPage({ searchParams }: LoginPageProps) {
  if (!hasSupabaseEnv()) redirect("/");
  const { erro } = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center bg-stone-50 px-6 py-12 text-stone-900">
      <section className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-7 shadow-sm sm:p-10">
        <Link href="/" className="text-sm font-semibold tracking-[0.18em] text-emerald-700 uppercase">Diary Tracker</Link>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight">Entrar</h1>
        <p className="mt-3 leading-7 text-stone-600">Este espaço é privado. Use a conta criada no painel do Supabase.</p>
        {erro === "credenciais" && <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">E-mail ou senha inválidos.</p>}
        <form action={signIn} className="mt-7 space-y-5">
          <label className="block text-sm font-medium">E-mail
            <input name="email" type="email" autoComplete="email" required className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-3 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />
          </label>
          <label className="block text-sm font-medium">Senha
            <input name="password" type="password" autoComplete="current-password" required className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-3 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />
          </label>
          <button className="w-full rounded-xl bg-emerald-700 px-4 py-3 font-medium text-white transition hover:bg-emerald-800">Entrar no diário</button>
        </form>
      </section>
    </main>
  );
}
