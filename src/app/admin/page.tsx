import { requireUser } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const tools = [
  {
    href: "/admin/data",
    title: "Backup e restauração",
    description: "Baixe uma cópia JSON dos seus registros pessoais ou restaure um backup anterior de forma controlada.",
    accent: "bg-rose-700",
  },
  {
    href: "/admin/diagnostics",
    title: "Diagnóstico técnico",
    description: "Consulte somente contagens, códigos e horários de erros técnicos, sem conteúdo pessoal ou mensagens de falha.",
    accent: "bg-slate-700",
  },
  {
    href: "/admin/security",
    title: "Log de segurança",
    description: "Revise logins e ações de backup, incluindo IP encaminhado, navegador e plataforma do acesso.",
    accent: "bg-amber-700",
  },
];

export default async function AdminPage() {
  if (!hasSupabaseEnv()) redirect("/");
  await requireUser();

  return (
    <main className="min-h-screen bg-stone-50 pb-12 text-stone-900">
      <header className="border-b border-stone-200 bg-white"><div className="mx-auto max-w-6xl px-5 py-5 sm:px-8"><p className="text-sm font-semibold tracking-[0.16em] text-slate-700 uppercase">Área privada</p><h1 className="mt-1 text-2xl font-semibold">Administração</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">Ferramentas de manutenção da sua conta, sem acesso a informações de outras pessoas.</p></div></header>
      <section className="mx-auto max-w-6xl px-5 py-8 sm:px-8"><div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{tools.map((tool) => <Link key={tool.href} href={tool.href} className="group overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"><div className={`h-2 ${tool.accent}`} /><div className="p-6"><h2 className="text-2xl font-semibold tracking-tight">{tool.title}</h2><p className="mt-3 min-h-20 leading-7 text-stone-600">{tool.description}</p><span className="mt-6 inline-block font-semibold text-slate-800">Abrir ferramenta →</span></div></Link>)}</div></section>
    </main>
  );
}
