import { HealthHeader } from "@/app/health-data/health-header";
import { requireUser } from "@/lib/auth";
import { formatHealthDate, formatDecimal, formatSleepDuration, type SleepEntry } from "@/lib/health";
import { saoPauloDate } from "@/lib/tasks";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";
type Period = "week" | "month" | "year";

function periodStart(period: Period, today: string) {
  const date = new Date(`${today}T12:00:00Z`);
  if (period === "week") date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  if (period === "month") date.setUTCDate(1);
  if (period === "year") { date.setUTCMonth(0, 1); }
  return date.toISOString().slice(0, 10);
}

export default async function SleepReportsPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const userId = await requireUser();
  const requestedPeriod = (await searchParams).period;
  const period: Period = requestedPeriod === "week" || requestedPeriod === "year" ? requestedPeriod : "month";
  const today = saoPauloDate();
  const supabase = await createClient();
  const [{ data: entriesData, error: entriesError }, { data: settingsData, error: settingsError }] = await Promise.all([
    supabase.from("health_sleep_entries").select("id, slept_on, sleep_time, wake_time, quality_score, description, duration_minutes").eq("user_id", userId).gte("slept_on", periodStart(period, today)).lte("slept_on", today).order("slept_on", { ascending: false }),
    supabase.from("health_sleep_settings").select("goal_minutes").eq("user_id", userId).maybeSingle(),
  ]);
  if (entriesError || settingsError) throw new Error("Não foi possível carregar o relatório de sono.");
  const entries = (entriesData ?? []).map((entry) => ({ ...entry, quality_score: entry.quality_score === null ? null : Number(entry.quality_score), duration_minutes: Number(entry.duration_minutes) })) as SleepEntry[];
  const goalMinutes = Number(settingsData?.goal_minutes ?? 420);
  const total = entries.reduce((sum, entry) => sum + entry.duration_minutes, 0);
  const average = entries.length ? Math.round(total / entries.length) : null;
  const longest = entries.length ? entries.reduce((best, entry) => entry.duration_minutes > best.duration_minutes ? entry : best) : null;
  const shortest = entries.length ? entries.reduce((best, entry) => entry.duration_minutes < best.duration_minutes ? entry : best) : null;
  const goalHits = entries.filter((entry) => entry.duration_minutes >= goalMinutes).length;
  const scoredEntries = entries.filter((entry): entry is SleepEntry & { quality_score: number } => entry.quality_score !== null);
  const averageScore = scoredEntries.length ? scoredEntries.reduce((sum, entry) => sum + entry.quality_score, 0) / scoredEntries.length : null;
  const labels: Record<Period, string> = { week: "Semana", month: "Mês", year: "Ano" };

  return <main className="min-h-screen bg-stone-50 pb-12 text-stone-900"><HealthHeader title="Relatórios de sono" description="A meta atual é usada para indicar as noites em que você atingiu o tempo desejado." backHref="/health-data/sleep" backLabel="Sono" /><div className="mx-auto max-w-6xl space-y-6 px-5 py-6 sm:px-8"><nav aria-label="Período do relatório" className="flex flex-wrap gap-2">{(["week", "month", "year"] as Period[]).map((item) => <Link key={item} href={`/health-data/sleep/reports?period=${item}`} className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${period === item ? "bg-indigo-700 text-white" : "bg-white text-stone-700 shadow-sm hover:bg-stone-100"}`}>{labels[item]}</Link>)}</nav><section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Média por noite" value={average === null ? "—" : formatSleepDuration(average)} /><Metric label="Meta atingida" value={`${goalHits}/${entries.length || 0} noites`} /><Metric label="Maior duração" value={longest ? `${formatSleepDuration(longest.duration_minutes)} · ${formatHealthDate(longest.slept_on)}` : "—"} /><Metric label="Menor duração" value={shortest ? `${formatSleepDuration(shortest.duration_minutes)} · ${formatHealthDate(shortest.slept_on)}` : "—"} /></section><section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-wrap items-baseline justify-between gap-3"><div><h2 className="text-xl font-semibold">Noites registradas</h2><p className="mt-1 text-sm text-stone-500">Meta: {formatSleepDuration(goalMinutes)} · Nota média: {averageScore === null ? "—" : formatDecimal(averageScore, 1)}</p></div><strong className="text-sm text-stone-600">Total: {formatSleepDuration(total)}</strong></div>{entries.length ? <div className="mt-5 divide-y divide-stone-100">{entries.map((entry) => { const metGoal = entry.duration_minutes >= goalMinutes; return <article key={entry.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="font-medium">{formatHealthDate(entry.slept_on)} · {formatSleepDuration(entry.duration_minutes)}</p><p className="mt-1 text-sm text-stone-500">{entry.sleep_time.slice(0, 5)}–{entry.wake_time.slice(0, 5)} · {entry.quality_score === null ? "sem nota" : `nota ${entry.quality_score}`}</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${metGoal ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>{metGoal ? "Meta atingida" : "Abaixo da meta"}</span></article>; })}</div> : <p className="mt-5 rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center text-sm text-stone-500">Não há registros neste período.</p>}</section></div></main>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"><p className="text-sm text-stone-500">{label}</p><p className="mt-2 text-xl font-semibold">{value}</p></article>;
}
