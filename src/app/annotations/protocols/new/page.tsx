import { AnnotationsHeader } from "@/app/annotations/annotations-header";
import { requireUser } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { redirect } from "next/navigation";
import { ProtocolForm } from "../protocol-form";

export default async function NewProtocolPage() {
  if (!hasSupabaseEnv()) redirect("/");
  await requireUser();

  return (
    <main className="min-h-screen bg-stone-50 pb-12 text-stone-900">
      <AnnotationsHeader active="protocols" title="Novo protocolo" description="Defina um título e adicione as demandas na sequência desejada." />
      <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8">
        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8"><ProtocolForm mode="create" /></section>
      </div>
    </main>
  );
}
