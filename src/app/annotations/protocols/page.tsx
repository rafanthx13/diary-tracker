import { AnnotationsHeader } from "@/app/annotations/annotations-header";
import { formatAnnotationDate, type Protocol } from "@/lib/annotations";
import { requireUser } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProtocolsPage() {
  if (!hasSupabaseEnv()) redirect("/");
  const userId = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("protocols")
    .select("id, title, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw new Error("Não foi possível carregar os protocolos. Execute a migração 20260925000000 no Supabase.");
  const protocols = (data ?? []) as Protocol[];

  return (
    <main className="min-h-screen bg-stone-50 pb-12 text-stone-900">
      <AnnotationsHeader active="protocols" title="Protocolos" description="Demandas organizadas em uma sequência clara e editável." />
      <section className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><h2 className="text-xl font-semibold">Todos os protocolos</h2><p className="mt-1 text-sm text-stone-600">{protocols.length} {protocols.length === 1 ? "protocolo criado" : "protocolos criados"}</p></div>
          <Link href="/annotations/protocols/new" className="rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-800">+ Novo protocolo</Link>
        </div>

        {protocols.length ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {protocols.map((protocol) => (
              <Link key={protocol.id} href={`/annotations/protocols/${protocol.id}`} className="group flex min-h-44 flex-col rounded-3xl border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md">
                <span className="text-xs font-semibold tracking-[0.14em] text-violet-700 uppercase">Protocolo</span>
                <h3 className="mt-3 text-xl font-semibold leading-7 group-hover:text-violet-800">{protocol.title}</h3>
                <p className="mt-auto pt-6 text-xs text-stone-500">Atualizado em {formatAnnotationDate(protocol.updated_at)}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-14 text-center">
            <h3 className="text-lg font-semibold">Nenhum protocolo criado</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-600">Crie seu primeiro protocolo e organize as demandas na ordem em que devem ser executadas.</p>
            <Link href="/annotations/protocols/new" className="mt-5 inline-flex rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-800">Criar primeiro protocolo</Link>
          </div>
        )}
      </section>
    </main>
  );
}
