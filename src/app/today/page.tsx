import { startActivity, stopActivity } from "@/app/actions";
import { RestoreCatalogButton } from "@/app/categories/restore-catalog-button";
import { requireUser } from "@/lib/auth";
import { currentDiaryDate, type Activity, type Classification, formatDuration, formatTime, toDateTimeLocal } from "@/lib/diary";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EditActivityModal, ManualActivityModal } from "./activity-modals";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ date?: string | string[] }>;
};

function isValidIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return new Date(`${value}T12:00:00-03:00`).toISOString().slice(0, 10) === value;
}

function shiftDate(value: string, days: number) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long" })
    .format(new Date(`${date}T12:00:00-03:00`));
}

function diaryHref(date: string, today: string) {
  return date === today ? "/today" : `/today?date=${date}`;
}

function formatTotalMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  return `${hours}:${String(minutes % 60).padStart(2, "0")}`;
}

export default async function TodayPage({ searchParams }: PageProps) {
  if (!hasSupabaseEnv()) redirect("/");
  const userId = await requireUser();
  const today = currentDiaryDate();
  const requestedDate = (await searchParams).date;
  const dateParameter = Array.isArray(requestedDate) ? requestedDate[0] : requestedDate;
  const selectedDate = dateParameter && isValidIsoDate(dateParameter) && dateParameter <= today ? dateParameter : today;
  const isToday = selectedDate === today;
  const previousDate = shiftDate(selectedDate, -1);
  const nextDate = shiftDate(selectedDate, 1);
  const supabase = await createClient();
  const activitySelect = "id, title, started_at, ended_at, diary_date, classification:classifications(id, name, category:categories(id, name, color))";
  const [
    { data: classificationsData, error: classificationsError },
    { data: categoriesData, error: categoriesError },
    { data: activitiesData, error: activitiesError },
    { data: runningActivityData, error: runningActivityError },
  ] = await Promise.all([
    supabase.from("classifications").select("id, name, category_id").order("name"),
    supabase.from("categories").select("id, name, color").order("name"),
    supabase.from("activities").select(activitySelect).eq("user_id", userId).eq("diary_date", selectedDate).order("started_at", { ascending: false }),
    supabase.from("activities").select(activitySelect).eq("user_id", userId).is("ended_at", null).maybeSingle(),
  ]);

  const dataError = classificationsError ?? categoriesError ?? activitiesError ?? runningActivityError;

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

  const classifications = (classificationsData ?? []) as unknown as (Classification & { category_id: string | null })[];
  const categoryNameById = new Map((categoriesData ?? []).map((category) => [category.id, category.name]));
  const classificationOptions = classifications.map((classification) => ({ id: classification.id, name: classification.name, categoryName: classification.category_id ? categoryNameById.get(classification.category_id) ?? null : null }));
  const activities = (activitiesData ?? []) as unknown as Activity[];
  const runningActivity = runningActivityData as unknown as Activity | null;
  const lastFinishedActivity = activities.find((activity) => activity.ended_at);
  const fallbackStart = isToday ? new Date() : new Date(`${selectedDate}T00:00:00-03:00`);
  const defaultStartDate = lastFinishedActivity?.ended_at ? new Date(lastFinishedActivity.ended_at) : fallbackStart;
  const defaultEndDate = isToday ? new Date() : new Date(defaultStartDate.getTime() + 15 * 60 * 1000);
  const defaultStart = toDateTimeLocal(defaultStartDate);
  const defaultEnd = toDateTimeLocal(defaultEndDate);
  const minutesByCategory = new Map<string, number>();
  for (const activity of activities) {
    const categoryId = activity.classification?.category?.id;
    if (!categoryId) continue;
    const [hours, minutesPart] = formatDuration(activity.started_at, activity.ended_at).split(":").map(Number);
    const minutes = hours * 60 + minutesPart;
    minutesByCategory.set(categoryId, (minutesByCategory.get(categoryId) ?? 0) + minutes);
  }

  return (
    <main className="min-h-screen bg-stone-50 pb-10 text-stone-900">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <p className="text-xs font-semibold tracking-[0.16em] text-emerald-700 uppercase">Diary Tracker</p>
          <h1 className="mt-1 text-lg font-semibold capitalize">{formatDate(selectedDate)}</h1>
        </div>
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 pb-3 sm:px-6">
          <Link href={diaryHref(previousDate, today)} className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium hover:bg-stone-100">← Anterior</Link>
          <form action="/today" className="flex items-center gap-2"><label className="sr-only" htmlFor="diary-date">Data do diário</label><input id="diary-date" name="date" type="date" defaultValue={selectedDate} max={today} className="rounded-lg border border-stone-300 px-2.5 py-1.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /><button className="rounded-lg bg-stone-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-700">Ir</button></form>
          {!isToday && <Link href={diaryHref(nextDate, today)} className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium hover:bg-stone-100">Próximo →</Link>}
          {!isToday && <Link href="/today" className="rounded-lg px-3 py-1.5 text-sm font-medium text-emerald-800 hover:bg-emerald-50">Hoje</Link>}
          <span className="hidden h-6 w-px bg-stone-200 sm:block" />
          <Link href="/today/reports" className="rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800 hover:bg-emerald-100">Relatório de tempo</Link>
          <Link href="/today/categories" className="rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800 hover:bg-emerald-100">Categorias de tempo</Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[19rem_minmax(0,1fr)]">
        <aside className="h-fit rounded-2xl bg-emerald-800 p-4 text-white shadow-sm">
          {!isToday ? (
            <div><p className="text-sm font-medium text-emerald-100">Registro histórico</p><h2 className="mt-1 text-lg font-semibold">{formatDate(selectedDate)}</h2><p className="mt-2 text-sm leading-5 text-emerald-50">Use o botão abaixo para registrar um período neste dia.</p></div>
          ) : runningActivity ? (
            <div><p className="text-xs font-medium text-emerald-100">Em andamento desde {formatTime(runningActivity.started_at)}</p><h2 className="mt-1 truncate text-xl font-semibold" title={runningActivity.title}>{runningActivity.title}</h2><p className="mt-1 text-sm text-emerald-100">{runningActivity.classification?.name ?? "Sem classificação"} · {formatDuration(runningActivity.started_at, null)}</p>{runningActivity.diary_date !== today && <p className="mt-2 rounded-lg bg-emerald-900/40 px-2.5 py-2 text-xs leading-5 text-emerald-50">Esta atividade pertence ao registro de {formatDate(runningActivity.diary_date)}.</p>}<form action={stopActivity} className="mt-4"><input type="hidden" name="activityId" value={runningActivity.id} /><button className="w-full rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-emerald-900 hover:bg-emerald-50">Encerrar agora</button></form></div>
          ) : classifications.length ? (
            <div><p className="text-xs font-medium text-emerald-100">Registro rápido</p><h2 className="mt-1 text-lg font-semibold">O que você fará agora?</h2><form action={startActivity} className="mt-4 space-y-2.5"><input name="title" required placeholder="Ex.: Academia" className="w-full rounded-xl border border-white/30 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none placeholder:text-stone-400 focus:ring-2 focus:ring-emerald-200" /><select name="classificationId" required defaultValue="" className="w-full rounded-xl border border-white/30 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none focus:ring-2 focus:ring-emerald-200"><option value="" disabled>Escolha uma classificação</option>{classificationOptions.map((option) => <option key={option.id} value={option.id}>{option.name}{option.categoryName ? ` · ${option.categoryName}` : ""}</option>)}</select><button className="w-full rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold hover:bg-emerald-400">Iniciar agora</button></form></div>
          ) : (
            <div><p className="text-sm leading-6 text-emerald-50">Nenhuma classificação foi encontrada.</p><div className="mt-3"><RestoreCatalogButton /></div></div>
          )}
          <div className="mt-4 border-t border-emerald-700 pt-4"><ManualActivityModal options={classificationOptions} defaultStart={defaultStart} defaultEnd={defaultEnd} dateLabel={isToday ? "hoje" : formatDate(selectedDate)} /></div>
        </aside>

        <section className="min-w-0 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-medium text-stone-500">Atividades de {isToday ? "hoje" : formatDate(selectedDate)}</p><h2 className="text-lg font-semibold">Seu histórico</h2></div><span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-600">{activities.length}</span></div>
          {activities.length ? (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead><tr className="border-b border-stone-200 text-xs text-stone-500"><th className="px-2 py-2 font-medium">Atividade</th><th className="px-2 py-2 font-medium">Início</th><th className="px-2 py-2 font-medium">Fim</th><th className="px-2 py-2 font-medium">Tempo</th><th className="px-2 py-2 font-medium">Classificação · categoria</th><th className="px-2 py-2 text-right font-medium">Ação</th></tr></thead>
                <tbody className="divide-y divide-stone-100">{activities.map((activity) => <tr key={activity.id} className="hover:bg-stone-50"><td className="max-w-52 truncate px-2 py-2 font-medium" title={activity.title}>{activity.title}</td><td className="whitespace-nowrap px-2 py-2 tabular-nums">{formatTime(activity.started_at)}</td><td className="whitespace-nowrap px-2 py-2 tabular-nums">{activity.ended_at ? formatTime(activity.ended_at) : "agora"}</td><td className="whitespace-nowrap px-2 py-2 font-medium tabular-nums">{formatDuration(activity.started_at, activity.ended_at)}</td><td className="max-w-60 truncate px-2 py-2 text-stone-600" title={`${activity.classification?.name ?? "Sem classificação"} · ${activity.classification?.category?.name ?? "Sem categoria"}`}>{activity.classification?.name ?? "Sem classificação"} · {activity.classification?.category?.name ?? "Sem categoria"}</td><td className="px-2 py-2 text-right"><EditActivityModal activity={activity} options={classificationOptions} /></td></tr>)}</tbody>
              </table>
            </div>
          ) : <p className="mt-3 rounded-xl bg-stone-50 px-4 py-8 text-center text-sm text-stone-500">Nenhuma atividade registrada neste dia.</p>}
        </section>

        <section className="lg:col-span-2">
          <div className="mb-3"><p className="text-xs font-medium text-stone-500">Resumo do dia</p><h2 className="text-lg font-semibold">Tempo por categoria</h2></div>
          <div className="grid gap-3 sm:grid-cols-3">{(categoriesData ?? []).map((category) => <article key={category.id} className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white px-4 py-3 shadow-sm"><div className="flex min-w-0 items-center gap-3"><span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: category.color }} /><h3 className="truncate text-sm font-semibold">{category.name}</h3></div><p className="ml-3 text-xl font-semibold tabular-nums">{formatTotalMinutes(minutesByCategory.get(category.id) ?? 0)}</p></article>)}</div>
        </section>
      </div>
    </main>
  );
}
