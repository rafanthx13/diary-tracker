"use server";

import { requireUser } from "@/lib/auth";
import { saoPauloDate } from "@/lib/tasks";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function textField(formData: FormData, name: string, maxLength: number, required = false) {
  const value = String(formData.get(name) ?? "").trim();
  if (required && !value) throw new Error(`O campo ${name} é obrigatório.`);
  if (value.length > maxLength) throw new Error(`O campo ${name} é muito longo.`);
  return value;
}

function dateField(formData: FormData, name = "measuredOn") {
  const value = textField(formData, name, 10, true);
  const parsed = new Date(`${value}T12:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value || value > saoPauloDate()) {
    throw new Error("Informe uma data válida que não esteja no futuro.");
  }
  return value;
}

function decimalValue(raw: FormDataEntryValue | null, fieldName: string, maximum: number) {
  const normalized = String(raw ?? "").trim().replace(/\s*(kg|cm)$/i, "").replace(",", ".");
  const value = Number(normalized);
  if (!normalized || !Number.isFinite(value) || value <= 0 || value > maximum) throw new Error(`Informe um valor válido para ${fieldName}.`);
  return Math.round(value * 100) / 100;
}

function refreshHealthPages() {
  revalidatePath("/health-data");
  revalidatePath("/health-data/weight");
  revalidatePath("/health-data/weight/reports");
  revalidatePath("/health-data/measurements");
  revalidatePath("/health-data/measurements/reports");
  revalidatePath("/health-data/measurements/types");
}

export async function saveWeight(formData: FormData) {
  const userId = await requireUser();
  const measuredOn = dateField(formData);
  const weightKg = decimalValue(formData.get("weightKg"), "o peso", 500);
  const notes = textField(formData, "notes", 500);
  const supabase = await createClient();
  const { error } = await supabase.from("health_weight_entries").upsert({ user_id: userId, measured_on: measuredOn, weight_kg: weightKg, notes: notes }, { onConflict: "user_id,measured_on" });
  if (error) throw new Error("Não foi possível salvar o peso. Execute a migração 20260921060000 no Supabase.");
  refreshHealthPages();
}

export async function createMeasurementType(formData: FormData) {
  const userId = await requireUser();
  const name = textField(formData, "name", 100, true);
  const instructions = textField(formData, "instructions", 300);
  const unit = textField(formData, "unit", 16, true);
  const supabase = await createClient();
  const { data: lastType } = await supabase.from("body_measurement_types").select("sort_order").eq("user_id", userId).order("sort_order", { ascending: false }).limit(1).maybeSingle();
  const { error } = await supabase.from("body_measurement_types").insert({ user_id: userId, name, instructions, unit, sort_order: (lastType?.sort_order ?? -1) + 1 });
  if (error?.code === "23505") throw new Error("Já existe uma parte do corpo com esse nome.");
  if (error) throw new Error("Não foi possível criar a parte do corpo.");
  refreshHealthPages();
}

export async function updateMeasurementType(formData: FormData) {
  const userId = await requireUser();
  const id = textField(formData, "id", 50, true);
  const name = textField(formData, "name", 100, true);
  const instructions = textField(formData, "instructions", 300);
  const unit = textField(formData, "unit", 16, true);
  const supabase = await createClient();
  const { error } = await supabase.from("body_measurement_types").update({ name, instructions, unit }).eq("id", id).eq("user_id", userId);
  if (error?.code === "23505") throw new Error("Já existe uma parte do corpo com esse nome.");
  if (error) throw new Error("Não foi possível atualizar a parte do corpo.");
  refreshHealthPages();
}

export async function saveBodyMeasurements(formData: FormData) {
  const userId = await requireUser();
  const measuredOn = dateField(formData);
  const notes = textField(formData, "notes", 500);
  const supabase = await createClient();
  const { data: types, error: typesError } = await supabase.from("body_measurement_types").select("id, name").eq("user_id", userId);
  if (typesError) throw new Error("Não foi possível carregar as partes do corpo.");

  const values = (types ?? []).flatMap((type) => {
    const raw = String(formData.get(`measurement_${type.id}`) ?? "").trim();
    return raw ? [{ measurement_type_id: type.id, value: decimalValue(raw, type.name, 1000) }] : [];
  });
  if (!values.length) throw new Error("Preencha pelo menos uma medida corporal.");

  const { data: session, error: sessionError } = await supabase.from("body_measurement_sessions").upsert({ user_id: userId, measured_on: measuredOn, notes }, { onConflict: "user_id,measured_on" }).select("id").single();
  if (sessionError || !session) throw new Error("Não foi possível salvar a sessão de medidas.");
  const { error: deleteError } = await supabase.from("body_measurement_values").delete().eq("session_id", session.id).eq("user_id", userId);
  if (deleteError) throw new Error("Não foi possível atualizar as medidas existentes.");
  const { error: valuesError } = await supabase.from("body_measurement_values").insert(values.map((item) => ({ ...item, session_id: session.id, user_id: userId })));
  if (valuesError) throw new Error("Não foi possível salvar as medidas corporais.");
  refreshHealthPages();
}

function parseCsvLine(line: string, delimiter: string) {
  const cells: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && quoted && line[index + 1] === '"') { value += '"'; index += 1; }
    else if (character === '"') quoted = !quoted;
    else if (character === delimiter && !quoted) { cells.push(value.trim()); value = ""; }
    else value += character;
  }
  cells.push(value.trim());
  return cells;
}

function normalizeHeader(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function importedDate(value: string, line: number) {
  const cleaned = value.trim();
  const match = cleaned.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const iso = match ? `${match[3]}-${match[2]}-${match[1]}` : cleaned;
  const parsed = new Date(`${iso}T12:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== iso || iso > saoPauloDate()) throw new Error(`Data inválida na linha ${line}.`);
  return iso;
}

export async function importBodyMeasurements(formData: FormData) {
  const userId = await requireUser();
  const file = formData.get("file");
  if (!(file instanceof File) || !file.size) throw new Error("Selecione um arquivo CSV.");
  if (file.size > 2_000_000) throw new Error("O arquivo deve ter no máximo 2 MB.");
  const content = (await file.text()).replace(/^\uFEFF/, "");
  const lines = content.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) throw new Error("O CSV precisa conter cabeçalho e pelo menos uma linha de dados.");
  const delimiter = (lines[0].match(/;/g)?.length ?? 0) >= (lines[0].match(/,/g)?.length ?? 0) ? ";" : ",";
  const headers = parseCsvLine(lines[0], delimiter).map(normalizeHeader);
  const indexOf = (...names: string[]) => names.map((name) => headers.indexOf(name)).find((index) => index >= 0) ?? -1;
  const dateIndex = indexOf("date", "data");
  const partIndex = indexOf("body_part", "parte_do_corpo", "parte");
  const valueIndex = indexOf("value", "valor", "medida");
  const unitIndex = indexOf("unit", "unidade");
  const instructionsIndex = indexOf("instructions", "instrucoes", "como_medir");
  if (dateIndex < 0 || partIndex < 0 || valueIndex < 0) throw new Error("O cabeçalho deve conter date, body_part e value.");

  const rows = lines.slice(1).map((line, index) => {
    const cells = parseCsvLine(line, delimiter);
    const bodyPart = String(cells[partIndex] ?? "").trim();
    if (!bodyPart) throw new Error(`Parte do corpo vazia na linha ${index + 2}.`);
    return {
      date: importedDate(cells[dateIndex] ?? "", index + 2),
      bodyPart,
      value: decimalValue(cells[valueIndex] ?? "", `a linha ${index + 2}`, 1000),
      unit: String(cells[unitIndex] ?? "cm").trim() || "cm",
      instructions: String(cells[instructionsIndex] ?? "").trim(),
    };
  });
  const supabase = await createClient();
  const weightRows = rows.filter((row) => normalizeHeader(row.bodyPart) === "peso");
  if (weightRows.length) {
    const { error } = await supabase.from("health_weight_entries").upsert(weightRows.map((row) => ({ user_id: userId, measured_on: row.date, weight_kg: row.value, notes: "Importado do Excel" })), { onConflict: "user_id,measured_on" });
    if (error) throw new Error("Não foi possível importar os registros de peso.");
  }
  const measurementRows = rows.filter((row) => normalizeHeader(row.bodyPart) !== "peso");
  if (measurementRows.length) {
    const { data: existingTypes, error: typesError } = await supabase.from("body_measurement_types").select("id, name, sort_order").eq("user_id", userId);
    if (typesError) throw new Error("Não foi possível consultar as partes do corpo.");
    const typeNames = new Set((existingTypes ?? []).map((type) => normalizeHeader(type.name)));
    let nextOrder = Math.max(-1, ...(existingTypes ?? []).map((type) => type.sort_order)) + 1;
    const newTypes = Array.from(new Map(measurementRows.filter((row) => !typeNames.has(normalizeHeader(row.bodyPart))).map((row) => [normalizeHeader(row.bodyPart), row])).values());
    if (newTypes.length) {
      const { error } = await supabase.from("body_measurement_types").insert(newTypes.map((row) => ({ user_id: userId, name: row.bodyPart, instructions: row.instructions, unit: row.unit, sort_order: nextOrder++ })));
      if (error) throw new Error("Não foi possível criar as novas partes do corpo do arquivo.");
    }
    const { data: allTypes, error: allTypesError } = await supabase.from("body_measurement_types").select("id, name").eq("user_id", userId);
    if (allTypesError) throw new Error("Não foi possível preparar as partes do corpo.");
    const typeByName = new Map((allTypes ?? []).map((type) => [normalizeHeader(type.name), type.id]));
    const dates = Array.from(new Set(measurementRows.map((row) => row.date)));
    const { error: sessionsUpsertError } = await supabase.from("body_measurement_sessions").upsert(dates.map((date) => ({ user_id: userId, measured_on: date, notes: "Importado do Excel" })), { onConflict: "user_id,measured_on" });
    if (sessionsUpsertError) throw new Error("Não foi possível criar as datas de medição.");
    const { data: sessions, error: sessionsError } = await supabase.from("body_measurement_sessions").select("id, measured_on").eq("user_id", userId).in("measured_on", dates);
    if (sessionsError) throw new Error("Não foi possível consultar as datas importadas.");
    const sessionByDate = new Map((sessions ?? []).map((session) => [session.measured_on, session.id]));
    const records = measurementRows.map((row) => ({ user_id: userId, session_id: sessionByDate.get(row.date)!, measurement_type_id: typeByName.get(normalizeHeader(row.bodyPart))!, value: row.value }));
    const { error: valuesError } = await supabase.from("body_measurement_values").upsert(records, { onConflict: "session_id,measurement_type_id" });
    if (valuesError) throw new Error("Não foi possível importar os valores das medidas.");
  }
  refreshHealthPages();
  redirect(`/health-data/measurements/import?imported=${rows.length}`);
}
