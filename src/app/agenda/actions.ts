"use server";

import { agendaColors } from "@/lib/agenda";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type SubmittedInterval = { title: string; color: string; endOffset: number };

function requiredText(formData: FormData, name: string, maximum: number) {
  const value = String(formData.get(name) ?? "").trim();
  if (!value || value.length > maximum) throw new Error(`Informe ${name === "title" ? "um nome para a agenda" : "uma atividade"} válido.`);
  return value;
}

function timeToMinutes(value: string) {
  const match = value.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!match) throw new Error("Informe uma hora inicial válida.");
  return Number(match[1]) * 60 + Number(match[2]);
}

function submittedIntervals(formData: FormData) {
  const raw = String(formData.get("intervals") ?? "");
  let values: unknown;
  try { values = JSON.parse(raw); } catch { throw new Error("Os intervalos da agenda são inválidos."); }
  if (!Array.isArray(values) || values.length < 1 || values.length > 100) throw new Error("Inclua entre 1 e 100 intervalos.");

  let previousEnd = 0;
  return values.map((value) => {
    if (!value || typeof value !== "object") throw new Error("Os intervalos da agenda são inválidos.");
    const row = value as Record<string, unknown>;
    const title = String(row.title ?? "").trim();
    const color = String(row.color ?? "");
    const endOffset = Number(row.endOffset);
    if (!title || title.length > 300 || !agendaColors.includes(color as (typeof agendaColors)[number]) || !Number.isInteger(endOffset) || endOffset <= previousEnd || endOffset > 1440) {
      throw new Error("Revise os horários, atividades e cores dos intervalos.");
    }
    previousEnd = endOffset;
    return { title, color, endOffset } satisfies SubmittedInterval;
  });
}

export async function saveAgenda(formData: FormData) {
  await requireUser();
  const title = requiredText(formData, "title", 100);
  const dayStartsAt = timeToMinutes(String(formData.get("dayStartsAt") ?? ""));
  const intervals = submittedIntervals(formData);
  if (intervals.at(-1)?.endOffset !== 1440) throw new Error("O último intervalo deve terminar exatamente no horário inicial do dia.");
  const agendaId = String(formData.get("agendaId") ?? "").trim();
  if (agendaId && !/^[0-9a-f-]{36}$/i.test(agendaId)) throw new Error("Agenda inválida.");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("save_agenda_with_intervals", {
    p_agenda_id: agendaId || null,
    p_title: title,
    p_day_starts_at: dayStartsAt,
    p_intervals: intervals,
  });
  if (error || typeof data !== "string") throw new Error("Não foi possível salvar a agenda. Execute a migração 20261105010000 no Supabase.");
  revalidatePath("/");
  revalidatePath("/agenda");
  return { id: data };
}

export async function deleteAgenda(formData: FormData) {
  const userId = await requireUser();
  const agendaId = String(formData.get("agendaId") ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(agendaId)) throw new Error("Agenda inválida.");
  const supabase = await createClient();
  const { data, error } = await supabase.from("agendas").delete().eq("id", agendaId).eq("user_id", userId).select("id").maybeSingle();
  if (error || !data) throw new Error("Não foi possível excluir a agenda.");
  revalidatePath("/");
  revalidatePath("/agenda");
}
