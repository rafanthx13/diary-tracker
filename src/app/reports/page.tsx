import { requireUser } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import Link from "next/link";
import { redirect } from "next/navigation";

const reports = [
  { href: "/today/reports/day", title: "Dia", description: "Veja quanto tempo foi gasto em cada atividade, classificação e categoria em uma data." },
  { href: "/today/reports/week", title: "Semana", description: "Compare a distribuição do seu tempo durante a semana escolhida." },
  { href: "/today/reports/month", title: "Mês", description: "Acompanhe os totais do mês e identifique os maiores blocos de tempo." },
  { href: "/today/reports/year", title: "Ano", description: "Tenha uma visão anual das atividades registradas." },
  { href: "/today/reports/all", title: "Acumulado", description: "Consulte tudo que já foi registrado no Diary Tracker." },
];

export default async function ReportsPage() {
  if (!hasSupabaseEnv()) redirect("/");
  await requireUser();

  return (
    <main className="min-h-screen bg-stone-50 pb-12 text-stone-900">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-5xl px-5 py-5 sm:px-8">
          <div><p className="text-sm font-semibold tracking-[0.16em] text-emerald-700 uppercase">Diary Tracker</p><h1 className="mt-1 text-xl font-semibold">Relatórios de tempo</h1></div>
        </div>
      </header>
      <section className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
        <div className="mb-5 flex flex-wrap gap-2"><Link href="/today" className="rounded-xl bg-stone-100 px-3 py-2 text-sm font-medium hover:bg-stone-200">Voltar ao registro</Link><Link href="/today/categories" className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100">Categorias de tempo</Link></div>
        <p className="max-w-2xl text-sm leading-6 text-stone-600">Escolha o período que deseja analisar. Os totais usam atividades encerradas; uma atividade ainda em andamento entra no relatório quando for encerrada.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => <Link key={report.href} href={report.href} className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow"><h2 className="text-xl font-semibold">{report.title}</h2><p className="mt-2 text-sm leading-6 text-stone-600">{report.description}</p><span className="mt-5 inline-block text-sm font-semibold text-emerald-800">Abrir relatório →</span></Link>)}
        </div>
      </section>
    </main>
  );
}
