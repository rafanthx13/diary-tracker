"use server";

import { requireUser } from "@/lib/auth";
import { recordDiagnosticEvent } from "@/lib/diagnostics";
import { PERSONAL_BACKUP_MAX_BYTES, parsePersonalBackup } from "@/lib/personal-backup";
import { recordSecurityAccessEvent } from "@/lib/security-access-log";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type RestoreBackupState = { status: "idle" | "error" | "success"; message: string };

export const initialRestoreBackupState: RestoreBackupState = { status: "idle", message: "" };

async function failedRestore(userId: string, message: string): Promise<RestoreBackupState> {
  await recordSecurityAccessEvent(userId, "backup_restore_failed");
  return { status: "error", message };
}

export async function restorePersonalBackup(
  _previousState: RestoreBackupState,
  formData: FormData,
): Promise<RestoreBackupState> {
  const userId = await requireUser();
  const file = formData.get("backup");
  const mode = formData.get("mode")?.toString() === "replace" ? "replace" : "merge";
  const confirmation = formData.get("confirmation")?.toString().trim();

  await recordSecurityAccessEvent(userId, "backup_restore_started");

  if (!(file instanceof File) || !file.size) {
    return failedRestore(userId, "Selecione um arquivo de backup JSON.");
  }
  if (file.size > PERSONAL_BACKUP_MAX_BYTES) {
    return failedRestore(userId, "O arquivo de backup pode ter no máximo 8 MB.");
  }
  if (confirmation !== "RESTAURAR") {
    return failedRestore(userId, "Digite RESTAURAR para confirmar a operação.");
  }

  let backup;
  try {
    backup = parsePersonalBackup(await file.text());
  } catch (error) {
    return failedRestore(userId, error instanceof Error ? error.message : "Não foi possível ler o backup.");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("restore_personal_backup", {
    p_backup: backup,
    p_replace: mode === "replace",
  });

  if (error) {
    await recordSecurityAccessEvent(userId, "backup_restore_failed");
    await recordDiagnosticEvent({ userId, source: "personal_backup_restore", code: "database_restore_failed" });
    return { status: "error", message: "Não foi possível restaurar este backup. Confirme que as migrações e o catálogo de tempo do projeto estão atualizados." };
  }

  revalidatePath("/", "layout");
  revalidatePath("/admin/data");
  await recordSecurityAccessEvent(userId, "backup_restore_succeeded");
  return {
    status: "success",
    message: mode === "replace" ? "Backup restaurado e os dados pessoais anteriores foram substituídos." : "Backup restaurado por mesclagem. Os registros do arquivo foram adicionados ou atualizados.",
  };
}
