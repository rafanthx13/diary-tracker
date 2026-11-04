import { requireUser } from "@/lib/auth";
import { formatMonthlyDiaryDate, formatMonthlyDiaryMonth, isoDateInMonth, monthDays, type MonthlyDiaryEntry, validMonthlyDiaryMonth } from "@/lib/monthly-diary";
import { saoPauloDate } from "@/lib/tasks";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { MonthlyDiaryGrid } from "./monthly-diary-grid";

export const dynamic = "force-dynamic";

function adjacentMonth(month: string, amount: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1 + amount, 1));
  return date.toISOString().slice(0, 7);
}

export default async function MonthlyDiaryPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const userId = await requireUser();
  const today = saoPauloDate();
  const month = validMonthlyDiaryMonth((await searchParams).month, today);
  const start = `${month}-01`;
  const end = `${month}-${String(monthDays(month)).padStart(2, "0")}`;
  const supabase = await createClient();
  const { data, error } = await supabase.from("monthly_diary_entries").select("id, entry_date, notes, did_klap, did_exercise").eq("user_id", userId).gte("entry_date", start).lte("entry_date", end).order("entry_date");
  if (error) throw new Error("Não foi possível carregar o Diário Mensal. Execute a migração mais recente.");
  const entries = (data ?? []) as MonthlyDiaryEntry[];
  const klapCount = entries.filter((entry) => entry.did_klap).length;
  const exerciseCount = entries.filter((entry) => entry.did_exercise).length;
  const recordedDays = entries.filter((entry) => entry.notes || entry.did_klap || entry.did_exercise).length;
  const daysUntilToday = month === today.slice(0, 7) ? Number(today.slice(8)) : month < today.slice(0, 7) ? monthDays(month) : 0;
  const denominator = daysUntilToday || monthDays(month);
  const days = Array.from({ length: monthDays(month) }, (_, index) => {
    const date = isoDateInMonth(month, index + 1);
    return { date, label: formatMonthlyDiaryDate(date), isFuture: date > today };
  });

  return <main className="min-h-screen bg-stone-50 pb-12 text-stone-900"><header className="border-b border-fuchsia-100 bg-white"><div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-8"><div><Link href="/" className="text-sm font-semibold text-fuchsia-700 hover:text-fuchsia-900">← Home</Link><h1 className="mt-2 text-2xl font-semibold tracking-tight">Diário Mensal</h1><p className="mt-1 max-w-2xl text-sm leading-6 text-stone-600">Um lugar rápido para registrar seu dia. Clique no texto para escrever; os marcadores salvam com um toque.</p></div><form action="/monthly-diary" className="flex items-center gap-2"><label className="sr-only" htmlFor="month">Mês exibido</label><input id="month" name="month" type="month" defaultValue={month} className="rounded-xl border border-fuchsia-200 px-3 py-2 text-sm outline-none focus:border-fuchsia-600 focus:ring-2 focus:ring-fuchsia-100" /><button className="rounded-xl bg-fuchsia-700 px-4 py-2 text-sm font-semibold text-white hover:bg-fuchsia-800">Ir</button></form></div></header><div className="mx-auto max-w-7xl space-y-6 px-5 py-6 sm:px-8"><div className="flex items-center justify-between gap-3"><Link href={`/monthly-diary?month=${adjacentMonth(month, -1)}`} className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-stone-100">← Mês anterior</Link><h2 className="text-lg font-semibold capitalize">{formatMonthlyDiaryMonth(month)}</h2><Link href={`/monthly-diary?month=${adjacentMonth(month, 1)}`} className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-stone-100">Próximo mês →</Link></div><section className="grid gap-3 sm:grid-cols-3"><Metric label="Klap" value={`${klapCount}/${denominator}`} detail={`${denominator ? Math.round((klapCount / denominator) * 100) : 0}% dos dias`} /><Metric label="Exercício" value={`${exerciseCount}/${denominator}`} detail={`${denominator ? Math.round((exerciseCount / denominator) * 100) : 0}% dos dias`} /><Metric label="Dias anotados" value={`${recordedDays}/${denominator}`} detail="com texto ou marcador" /></section><section className="rounded-3xl border border-stone-200 bg-white p-3 shadow-sm sm:p-5"><div className="mb-4"><h2 className="text-xl font-semibold">Todos os dias do mês</h2><p className="mt-1 text-sm text-stone-500">A anotação é salva quando você sai da célula. Apague tudo de uma linha para remover seu registro daquele dia.</p></div><MonthlyDiaryGrid days={days} initialEntries={entries} today={today} /></section></div></main>;
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <article className="rounded-2xl border border-fuchsia-100 bg-fuchsia-50 p-5"><p className="text-sm font-medium text-fuchsia-900">{label}</p><p className="mt-1 text-2xl font-semibold tracking-tight text-fuchsia-950">{value}</p><p className="mt-1 text-sm text-fuchsia-800">{detail}</p></article>;
}
