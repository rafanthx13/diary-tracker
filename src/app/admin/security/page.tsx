import { requireUser } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type SecurityEvent = {
  id: string;
  occurred_at: string;
  event_type: string;
  ip_address: string | null;
  user_agent: string | null;
  accept_language: string | null;
  client_platform: string | null;
  client_is_mobile: boolean | null;
  request_host: string | null;
  is_tls: boolean | null;
};

const eventLabels: Record<string, string> = {
  login_success: "Login realizado",
  backup_area_opened: "Área de backup aberta",
  backup_exported: "Backup baixado",
  backup_restore_started: "Restauração iniciada",
  backup_restore_succeeded: "Restauração concluída",
  backup_restore_failed: "Restauração falhou",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "medium", timeZone: "America/Sao_Paulo" }).format(new Date(value));
}

export default async function SecurityLogPage() {
  if (!hasSupabaseEnv()) redirect("/");
  const userId = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("security_access_events")
    .select("id, occurred_at, event_type, ip_address, user_agent, accept_language, client_platform, client_is_mobile, request_host, is_tls")
    .eq("user_id", userId)
    .order("occurred_at", { ascending: false })
    .limit(100);

  if (error) {
    return <main className="grid min-h-screen place-items-center bg-stone-50 px-6 py-12 text-stone-900"><section className="w-full max-w-xl rounded-3xl border border-amber-200 bg-white p-7 shadow-sm"><h1 className="text-2xl font-semibold">Log de segurança ainda não está disponível.</h1><p className="mt-3 leading-7 text-stone-600">Aplique a migração <code className="rounded bg-stone-100 px-1.5 py-0.5">20260925020000</code> no Supabase para ativar esta trilha de acesso.</p><Link href="/admin" className="mt-6 inline-flex rounded-xl bg-stone-100 px-4 py-3 text-sm font-semibold">Voltar</Link></section></main>;
  }
  const events = (data ?? []) as SecurityEvent[];

  return (
    <main className="min-h-screen bg-stone-50 pb-12 text-stone-900">
      <header className="border-b border-stone-200 bg-white"><div className="mx-auto max-w-6xl px-5 py-5 sm:px-8"><p className="text-sm font-semibold tracking-[0.16em] text-amber-700 uppercase">Área privada</p><h1 className="mt-1 text-2xl font-semibold">Log de segurança</h1><p className="mt-2 max-w-4xl text-sm leading-6 text-stone-600">Registra somente logins bem-sucedidos e eventos da área de backup. Senhas, cookies, tokens, conteúdo de formulários e conteúdo dos backups nunca são gravados.</p></div></header>
      <section className="mx-auto max-w-6xl px-5 py-6 sm:px-8"><div className="mb-6 flex flex-wrap gap-2"><Link href="/admin" className="rounded-xl bg-stone-100 px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-200">← Administração</Link><Link href="/admin/data" className="rounded-xl bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-200">Backup e restauração</Link></div>{events.length ? <div className="space-y-4">{events.map((event) => <article key={event.id} className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-semibold text-amber-800">{eventLabels[event.event_type] ?? event.event_type}</p><time className="mt-1 block text-sm text-stone-500">{formatDate(event.occurred_at)}</time></div><span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">{event.is_tls ? "HTTPS" : "Protocolo não informado"}</span></div><dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4"><LogField label="IP encaminhado" value={event.ip_address} /><LogField label="Host" value={event.request_host} /><LogField label="Idioma" value={event.accept_language} /><LogField label="Plataforma" value={event.client_platform} /><LogField label="Dispositivo" value={event.client_is_mobile === null ? null : event.client_is_mobile ? "Móvel" : "Desktop"} /><LogField label="Navegador" value={event.user_agent} className="lg:col-span-3" /></dl></article>)}</div> : <div className="rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-14 text-center"><h2 className="text-lg font-semibold">Nenhum acesso registrado ainda</h2><p className="mt-2 text-sm leading-6 text-stone-600">O primeiro registro será criado no próximo login ou ao abrir a área de backup.</p></div>}</section>
    </main>
  );
}

function LogField({ label, value, className = "" }: { label: string; value: string | null; className?: string }) {
  return <div className={className}><dt className="text-xs font-semibold tracking-wide text-stone-500 uppercase">{label}</dt><dd className="mt-1 break-all leading-6 text-stone-800">{value ?? "Não informado"}</dd></div>;
}
