import { createCategory, signOut, updateCategory, updateClassification } from "@/app/actions";
import { CreateClassificationForm } from "./create-classification-form";
import { RestoreCatalogButton } from "./restore-catalog-button";
import { requireUser } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Category = {
  id: string;
  name: string;
  color: string;
  classifications: { id: string; name: string }[];
};

export default async function CategoriesPage() {
  if (!hasSupabaseEnv()) redirect("/");
  await requireUser();
  const supabase = await createClient();
  const [{ data: categoriesData, error: categoriesError }, { data: classificationsData, error: classificationsError }] = await Promise.all([
    supabase.from("categories").select("id, name, color").order("name"),
    supabase.from("classifications").select("id, name, category_id").order("name"),
  ]);

  if (categoriesError || classificationsError) throw new Error("Não foi possível carregar categorias e classificações.");
  const classificationsByCategory = new Map<string, { id: string; name: string }[]>();
  for (const classification of classificationsData ?? []) {
    const current = classificationsByCategory.get(classification.category_id) ?? [];
    current.push({ id: classification.id, name: classification.name });
    classificationsByCategory.set(classification.category_id, current);
  }
  const categories = (categoriesData ?? []).map((category) => ({
    ...category,
    classifications: classificationsByCategory.get(category.id) ?? [],
  })) as Category[];
  const classificationsCount = categories.reduce((total, category) => total + category.classifications.length, 0);

  return (
    <main className="min-h-screen bg-stone-50 pb-12 text-stone-900">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div>
            <p className="text-sm font-semibold tracking-[0.16em] text-emerald-700 uppercase">Diary Tracker</p>
            <h1 className="mt-1 text-xl font-semibold">Categorias e classificações</h1>
          </div>
          <div className="flex items-center gap-1">
            <Link href="/today" className="rounded-lg px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100">Hoje</Link>
            <form action={signOut}><button className="rounded-lg px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100">Sair</button></form>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[0.85fr_1.15fr]">
        <aside className="space-y-6">
          <section className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6">
            <p className="text-sm font-medium text-stone-500">Novo grupo</p>
            <h2 className="mt-1 text-xl font-semibold">Criar categoria</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">Categorias agrupam o tipo de tempo gasto, como TASK, Relax ou Comer.</p>
            <form action={createCategory} className="mt-5 space-y-4">
              <label className="block text-sm font-medium">Nome<input name="name" required maxLength={80} placeholder="Ex.: Estudos" className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-3 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></label>
              <label className="block text-sm font-medium">Cor<input name="color" type="color" defaultValue="#0f766e" className="mt-2 h-12 w-full cursor-pointer rounded-xl border border-stone-300 bg-white p-1" /></label>
              <button className="w-full rounded-xl bg-stone-900 px-4 py-3 font-medium text-white transition hover:bg-stone-700">Criar categoria</button>
            </form>
          </section>

          <section className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6">
            <p className="text-sm font-medium text-stone-500">Tipo específico</p>
            <h2 className="mt-1 text-xl font-semibold">Criar classificação</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">Classificações são usadas ao registrar atividades, como Academia ou Arrumação Quarto.</p>
            <CreateClassificationForm categories={categories} />
          </section>
        </aside>

        <section className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6">
          <p className="text-sm font-medium text-stone-500">Organização atual</p>
          <h2 className="mt-1 text-xl font-semibold">Seus grupos</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">Renomear não muda os IDs, então seus registros antigos permanecem vinculados corretamente.</p>
          {classificationsCount === 0 && (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm leading-6 text-amber-900">Nenhuma classificação foi encontrada. Isso pode acontecer se a conta foi criada antes da migração.</p>
              <RestoreCatalogButton />
            </div>
          )}
          <div className="mt-6 space-y-5">
            {categories.map((category) => (
              <article key={category.id} className="rounded-2xl border border-stone-200 p-4 sm:p-5">
                <form action={updateCategory} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <input type="hidden" name="categoryId" value={category.id} />
                  <label className="block flex-1 text-sm font-medium">Categoria<input name="name" required maxLength={80} defaultValue={category.name} className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2.5 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></label>
                  <label className="block text-sm font-medium">Cor<input name="color" type="color" defaultValue={category.color} className="mt-2 h-11 w-full cursor-pointer rounded-xl border border-stone-300 bg-white p-1 sm:w-16" /></label>
                  <button className="rounded-xl bg-stone-100 px-4 py-3 text-sm font-medium transition hover:bg-stone-200">Salvar</button>
                </form>
                <div className="mt-5 border-t border-stone-100 pt-4">
                  <p className="text-xs font-semibold tracking-[0.12em] text-stone-500 uppercase">Classificações</p>
                  {category.classifications.length ? <div className="mt-3 space-y-2">{category.classifications.map((classification) => (
                    <form action={updateClassification} key={classification.id} className="flex gap-2">
                      <input type="hidden" name="classificationId" value={classification.id} />
                      <input type="hidden" name="categoryId" value={category.id} />
                      <input name="name" required maxLength={120} defaultValue={classification.name} className="min-w-0 flex-1 rounded-xl border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />
                      <button className="rounded-xl px-3 text-sm font-medium text-emerald-800 hover:bg-emerald-50">Salvar</button>
                    </form>
                  ))}</div> : <p className="mt-3 text-sm text-stone-500">Nenhuma classificação nesta categoria.</p>}
                </div>
              </article>
            ))}
            {!categories.length && <p className="rounded-2xl bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">Nenhuma categoria criada ainda.</p>}
          </div>
        </section>
      </div>
    </main>
  );
}
