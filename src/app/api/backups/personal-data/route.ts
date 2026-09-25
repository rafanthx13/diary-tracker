import { recordDiagnosticEvent } from "@/lib/diagnostics";
import {
  PERSONAL_BACKUP_FORMAT,
  PERSONAL_BACKUP_VERSION,
  type PersonalBackup,
  type PersonalBackupData,
} from "@/lib/personal-backup";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { recordSecurityAccessEvent } from "@/lib/security-access-log";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  if (!hasSupabaseEnv()) return new Response("Supabase não configurado.", { status: 503 });

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return new Response("Não autenticado.", { status: 401 });

  const results = await Promise.all([
    supabase.from("activities").select("id, classification_id, title, started_at, ended_at, created_at, updated_at").eq("user_id", userId).order("started_at"),
    supabase.from("task_lists").select("id, name, description, sort_order, created_at, updated_at").eq("user_id", userId).order("sort_order").order("created_at"),
    supabase.from("tasks").select("id, title, is_daily, task_list_id, is_important, completed_at, created_at, updated_at").eq("user_id", userId).order("created_at"),
    supabase.from("daily_task_completions").select("id, task_id, completed_on, completed_at, created_at").eq("user_id", userId).order("completed_on").order("created_at"),
    supabase.from("health_weight_entries").select("id, measured_on, weight_kg, notes, created_at, updated_at").eq("user_id", userId).order("measured_on"),
    supabase.from("body_measurement_types").select("id, name, instructions, unit, sort_order, created_at, updated_at").eq("user_id", userId).order("sort_order").order("created_at"),
    supabase.from("body_measurement_sessions").select("id, measured_on, notes, created_at, updated_at").eq("user_id", userId).order("measured_on"),
    supabase.from("body_measurement_values").select("id, session_id, measurement_type_id, value, created_at, updated_at").eq("user_id", userId).order("created_at"),
    supabase.from("protocols").select("id, title, created_at, updated_at").eq("user_id", userId).order("created_at"),
    supabase.from("protocol_demands").select("id, protocol_id, content, sort_order, created_at, updated_at").eq("user_id", userId).order("protocol_id").order("sort_order"),
    supabase.from("markdown_notes").select("id, title, content, created_at, updated_at").eq("user_id", userId).order("created_at"),
  ]);

  const failedResult = results.find((result) => result.error);
  if (failedResult?.error) {
    await recordDiagnosticEvent({ userId, source: "personal_backup_export", code: "database_read_failed" });
    return new Response("Não foi possível gerar o backup.", { status: 500 });
  }

  const data: PersonalBackupData = {
    activities: results[0].data ?? [],
    task_lists: results[1].data ?? [],
    tasks: results[2].data ?? [],
    daily_task_completions: results[3].data ?? [],
    health_weight_entries: results[4].data ?? [],
    body_measurement_types: results[5].data ?? [],
    body_measurement_sessions: results[6].data ?? [],
    body_measurement_values: results[7].data ?? [],
    protocols: results[8].data ?? [],
    protocol_demands: results[9].data ?? [],
    markdown_notes: results[10].data ?? [],
  };
  const backup: PersonalBackup = {
    format: PERSONAL_BACKUP_FORMAT,
    version: PERSONAL_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  };
  const filenameDate = backup.exportedAt.slice(0, 10);
  await recordSecurityAccessEvent(userId, "backup_exported");

  return new Response(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="diary-tracker-backup-${filenameDate}.json"`,
      "Cache-Control": "no-store, private",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
