import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

export type SecurityAccessEventType =
  | "login_success"
  | "backup_area_opened"
  | "backup_exported"
  | "backup_restore_started"
  | "backup_restore_succeeded"
  | "backup_restore_failed";

function limitHeader(value: string | null, maxLength: number) {
  return value?.slice(0, maxLength) || null;
}

function clientIp(requestHeaders: Headers) {
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  return limitHeader(forwarded ?? requestHeaders.get("cf-connecting-ip") ?? requestHeaders.get("x-real-ip"), 64);
}

// Este log é intencionalmente limitado a eventos de segurança. Não acrescente
// senha, token, cookie, dados de formulário, URL com parâmetros ou conteúdo do backup.
export async function recordSecurityAccessEvent(userId: string, eventType: SecurityAccessEventType) {
  try {
    const requestHeaders = await headers();
    const mobileHint = requestHeaders.get("sec-ch-ua-mobile");
    const supabase = await createClient();
    await supabase.from("security_access_events").insert({
      user_id: userId,
      event_type: eventType,
      ip_address: clientIp(requestHeaders),
      user_agent: limitHeader(requestHeaders.get("user-agent"), 1000),
      accept_language: limitHeader(requestHeaders.get("accept-language"), 300),
      client_platform: limitHeader(requestHeaders.get("sec-ch-ua-platform") ?? requestHeaders.get("sec-ch-ua"), 300),
      client_is_mobile: mobileHint === "?1" ? true : mobileHint === "?0" ? false : null,
      request_host: limitHeader(requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host"), 300),
      is_tls: requestHeaders.get("x-forwarded-proto") === "https",
    });
  } catch {
    // Falhas no log não podem impedir autenticação, exportação ou restauração.
  }
}
