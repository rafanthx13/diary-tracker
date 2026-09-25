import { requireUser } from "@/lib/auth";
import { currentDiaryDate } from "@/lib/diary";
import {
  createTimeReport,
  formatReportDate,
  formatReportDuration,
  getIsoWeekValue,
  isTimeReportPeriod,
  isoWeekStart,
  nextMonthStart,
  type ReportActivity,
  shiftIsoDate,
  type TimeReportPeriod,
  type TimeTotal,
} from "@/lib/time-reports";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ period: string }>;
  searchParams: Promise<{ date?: string; week?: string; month?: string; year?: string }>;
};

type ReportRange = {
  title: string;
  startDate?: string;
  endDate?: string;
  filter: React.ReactNode;
};

const periodLabels: Record<TimeReportPeriod, string> = {
  day: "Dia",
  week: "Semana",
  month: "Mês",
  year: "Ano",
  all: "Acumulado",
};

function validDate(value: string | undefined, fallback: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return fallback;
  return new Date(`${value}T12:00:00-03:00`).toISOString().slice(0, 10) === value ? value : fallback;
}

function validMonth(value: string | undefined, fallback: string) {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return fallback;
  const [year, month] = value.split("-").map(Number);
  return month >= 1 && month <= 12 && year >= 2000 && year <= 9998 ? value : fallback;
}

function validYear(value: string | undefined, fallback: number) {
  const year = Number(value);
  return Number.isInteger(year) && year >= 2000 && year <= 9998 ? year : fallback;
}

function reportRange(period: TimeReportPeriod, search: Awaited<Props["searchParams"]>, today: string): ReportRange {
  if (period === "day") {
    const date = validDate(search.date, today);
    return { title: formatReportDate(date), startDate: date, endDate: shiftIsoDate(date, 1), filter: <PeriodForm action="/today/reports/day" name="date" type="date" value={date} max={today} /> };
  }

  if (period === "week") {
    const week = search.week && isoWeekStart(search.week) ? search.week : getIsoWeekValue(today);
    const startDate = isoWeekStart(week)!;
    const endDate = shiftIsoDate(startDate, 7);
    return { title: `${formatReportDate(startDate)} — ${formatReportDate(shiftIsoDate(endDate, -1))}`, startDate, endDate, filter: <PeriodForm action="/today/reports/week" name="week" type="week" value={week} /> };
  }

  if (period === "month") {
    const month = validMonth(search.month, today.slice(0, 7));
    const startDate = `${month}-01`;
    const endDate = nextMonthStart(month);
    return { title: new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "America/Sao_Paulo" }).format(new Date(`${startDate}T12:00:00-03:00`)), startDate, endDate, filter: <PeriodForm action="/today/reports/month" name="month" type="month" value={month} /> };
  }

  if (period === "year") {
    const year = validYear(search.year, Number(today.slice(0, 4)));
    return { title: String(year), startDate: `${year}-01-01`, endDate: `${year + 1}-01-01`, filter: <PeriodForm action="/today/reports/year" name="year" type="number" value={String(year)} min="2000" max="9998" /> };
  }

  return { title: "Todo o histórico", filter: null };
}

function PeriodForm({ action, name, type, value, min, max }: { action: string; name: string; type: "date" | "week" | "month" | "number"; value: string; min?: string; max?: string }) {
  return <form action={action} className="flex flex-wrap items-end gap-2"><label className="block text-sm font-medium">Período<input name={name} type={type} defaultValue={value} min={min} max={max} className="mt-2 block rounded-xl border border-stone-300 px-3 py-2.5 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></label><button className="rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-700">Ver</button></form>;
}

async function getActivities(userId: string, startDate?: string, endDate?: string) {
  const supabase = await createClient();
  const result: ReportActivity[] = [];
  const pageSize = 1000;
  let from = 0;

  while (true) {
    let query = supabase.from("activities").select("id, title, started_at, ended_at, classification:classifications(id, name, category:categories(id, name))").eq("user_id", userId).not("ended_at", "is", null).order("started_at", { ascending: false });
    if (startDate && endDate) query = query.gte("diary_date", startDate).lt("diary_date", endDate);
    const { data, error } = await query.range(from, from + pageSize - 1);
    if (error) throw new Error("Não foi possível carregar os dados do relatório.");
    const page = (data ?? []) as unknown as ReportActivity[];
    result.push(...page);
    if (page.length < pageSize) return result;
    from += pageSize;
  }
}

function formatPercentage(minutes: number, totalMinutes: number) {
  if (!totalMinutes) return "0%";
  return new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 }).format(minutes / totalMinutes);
}

function TotalsCard({ title, totals, totalMinutes, showPercentage = false }: { title: string; totals: TimeTotal[]; totalMinutes: number; showPercentage?: boolean }) {
  return <section className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6"><h2 className="text-xl font-semibold">{title}</h2>{totals.length ? <div className="mt-4 divide-y divide-stone-100">{totals.map((item) => <div key={item.label} className="flex items-center justify-between gap-4 py-3 first:pt-0"><span className="min-w-0 truncate font-medium">{item.label}</span><span className="shrink-0 text-right tabular-nums"><span className="block text-sm font-semibold text-emerald-800">{formatReportDuration(item.minutes)}</span>{showPercentage && <span className="mt-0.5 block text-xs font-medium text-stone-500">{formatPercentage(item.minutes, totalMinutes)} do total</span>}</span></div>)}</div> : <p className="mt-4 rounded-2xl bg-stone-50 px-4 py-5 text-center text-sm text-stone-500">Sem atividades encerradas neste período.</p>}</section>;
}

export default async function TimeReportPage({ params, searchParams }: Props) {
  if (!hasSupabaseEnv()) redirect("/");
  const { period: rawPeriod } = await params;
  if (!isTimeReportPeriod(rawPeriod)) notFound();
  const userId = await requireUser();
  const period = rawPeriod;
  const range = reportRange(period, await searchParams, currentDiaryDate());
  const includeActivityTotals = period === "day" || period === "week";
  const report = createTimeReport(await getActivities(userId, range.startDate, range.endDate), { includeActivityTotals });

  return <main className="min-h-screen bg-stone-50 pb-12 text-stone-900"><header className="border-b border-stone-200 bg-white"><div className="mx-auto max-w-5xl px-5 py-5 sm:px-8"><p className="text-sm font-semibold tracking-[0.16em] text-emerald-700 uppercase">Diary Tracker</p><h1 className="mt-1 text-2xl font-semibold">Relatório de tempo: {periodLabels[period]}</h1></div></header><div className="mx-auto max-w-5xl space-y-6 px-5 py-6 sm:px-8"><div className="flex flex-wrap gap-2"><Link href="/today" className="rounded-xl bg-stone-100 px-3 py-2 text-sm font-medium hover:bg-stone-200">Voltar ao registro</Link><Link href="/today/categories" className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100">Categorias de tempo</Link></div><nav aria-label="Períodos do relatório" className="flex flex-wrap gap-2">{(Object.keys(periodLabels) as TimeReportPeriod[]).map((item) => <Link key={item} href={`/today/reports/${item}`} className={`rounded-xl px-3 py-2 text-sm font-medium ${item === period ? "bg-emerald-700 text-white" : "border border-stone-300 bg-white hover:bg-stone-100"}`}>{periodLabels[item]}</Link>)}</nav><section className="rounded-3xl bg-emerald-800 p-5 text-white sm:p-6"><p className="text-sm font-medium text-emerald-100">Período analisado</p><h2 className="mt-1 text-2xl font-semibold capitalize">{range.title}</h2><div className="mt-5 flex flex-wrap items-end justify-between gap-5"><div><p className="text-sm text-emerald-100">Tempo registrado</p><p className="mt-1 text-4xl font-semibold tabular-nums">{formatReportDuration(report.totalMinutes)}</p><p className="mt-2 text-sm text-emerald-100">{report.activityCount} atividade{report.activityCount === 1 ? " encerrada" : "s encerradas"}</p></div>{range.filter}</div></section><div className={`grid gap-6 ${includeActivityTotals ? "lg:grid-cols-3" : "md:grid-cols-2"}`}>{includeActivityTotals && <TotalsCard title="Por atividade" totals={report.byActivity} totalMinutes={report.totalMinutes} />}<TotalsCard title="Por classificação" totals={report.byClassification} totalMinutes={report.totalMinutes} showPercentage /><TotalsCard title="Por categoria" totals={report.byCategory} totalMinutes={report.totalMinutes} showPercentage /></div></div></main>;
}
