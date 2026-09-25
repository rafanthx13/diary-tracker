import { AnnotationsHeader } from "@/app/annotations/annotations-header";
import { type Protocol, type ProtocolDemand } from "@/lib/annotations";
import { requireUser } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { ProtocolForm } from "../../protocol-form";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }> };

export default async function EditProtocolPage({ params }: Props) {
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

  return (
    <main className="min-h-screen bg-stone-50 pb-12 text-stone-900">
      <AnnotationsHeader active="protocols" title="Editar protocolo" description="Altere o título, o texto e a ordem das demandas." />
      <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8"><section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8"><ProtocolForm mode="edit" protocolId={protocol.id} initialTitle={protocol.title} initialDemands={(demandsData ?? []) as ProtocolDemand[]} /></section></div>
    </main>
  );
}
