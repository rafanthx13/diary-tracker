import { importSleepEntries } from "@/app/health-data/actions";
import { HealthHeader } from "@/app/health-data/health-header";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const exampleCsv = `date;sleep_time;wake_time
2026-10-03;23:20;07:10
2026-10-04;00:05;08:00
2026-10-05;22:45;06:30`;

export default async function SleepImportPage({ searchParams }: { searchParams: Promise<{ imported?: string }> }) {
  await requireUser();
  const imported = Number((await searchParams).imported ?? 0);

  return <main className="min-h-screen bg-stone-50 pb-12 text-stone-900"><HealthHeader title="Importar sono" description="Envie um CSV simples para criar ou atualizar os seus registros de sono." backHref="/health-data/sleep" backLabel="Sono" /><div className="mx-auto grid max-w-5xl gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"><section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">{imported > 0 && <p role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900">{imported} {imported === 1 ? "registro foi importado" : "registros foram importados"}.</p>}<h2 className="text-xl font-semibold">Enviar arquivo</h2><p className="mt-2 text-sm leading-6 text-stone-600">Cada linha corresponde ao dia em que você acordou. Se já houver um registro na mesma data, os horários serão atualizados.</p><form action={importSleepEntries} className="mt-5 space-y-4"><label className="block text-sm font-medium">Arquivo CSV<input type="file" name="file" accept=".csv,text/csv" required className="mt-2 block w-full rounded-xl border border-stone-300 bg-white px-3 py-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-100 file:px-3 file:py-2 file:font-semibold file:text-indigo-900 hover:file:bg-indigo-200" /></label><p className="text-xs leading-5 text-stone-500">Tamanho máximo: 2 MB. São aceitos os separadores <strong>;</strong> e <strong>,</strong>.</p><button className="w-full rounded-xl bg-indigo-700 px-5 py-3 font-semibold text-white hover:bg-indigo-800">Importar registros</button></form></section><section className="rounded-3xl border border-indigo-100 bg-indigo-50 p-5 shadow-sm sm:p-6"><p className="text-sm font-semibold text-indigo-800">Exemplo válido</p><h2 className="mt-1 text-xl font-semibold">Estrutura do CSV</h2><p className="mt-2 text-sm leading-6 text-indigo-950">Copie este conteúdo para um arquivo com extensão <code>.csv</code>; ele funcionará sem alterações. Use horas no formato <strong>HH:MM</strong>.</p><pre className="mt-5 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-sm leading-6 text-slate-100"><code>{exampleCsv}</code></pre><p className="mt-4 text-xs leading-5 text-indigo-900">A importação não inclui nota nem descrição; esses campos podem ser preenchidos depois ao editar o registro do dia.</p></section></div></main>;
}
