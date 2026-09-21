import { signOut } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { formatDateTime, monthBounds, saoPauloDate, type CategoryOption, type Task } from "@/lib/tasks";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type CompletedPageProps = { searchParams: Promise<{ month?: string }> };

export default async function CompletedTasksPage({ searchParams }: CompletedPageProps) {
  if (!hasSupabaseEnv()) redirect("/");
  const userId = await requireUser();
  const { month: requestedMonth } = await searchParams;
  const defaultMonth = saoPauloDate().slice(0, 7);
  const month = /^\d{4}-\d{2}$/.test(requestedMonth ?? "") ? requestedMonth! : defaultMonth;
  const { start, end } = monthBounds(month);
  const supabase = await createClient();
  const [{ data: tasksData, error: tasksError }, { data: categoriesData, error: categoriesError }] = await Promise.all([
    supabase.from("tasks").select("id, title, category_id, is_daily, completed_at, created_at").eq("user_id", userId).eq("is_daily", false).gte("completed_at", start).lt("completed_at", end).order("completed_at", { ascending: false }),
    supabase.from("categories").select("id, name, color").order("name"),
  ]);
  if (tasksError || categoriesError) throw new Error("Não foi possível carregar tarefas concluídas.");
  const tasks = (tasksData ?? []) as unknown as Task[];
  const categories = (categoriesData ?? []) as unknown as CategoryOption[];
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  return <main className="min-h-screen bg-stone-50 pb-12 text-stone-900"><header className="border-b border-stone-200 bg-white"><div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-5 py-4 sm:px-8"><div><p className="text-sm font-semibold tracking-[0.16em] text-emerald-700 uppercase">Diary Tracker</p><h1 className="mt-1 text-xl font-semibold">Concluídas no mês</h1></div><div className="flex flex-wrap justify-end gap-1"><Link href="/tasks" className="rounded-lg px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100">Tarefas</Link><Link href="/routine" className="rounded-lg px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100">Rotina</Link><form action={signOut}><button className="rounded-lg px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100">Sair</button></form></div></div></header><div className="mx-auto max-w-4xl space-y-6 px-5 py-6 sm:px-8"><form className="flex items-end gap-3 rounded-3xl border border-stone-200 bg-white p-5"><label className="block text-sm font-medium">Mês<input type="month" name="month" defaultValue={month} className="mt-2 block rounded-xl border border-stone-300 px-3 py-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></label><button className="rounded-xl bg-stone-900 px-4 py-3 font-medium text-white transition hover:bg-stone-700">Ver</button></form><section className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6"><p className="text-sm font-medium text-stone-500">{tasks.length} tarefa{tasks.length === 1 ? "" : "s"}</p><h2 className="mt-1 text-xl font-semibold">Histórico de conclusão</h2>{tasks.length ? <div className="mt-5 divide-y divide-stone-100">{tasks.map((task) => { const category = task.category_id ? categoryById.get(task.category_id) : undefined; return <article key={task.id} className="py-4 first:pt-0"><div className="flex flex-col justify-between gap-2 sm:flex-row"><div><h3 className="font-medium">{task.title}</h3>{category && <span className="mt-1 inline-flex items-center gap-1.5 text-xs text-stone-500"><span className="size-2 rounded-full" style={{ background: category.color }} />{category.name}</span>}</div><dl className="text-sm text-stone-500 sm:text-right"><div>Criada: {formatDateTime(task.created_at)}</div><div>Concluída: {task.completed_at ? formatDateTime(task.completed_at) : "—"}</div></dl></div></article>; })}</div> : <p className="mt-5 rounded-2xl bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">Nenhuma tarefa geral foi concluída neste mês.</p>}</section></div></main>;
}
