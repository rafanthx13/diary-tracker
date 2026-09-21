import { saveWeight } from "@/app/health-data/actions";
import { HealthHeader } from "@/app/health-data/health-header";
import { requireUser } from "@/lib/auth";
import { formatDecimal, formatHealthDate, type WeightEntry } from "@/lib/health";
import { saoPauloDate } from "@/lib/tasks";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function WeightPage() {
  const userId = await requireUser();
  const today = saoPauloDate();
  const supabase = await createClient();
  const { data, error } = await supabase.from("health_weight_entries").select("id, measured_on, weight_kg, notes").eq("user_id", userId).order("measured_on", { ascending: false }).limit(30);
  if (error) throw new Error("Não foi possível carregar seu peso. Execute a migração 20260921060000 no Supabase.");
  const entries = (data ?? []).map((entry) => ({ ...entry, weight_kg: Number(entry.weight_kg) })) as WeightEntry[];
  const todayEntry = entries.find((entry) => entry.measured_on === today);

  return <main className="min-h-screen bg-stone-50 pb-12 text-stone-900"><HealthHeader title="Meu peso" description="Um registro por dia. Salvar novamente a mesma data atualiza o valor existente." actions={<Link href="/health-data/weight/reports" className="rounded-xl bg-rose-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-800">▥ Relatório</Link>} /><div className="mx-auto grid max-w-6xl gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[360px_1fr]"><section className="h-fit rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6"><p className="text-sm font-semibold tracking-wide text-rose-700 uppercase">Registro da manhã</p><h2 className="mt-2 text-xl font-semibold">{todayEntry ? "Atualizar peso de hoje" : "Registrar peso de hoje"}</h2><form action={saveWeight} className="mt-5 space-y-4"><label className="block text-sm font-medium">Data<input type="date" name="measuredOn" required max={today} defaultValue={today} className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-3 outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-100" /></label><label className="block text-sm font-medium">Peso (kg)<input type="number" name="weightKg" min="20" max="500" step="0.01" required defaultValue={todayEntry?.weight_kg} inputMode="decimal" placeholder="Ex.: 82,8" className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-3 text-lg outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-100" /></label><label className="block text-sm font-medium">Observação <span className="font-normal text-stone-400">(opcional)</span><textarea name="notes" maxLength={500} rows={3} defaultValue={todayEntry?.notes} placeholder="Ex.: medi em jejum" className="mt-2 w-full resize-none rounded-xl border border-stone-300 px-3 py-3 outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-100" /></label><button className="w-full rounded-xl bg-rose-700 px-5 py-3 font-semibold text-white hover:bg-rose-800">Salvar peso</button></form></section><section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-baseline justify-between gap-4"><div><p className="text-sm font-medium text-stone-500">Últimos registros</p><h2 className="mt-1 text-xl font-semibold">Histórico recente</h2></div><span className="rounded-full bg-stone-100 px-3 py-1 text-sm text-stone-600">{entries.length}</span></div>{entries.length ? <div className="mt-5 divide-y divide-stone-100">{entries.map((entry) => <article key={entry.id} className="grid gap-1 py-3 first:pt-0 sm:grid-cols-[150px_110px_1fr] sm:items-center"><time className="text-sm text-stone-500">{formatHealthDate(entry.measured_on)}</time><strong className="text-lg text-stone-900">{formatDecimal(entry.weight_kg)} kg</strong><p className="truncate text-sm text-stone-500">{entry.notes || "Sem observação"}</p></article>)}</div> : <p className="mt-5 rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center text-sm text-stone-500">Seu primeiro registro aparecerá aqui.</p>}</section></div></main>;
}
