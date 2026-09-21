import { createTask, setDailyTaskCompletion, signOut } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { saoPauloDate, type CategoryOption, type Task } from "@/lib/tasks";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function RoutinePage() {
  if (!hasSupabaseEnv()) redirect("/");
  const userId = await requireUser();
  const today = saoPauloDate();
  const supabase = await createClient();
  const [{ data: tasksData, error: tasksError }, { data: completionsData, error: completionsError }, { data: categoriesData, error: categoriesError }] = await Promise.all([
    supabase.from("tasks").select("id, title, category_id, is_daily, completed_at, created_at").eq("user_id", userId).eq("is_daily", true).order("created_at"),
    supabase.from("daily_task_completions").select("task_id").eq("user_id", userId).eq("completed_on", today),
    supabase.from("categories").select("id, name, color").order("name"),
  ]);
  if (tasksError || completionsError || categoriesError) throw new Error("Não foi possível carregar a rotina diária.");

  const tasks = (tasksData ?? []) as unknown as Task[];
  const categories = (categoriesData ?? []) as unknown as CategoryOption[];
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const completedIds = new Set((completionsData ?? []).map((completion) => completion.task_id));
  const pending = tasks.filter((task) => !completedIds.has(task.id));
  const completed = tasks.filter((task) => completedIds.has(task.id));

  return <main className="min-h-screen bg-stone-50 pb-12 text-stone-900"><header className="border-b border-stone-200 bg-white"><div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-5 py-4 sm:px-8"><div><p className="text-sm font-semibold tracking-[0.16em] text-emerald-700 uppercase">Diary Tracker</p><h1 className="mt-1 text-xl font-semibold">Rotina diária</h1></div><div className="flex flex-wrap justify-end gap-1"><Link href="/today" className="rounded-lg px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100">Hoje</Link><Link href="/tasks" className="rounded-lg px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100">Tarefas</Link><form action={signOut}><button className="rounded-lg px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100">Sair</button></form></div></div></header><div className="mx-auto max-w-4xl space-y-6 px-5 py-6 sm:px-8"><section className="rounded-3xl bg-emerald-800 p-5 text-white"><p className="text-sm text-emerald-100">Progresso de hoje</p><p className="mt-2 text-3xl font-semibold">{completed.length} de {tasks.length}</p><div className="mt-4 h-2 overflow-hidden rounded-full bg-emerald-950"><div className="h-full rounded-full bg-emerald-400" style={{ width: `${tasks.length ? (completed.length / tasks.length) * 100 : 0}%` }} /></div></section><details className="group rounded-3xl border border-stone-200 bg-white p-5" open={!tasks.length}><summary className="cursor-pointer list-none text-lg font-semibold"><span className="group-open:hidden">+ Adicionar tarefa diária</span><span className="hidden group-open:inline">Adicionar tarefa diária</span></summary><form action={createTask} className="mt-5 grid gap-4 sm:grid-cols-[1fr_220px_auto] sm:items-end"><input type="hidden" name="isDaily" value="true" /><label className="block text-sm font-medium">Tarefa<input name="title" required maxLength={240} placeholder="Ex.: Ler 20 minutos" className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-3 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></label><label className="block text-sm font-medium">Categoria <span className="font-normal text-stone-400">opcional</span><select name="categoryId" defaultValue="" className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-3 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"><option value="">Sem categoria</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><button className="rounded-xl bg-emerald-700 px-5 py-3 font-medium text-white transition hover:bg-emerald-800">Adicionar</button></form></details><section className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6"><h2 className="text-xl font-semibold">Hoje</h2>{tasks.length ? <div className="mt-5 divide-y divide-stone-100">{[...pending, ...completed].map((task) => <RoutineRow key={task.id} task={task} completed={completedIds.has(task.id)} category={task.category_id ? categoryById.get(task.category_id) : undefined} />)}</div> : <p className="mt-5 rounded-2xl bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">Sua rotina está vazia. Adicione a primeira tarefa diária acima.</p>}</section></div></main>;
}

function RoutineRow({ task, completed, category }: { task: Task; completed: boolean; category?: CategoryOption }) {
  return <article className="flex items-center gap-3 py-4 first:pt-0"><form action={setDailyTaskCompletion}><input type="hidden" name="taskId" value={task.id} /><input type="hidden" name="complete" value={String(!completed)} /><button aria-label={completed ? `Desmarcar ${task.title}` : `Concluir ${task.title}`} className={`grid size-7 shrink-0 place-items-center rounded-lg border-2 transition ${completed ? "border-emerald-700 bg-emerald-700 text-white" : "border-stone-300 hover:border-emerald-600"}`}>{completed ? "✓" : ""}</button></form><div className="min-w-0 flex-1"><p className={`font-medium ${completed ? "text-stone-500 line-through" : ""}`}>{task.title}</p>{category && <span className="mt-1 inline-flex items-center gap-1.5 text-xs text-stone-500"><span className="size-2 rounded-full" style={{ background: category.color }} />{category.name}</span>}</div></article>;
}
