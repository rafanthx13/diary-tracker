import { signOut } from "@/app/actions";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export async function AppNavbar() {
  if (!hasSupabaseEnv()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;

  return <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/95 text-stone-900 shadow-sm backdrop-blur"><nav aria-label="Navegação principal" className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-3 py-3 sm:px-8"><Link href="/" className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium hover:bg-stone-100">Home</Link><Link href="/today" className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium hover:bg-stone-100">Tempo</Link><Link href="/diary-task" className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium hover:bg-stone-100">Diary Task</Link><Link href="/tasks" className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium hover:bg-stone-100">TODO List</Link><Link href="/annotations" className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium hover:bg-stone-100">Anotações</Link><form action={signOut} className="ml-auto shrink-0"><button className="rounded-lg px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100">Sair</button></form></nav></header>;
}
