import { HealthHeader } from "@/app/health-data/health-header";
import { requireUser } from "@/lib/auth";
import Link from "next/link";

const healthModules = [
  { href: "/health-data/weight", icon: "⚖", title: "Meu peso", description: "Registre o peso da manhã uma vez por dia e acompanhe sua evolução.", status: "Disponível" },
  { href: "/health-data/measurements", icon: "⌁", title: "Minhas medidas corporais", description: "Registre medidas por data, gerencie partes do corpo e importe seu histórico.", status: "Disponível" },
  { href: "/health-data/inbody", icon: "◫", title: "InBody", description: "Espaço reservado para os dados de composição corporal.", status: "Em construção" },
];

export default async function HealthDataPage() {
  await requireUser();
  return <main className="min-h-screen bg-stone-50 pb-12 text-stone-900"><HealthHeader title="Dados de Saúde" description="Registros pessoais para observar tendências do seu corpo ao longo do tempo." backHref="/" backLabel="Home" /><section className="mx-auto max-w-6xl px-5 py-8 sm:px-8"><div className="grid gap-5 lg:grid-cols-3">{healthModules.map((module) => <Link key={module.href} href={module.href} className="group flex min-h-64 flex-col justify-between rounded-3xl border border-stone-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-rose-200 hover:shadow-md"><div><span className="grid size-12 place-items-center rounded-2xl bg-rose-100 text-2xl text-rose-800" aria-hidden="true">{module.icon}</span><h2 className="mt-5 text-2xl font-semibold tracking-tight">{module.title}</h2><p className="mt-3 leading-7 text-stone-600">{module.description}</p></div><span className={`mt-6 w-fit rounded-full px-3 py-1 text-sm font-semibold ${module.status === "Disponível" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{module.status}</span></Link>)}</div><p className="mt-8 text-sm leading-6 text-stone-500">Estes registros servem para acompanhamento pessoal e não substituem avaliação médica.</p></section></main>;
}
