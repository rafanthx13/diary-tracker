import { requireUser } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import Link from "next/link";

const modules = [
  { href: "/today", title: "Tasks temporizadas", description: "Registre atividades com início, fim, duração, classificação e categoria.", accent: "bg-emerald-700" },
  { href: "/diary-task", title: "Task diária recorrente", description: "Marque tarefas que se repetem todos os dias e acompanhe sua frequência.", accent: "bg-blue-700" },
  { href: "/tasks", title: "TODO List", description: "Organize tarefas gerais em abas e consulte o que já foi concluído.", accent: "bg-amber-700" },
  { href: "/health-data", title: "Dados de Saúde", description: "Acompanhe peso, medidas corporais e a evolução dos seus indicadores de saúde.", accent: "bg-rose-700" },
  { href: "/annotations", title: "Anotações", description: "Organize protocolos com demandas numeradas e escreva anotações completas em Markdown.", accent: "bg-violet-700" },
];

export default async function Home() {
  if (!hasSupabaseEnv()) return <SetupPage />;
  await requireUser();

  return <main className="min-h-screen bg-stone-50 pb-12 text-stone-900"><header className="border-b border-stone-200 bg-white"><div className="mx-auto max-w-6xl px-5 py-5 sm:px-8"><p className="text-sm font-semibold tracking-[0.18em] text-emerald-700 uppercase">Diary Tracker</p><h1 className="mt-1 text-2xl font-semibold">Escolha um módulo</h1></div></header><section className="mx-auto max-w-6xl px-5 py-10 sm:px-8"><p className="max-w-2xl leading-7 text-stone-600">Cada módulo tem uma finalidade própria. Seus registros de tempo, tarefas e dados de saúde permanecem separados.</p><div className="mt-7 grid gap-5 md:grid-cols-2">{modules.map((module) => <Link key={module.href} href={module.href} className="group overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"><div className={`h-2 ${module.accent}`} /><div className="p-6"><h2 className="text-2xl font-semibold tracking-tight">{module.title}</h2><p className="mt-3 min-h-20 leading-7 text-stone-600">{module.description}</p><span className="mt-6 inline-block font-semibold text-emerald-800">Abrir módulo →</span></div></Link>)}</div></section></main>;
}

function SetupPage() {
  return <main className="grid min-h-screen place-items-center bg-stone-50 px-6 py-12 text-stone-900"><section className="w-full max-w-xl rounded-3xl border border-stone-200 bg-white p-7 shadow-sm sm:p-10"><p className="text-sm font-semibold tracking-[0.18em] text-emerald-700 uppercase">Diary Tracker</p><h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Conecte o Supabase para começar.</h1><p className="mt-4 leading-7 text-stone-600">A interface e a segurança já estão prontas. Falta informar a URL e a chave pública do seu projeto Supabase.</p><ol className="mt-7 space-y-3 rounded-2xl bg-stone-50 p-5 text-sm leading-6 text-stone-700"><li><span className="font-semibold">1.</span> Execute as migrações SQL no Supabase.</li><li><span className="font-semibold">2.</span> Crie sua conta privada no painel de autenticação.</li><li><span className="font-semibold">3.</span> Configure as variáveis de ambiente.</li></ol><Link className="mt-7 inline-flex rounded-xl bg-emerald-700 px-4 py-3 font-medium text-white hover:bg-emerald-800" href="https://supabase.com/dashboard">Abrir Supabase</Link></section></main>;
}
