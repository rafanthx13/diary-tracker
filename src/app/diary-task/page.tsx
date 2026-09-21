import { createTask, setDailyTaskCompletion } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { saoPauloDate, type Task } from "@/lib/tasks";
import { formatReportDate, shiftIsoDate } from "@/lib/time-reports";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ date?: string | string[] }> };

function validDate(value: string | undefined, fallback: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return fallback;
  return new Date(`${value}T12:00:00-03:00`).toISOString().slice(0, 10) === value && value <= fallback ? value : fallback;
}

function diaryTaskHref(date: string, today: string) {
  return date === today ? "/diary-task" : `/diary-task?date=${date}`;
}

export default async function DiaryTaskPage({ searchParams }: Props) {
  if (!hasSupabaseEnv()) redirect("/");
  const userId = await requireUser();
  const today = saoPauloDate();
  const requestedDate = (await searchParams).date;
  const selectedDate = validDate(Array.isArray(requestedDate) ? requestedDate[0] : requestedDate, today);
  const isToday = selectedDate === today;
  const supabase = await createClient();
  const [{ data: taskData, error: taskError }, { data: completionData, error: completionError }] = await Promise.all([
    supabase.from("tasks").select("id, title, is_daily, task_list_id, completed_at, created_at").eq("user_id", userId).eq("is_daily", true).order("created_at"),
    supabase.from("daily_task_completions").select("task_id").eq("user_id", userId).eq("completed_on", selectedDate),
  ]);
  if (taskError || completionError) throw new Error("Não foi possível carregar o Diary Task.");
  const tasks = (taskData ?? []) as unknown as Task[];
  const completedIds = new Set((completionData ?? []).map((completion) => completion.task_id));
  const pending = tasks.filter((task) => !completedIds.has(task.id));
  const completed = tasks.filter((task) => completedIds.has(task.id));
  const previousDate = shiftIsoDate(selectedDate, -1);
  const nextDate = shiftIsoDate(selectedDate, 1);

  return <main className="min-h-screen bg-stone-50 pb-12 text-stone-900"><header className="border-b border-stone-200 bg-white"><div className="mx-auto max-w-6xl px-5 pt-5 sm:px-8"><p className="text-sm font-semibold tracking-[0.16em] text-emerald-700 uppercase">Diary Tracker</p><h1 className="mt-1 text-2xl font-semibold">Diary Task</h1></div><div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-5 py-4 sm:px-8"><Link href={diaryTaskHref(previousDate, today)} className="rounded-xl border border-stone-300 px-3 py-2 text-sm font-medium hover:bg-stone-100">← Anterior</Link><form action="/diary-task" className="flex items-center gap-2"><label className="sr-only" htmlFor="diary-task-date">Data</label><input id="diary-task-date" name="date" type="date" defaultValue={selectedDate} max={today} className="rounded-xl border border-stone-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /><button className="rounded-xl bg-stone-900 px-3 py-2 text-sm font-medium text-white hover:bg-stone-700">Ir</button></form>{!isToday && <Link href={diaryTaskHref(nextDate, today)} className="rounded-xl border border-stone-300 px-3 py-2 text-sm font-medium hover:bg-stone-100">Próximo →</Link>}{!isToday && <Link href="/diary-task" className="rounded-xl px-3 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-50">Voltar para hoje</Link>}<Link href="/diary-task/reports" className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100">Relatório</Link></div></header><div className="mx-auto max-w-6xl space-y-6 px-5 py-6 sm:px-8"><section className="rounded-3xl bg-emerald-800 p-5 text-white sm:p-6"><p className="text-sm font-medium text-emerald-100">{isToday ? "Progresso de hoje" : "Progresso de " + formatReportDate(selectedDate)}</p><p className="mt-2 text-4xl font-semibold">{completed.length} de {tasks.length}</p><div className="mt-4 h-2 overflow-hidden rounded-full bg-emerald-950"><div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${tasks.length ? completed.length / tasks.length * 100 : 0}%` }} /></div></section><details className="group rounded-3xl border border-stone-200 bg-white p-5 shadow-sm" open={!tasks.length}><summary className="cursor-pointer list-none text-lg font-semibold"><span className="group-open:hidden">+ Criar tarefa diária</span><span className="hidden group-open:inline">Criar tarefa diária</span></summary><p className="mt-2 text-sm text-stone-600">Depois de criada, esta tarefa aparecerá todos os dias no Diary Task.</p><form action={createTask} className="mt-5 flex flex-col gap-3 sm:flex-row"><input type="hidden" name="isDaily" value="true" /><label className="flex-1 text-sm font-medium">Tarefa<input name="title" required maxLength={240} placeholder="Ex.: Ler 20 minutos" className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></label><button className="mt-6 rounded-xl bg-emerald-700 px-5 py-3 font-medium text-white hover:bg-emerald-800 sm:mt-auto">Adicionar</button></form></details><TaskGroup title="Para fazer" description="Ainda não concluídas" tasks={pending} selectedDate={selectedDate} completed={false} /><TaskGroup title="Feitas" description="Concluídas nesta data" tasks={completed} selectedDate={selectedDate} completed /></div></main>;
}

function TaskGroup({ title, description, tasks, selectedDate, completed }: { title: string; description: string; tasks: Task[]; selectedDate: string; completed: boolean }) { return <section><div className="flex items-baseline justify-between gap-4"><div><p className="text-sm font-medium text-stone-500">{description}</p><h2 className="mt-1 text-xl font-semibold">{title}</h2></div><span className="rounded-full bg-stone-200 px-3 py-1 text-sm text-stone-600">{tasks.length}</span></div>{tasks.length ? <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{tasks.map((task) => <DiaryTaskCard key={task.id} task={task} selectedDate={selectedDate} completed={completed} />)}</div> : <p className="mt-5 rounded-3xl border border-dashed border-stone-300 bg-white px-4 py-8 text-center text-sm text-stone-500">{completed ? "Nenhuma tarefa foi concluída nesta data." : "Não há tarefas pendentes nesta data."}</p>}</section>; }

function DiaryTaskCard({ task, selectedDate, completed }: { task: Task; selectedDate: string; completed: boolean }) { return <article className={`flex min-h-40 flex-col justify-between rounded-3xl border bg-white p-5 shadow-sm ${completed ? "border-emerald-200 opacity-80" : "border-stone-200"}`}><div className="flex items-start justify-between gap-4"><h3 className={`text-lg font-semibold leading-6 ${completed ? "text-stone-600 line-through" : ""}`}>{task.title}</h3><form action={setDailyTaskCompletion}><input type="hidden" name="taskId" value={task.id} /><input type="hidden" name="completedOn" value={selectedDate} /><input type="hidden" name="complete" value={String(!completed)} /><button aria-label={completed ? `Desmarcar ${task.title}` : `Concluir ${task.title}`} className={`grid size-9 shrink-0 place-items-center rounded-xl text-lg transition ${completed ? "bg-emerald-700 text-white hover:bg-emerald-800" : "border-2 border-stone-300 hover:border-emerald-600 hover:bg-emerald-50"}`}>✓</button></form></div><p className="mt-6 text-sm text-stone-500">{completed ? "Feita" : "Pendente"}</p></article>; }
