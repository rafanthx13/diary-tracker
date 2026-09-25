import { RestoreBackupForm } from "@/app/admin/restore-backup-form";
import { requireUser } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { recordSecurityAccessEvent } from "@/lib/security-access-log";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PersonalDataPage() {
  if (!hasSupabaseEnv()) redirect("/");
  const userId = await requireUser();
  await recordSecurityAccessEvent(userId, "backup_area_opened");

  return (
    <main className="min-h-screen bg-stone-50 pb-12 text-stone-900">
      <header className="border-b border-stone-200 bg-white"><div className="mx-auto max-w-5xl px-5 py-5 sm:px-8"><p className="text-sm font-semibold tracking-[0.16em] text-rose-700 uppercase">Área privada</p><h1 className="mt-1 text-2xl font-semibold">Backup e restauração</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">Mantenha uma cópia local dos seus registros e recupere-os quando necessário.</p></div></header>
      <div className="mx-auto max-w-5xl space-y-6 px-5 py-6 sm:px-8">
        <Link href="/admin" className="inline-flex rounded-xl bg-stone-100 px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-200">← Administração</Link>
        <section className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm sm:p-6"><p className="text-sm font-semibold text-emerald-800">Exportar dados pessoais</p><h2 className="mt-1 text-xl font-semibold">Baixar backup do banco</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">O arquivo JSON contém atividades, tarefas, rotina diária, peso, medidas, protocolos e anotações da sua conta. Ele não inclui senha, sessão, credenciais nem dados de outras pessoas.</p><a href="/api/backups/personal-data" className="mt-5 inline-flex rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800">↓ Baixar backup JSON</a></section>
        <section className="rounded-3xl border border-rose-200 bg-white p-5 shadow-sm sm:p-6"><p className="text-sm font-semibold text-rose-800">Importar cópia anterior</p><h2 className="mt-1 text-xl font-semibold">Restaurar backup</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">Use somente arquivos gerados por esta ferramenta. A restauração acontece em uma única operação do banco: se algum registro for inválido ou incompatível, nada é aplicado.</p><div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-950"><strong>Antes de restaurar:</strong> aplique as migrações do projeto e mantenha o catálogo de classificações de tempo disponível. Para uma cópia de segurança normal, prefira o modo de mesclagem.</div><RestoreBackupForm /></section>
      </div>
    </main>
  );
}
