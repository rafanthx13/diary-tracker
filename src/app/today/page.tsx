import { createManualActivity, signOut, startActivity, stopActivity } from "@/app/actions";
import { RestoreCatalogButton } from "@/app/categories/restore-catalog-button";
import { requireUser } from "@/lib/auth";
import { type Activity, type Classification, formatDuration, formatTime, toDateTimeLocal } from "@/lib/diary";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function getTodayInSaoPaulo() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((value) => value.type === type)?.value ?? "";

  return `${part("year")}-${part("month")}-${part("day")}`;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long" })
    .format(new Date(`${date}T12:00:00-03:00`));
}

export default async function TodayPage() {
  if (!hasSupabaseEnv()) redirect("/");
  await requireUser();

  const today = getTodayInSaoPaulo();
  const supabase = await createClient();
  const [{ data: classificationsData, error: classificationsError }, { data: activitiesData, error: activitiesError }] = await Promise.all([
    supabase.from("classifications").select("id, name").order("name"),
    supabase.from("activities").select("id, title, started_at, ended_at, classification:classifications(id, name, category:categories(id, name, color))").or(`tracking_date.eq.${today},ended_at.is.null`).order("started_at", { ascending: false }),
  ]);

  const dataError = classificationsError ?? activitiesError;

  if (dataError) {
    const isMissingSchema = dataError.code === "42P01" || dataError.code === "PGRST205";
    const isPermissionError = dataError.code === "42501";

    return (
      <main className="grid min-h-screen place-items-center bg-stone-50 px-6 text-stone-900">
        <section className="w-full max-w-xl rounded-3xl border border-amber-200 bg-white p-7 shadow-sm sm:p-10">
          <p className="text-sm font-semibold tracking-[0.18em] text-amber-700 uppercase">Diary Tracker</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">Não foi possível carregar o diário.</h1>
          <p className="mt-4 leading-7 text-stone-600">
            {isMissingSchema
              ? "As tabelas ainda não estão disponíveis na API do Supabase. Execute a migração SQL e aguarde alguns segundos antes de atualizar a página."
              : isPermissionError
                ? "A sua conta não tem permissão para ler os dados. Confirme que a migração foi executada antes de criar o usuário."
                : "O Supabase retornou o diagnóstico abaixo. Ele ajuda a identificar a configuração que falta."}
          </p>
          <dl className="mt-6 space-y-3 rounded-2xl bg-stone-50 p-5 text-sm">
            <div><dt className="font-medium text-stone-500">Código</dt><dd className="mt-1 font-mono">{dataError.code ?? "sem código"}</dd></div>
            <div><dt className="font-medium text-stone-500">Mensagem</dt><dd className="mt-1 break-words font-mono">{dataError.message}</dd></div>
          </dl>
        </section>
      </main>
    );
  }

  // Sem tipos gerados pelo Supabase, o cliente infere relacionamentos como listas.
  // O PostgREST retorna um objeto para estas relações muitos-para-um.
  const classifications = (classificationsData ?? []) as unknown as Classification[];
  const activities = (activitiesData ?? []) as unknown as Activity[];
  const runningActivity = activities.find((activity) => !activity.ended_at);
  const lastFinishedActivity = activities.find((activity) => activity.ended_at);
  const defaultStart = toDateTimeLocal(lastFinishedActivity?.ended_at ? new Date(lastFinishedActivity.ended_at) : new Date());
  const defaultEnd = toDateTimeLocal(new Date());

  return (
    <main className="min-h-screen bg-stone-50 pb-12 text-stone-900">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-8">
          <div>
            <p className="text-sm font-semibold tracking-[0.16em] text-emerald-700 uppercase">Diary Tracker</p>
            <h1 className="mt-1 text-xl font-semibold capitalize">{formatDate(today)}</h1>
          </div>
          <div className="flex items-center gap-1"><Link href="/tasks" className="rounded-lg px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100">Tarefas</Link><Link href="/routine" className="rounded-lg px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100">Rotina</Link><Link href="/categories" className="rounded-lg px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100">Categorias</Link><form action={signOut}><button className="rounded-lg px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100">Sair</button></form></div>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6">
          <section className="rounded-3xl bg-emerald-800 p-6 text-white shadow-sm">
            {runningActivity ? (
              <>
                <p className="text-sm font-medium text-emerald-100">Em andamento desde {formatTime(runningActivity.started_at)}</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">{runningActivity.title}</h2>
                <p className="mt-1 text-emerald-100">{runningActivity.classification?.name ?? "Sem classificação"} · {formatDuration(runningActivity.started_at, null)}</p>
                <form action={stopActivity} className="mt-6"><input type="hidden" name="activityId" value={runningActivity.id} /><button className="w-full rounded-xl bg-white px-4 py-3 font-semibold text-emerald-900 transition hover:bg-emerald-50">Encerrar agora</button></form>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-emerald-100">Registro rápido</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">O que você vai fazer agora?</h2>
                {classifications.length ? (
                  <form action={startActivity} className="mt-5 space-y-3">
                    <input name="title" required placeholder="Ex.: Academia" className="w-full rounded-xl border border-white/30 bg-white px-3 py-3 text-stone-900 outline-none placeholder:text-stone-400 focus:ring-2 focus:ring-emerald-200" />
                    <select name="classificationId" required defaultValue="" className="w-full rounded-xl border border-white/30 bg-white px-3 py-3 text-stone-900 outline-none focus:ring-2 focus:ring-emerald-200">
                      <option value="" disabled>Escolha uma classificação</option>
                      {classifications.map((classification) => <option key={classification.id} value={classification.id}>{classification.name}</option>)}
                    </select>
                    <button className="w-full rounded-xl bg-emerald-500 px-4 py-3 font-semibold transition hover:bg-emerald-400">Iniciar agora</button>
                  </form>
                ) : (
                  <div className="mt-5 rounded-2xl bg-emerald-950/40 p-4">
                    <p className="text-sm leading-6 text-emerald-50">Nenhuma classificação está vinculada à conta atual. Restaure o catálogo padrão ou crie uma em Categorias.</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2"><RestoreCatalogButton /><Link href="/categories" className="mt-3 rounded-xl border border-emerald-200 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700">Abrir categorias</Link></div>
                  </div>
                )}
              </>
            )}
          </section>

          <section className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6">
            <div className="flex items-baseline justify-between gap-4"><div><p className="text-sm font-medium text-stone-500">Atividades do dia</p><h2 className="mt-1 text-xl font-semibold">Seu histórico</h2></div><span className="rounded-full bg-stone-100 px-3 py-1 text-sm text-stone-600">{activities.length}</span></div>
            {activities.length ? (
              <div className="mt-5 divide-y divide-stone-100">
                {activities.map((activity) => (
                  <article key={activity.id} className="py-4 first:pt-0">
                    <div className="flex items-start justify-between gap-4"><div><h3 className="font-medium">{activity.title}</h3><p className="mt-1 text-sm text-stone-500">{activity.classification?.name ?? "Sem classificação"}</p></div><span className="shrink-0 text-right text-sm font-medium tabular-nums">{formatTime(activity.started_at)} — {activity.ended_at ? formatTime(activity.ended_at) : "agora"}<small className="mt-1 block font-normal text-stone-500">{formatDuration(activity.started_at, activity.ended_at)}</small></span></div>
                  </article>
                ))}
              </div>
            ) : <p className="mt-5 rounded-2xl bg-stone-50 px-4 py-6 text-center text-sm leading-6 text-stone-500">Nenhuma atividade registrada hoje. Comece pelo registro rápido acima.</p>}
          </section>
        </section>

        <aside className="h-fit rounded-3xl border border-stone-200 bg-white p-5 sm:p-6">
          <p className="text-sm font-medium text-stone-500">Adicionar manualmente</p><h2 className="mt-1 text-xl font-semibold">Registrar um período</h2><p className="mt-2 text-sm leading-6 text-stone-600">Use este formulário para registrar algo que já aconteceu ou ajustar o histórico.</p>
          <form action={createManualActivity} className="mt-6 space-y-4">
            <label className="block text-sm font-medium">Atividade<input name="title" required placeholder="Ex.: Arrumar quarto" className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-3 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></label>
            <label className="block text-sm font-medium">Classificação<select name="classificationId" required defaultValue="" className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-3 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"><option value="" disabled>Escolha uma classificação</option>{classifications.map((classification) => <option key={classification.id} value={classification.id}>{classification.name}</option>)}</select></label>
            <label className="block text-sm font-medium">Início<input name="startedAt" type="datetime-local" defaultValue={defaultStart} required className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-3 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></label>
            <label className="block text-sm font-medium">Fim<input name="endedAt" type="datetime-local" defaultValue={defaultEnd} required className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-3 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></label>
            <button disabled={!classifications.length} className="w-full rounded-xl bg-stone-900 px-4 py-3 font-medium text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50">Salvar período</button>
          </form>
        </aside>
      </div>
    </main>
  );
}
