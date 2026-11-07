import { AgendaWorkspace } from "./agenda-workspace";
import { requireUser } from "@/lib/auth";
import { type Agenda, type AgendaInterval } from "@/lib/agenda";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AgendaPage() {
  if (!hasSupabaseEnv()) redirect("/");
  const userId = await requireUser();
  const supabase = await createClient();
  const { data: agendas, error: agendasError } = await supabase.from("agendas").select("id, title, day_starts_at, updated_at").eq("user_id", userId).order("updated_at", { ascending: false });
  const { data: intervals, error: intervalsError } = await supabase.from("agenda_intervals").select("id, agenda_id, title, color, sort_order, starts_at, ends_at").eq("user_id", userId).order("sort_order");
  if (agendasError || intervalsError) throw new Error("Não foi possível carregar as agendas. Execute a migração 20261105010000 no Supabase.");
  return <AgendaWorkspace agendas={(agendas ?? []) as Agenda[]} intervals={(intervals ?? []) as AgendaInterval[]} />;
}
