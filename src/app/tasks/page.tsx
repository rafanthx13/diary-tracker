import { createTask, setTaskCompletion, signOut } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { type CategoryOption, type Task } from "@/lib/tasks";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  if (!hasSupabaseEnv()) redirect("/");
  const userId = await requireUser();
  const supabase = await createClient();
  const [{ data: tasksData, error: tasksError }, { data: categoriesData, error: categoriesError }] = await Promise.all([
    supabase.from("tasks").select("id, title, category_id, is_daily, completed_at, created_at").eq("user_id", userId).eq("is_daily", false).order("completed_at", { ascending: true, nullsFirst: true }).order("created_at", { ascending: false }),
    supabase.from("categories").select("id, name, color").order("name"),
  ]);
  if (tasksError || categoriesError) throw new Error("Não foi possível carregar a TODO List.");

  const tasks = (tasksData ?? []) as unknown as Task[];
  const categories = (categoriesData ?? []) as unknown as CategoryOption[];
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const pending = tasks.filter((task) => !task.completed_at);
  const completed = tasks.filter((task) => task.completed_at);

  return (
    <main className="min-h-screen bg-stone-50 pb-12 text-stone-900">
      <header className="border-b border-stone-200 bg-white"><div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-5 py-4 sm:px-8"><div><p className="text-sm font-semibold tracking-[0.16em] text-emerald-700 uppercase">Diary Tracker</p><h1 className="mt-1 text-xl font-semibold">TODO List</h1></div><div className="flex flex-wrap justify-end gap-1"><Link href="/today" className="rounded-lg px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100">Hoje</Link><Link href="/routine" className="rounded-lg px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100">Rotina</Link><Link href="/tasks/completed" className="rounded-lg px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100">Concluídas</Link><form action={signOut}><button className="rounded-lg px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100">Sair</button></form></div></div></header>

      <div className="mx-auto max-w-4xl space-y-6 px-5 py-6 sm:px-8">
        <details className="group rounded-3xl border border-stone-200 bg-white p-5 shadow-sm" open={!tasks.length}>
          <summary className="cursor-pointer list-none text-lg font-semibold"><span className="group-open:hidden">+ Nova tarefa</span><span className="hidden group-open:inline">Nova tarefa</span></summary>
          <form action={createTask} className="mt-5 grid gap-4 sm:grid-cols-[1fr_220px_auto] sm:items-end"><input type="hidden" name="isDaily" value="false" /><label className="block text-sm font-medium">Tarefa<input name="title" required maxLength={240} placeholder="O que precisa fazer?" className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-3 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></label><label className="block text-sm font-medium">Categoria <span className="font-normal text-stone-400">opcional</span><select name="categoryId" defaultValue="" className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-3 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"><option value="">Sem categoria</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><button className="rounded-xl bg-emerald-700 px-5 py-3 font-medium text-white transition hover:bg-emerald-800">Adicionar</button></form>
        </details>

        <section className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6"><div className="flex items-baseline justify-between"><div><p className="text-sm font-medium text-stone-500">Pendentes</p><h2 className="mt-1 text-xl font-semibold">Para fazer</h2></div><span className="rounded-full bg-stone-100 px-3 py-1 text-sm text-stone-600">{pending.length}</span></div>{pending.length ? <div className="mt-5 divide-y divide-stone-100">{pending.map((task) => <TaskRow key={task.id} task={task} category={task.category_id ? categoryById.get(task.category_id) : undefined} />)}</div> : <p className="mt-5 rounded-2xl bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">Não há tarefas pendentes.</p>}</section>

        {completed.length > 0 && <section className="rounded-3xl border border-stone-200 bg-white p-5 opacity-80 sm:p-6"><div className="flex items-baseline justify-between"><div><p className="text-sm font-medium text-stone-500">Concluídas</p><h2 className="mt-1 text-xl font-semibold">Finalizadas</h2></div><span className="rounded-full bg-stone-100 px-3 py-1 text-sm text-stone-600">{completed.length}</span></div><div className="mt-5 divide-y divide-stone-100">{completed.map((task) => <TaskRow key={task.id} task={task} category={task.category_id ? categoryById.get(task.category_id) : undefined} />)}</div></section>}
      </div>
    </main>
  );
}

function TaskRow({ task, category }: { task: Task; category?: CategoryOption }) {
  const completed = Boolean(task.completed_at);
  return <article className="flex items-center gap-3 py-4 first:pt-0"><form action={setTaskCompletion}><input type="hidden" name="taskId" value={task.id} /><input type="hidden" name="complete" value={String(!completed)} /><button aria-label={completed ? `Reabrir ${task.title}` : `Concluir ${task.title}`} className={`grid size-7 shrink-0 place-items-center rounded-lg border-2 transition ${completed ? "border-emerald-700 bg-emerald-700 text-white" : "border-stone-300 hover:border-emerald-600"}`}>{completed ? "✓" : ""}</button></form><div className="min-w-0 flex-1"><p className={`font-medium ${completed ? "text-stone-500 line-through" : ""}`}>{task.title}</p>{category && <span className="mt-1 inline-flex items-center gap-1.5 text-xs text-stone-500"><span className="size-2 rounded-full" style={{ background: category.color }} />{category.name}</span>}</div></article>;
}
