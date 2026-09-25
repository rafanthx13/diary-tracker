import { AnnotationsHeader } from "@/app/annotations/annotations-header";
import { formatAnnotationDate, type Protocol, type ProtocolDemand } from "@/lib/annotations";
import { requireUser } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }> };

export default async function ProtocolDetailPage({ params }: Props) {
  if (!hasSupabaseEnv()) redirect("/");
  const userId = await requireUser();
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: protocolData, error: protocolError }, { data: demandsData, error: demandsError }] = await Promise.all([
    supabase.from("protocols").select("id, title, created_at, updated_at").eq("id", id).eq("user_id", userId).maybeSingle(),
    supabase.from("protocol_demands").select("id, content, sort_order").eq("protocol_id", id).eq("user_id", userId).order("sort_order"),
  ]);

  if (protocolError || demandsError) throw new Error("Não foi possível carregar o protocolo.");
  if (!protocolData) notFound();
  const protocol = protocolData as Protocol;
  const demands = (demandsData ?? []) as ProtocolDemand[];

  return (
    <main className="min-h-screen bg-stone-50 pb-12 text-stone-900">
      <AnnotationsHeader active="protocols" title={protocol.title} description={`Atualizado em ${formatAnnotationDate(protocol.updated_at)}`} />
      <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8">
        <div className="mb-5 flex flex-wrap justify-between gap-3">
          <Link href="/annotations/protocols" className="rounded-xl px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-200">← Voltar aos protocolos</Link>
          <Link href={`/annotations/protocols/${protocol.id}/edit`} className="rounded-xl bg-violet-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-800">Editar protocolo</Link>
        </div>
        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="flex items-center justify-between gap-4 border-b border-stone-200 pb-5"><h2 className="text-xl font-semibold">Demandas</h2><span className="rounded-full bg-violet-100 px-3 py-1 text-sm font-semibold text-violet-800">{demands.length}</span></div>
          {demands.length ? (
            <ol className="mt-6 space-y-4">
              {demands.map((demand) => (
                <li key={demand.id} className="grid grid-cols-[3rem_1fr] items-start gap-4 rounded-2xl border border-stone-200 bg-stone-50 p-4 sm:grid-cols-[3.5rem_1fr] sm:p-5">
                  <span className="grid size-12 place-items-center rounded-2xl bg-violet-700 text-lg font-bold text-white">{demand.sort_order}</span>
                  <p className="whitespace-pre-wrap pt-2 leading-7 text-stone-800">{demand.content}</p>
                </li>
              ))}
            </ol>
          ) : <p className="mt-6 rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-5 py-10 text-center text-sm text-stone-500">Este protocolo ainda não possui demandas.</p>}
        </section>
      </div>
    </main>
  );
}
