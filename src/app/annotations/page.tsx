import { requireUser } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AnnotationsHeader } from "./annotations-header";

export const dynamic = "force-dynamic";

const submodules = [
  {
    href: "/annotations/protocols",
    title: "Protocolos",
    description: "Crie roteiros de demandas numeradas, consulte cada protocolo e reorganize os itens quando precisar.",
    action: "Abrir protocolos",
  },
  {
    href: "/annotations/notes",
    title: "Anotações",
    description: "Registre textos livres em Markdown e leia o conteúdo com títulos, listas, tabelas, links e código formatados.",
    action: "Abrir anotações",
  },
];

export default async function AnnotationsPage() {
  if (!hasSupabaseEnv()) redirect("/");
  await requireUser();

  return (
    <main className="min-h-screen bg-stone-50 pb-12 text-stone-900">
      <AnnotationsHeader active="home" title="Anotações" description="Centralize protocolos estruturados e notas livres em um só módulo." />
      <section className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <div className="grid gap-5 md:grid-cols-2">
          {submodules.map((submodule, index) => (
            <Link key={submodule.href} href={submodule.href} className="group overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-violet-200 hover:shadow-md">
              <div className={`h-2 ${index === 0 ? "bg-violet-700" : "bg-fuchsia-700"}`} />
              <div className="p-6 sm:p-7">
                <p className="text-xs font-semibold tracking-[0.16em] text-violet-700 uppercase">Submódulo</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">{submodule.title}</h2>
                <p className="mt-3 min-h-24 leading-7 text-stone-600">{submodule.description}</p>
                <span className="mt-5 inline-flex items-center font-semibold text-violet-800">{submodule.action}<span className="ml-2 transition-transform group-hover:translate-x-1">→</span></span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
