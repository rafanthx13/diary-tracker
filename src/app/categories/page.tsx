import { updateClassification } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CreateClassificationForm } from "./create-classification-form";
import { RestoreCatalogButton } from "./restore-catalog-button";

export const dynamic = "force-dynamic";

type ClassificationItem = { id: string; name: string };
type Category = { id: string; name: string; color: string; classifications: ClassificationItem[] };

export default async function CategoriesPage() {
  if (!hasSupabaseEnv()) redirect("/");
  await requireUser();
  const supabase = await createClient();
  const [{ data: categoriesData, error: categoriesError }, { data: classificationsData, error: classificationsError }] = await Promise.all([
    supabase.from("categories").select("id, name, color").order("name"),
    supabase.from("classifications").select("id, name, category_id").order("name"),
  ]);
  if (categoriesError || classificationsError) throw new Error("Não foi possível carregar categorias e classificações.");

  const classificationsByCategory = new Map<string, ClassificationItem[]>();
  const ungroupedClassifications: ClassificationItem[] = [];
  for (const classification of classificationsData ?? []) {
    if (!classification.category_id) {
      ungroupedClassifications.push({ id: classification.id, name: classification.name });
      continue;
    }
    const current = classificationsByCategory.get(classification.category_id) ?? [];
    current.push({ id: classification.id, name: classification.name });
    classificationsByCategory.set(classification.category_id, current);
  }
  const categories = (categoriesData ?? []).map((category) => ({ ...category, classifications: classificationsByCategory.get(category.id) ?? [] })) as Category[];
  const classificationsCount = categories.reduce((total, category) => total + category.classifications.length, 0) + ungroupedClassifications.length;

  return <main className="min-h-screen bg-stone-50 pb-12 text-stone-900"><header className="border-b border-stone-200 bg-white"><div className="mx-auto max-w-6xl px-5 py-5 sm:px-8"><p className="text-sm font-semibold tracking-[0.16em] text-emerald-700 uppercase">Tasks temporizadas</p><h1 className="mt-1 text-2xl font-semibold">Categorias e classificações de tempo</h1><div className="mt-4 flex flex-wrap gap-2"><Link href="/today" className="rounded-xl bg-stone-100 px-3 py-2 text-sm font-medium hover:bg-stone-200">Voltar ao registro</Link><Link href="/today/reports" className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100">Relatório de tempo</Link></div></div></header><div className="mx-auto max-w-6xl space-y-6 px-5 py-6 sm:px-8"><section className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6"><p className="text-sm font-medium text-stone-500">Categorias fixas</p><h2 className="mt-1 text-xl font-semibold">{categories.length} categoria{categories.length === 1 ? "" : "s"}</h2><p className="mt-2 text-sm text-stone-600">As categorias não podem ser criadas ou editadas nesta tela.</p>{categories.length ? <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{categories.map((category) => <article key={category.id} className="rounded-2xl border border-stone-200 p-4"><div className="flex items-center gap-3"><span className="size-4 shrink-0 rounded-full" style={{ backgroundColor: category.color }} /><h3 className="font-semibold">{category.name}</h3></div><p className="mt-3 text-sm text-stone-500">{category.classifications.length} classificação{category.classifications.length === 1 ? "" : "ões"}</p></article>)}</div> : <p className="mt-5 rounded-2xl bg-stone-50 p-5 text-sm text-stone-500">Nenhuma categoria encontrada.</p>}</section><div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]"><aside><section className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6"><p className="text-sm font-medium text-stone-500">Tipo específico</p><h2 className="mt-1 text-xl font-semibold">Criar classificação</h2><p className="mt-2 text-sm leading-6 text-stone-600">Escolha uma categoria agora ou deixe sem categoria e organize depois.</p><CreateClassificationForm categories={categories} /></section></aside><section className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6"><p className="text-sm font-medium text-stone-500">Organização atual</p><h2 className="mt-1 text-xl font-semibold">Vincular classificações</h2><p className="mt-2 text-sm leading-6 text-stone-600">Use o seletor de cada classificação para colocá-la em TEMPO PERDIDO, WORK, ROTINA QUARTO ou deixá-la sem categoria.</p>{classificationsCount === 0 && <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="text-sm leading-6 text-amber-900">Nenhuma classificação foi encontrada.</p><RestoreCatalogButton /></div>}<div className="mt-6 space-y-5">{categories.map((category) => <article key={category.id} className="rounded-2xl border border-stone-200 p-4 sm:p-5"><div className="flex items-center gap-3"><span className="size-4 shrink-0 rounded-full" style={{ backgroundColor: category.color }} /><h3 className="font-semibold">{category.name}</h3></div><div className="mt-4 border-t border-stone-100 pt-4"><p className="text-xs font-semibold tracking-[0.12em] text-stone-500 uppercase">Classificações</p>{category.classifications.length ? <div className="mt-3 space-y-3">{category.classifications.map((classification) => <ClassificationEditor key={classification.id} classification={classification} categoryId={category.id} categories={categories} />)}</div> : <p className="mt-3 text-sm text-stone-500">Nenhuma classificação nesta categoria.</p>}</div></article>)}{ungroupedClassifications.length > 0 && <article className="rounded-2xl border border-dashed border-stone-300 p-4 sm:p-5"><p className="text-xs font-semibold tracking-[0.12em] text-stone-500 uppercase">Sem categoria</p><div className="mt-3 space-y-3">{ungroupedClassifications.map((classification) => <ClassificationEditor key={classification.id} classification={classification} categoryId="" categories={categories} />)}</div></article>}</div></section></div></div></main>;
}

function ClassificationEditor({ classification, categoryId, categories }: { classification: ClassificationItem; categoryId: string; categories: Category[] }) {
  return <form action={updateClassification} className="grid gap-2 rounded-xl bg-stone-50 p-3 sm:grid-cols-[1fr_0.8fr_auto]"><input type="hidden" name="classificationId" value={classification.id} /><input name="name" aria-label="Nome da classificação" required maxLength={120} defaultValue={classification.name} className="min-w-0 rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /><select name="categoryId" aria-label={`Categoria de ${classification.name}`} defaultValue={categoryId} className="min-w-0 rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"><option value="">Sem categoria</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select><button className="rounded-xl px-3 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100">Salvar</button></form>;
}
