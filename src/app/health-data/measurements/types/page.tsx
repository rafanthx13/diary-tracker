import { createMeasurementType, updateMeasurementType } from "@/app/health-data/actions";
import { HealthHeader } from "@/app/health-data/health-header";
import { requireUser } from "@/lib/auth";
import { type MeasurementType } from "@/lib/health";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function MeasurementTypesPage() {
  const userId = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase.from("body_measurement_types").select("id, name, instructions, unit, sort_order").eq("user_id", userId).order("sort_order").order("created_at");
  if (error) throw new Error("Não foi possível carregar as partes do corpo.");
  const types = (data ?? []) as MeasurementType[];
  return <main className="min-h-screen bg-stone-50 pb-12 text-stone-900"><HealthHeader title="Partes do corpo" description="Estes campos aparecem no registro e nos relatórios de medidas." backHref="/health-data/measurements" backLabel="Medidas corporais" /><div className="mx-auto grid max-w-6xl gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[340px_1fr]"><section className="h-fit rounded-3xl border border-stone-200 bg-white p-5 shadow-sm"><h2 className="text-xl font-semibold">Nova parte do corpo</h2><form action={createMeasurementType} className="mt-5 space-y-4"><Field label="Nome" name="name" required placeholder="Ex.: Antebraço Direito" /><Field label="Como medir" name="instructions" placeholder="Ex.: no ponto mais largo" /><Field label="Unidade" name="unit" required defaultValue="cm" placeholder="cm" /><button className="w-full rounded-xl bg-rose-700 px-4 py-3 font-semibold text-white hover:bg-rose-800">Criar parte do corpo</button></form></section><section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-baseline justify-between"><h2 className="text-xl font-semibold">Campos cadastrados</h2><span className="rounded-full bg-stone-100 px-3 py-1 text-sm text-stone-600">{types.length}</span></div><div className="mt-5 space-y-3">{types.map((type) => <form key={type.id} action={updateMeasurementType} className="grid gap-3 rounded-2xl border border-stone-200 p-4 sm:grid-cols-[1fr_1.5fr_90px_auto] sm:items-end"><input type="hidden" name="id" value={type.id} /><Field label="Nome" name="name" required defaultValue={type.name} /><Field label="Como medir" name="instructions" defaultValue={type.instructions} /><Field label="Unidade" name="unit" required defaultValue={type.unit} /><button className="rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-semibold hover:bg-stone-50">Salvar</button></form>)}{!types.length && <p className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center text-sm text-stone-500">Nenhuma parte do corpo cadastrada.</p>}</div></section></div></main>;
}

function Field({ label, name, required, defaultValue, placeholder }: { label: string; name: string; required?: boolean; defaultValue?: string; placeholder?: string }) {
  return <label className="block text-sm font-medium">{label}<input name={name} required={required} defaultValue={defaultValue} placeholder={placeholder} maxLength={name === "instructions" ? 300 : name === "unit" ? 16 : 100} className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2.5 font-normal outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-100" /></label>;
}
