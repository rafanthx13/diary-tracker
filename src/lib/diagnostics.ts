import { createClient } from "@/lib/supabase/server";

type DiagnosticEvent = {
  userId: string;
  source: string;
  code: string;
  severity?: "warning" | "error";
};

function normalizedValue(value: string, maxLength: number) {
  return value
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, maxLength) || "unknown";
}

// Não registre mensagens, stack traces, URLs ou payloads: eles podem conter dados pessoais.
export async function recordDiagnosticEvent({ userId, source, code, severity = "error" }: DiagnosticEvent) {
  try {
    const supabase = await createClient();
    await supabase.from("app_error_events").insert({
      user_id: userId,
      source: normalizedValue(source, 80),
      code: normalizedValue(code, 120),
      severity,
    });
  } catch {
    // O monitoramento nunca deve interromper o fluxo principal da aplicação.
  }
}
