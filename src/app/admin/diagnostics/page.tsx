import { requireUser } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type ErrorEvent = { occurred_at: string; source: string; code: string; severity: "warning" | "error" };

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(value));
}

export default async function DiagnosticsPage() {
  if (!hasSupabaseEnv()) redirect("/");
  const userId = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("app_error_events")
    .select("occurred_at, source, code, severity")
    .eq("user_id", userId)
    .order("occurred_at", { ascending: false })
    .limit(50);

  if (error) {
    return <main className="grid min-h-screen place-items-center bg-stone-50 px-6 py-12 text-stone-900"><section className="w-full max-w-xl rounded-3xl border border-amber-200 bg-white p-7 shadow-sm"><h1 className="text-2xl font-semibold">Diagnóstico ainda não está disponível.</h1><p className="mt-3 leading-7 text-stone-600">Aplique a migração <code className="rounded bg-stone-100 px-1.5 py-0.5">20260925010000</code> no Supabase para ativar o monitoramento privado de erros.</p><Link href="/admin" className="mt-6 inline-flex rounded-xl bg-stone-100 px-4 py-3 text-sm font-semibold">Voltar</Link></section></main>;
  }

  const events = (data ?? []) as ErrorEvent[];
  const errors = events.filter((event) => event.severity === "error").length;
  const uniqueCodes = new Set(events.map((event) => event.code)).size;

  return (
    <main className="min-h-screen bg-stone-50 pb-12 text-stone-900">
      <header className="border-b border-stone-200 bg-white"><div className="mx-auto max-w-5xl px-5 py-5 sm:px-8"><p className="text-sm font-semibold tracking-[0.16em] text-slate-700 uppercase">Área privada</p><h1 className="mt-1 text-2xl font-semibold">Diagnóstico técnico</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">Este painel armazena apenas horário, origem, código e gravidade do erro. Não mostra mensagens, conteúdo, URLs, identidade ou qualquer dado pessoal.</p></div></header>
      <div className="mx-auto max-w-5xl space-y-6 px-5 py-6 sm:px-8"><div className="flex flex-wrap gap-2"><Link href="/admin" className="rounded-xl bg-stone-100 px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-200">← Administração</Link><Link href="/admin/data" className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-200">Backup e restauração</Link></div><section className="grid gap-4 sm:grid-cols-3"><Metric label="Eventos exibidos" value={String(events.length)} /><Metric label="Com gravidade de erro" value={String(errors)} /><Metric label="Códigos distintos" value={String(uniqueCodes)} /></section><section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6"><div><p className="text-sm font-medium text-stone-500">Últimos 50 eventos</p><h2 className="mt-1 text-xl font-semibold">Ocorrências registradas</h2></div>{events.length ? <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead className="border-b border-stone-200 text-xs uppercase tracking-wide text-stone-500"><tr><th className="px-3 py-3 font-semibold">Horário</th><th className="px-3 py-3 font-semibold">Origem</th><th className="px-3 py-3 font-semibold">Código</th><th className="px-3 py-3 font-semibold">Gravidade</th></tr></thead><tbody className="divide-y divide-stone-100">{events.map((event) => <tr key={`${event.occurred_at}-${event.code}`}><td className="whitespace-nowrap px-3 py-3 text-stone-600">{formatDate(event.occurred_at)}</td><td className="px-3 py-3 font-mono text-xs text-stone-700">{event.source}</td><td className="px-3 py-3 font-mono text-xs text-stone-700">{event.code}</td><td className="px-3 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${event.severity === "error" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>{event.severity === "error" ? "Erro" : "Alerta"}</span></td></tr>)}</tbody></table></div> : <p className="mt-5 rounded-2xl border border-dashed border-stone-300 bg-white px-5 py-10 text-center text-sm text-stone-500">Nenhum erro técnico foi registrado.</p>}</section></div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"><p className="text-sm text-stone-500">{label}</p><p className="mt-2 text-3xl font-semibold tabular-nums">{value}</p></article>;
}
