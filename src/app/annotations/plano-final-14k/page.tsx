import { requireUser } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PlanoFinal14kPage() {
  if (!hasSupabaseEnv()) redirect("/");
  await requireUser();
  const imageUrl = process.env.PLANO_FINAL_14K_IMAGE_URL;

  if (!imageUrl) {
    throw new Error("A imagem do Plano final 14k não foi configurada.");
  }

  return (
    <main className="flex min-h-0 flex-1 items-center justify-center overflow-hidden p-4">
      {/* A URL é administrada no ambiente e pode apontar para qualquer hospedagem de imagem. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt="Plano final 14k"
        className="block h-auto max-h-full w-auto max-w-full object-contain"
      />
    </main>
  );
}
