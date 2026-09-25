"use server";

import { recordDiagnosticEvent } from "@/lib/diagnostics";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export async function recordClientError(code: string) {
  if (!hasSupabaseEnv()) return;

  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    const userId = data?.claims?.sub;
    if (!userId) return;
    await recordDiagnosticEvent({ userId, source: "next_error_boundary", code });
  } catch {
    // A interface de erro deve continuar funcionando mesmo sem o monitoramento.
  }
}
