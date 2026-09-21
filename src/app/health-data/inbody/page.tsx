import { HealthHeader } from "@/app/health-data/health-header";
import { requireUser } from "@/lib/auth";

export default async function InBodyPage() {
  await requireUser();
  return <main className="min-h-screen bg-stone-50 text-stone-900"><HealthHeader title="InBody" description="Composição corporal e histórico de avaliações." /><section className="mx-auto max-w-3xl px-5 py-16 text-center sm:px-8"><div className="rounded-3xl border border-dashed border-amber-300 bg-amber-50 px-6 py-16"><span className="text-4xl" aria-hidden="true">🚧</span><h2 className="mt-5 text-2xl font-semibold">Em construção</h2><p className="mx-auto mt-3 max-w-lg leading-7 text-stone-600">Este módulo está reservado para uma etapa futura. Nenhum dado de InBody precisa ser cadastrado agora.</p></div></section></main>;
}
