import { setTaskCompletion } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { formatDateTime, monthBounds, saoPauloDate, type Task } from "@/lib/tasks";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<{ month?: string }> };

export default async function CompletedTasksPage({ searchParams }: Props) {
  if (!hasSupabaseEnv()) redirect("/");
  const userId = await requireUser();
  const { month: requestedMonth } = await searchParams;
  const fallbackMonth = saoPauloDate().slice(0, 7);
  const month = /^\d{4}-\d{2}$/.test(requestedMonth ?? "") ? requestedMonth! : fallbackMonth;
  const { start, end } = monthBounds(month);
  const supabase = await createClient();
  const { data, error } = await supabase.from("tasks").select("id, title, is_daily, task_list_id, completed_at, created_at").eq("user_id", userId).eq("is_daily", false).gte("completed_at", start).lt("completed_at", end).order("completed_at", { ascending: false });
  if (error) throw new Error("Não foi possível carregar tarefas concluídas.");
  const tasks = (data ?? []) as unknown as Task[];

  return <main className="min-h-screen bg-stone-50 pb-12 text-stone-900"><header className="border-b border-stone-200 bg-white"><div className="mx-auto max-w-6xl px-5 py-5 sm:px-8"><p className="text-sm font-semibold tracking-[0.16em] text-emerald-700 uppercase">Diary Tracker</p><h1 className="mt-1 text-2xl font-semibold">Relatório da TODO List</h1></div></header><div className="mx-auto max-w-6xl space-y-6 px-5 py-6 sm:px-8"><Link href="/tasks" className="inline-block rounded-xl bg-stone-100 px-3 py-2 text-sm font-medium hover:bg-stone-200">Voltar à TODO List</Link><form className="flex items-end gap-3 rounded-3xl border border-stone-200 bg-white p-5"><label className="block text-sm font-medium">Mês<input type="month" name="month" defaultValue={month} className="mt-2 block rounded-xl border border-stone-300 px-3 py-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></label><button className="rounded-xl bg-stone-900 px-4 py-3 font-medium text-white transition hover:bg-stone-700">Ver</button></form><section><div className="flex items-baseline justify-between gap-4"><div><p className="text-sm font-medium text-stone-500">Finalizadas no mês selecionado</p><h2 className="mt-1 text-xl font-semibold">Tarefas concluídas</h2></div><span className="rounded-full bg-stone-200 px-3 py-1 text-sm text-stone-600">{tasks.length}</span></div>{tasks.length ? <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{tasks.map((task) => <CompletedTaskCard key={task.id} task={task} />)}</div> : <p className="mt-5 rounded-3xl border border-dashed border-stone-300 bg-white px-4 py-10 text-center text-sm text-stone-500">Nenhuma tarefa geral foi concluída neste mês.</p>}</section></div></main>;
}

function CompletedTaskCard({ task }: { task: Task }) { return <article className="flex min-h-44 flex-col justify-between rounded-3xl border border-stone-200 bg-white p-5 opacity-80 shadow-sm"><div className="flex items-start justify-between gap-4"><h3 className="text-lg font-semibold leading-6 text-stone-600 line-through">{task.title}</h3><form action={setTaskCompletion}><input type="hidden" name="taskId" value={task.id} /><input type="hidden" name="complete" value="false" /><button aria-label={`Reabrir ${task.title}`} className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-700 text-lg text-white transition hover:bg-emerald-800">✓</button></form></div><dl className="mt-6 space-y-1 text-sm text-stone-500"><div>Criada: {formatDateTime(task.created_at)}</div><div>Concluída: {task.completed_at ? formatDateTime(task.completed_at) : "—"}</div></dl></article>; }
