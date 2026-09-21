import { HealthHeader } from "@/app/health-data/health-header";
import { HealthLineChart } from "@/components/health-line-chart";
import { requireUser } from "@/lib/auth";
import { formatDecimal, formatHealthDate, type MeasurementType } from "@/lib/health";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<{ type?: string | string[] }> };

export default async function MeasurementReportsPage({ searchParams }: Props) {
  const userId = await requireUser();
  const supabase = await createClient();
  const [{ data: typeData, error: typeError }, { data: sessionData, error: sessionError }] = await Promise.all([
    supabase.from("body_measurement_types").select("id, name, instructions, unit, sort_order").eq("user_id", userId).order("sort_order").order("created_at"),
    supabase.from("body_measurement_sessions").select("id, measured_on").eq("user_id", userId).order("measured_on"),
  ]);
  if (typeError || sessionError) throw new Error("Não foi possível carregar os relatórios de medidas.");
  const types = (typeData ?? []) as MeasurementType[];
  const rawType = (await searchParams).type;
  const requestedType = Array.isArray(rawType) ? rawType[0] : rawType;
  const activeType = types.find((type) => type.id === requestedType) ?? types[0];
  const sessions = sessionData ?? [];
  const sessionDates = new Map(sessions.map((session) => [session.id, session.measured_on]));
  const { data: valueData, error: valueError } = activeType
    ? await supabase.from("body_measurement_values").select("id, session_id, value").eq("user_id", userId).eq("measurement_type_id", activeType.id)
    : { data: [], error: null };
  if (valueError) throw new Error("Não foi possível carregar a evolução desta medida.");
  const points = (valueData ?? []).map((value) => ({ id: value.id, date: sessionDates.get(value.session_id) ?? "", value: Number(value.value) })).filter((point) => point.date).sort((first, second) => first.date.localeCompare(second.date));
  const first = points[0];
  const latest = points.at(-1);
  const change = first && latest ? latest.value - first.value : null;
  const percentage = first?.value && change !== null ? change / first.value * 100 : null;
  const minimum = points.length ? Math.min(...points.map((point) => point.value)) : null;
  const maximum = points.length ? Math.max(...points.map((point) => point.value)) : null;

  return <main className="min-h-screen bg-stone-50 pb-12 text-stone-900"><HealthHeader title="Relatórios de medidas" description="Escolha uma parte do corpo para visualizar sua evolução." backHref="/health-data/measurements" backLabel="Medidas corporais" /><div className="mx-auto max-w-6xl space-y-6 px-5 py-6 sm:px-8">{types.length ? <><section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"><form className="flex flex-col gap-3 sm:flex-row sm:items-end"><label className="flex-1 text-sm font-medium">Parte do corpo<select name="type" defaultValue={activeType?.id} className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-100">{types.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}</select></label><button className="rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-stone-700">Visualizar</button></form></section><section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Última medida" value={latest ? `${formatDecimal(latest.value)} ${activeType!.unit}` : "—"} /><Metric label="Evolução total" value={change === null ? "—" : `${change > 0 ? "+" : ""}${formatDecimal(change)} ${activeType!.unit}${percentage === null ? "" : ` · ${percentage > 0 ? "+" : ""}${formatDecimal(percentage, 1)}%`}`} /><Metric label="Menor medida" value={minimum === null ? "—" : `${formatDecimal(minimum)} ${activeType!.unit}`} /><Metric label="Maior medida" value={maximum === null ? "—" : `${formatDecimal(maximum)} ${activeType!.unit}`} /></section><section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="text-xl font-semibold">{activeType!.name}</h2>{activeType!.instructions && <p className="mt-1 text-sm text-stone-500">Padrão de medição: {activeType!.instructions}</p>}<div className="mt-5"><HealthLineChart points={points} unit={activeType!.unit} label={activeType!.name} /></div></section>{points.length > 0 && <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="text-xl font-semibold">Histórico</h2><div className="mt-4 divide-y divide-stone-100">{[...points].reverse().map((point) => <div key={point.id} className="flex items-center justify-between gap-4 py-3"><time className="text-sm text-stone-500">{formatHealthDate(point.date)}</time><strong>{formatDecimal(point.value)} {activeType!.unit}</strong></div>)}</div></section>}</> : <section className="rounded-3xl border border-dashed border-stone-300 bg-white p-10 text-center text-stone-500">Cadastre uma parte do corpo antes de abrir os relatórios.</section>}</div></main>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"><p className="text-sm text-stone-500">{label}</p><p className="mt-2 text-xl font-semibold">{value}</p></article>;
}
