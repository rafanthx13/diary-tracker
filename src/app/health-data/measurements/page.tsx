import { saveBodyMeasurements } from "@/app/health-data/actions";
import { HealthHeader } from "@/app/health-data/health-header";
import { requireUser } from "@/lib/auth";
import { formatDecimal, formatHealthDate, validHealthDate, type MeasurementType } from "@/lib/health";
import { saoPauloDate } from "@/lib/tasks";
import { shiftIsoDate } from "@/lib/time-reports";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<{ date?: string | string[] }> };
type Session = { id: string; measured_on: string; notes: string };
type Value = { session_id: string; measurement_type_id: string; value: number };

function pageHref(date: string, today: string) {
  return date === today ? "/health-data/measurements" : `/health-data/measurements?date=${date}`;
}

export default async function MeasurementsPage({ searchParams }: Props) {
  const userId = await requireUser();
  const today = saoPauloDate();
  const rawDate = (await searchParams).date;
  const selectedDate = validHealthDate(Array.isArray(rawDate) ? rawDate[0] : rawDate, today);
  const supabase = await createClient();
  const [{ data: typeData, error: typeError }, { data: selectedSessionData, error: selectedError }, { data: recentData, error: recentError }] = await Promise.all([
    supabase.from("body_measurement_types").select("id, name, instructions, unit, sort_order").eq("user_id", userId).order("sort_order").order("created_at"),
    supabase.from("body_measurement_sessions").select("id, measured_on, notes").eq("user_id", userId).eq("measured_on", selectedDate).maybeSingle(),
    supabase.from("body_measurement_sessions").select("id, measured_on, notes").eq("user_id", userId).order("measured_on", { ascending: false }).limit(2),
  ]);
  if (typeError || selectedError || recentError) throw new Error("Não foi possível carregar suas medidas. Execute a migração 20260921060000 no Supabase.");
  const types = (typeData ?? []) as MeasurementType[];
  const selectedSession = selectedSessionData as Session | null;
  const recentSessions = (recentData ?? []) as Session[];
  const sessionIds = Array.from(new Set([selectedSession?.id, ...recentSessions.map((session) => session.id)].filter(Boolean))) as string[];
  const { data: valueData, error: valueError } = sessionIds.length
    ? await supabase.from("body_measurement_values").select("session_id, measurement_type_id, value").eq("user_id", userId).in("session_id", sessionIds)
    : { data: [], error: null };
  if (valueError) throw new Error("Não foi possível carregar os valores das medidas.");
  const values = (valueData ?? []).map((value) => ({ ...value, value: Number(value.value) })) as Value[];
  const selectedValues = new Map(values.filter((value) => value.session_id === selectedSession?.id).map((value) => [value.measurement_type_id, value.value]));
  const latest = recentSessions[0];
  const previous = recentSessions[1];
  const latestValues = new Map(values.filter((value) => value.session_id === latest?.id).map((value) => [value.measurement_type_id, value.value]));
  const previousValues = new Map(values.filter((value) => value.session_id === previous?.id).map((value) => [value.measurement_type_id, value.value]));
  const isToday = selectedDate === today;

  const actions = <><Link href="/health-data/measurements/types" className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-stone-50">⚙ Partes do corpo</Link><Link href="/health-data/measurements/import" className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-stone-50">↑ Importar</Link><Link href="/health-data/measurements/reports" className="rounded-xl bg-rose-700 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-800">▥ Relatórios</Link></>;
  return <main className="min-h-screen bg-stone-50 pb-12 text-stone-900"><HealthHeader title="Minhas medidas corporais" description="Selecione uma data e preencha somente as medidas que você fez naquele dia." actions={actions} /><div className="mx-auto max-w-6xl space-y-6 px-5 py-6 sm:px-8"><section className="flex flex-wrap items-center gap-2 rounded-2xl border border-stone-200 bg-white p-3 shadow-sm"><Link href={pageHref(shiftIsoDate(selectedDate, -1), today)} className="rounded-xl border border-stone-300 px-3 py-2 text-sm font-medium hover:bg-stone-50">← Dia anterior</Link><form action="/health-data/measurements" className="flex items-center gap-2"><label htmlFor="measurement-date" className="sr-only">Data</label><input id="measurement-date" name="date" type="date" max={today} defaultValue={selectedDate} className="rounded-xl border border-stone-300 px-3 py-2 text-sm outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-100" /><button className="rounded-xl bg-stone-900 px-3 py-2 text-sm font-semibold text-white hover:bg-stone-700">Abrir</button></form>{!isToday && <Link href={pageHref(shiftIsoDate(selectedDate, 1), today)} className="rounded-xl border border-stone-300 px-3 py-2 text-sm font-medium hover:bg-stone-50">Próximo dia →</Link>}{!isToday && <Link href="/health-data/measurements" className="rounded-xl px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50">Hoje</Link>}</section>

  {latest && <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6"><div><p className="text-sm text-stone-500">Última medição: {formatHealthDate(latest.measured_on)}</p><h2 className="mt-1 text-xl font-semibold">Evolução desde a medição anterior</h2>{previous && <p className="mt-1 text-sm text-stone-500">Comparada com {formatHealthDate(previous.measured_on)}</p>}</div><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{types.filter((type) => latestValues.has(type.id)).map((type) => { const value = latestValues.get(type.id)!; const before = previousValues.get(type.id); const delta = before === undefined ? null : value - before; const percent = before ? delta! / before * 100 : null; return <article key={type.id} className="rounded-2xl bg-stone-50 p-4"><p className="truncate text-sm font-medium text-stone-600">{type.name}</p><p className="mt-2 text-xl font-semibold">{formatDecimal(value)} {type.unit}</p><p className={`mt-1 text-sm ${delta === null ? "text-stone-400" : delta > 0 ? "text-amber-700" : delta < 0 ? "text-emerald-700" : "text-stone-500"}`}>{delta === null ? "Sem comparação" : `${delta > 0 ? "+" : ""}${formatDecimal(delta)} ${type.unit} (${percent === null ? "—" : `${percent > 0 ? "+" : ""}${formatDecimal(percent, 1)}%`})`}</p></article>; })}</div></section>}

  <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6"><p className="text-sm font-medium text-rose-700">{formatHealthDate(selectedDate)}</p><h2 className="mt-1 text-xl font-semibold">{selectedSession ? "Editar medidas desta data" : "Registrar medidas nesta data"}</h2>{types.length ? <form action={saveBodyMeasurements} className="mt-6"><input type="hidden" name="measuredOn" value={selectedDate} /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{types.map((type) => <label key={type.id} className="block rounded-2xl border border-stone-200 p-4 text-sm font-semibold"><span className="flex items-center justify-between gap-2"><span>{type.name}</span><span className="font-normal text-stone-400">{type.unit}</span></span>{type.instructions && <span className="mt-1 block min-h-10 text-xs font-normal leading-5 text-stone-500">{type.instructions}</span>}<input type="number" name={`measurement_${type.id}`} min="0.01" max="1000" step="0.01" inputMode="decimal" defaultValue={selectedValues.get(type.id)} placeholder="Não medido" className="mt-3 w-full rounded-xl border border-stone-300 px-3 py-2.5 text-base font-normal outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-100" /></label>)}</div><label className="mt-5 block text-sm font-medium">Observações <span className="font-normal text-stone-400">(opcional)</span><textarea name="notes" maxLength={500} rows={3} defaultValue={selectedSession?.notes} className="mt-2 w-full resize-none rounded-xl border border-stone-300 px-3 py-3 outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-100" /></label><button className="mt-5 rounded-xl bg-rose-700 px-5 py-3 font-semibold text-white hover:bg-rose-800">Salvar medidas</button></form> : <div className="mt-5 rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center"><p className="text-sm text-stone-500">Cadastre pelo menos uma parte do corpo antes de registrar medidas.</p><Link href="/health-data/measurements/types" className="mt-4 inline-flex rounded-xl bg-rose-700 px-4 py-2.5 text-sm font-semibold text-white">Gerenciar partes do corpo</Link></div>}</section></div></main>;
}
