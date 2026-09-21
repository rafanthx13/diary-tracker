import { requireUser } from "@/lib/auth";
import { saoPauloDate, type Task } from "@/lib/tasks";
import { formatReportDate, getIsoWeekValue, isoWeekStart, nextMonthStart, shiftIsoDate } from "@/lib/time-reports";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CompletionMatrix } from "./completion-matrix";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ period: string }>; searchParams: Promise<{ date?: string; week?: string; month?: string; year?: string }> };
type Completion = { task_id: string; completed_on: string };
type ReportRange = { title: string; startDate?: string; endDate?: string; filter: React.ReactNode };
type DiaryTaskReportPeriod = "day" | "week" | "month" | "100-days" | "year" | "all";

const labels: Record<DiaryTaskReportPeriod, string> = { day: "Dia", week: "Semana", month: "Mês", "100-days": "100 dias", year: "Ano", all: "Acumulado" };

function isDiaryTaskReportPeriod(value: string): value is DiaryTaskReportPeriod { return value in labels; }

function validDate(value: string | undefined, fallback: string) { return value && /^\d{4}-\d{2}-\d{2}$/.test(value) && new Date(`${value}T12:00:00-03:00`).toISOString().slice(0, 10) === value && value <= fallback ? value : fallback; }
function validMonth(value: string | undefined, fallback: string) { if (!value || !/^\d{4}-\d{2}$/.test(value)) return fallback; const [year, month] = value.split("-").map(Number); return year >= 2000 && year <= 9998 && month >= 1 && month <= 12 ? value : fallback; }
function validYear(value: string | undefined, fallback: number) { const year = Number(value); return Number.isInteger(year) && year >= 2000 && year <= 9998 ? year : fallback; }

function FilterForm({ action, name, type, value, max, min }: { action: string; name: string; type: "date" | "week" | "month" | "number"; value: string; max?: string; min?: string }) { return <form action={action} className="flex flex-wrap items-end gap-2"><label className="block text-sm font-medium text-emerald-50">Período<input name={name} type={type} defaultValue={value} max={max} min={min} className="mt-2 block rounded-xl border border-white/30 bg-white px-3 py-2.5 text-stone-900 outline-none focus:ring-2 focus:ring-emerald-200" /></label><button className="rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-emerald-900 hover:bg-emerald-50">Ver</button></form>; }

function rangeFor(period: DiaryTaskReportPeriod, search: Awaited<Props["searchParams"]>, today: string): ReportRange {
  if (period === "day") { const date = validDate(search.date, today); return { title: formatReportDate(date), startDate: date, endDate: shiftIsoDate(date, 1), filter: <FilterForm action="/diary-task/reports/day" name="date" type="date" value={date} max={today} /> }; }
  if (period === "week") { const week = search.week && isoWeekStart(search.week) ? search.week : getIsoWeekValue(today); const startDate = isoWeekStart(week)!; const endDate = shiftIsoDate(startDate, 7); return { title: `${formatReportDate(startDate)} — ${formatReportDate(shiftIsoDate(endDate, -1))}`, startDate, endDate, filter: <FilterForm action="/diary-task/reports/week" name="week" type="week" value={week} /> }; }
  if (period === "month") { const month = validMonth(search.month, today.slice(0, 7)); const startDate = `${month}-01`; return { title: new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "America/Sao_Paulo" }).format(new Date(`${startDate}T12:00:00-03:00`)), startDate, endDate: nextMonthStart(month), filter: <FilterForm action="/diary-task/reports/month" name="month" type="month" value={month} /> }; }
  if (period === "100-days") { const startDate = shiftIsoDate(today, -99); return { title: `${formatReportDate(startDate)} — ${formatReportDate(today)}`, startDate, endDate: shiftIsoDate(today, 1), filter: null }; }
  if (period === "year") { const year = validYear(search.year, Number(today.slice(0, 4))); return { title: String(year), startDate: `${year}-01-01`, endDate: `${year + 1}-01-01`, filter: <FilterForm action="/diary-task/reports/year" name="year" type="number" value={String(year)} min="2000" max="9998" /> }; }
  return { title: "Todo o histórico", filter: null };
}

function datesInRange(startDate: string, endDate: string) {
  const dates: string[] = [];
  for (let date = startDate; date < endDate; date = shiftIsoDate(date, 1)) dates.push(date);
  return dates;
}

async function getCompletions(userId: string, startDate?: string, endDate?: string) {
  const supabase = await createClient();
  const all: Completion[] = [];
  const pageSize = 1000;
  let from = 0;
  while (true) {
    let query = supabase.from("daily_task_completions").select("task_id, completed_on").eq("user_id", userId).order("completed_on", { ascending: false });
    if (startDate && endDate) query = query.gte("completed_on", startDate).lt("completed_on", endDate);
    const { data, error } = await query.range(from, from + pageSize - 1);
    if (error) throw new Error("Não foi possível carregar as conclusões do relatório.");
    const page = (data ?? []) as Completion[];
    all.push(...page);
    if (page.length < pageSize) return all;
    from += pageSize;
  }
}

export default async function DiaryTaskReportPage({ params, searchParams }: Props) {
  if (!hasSupabaseEnv()) redirect("/");
  const { period: rawPeriod } = await params;
  if (!isDiaryTaskReportPeriod(rawPeriod)) notFound();
  const userId = await requireUser();
  const period = rawPeriod;
  const range = rangeFor(period, await searchParams, saoPauloDate());
  const supabase = await createClient();
  const [{ data: taskData, error: taskError }, completions] = await Promise.all([supabase.from("tasks").select("id, title, is_daily, task_list_id, completed_at, created_at").eq("user_id", userId).eq("is_daily", true).order("created_at"), getCompletions(userId, range.startDate, range.endDate)]);
  if (taskError) throw new Error("Não foi possível carregar as tarefas do relatório.");
  const tasks = (taskData ?? []) as unknown as Task[];
  const datesByTask = new Map<string, string[]>();
  for (const completion of completions) datesByTask.set(completion.task_id, [...(datesByTask.get(completion.task_id) ?? []), completion.completed_on]);
  const rows = tasks.map((task) => ({ task, dates: datesByTask.get(task.id) ?? [] })).sort((first, second) => second.dates.length - first.dates.length || first.task.title.localeCompare(second.task.title, "pt-BR"));
  const activeDays = new Set(completions.map((completion) => completion.completed_on)).size;
  const matrixDates = ["week", "month", "100-days"].includes(period) && range.startDate && range.endDate
    ? datesInRange(range.startDate, range.endDate)
    : null;

  return <main className="min-h-screen bg-stone-50 pb-12 text-stone-900"><header className="border-b border-stone-200 bg-white"><div className="mx-auto max-w-6xl px-5 py-5 sm:px-8"><p className="text-sm font-semibold tracking-[0.16em] text-emerald-700 uppercase">Diary Tracker</p><h1 className="mt-1 text-2xl font-semibold">Relatório: Diary Task</h1></div></header><div className="mx-auto max-w-6xl space-y-6 px-5 py-6 sm:px-8"><div className="flex flex-wrap gap-2"><Link href="/diary-task" className="rounded-xl bg-stone-100 px-3 py-2 text-sm font-medium hover:bg-stone-200">Voltar ao Diary Task</Link><Link href="/diary-task/reports" className="rounded-xl bg-stone-100 px-3 py-2 text-sm font-medium hover:bg-stone-200">Todos os relatórios</Link></div><nav aria-label="Períodos do relatório" className="flex flex-wrap gap-2">{(Object.keys(labels) as DiaryTaskReportPeriod[]).map((item) => <Link key={item} href={`/diary-task/reports/${item}`} className={`rounded-xl px-3 py-2 text-sm font-medium ${item === period ? "bg-emerald-700 text-white" : "border border-stone-300 bg-white hover:bg-stone-100"}`}>{labels[item]}</Link>)}</nav><section className="rounded-3xl bg-emerald-800 p-5 text-white sm:p-6"><p className="text-sm font-medium text-emerald-100">Período analisado</p><h2 className="mt-1 text-2xl font-semibold capitalize">{range.title}</h2><div className="mt-5 flex flex-wrap items-end justify-between gap-5"><div><p className="text-sm text-emerald-100">Conclusões registradas</p><p className="mt-1 text-4xl font-semibold">{completions.length}</p><p className="mt-2 text-sm text-emerald-100">em {activeDays} dia{activeDays === 1 ? "" : "s"}</p></div>{range.filter}</div></section>{matrixDates && <CompletionMatrix rows={rows} dates={matrixDates} />}<section><div className="flex items-baseline justify-between gap-4"><div><p className="text-sm font-medium text-stone-500">Frequência por tarefa</p><h2 className="mt-1 text-xl font-semibold">Tarefas diárias</h2></div><span className="rounded-full bg-stone-200 px-3 py-1 text-sm text-stone-600">{rows.length}</span></div>{rows.length ? <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{rows.map(({ task, dates }) => <article key={task.id} className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-4"><h3 className="text-lg font-semibold leading-6">{task.title}</h3><span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800">{dates.length}×</span></div>{dates.length ? <details className="mt-5"><summary className="cursor-pointer text-sm font-semibold text-emerald-800">Ver dias concluídos</summary><p className="mt-3 text-sm leading-6 text-stone-600">{dates.map(formatReportDate).join(" · ")}</p></details> : <p className="mt-5 text-sm text-stone-500">Não foi concluída neste período.</p>}</article>)}</div> : <p className="mt-5 rounded-3xl border border-dashed border-stone-300 bg-white px-4 py-10 text-center text-sm text-stone-500">Nenhuma tarefa diária foi criada ainda.</p>}</section></div></main>;
}
