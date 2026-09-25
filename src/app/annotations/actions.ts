"use server";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function requiredText(formData: FormData, field: string, maxLength: number) {
  const value = formData.get(field)?.toString().trim();
  if (!value) throw new Error(`O campo ${field} é obrigatório.`);
  if (value.length > maxLength) throw new Error(`O campo ${field} deve ter no máximo ${maxLength} caracteres.`);
  return value;
}

function protocolDemands(formData: FormData) {
  const rawValue = formData.get("demands")?.toString() ?? "[]";
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawValue);
  } catch {
    throw new Error("A lista de demandas é inválida.");
  }

  if (!Array.isArray(parsed) || parsed.length > 100 || parsed.some((value) => typeof value !== "string")) {
    throw new Error("A lista de demandas é inválida.");
  }

  return parsed.map((value) => value.trim()).filter(Boolean).map((value) => {
    if (value.length > 1000) throw new Error("Cada demanda deve ter no máximo 1000 caracteres.");
    return value;
  });
}

function revalidateAnnotations() {
  revalidatePath("/annotations");
  revalidatePath("/annotations/protocols");
  revalidatePath("/annotations/notes");
}

export async function createProtocol(formData: FormData) {
  await requireUser();
  const title = requiredText(formData, "title", 160);
  const demands = protocolDemands(formData);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_protocol_with_demands", {
    p_title: title,
    p_demands: demands,
  });

  if (error || typeof data !== "string") {
    throw new Error("Não foi possível criar o protocolo. Execute a migração 20260925000000 no Supabase.");
  }
  revalidateAnnotations();
  redirect(`/annotations/protocols/${data}`);
}

export async function updateProtocol(formData: FormData) {
  await requireUser();
  const protocolId = requiredText(formData, "protocolId", 36);
  const title = requiredText(formData, "title", 160);
  const demands = protocolDemands(formData);
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_protocol_with_demands", {
    p_protocol_id: protocolId,
    p_title: title,
    p_demands: demands,
  });

  if (error) throw new Error("Não foi possível atualizar o protocolo.");
  revalidateAnnotations();
  revalidatePath(`/annotations/protocols/${protocolId}`);
  redirect(`/annotations/protocols/${protocolId}`);
}

export async function createNote(formData: FormData) {
  const userId = await requireUser();
  const title = requiredText(formData, "title", 160);
  const content = formData.get("content")?.toString() ?? "";
  if (content.length > 100000) throw new Error("O conteúdo deve ter no máximo 100.000 caracteres.");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("markdown_notes")
    .insert({ user_id: userId, title, content })
    .select("id")
    .single();

  if (error || !data) throw new Error("Não foi possível criar a anotação. Execute a migração 20260925000000 no Supabase.");
  revalidateAnnotations();
  redirect(`/annotations/notes/${data.id}`);
}

export async function updateNote(formData: FormData) {
  const userId = await requireUser();
  const noteId = requiredText(formData, "noteId", 36);
  const title = requiredText(formData, "title", 160);
  const content = formData.get("content")?.toString() ?? "";
  if (content.length > 100000) throw new Error("O conteúdo deve ter no máximo 100.000 caracteres.");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("markdown_notes")
    .update({ title, content })
    .eq("id", noteId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error || !data) throw new Error("Não foi possível atualizar a anotação.");
  revalidateAnnotations();
  revalidatePath(`/annotations/notes/${noteId}`);
  redirect(`/annotations/notes/${noteId}`);
}
