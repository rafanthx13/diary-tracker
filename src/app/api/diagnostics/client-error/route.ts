import { recordDiagnosticEvent } from "@/lib/diagnostics";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

export const runtime = "nodejs";

const acceptedCodes = new Set(["window_error", "unhandled_promise_rejection"]);

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) return new Response(null, { status: 204 });

  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  if (!origin || !host) {
    return new Response(null, { status: 403 });
  }
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return new Response(null, { status: 403 });
  }
  if (originHost !== host) return new Response(null, { status: 403 });

  let code = "";
  try {
    const body: unknown = await request.json();
    if (typeof body === "object" && body !== null && "code" in body && typeof body.code === "string") {
      code = body.code;
    }
  } catch {
    return new Response(null, { status: 400 });
  }
  if (!acceptedCodes.has(code)) return new Response(null, { status: 400 });

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return new Response(null, { status: 401 });

  await recordDiagnosticEvent({ userId, source: "browser_runtime", code });
  return new Response(null, { status: 204 });
}
