import { HealthHeader } from "@/app/health-data/health-header";
import { HealthLineChart } from "@/components/health-line-chart";
import { requireUser } from "@/lib/auth";
import { formatDecimal, formatHealthDate, type WeightEntry } from "@/lib/health";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function WeightReportsPage() {
  const userId = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase.from("health_weight_entries").select("id, measured_on, weight_kg, notes").eq("user_id", userId).order("measured_on");
  if (error) throw new Error("Não foi possível carregar o relatório de peso.");
  const entries = (data ?? []).map((entry) => ({ ...entry, weight_kg: Number(entry.weight_kg) })) as WeightEntry[];
  const latest = entries.at(-1);
  const first = entries[0];
  const minimum = entries.length ? Math.min(...entries.map((entry) => entry.weight_kg)) : null;
  const maximum = entries.length ? Math.max(...entries.map((entry) => entry.weight_kg)) : null;
  const change = latest && first ? latest.weight_kg - first.weight_kg : null;

  return <main className="min-h-screen bg-stone-50 pb-12 text-stone-900"><HealthHeader title="Evolução do peso" description="O gráfico usa todos os seus registros, em ordem cronológica." backHref="/health-data/weight" backLabel="Meu peso" /><div className="mx-auto max-w-6xl space-y-6 px-5 py-6 sm:px-8"><section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Peso atual" value={latest ? `${formatDecimal(latest.weight_kg)} kg` : "—"} /><Metric label="Variação total" value={change === null ? "—" : `${change > 0 ? "+" : ""}${formatDecimal(change)} kg`} /><Metric label="Menor registro" value={minimum === null ? "—" : `${formatDecimal(minimum)} kg`} /><Metric label="Maior registro" value={maximum === null ? "—" : `${formatDecimal(maximum)} kg`} /></section><section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="text-xl font-semibold">Evolução diária</h2><p className="mt-1 text-sm text-stone-500">Cada ponto representa um dia em que o peso foi registrado.</p><div className="mt-5"><HealthLineChart points={entries.map((entry) => ({ date: entry.measured_on, value: entry.weight_kg }))} unit="kg" label="Peso" /></div></section>{entries.length > 0 && <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="text-xl font-semibold">Todos os registros</h2><div className="mt-4 divide-y divide-stone-100">{[...entries].reverse().map((entry) => <div key={entry.id} className="flex items-center justify-between gap-4 py-3"><span className="text-sm text-stone-500">{formatHealthDate(entry.measured_on)}</span><strong>{formatDecimal(entry.weight_kg)} kg</strong></div>)}</div></section>}</div></main>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"><p className="text-sm text-stone-500">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></article>;
}
