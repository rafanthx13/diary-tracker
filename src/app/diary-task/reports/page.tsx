import { requireUser } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import Link from "next/link";
import { redirect } from "next/navigation";

const reports = [
  { href: "/diary-task/reports/day", title: "Dia", description: "Veja quais tarefas diárias foram feitas em uma data." },
  { href: "/diary-task/reports/week", title: "Semana", description: "Confira quantas vezes cada tarefa foi concluída na semana." },
  { href: "/diary-task/reports/month", title: "Mês", description: "Acompanhe frequência e dias concluídos no mês." },
  { href: "/diary-task/reports/100-days", title: "100 dias", description: "Visualize a constância das tarefas nos últimos 100 dias." },
  { href: "/diary-task/reports/year", title: "Ano", description: "Veja a constância das tarefas durante o ano." },
  { href: "/diary-task/reports/all", title: "Acumulado", description: "Consulte todas as conclusões já registradas." },
];

export default async function DiaryTaskReportsPage() {
  if (!hasSupabaseEnv()) redirect("/");
  await requireUser();

  return <main className="min-h-screen bg-stone-50 pb-12 text-stone-900"><header className="border-b border-stone-200 bg-white"><div className="mx-auto max-w-5xl px-5 py-5 sm:px-8"><p className="text-sm font-semibold tracking-[0.16em] text-emerald-700 uppercase">Diary Tracker</p><h1 className="mt-1 text-2xl font-semibold">Relatório do Diary Task</h1></div></header><section className="mx-auto max-w-5xl px-5 py-8 sm:px-8"><Link href="/diary-task" className="mb-5 inline-block rounded-xl bg-stone-100 px-3 py-2 text-sm font-medium hover:bg-stone-200">Voltar ao Diary Task</Link><p className="max-w-2xl text-sm leading-6 text-stone-600">Escolha um período para ver em quais dias cada tarefa foi feita e quantas vezes ela foi concluída.</p><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{reports.map((report) => <Link key={report.href} href={report.href} className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow"><h2 className="text-xl font-semibold">{report.title}</h2><p className="mt-2 text-sm leading-6 text-stone-600">{report.description}</p><span className="mt-5 inline-block text-sm font-semibold text-emerald-800">Abrir relatório →</span></Link>)}</div></section></main>;
}
