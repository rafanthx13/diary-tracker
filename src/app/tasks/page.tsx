import { createTask, createTaskList, reorderTaskList, setTaskCompletion, setTaskImportance } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { type Task } from "@/lib/tasks";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ list?: string | string[] }> };
type TaskList = { id: string; name: string; description: string; sort_order: number };
type TaskSection = { id: string; title: string; description: string; tasks: Task[] };

function sortTasks(tasks: Task[]) {
  return [...tasks].sort((first, second) => Number(second.is_important) - Number(first.is_important) || second.created_at.localeCompare(first.created_at));
}

export default async function TasksPage({ searchParams }: Props) {
  if (!hasSupabaseEnv()) redirect("/");
  const userId = await requireUser();
  const requestedList = (await searchParams).list;
  const listParameter = Array.isArray(requestedList) ? requestedList[0] : requestedList;
  const supabase = await createClient();
  const [{ data: taskData, error: taskError }, { data: listData, error: listError }] = await Promise.all([
    supabase.from("tasks").select("id, title, is_daily, task_list_id, is_important, completed_at, created_at").eq("user_id", userId).eq("is_daily", false).order("is_important", { ascending: false }).order("created_at", { ascending: false }),
    supabase.from("task_lists").select("id, name, description, sort_order").eq("user_id", userId).order("sort_order").order("created_at"),
  ]);
  if (taskError || listError) throw new Error("Não foi possível carregar a TODO List. Execute a migração 20260921050000 no Supabase.");

  const lists = (listData ?? []) as TaskList[];
  const activeList = lists.find((list) => list.id === listParameter) ?? null;
  const selectedView = activeList ? "custom" : listParameter === "pending" ? "pending" : "all";
  const pendingTasks = sortTasks(((taskData ?? []) as unknown as Task[]).filter((task) => !task.completed_at));
  const unassignedTasks = pendingTasks.filter((task) => !task.task_list_id);
  const sections: TaskSection[] = selectedView === "all"
    ? [
        ...lists.map((list) => ({ id: list.id, title: list.name, description: list.description, tasks: pendingTasks.filter((task) => task.task_list_id === list.id) })),
        ...(unassignedTasks.length || !lists.length ? [{ id: "pending", title: "Pendente", description: "Tarefas que ainda não foram colocadas em uma aba.", tasks: unassignedTasks }] : []),
      ]
    : selectedView === "pending"
      ? [{ id: "pending", title: "Pendente", description: "Tarefas que ainda não foram colocadas em uma aba.", tasks: unassignedTasks }]
      : [{ id: activeList!.id, title: activeList!.name, description: activeList!.description, tasks: pendingTasks.filter((task) => task.task_list_id === activeList!.id) }];
  const canCreateTask = selectedView !== "all";

  return (
    <main className="min-h-screen bg-stone-50 pb-12 text-stone-900">
      <Header />
      <div className="mx-auto max-w-6xl space-y-6 px-5 py-6 sm:px-8">
        <section className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
          <nav aria-label="Abas da TODO List" className="flex flex-wrap items-center gap-2">
            <Link href="/tasks" className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${selectedView === "all" ? "bg-emerald-700 text-white" : "bg-stone-100 hover:bg-stone-200"}`}><span aria-hidden="true">✦</span>TODAS</Link>
            <Link href="/tasks?list=pending" className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${selectedView === "pending" ? "bg-emerald-700 text-white" : "bg-stone-100 hover:bg-stone-200"}`}>Pendente</Link>
            {lists.map((list) => <Link key={list.id} href={`/tasks?list=${list.id}`} className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${activeList?.id === list.id ? "bg-emerald-700 text-white" : "bg-stone-100 hover:bg-stone-200"}`}>{list.name}</Link>)}
          </nav>

          <div className="mt-4 grid gap-3 border-t border-stone-100 pt-4 lg:grid-cols-3">
            <details className="group rounded-2xl bg-stone-50 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-emerald-800">＋ Criar nova aba</summary>
              <form action={createTaskList} className="mt-4 space-y-3">
                <label className="block text-sm font-medium">Nome da aba<input name="name" required maxLength={80} placeholder="Ex.: Estudos" className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></label>
                <label className="block text-sm font-medium">Descrição<textarea name="description" maxLength={300} rows={2} placeholder="Ex.: Cursos, leituras e exercícios que quero estudar." className="mt-2 w-full resize-none rounded-xl border border-stone-300 bg-white px-3 py-2.5 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></label>
                <button className="rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-700">Criar aba</button>
              </form>
            </details>

            {lists.length > 1 && <details className="group rounded-2xl bg-stone-50 p-4"><summary className="cursor-pointer text-sm font-semibold text-emerald-800">↕ Ordenar abas</summary><p className="mt-2 text-xs leading-5 text-stone-500">A ordem definida aqui também é usada nas seções da aba TODAS.</p><div className="mt-3 space-y-2">{lists.map((list, index) => <div key={list.id} className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white px-3 py-2"><span className="truncate text-sm font-medium"><span className="mr-2 text-stone-400">{index + 1}.</span>{list.name}</span><div className="flex gap-1"><OrderButton listId={list.id} direction="up" disabled={index === 0} label={`Subir ${list.name}`} symbol="↑" /><OrderButton listId={list.id} direction="down" disabled={index === lists.length - 1} label={`Descer ${list.name}`} symbol="↓" /></div></div>)}</div></details>}

            <details className="group rounded-2xl bg-stone-50 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-emerald-800">ⓘ Informações e nova tarefa</summary>
              <div className="mt-4"><h2 className="text-lg font-semibold">{selectedView === "all" ? "Todas as tarefas" : activeList?.name ?? "Pendente"}</h2>{selectedView === "custom" && activeList?.description && <p className="mt-2 text-sm leading-6 text-stone-600">{activeList.description}</p>}{canCreateTask ? <form action={createTask} className="mt-4 space-y-3"><input type="hidden" name="isDaily" value="false" /><input type="hidden" name="taskListId" value={activeList?.id ?? ""} /><label className="block text-sm font-medium">Nova tarefa<input name="title" required maxLength={240} placeholder="O que precisa fazer?" className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></label><button className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-800">Adicionar</button></form> : <p className="mt-2 text-sm leading-6 text-stone-600">Abra uma aba específica para criar uma tarefa nela.</p>}</div>
            </details>
          </div>
        </section>

        <div className="space-y-5">{sections.map((section) => <TaskGroup key={section.id} section={section} />)}</div>
      </div>
    </main>
  );
}

function Header() {
  return <header className="border-b border-stone-200 bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8"><div><p className="text-sm font-semibold tracking-[0.16em] text-emerald-700 uppercase">Diary Tracker</p><h1 className="mt-1 text-2xl font-semibold">TODO List</h1></div><Link href="/tasks/reports" className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 shadow-sm hover:bg-stone-50"><span aria-hidden="true">▥</span>Relatório</Link></div></header>;
}

function OrderButton({ listId, direction, disabled, label, symbol }: { listId: string; direction: "up" | "down"; disabled: boolean; label: string; symbol: string }) {
  return <form action={reorderTaskList}><input type="hidden" name="taskListId" value={listId} /><input type="hidden" name="direction" value={direction} /><button disabled={disabled} aria-label={label} title={label} className="grid size-8 place-items-center rounded-lg bg-stone-100 font-semibold hover:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-30">{symbol}</button></form>;
}

function TaskGroup({ section }: { section: TaskSection }) {
  return <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-semibold">{section.title}</h2>{section.description && <p className="mt-2 text-sm leading-6 text-stone-600">{section.description}</p>}</div><span className="shrink-0 rounded-full bg-stone-100 px-3 py-1 text-sm text-stone-600">{section.tasks.length}</span></div>{section.tasks.length ? <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{section.tasks.map((task) => <TaskCard key={task.id} task={task} />)}</div> : <p className="mt-5 rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-8 text-center text-sm text-stone-500">Nenhuma tarefa pendente nesta aba.</p>}</section>;
}

function TaskCard({ task }: { task: Task }) {
  return <article className={`flex min-h-40 flex-col justify-between rounded-3xl border p-5 shadow-sm ${task.is_important ? "border-amber-300 bg-amber-50" : "border-stone-200 bg-white"}`}><div className="flex items-start justify-between gap-3"><h3 className="text-lg font-semibold leading-6">{task.title}</h3><div className="flex shrink-0 gap-2"><form action={setTaskImportance}><input type="hidden" name="taskId" value={task.id} /><input type="hidden" name="important" value={task.is_important ? "false" : "true"} /><button aria-label={`${task.is_important ? "Remover importância de" : "Marcar como importante"} ${task.title}`} aria-pressed={task.is_important} title={task.is_important ? "Remover importância" : "Marcar como importante"} className={`grid size-9 place-items-center rounded-xl border-2 text-lg font-black transition ${task.is_important ? "border-amber-500 bg-amber-500 text-white" : "border-stone-300 text-stone-400 hover:border-amber-500 hover:text-amber-600"}`}>!</button></form><form action={setTaskCompletion}><input type="hidden" name="taskId" value={task.id} /><input type="hidden" name="complete" value="true" /><button aria-label={`Concluir ${task.title}`} title="Concluir tarefa" className="grid size-9 place-items-center rounded-xl border-2 border-stone-300 text-lg transition hover:border-emerald-600 hover:bg-emerald-50">✓</button></form></div></div><p className={`mt-6 text-sm font-medium ${task.is_important ? "text-amber-800" : "text-stone-500"}`}>{task.is_important ? "! Importante" : "Tarefa pendente"}</p></article>;
}
