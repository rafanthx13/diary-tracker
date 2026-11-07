import { type Agenda, type AgendaColor, type AgendaInterval, formatDuration, minutesToTime } from "@/lib/agenda";
import { requireUser } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const shades: Record<AgendaColor, string> = {
  emerald: "bg-emerald-500 border-emerald-600 text-emerald-950", blue: "bg-blue-500 border-blue-600 text-blue-950",
  violet: "bg-violet-500 border-violet-600 text-violet-950", amber: "bg-amber-400 border-amber-500 text-amber-950",
  rose: "bg-rose-500 border-rose-600 text-rose-950", cyan: "bg-cyan-500 border-cyan-600 text-cyan-950",
  orange: "bg-orange-400 border-orange-500 text-orange-950", lime: "bg-lime-400 border-lime-500 text-lime-950",
};

export default async function AgendaVisualizarPage() {
  if (!hasSupabaseEnv()) redirect("/");
  const userId = await requireUser();
  const supabase = await createClient();
  const { data: agendas, error: agendasError } = await supabase.from("agendas").select("id, title, day_starts_at, updated_at").eq("user_id", userId).order("updated_at", { ascending: false });
  const { data: intervals, error: intervalsError } = await supabase.from("agenda_intervals").select("id, agenda_id, title, color, sort_order, starts_at, ends_at").eq("user_id", userId).order("sort_order");
  if (agendasError || intervalsError) throw new Error("Não foi possível carregar as agendas.");
  const agendaRows = (agendas ?? []) as Agenda[];
  const intervalRows = (intervals ?? []) as AgendaInterval[];

  return <main className="min-h-screen bg-stone-50 pb-12 text-stone-900">
    <header className="border-b border-stone-200 bg-white"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-6 sm:px-8"><div><p className="text-sm font-semibold tracking-[0.18em] text-sky-700 uppercase">Agenda</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Todas as agendas</h1><p className="mt-2 text-sm leading-6 text-stone-600">Visualize suas rotinas sem os campos de edição.</p></div><Link href="/agenda" className="rounded-xl border border-sky-200 px-4 py-3 text-sm font-semibold text-sky-800 hover:bg-sky-50">Editar agendas</Link></div></header>
    <section className="mx-auto max-w-7xl px-5 py-7 sm:px-8">{agendaRows.length ? <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{agendaRows.map((agenda) => <AgendaCard key={agenda.id} agenda={agenda} intervals={intervalRows.filter((item) => item.agenda_id === agenda.id)} />)}</div> : <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-10 text-center"><h2 className="text-xl font-semibold">Nenhuma agenda criada</h2><p className="mt-2 text-sm text-stone-600">Crie uma agenda para ver seu ciclo de 24 horas aqui.</p><Link href="/agenda" className="mt-5 inline-flex rounded-xl bg-sky-700 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-800">Criar agenda</Link></div>}</section>
  </main>;
}

function AgendaCard({ agenda, intervals }: { agenda: Agenda; intervals: AgendaInterval[] }) {
  return <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm"><div className="flex items-baseline justify-between gap-3"><div><p className="text-xs font-semibold tracking-wide text-sky-700 uppercase">Começa às {minutesToTime(agenda.day_starts_at)}</p><h2 className="mt-1 text-xl font-semibold">{agenda.title}</h2></div><span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs text-stone-600">{intervals.length} blocos</span></div><div className="mt-5 max-h-[70vh] overflow-y-auto pr-2"><div className="relative ml-12 border-l-2 border-stone-200 pt-3">{intervals.map((interval, index) => { const duration = interval.ends_at - interval.starts_at; const height = Math.max(76, duration * 0.52); return <div key={interval.id} className="relative border-b border-white/70" style={{ height: height + "px" }}><time className="absolute -left-12 -top-2 w-10 text-right text-xs text-stone-500">{minutesToTime(agenda.day_starts_at + interval.starts_at)}</time><div className={"ml-3 h-full rounded-xl border p-3 pb-5 " + shades[interval.color]}><p className="font-semibold leading-5">{interval.title}</p><p className="mt-1 text-xs opacity-80">{minutesToTime(agenda.day_starts_at + interval.starts_at)} – {minutesToTime(agenda.day_starts_at + interval.ends_at)} · {formatDuration(duration)}</p></div>{index === intervals.length - 1 ? <time className="absolute -bottom-2 -left-12 w-10 text-right text-xs text-stone-500">{minutesToTime(agenda.day_starts_at + interval.ends_at)}</time> : null}</div>; })}</div></div></article>;
}
