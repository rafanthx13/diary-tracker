import { updateDailyTaskSettings } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { type Task } from "@/lib/tasks";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ManageDiaryTasksPage() {
  if (!hasSupabaseEnv()) redirect("/");
  const userId = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("id, title, is_daily, allows_not_done, task_list_id, completed_at, created_at")
    .eq("user_id", userId)
    .eq("is_daily", true)
    .order("created_at");

  if (error) throw new Error("Não foi possível carregar as atividades diárias.");
  const tasks = (data ?? []) as unknown as Task[];

  return <main className="min-h-screen bg-stone-50 pb-12 text-stone-900"><header className="border-b border-stone-200 bg-white"><div className="mx-auto max-w-4xl px-5 py-5 sm:px-8"><p className="text-sm font-semibold tracking-[0.16em] text-emerald-700 uppercase">Diary Tracker</p><h1 className="mt-1 text-2xl font-semibold">Gerenciar atividades diárias</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">Renomeie as atividades e defina quais podem ser marcadas como não feitas. Renomear mantém intacto todo o histórico de checks da atividade.</p><div className="mt-4"><Link href="/diary-task" className="inline-block rounded-xl bg-stone-100 px-3 py-2 text-sm font-medium hover:bg-stone-200">Voltar ao Diary Task</Link></div></div></header><div className="mx-auto max-w-4xl space-y-4 px-5 py-6 sm:px-8">{tasks.length ? tasks.map((task) => <TaskSettingsCard key={task.id} task={task} />) : <section className="rounded-3xl border border-dashed border-stone-300 bg-white px-5 py-10 text-center text-sm text-stone-500">Nenhuma atividade diária foi criada ainda. Crie a primeira no <Link href="/diary-task" className="font-medium text-emerald-800 underline">Diary Task</Link>.</section>}</div></main>;
}

function TaskSettingsCard({ task }: { task: Task }) {
  return <form action={updateDailyTaskSettings} className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6"><input type="hidden" name="taskId" value={task.id} /><div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end"><label className="text-sm font-medium">Nome da atividade<input name="title" required maxLength={240} defaultValue={task.title} className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></label><label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-stone-50 p-3 text-sm leading-5 text-stone-700"><input name="allowsNotDone" value="true" type="checkbox" defaultChecked={task.allows_not_done} className="mt-0.5 size-4 accent-emerald-700" /><span><span className="block font-medium text-stone-900">Permitir “não feita”</span>Use quando já souber que a atividade não poderá ser realizada no dia.</span></label></div><div className="mt-5 flex justify-end"><button className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-800">Salvar alterações</button></div></form>;
}
