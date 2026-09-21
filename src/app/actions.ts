"use server";

import { requireUser } from "@/lib/auth";
import type { ClassificationFormState } from "@/lib/classification-form-state";
import { saoPauloDate } from "@/lib/tasks";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function requiredText(formData: FormData, field: string) {
  const value = formData.get(field)?.toString().trim();
  if (!value) throw new Error(`O campo ${field} é obrigatório.`);
  return value;
}

function asIsoDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("Data ou horário inválido.");
  return date.toISOString();
}

function colorValue(formData: FormData) {
  const color = requiredText(formData, "color");
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
    throw new Error("A cor informada é inválida.");
  }
  return color;
}

function revalidateDiaryConfiguration() {
  revalidatePath("/categories");
  revalidatePath("/today");
}

function revalidateTasks() {
  revalidatePath("/tasks");
  revalidatePath("/routine");
  revalidatePath("/tasks/completed");
}

function optionalCategoryId(formData: FormData) {
  const value = formData.get("categoryId")?.toString().trim();
  return value || null;
}

async function ensureAvailableCategory(categoryId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id")
    .eq("id", categoryId)
    .maybeSingle();

  if (error || !data) throw new Error("A categoria selecionada não está disponível.");
}

export async function signIn(formData: FormData) {
  const email = requiredText(formData, "email");
  const password = requiredText(formData, "password");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) redirect("/login?erro=credenciais");
  redirect("/today");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function startActivity(formData: FormData) {
  const userId = await requireUser();
  const title = requiredText(formData, "title");
  const classificationId = requiredText(formData, "classificationId");
  const supabase = await createClient();

  const { error } = await supabase.from("activities").insert({
    user_id: userId,
    title,
    classification_id: classificationId,
    started_at: new Date().toISOString(),
  });

  if (error) throw new Error("Não foi possível iniciar a atividade.");
  revalidatePath("/today");
}

export async function stopActivity(formData: FormData) {
  const userId = await requireUser();
  const activityId = requiredText(formData, "activityId");
  const supabase = await createClient();
  const { error } = await supabase
    .from("activities")
    .update({ ended_at: new Date().toISOString() })
    .eq("id", activityId)
    .eq("user_id", userId)
    .is("ended_at", null);

  if (error) throw new Error("Não foi possível encerrar a atividade.");
  revalidatePath("/today");
}

export async function createManualActivity(formData: FormData) {
  const userId = await requireUser();
  const title = requiredText(formData, "title");
  const classificationId = requiredText(formData, "classificationId");
  const startedAt = asIsoDate(requiredText(formData, "startedAt"));
  const endedAt = asIsoDate(requiredText(formData, "endedAt"));

  if (new Date(endedAt) <= new Date(startedAt)) {
    throw new Error("O fim precisa ser posterior ao início.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("activities").insert({
    user_id: userId,
    title,
    classification_id: classificationId,
    started_at: startedAt,
    ended_at: endedAt,
  });

  if (error) throw new Error("Não foi possível salvar a atividade.");
  revalidatePath("/today");
}

export async function createCategory(formData: FormData) {
  await requireUser();
  const name = requiredText(formData, "name");
  const color = colorValue(formData);
  const supabase = await createClient();
  const { error } = await supabase.from("categories").insert({ name, color });

  if (error) throw new Error("Não foi possível criar a categoria. Escolha outro nome, se ele já existir.");
  revalidateDiaryConfiguration();
}

export async function updateCategory(formData: FormData) {
  await requireUser();
  const categoryId = requiredText(formData, "categoryId");
  const name = requiredText(formData, "name");
  const color = colorValue(formData);
  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update({ name, color })
    .eq("id", categoryId);

  if (error) throw new Error("Não foi possível atualizar a categoria.");
  revalidateDiaryConfiguration();
}

async function saveClassification(formData: FormData) {
  await requireUser();
  const name = requiredText(formData, "name");
  const categoryId = requiredText(formData, "categoryId");
  await ensureAvailableCategory(categoryId);
  const supabase = await createClient();
  const { error } = await supabase.from("classifications").insert({
    category_id: categoryId,
    name,
  });

  if (error) throw error;
  revalidateDiaryConfiguration();
}

export async function createClassification(formData: FormData) {
  try {
    await saveClassification(formData);
  } catch {
    throw new Error("Não foi possível criar a classificação.");
  }
}

export async function createClassificationWithFeedback(
  _previousState: ClassificationFormState,
  formData: FormData,
): Promise<ClassificationFormState> {
  try {
    await saveClassification(formData);
    return { status: "success", message: "Classificação criada com sucesso." };
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";

    if (code === "23505") {
      return { status: "error", message: "Já existe uma classificação com esse nome." };
    }
    if (code === "42501") {
      return { status: "error", message: "Sua conta não tem permissão para criar classificações." };
    }
    if (code === "23503") {
      return { status: "error", message: "A categoria escolhida não está mais disponível." };
    }

    return { status: "error", message: "Não foi possível criar a classificação. Tente novamente." };
  }
}

export async function updateClassification(formData: FormData) {
  await requireUser();
  const classificationId = requiredText(formData, "classificationId");
  const name = requiredText(formData, "name");
  const categoryId = requiredText(formData, "categoryId");
  await ensureAvailableCategory(categoryId);
  const supabase = await createClient();
  const { error } = await supabase
    .from("classifications")
    .update({ name, category_id: categoryId })
    .eq("id", classificationId);

  if (error) throw new Error("Não foi possível atualizar a classificação.");
  revalidateDiaryConfiguration();
}

export async function restoreInitialCatalog() {
  await requireUser();
  const supabase = await createClient();
  const defaultCategories = [
    { name: "TASK", color: "#2563eb" },
    { name: "Relax", color: "#7c3aed" },
    { name: "Arrumação", color: "#d97706" },
    { name: "Comer", color: "#dc2626" },
    { name: "Saúde", color: "#059669" },
    { name: "Planejamento", color: "#475569" },
  ];

  const { data: currentCategories, error: categoryError } = await supabase
    .from("categories")
    .select("id, name");
  if (categoryError) throw new Error("Não foi possível ler as categorias atuais.");

  const existingCategoryNames = new Set((currentCategories ?? []).map((category) => category.name.toLocaleLowerCase("pt-BR")));
  const missingCategories = defaultCategories.filter((category) => !existingCategoryNames.has(category.name.toLocaleLowerCase("pt-BR")));
  if (missingCategories.length) {
    const { error } = await supabase.from("categories").insert(missingCategories);
    if (error) throw new Error("Não foi possível restaurar as categorias iniciais.");
  }

  const { data: allCategories, error: allCategoriesError } = await supabase
    .from("categories")
    .select("id, name");
  if (allCategoriesError) throw new Error("Não foi possível carregar as categorias restauradas.");

  const categoryIds = new Map((allCategories ?? []).map((category) => [category.name.toLocaleLowerCase("pt-BR"), category.id]));
  const defaultClassifications = [
    ["TASK", "TASK"],
    ["Relax", "Relax or Games"],
    ["Arrumação", "Arrumação Quarto"],
    ["Comer", "Jantar"],
    ["Saúde", "Academia"],
    ["Planejamento", "Next Day"],
    ["Planejamento", "Sair Casa"],
  ];

  const { data: currentClassifications, error: classificationsError } = await supabase
    .from("classifications")
    .select("name");
  if (classificationsError) throw new Error("Não foi possível ler as classificações atuais.");

  const existingClassificationNames = new Set((currentClassifications ?? []).map((classification) => classification.name.toLocaleLowerCase("pt-BR")));
  const missingClassifications = defaultClassifications
    .filter(([, name]) => !existingClassificationNames.has(name.toLocaleLowerCase("pt-BR")))
    .map(([categoryName, name]) => ({
      category_id: categoryIds.get(categoryName.toLocaleLowerCase("pt-BR")),
      name,
    }));

  if (missingClassifications.some((classification) => !classification.category_id)) {
    throw new Error("Não foi possível encontrar uma categoria necessária para o catálogo inicial.");
  }
  if (missingClassifications.length) {
    const { error } = await supabase.from("classifications").insert(missingClassifications as { category_id: string; name: string }[]);
    if (error) throw new Error("Não foi possível restaurar as classificações iniciais.");
  }

  revalidateDiaryConfiguration();
}

export async function restoreInitialCatalogWithFeedback(
  _previousState: ClassificationFormState,
  _formData: FormData,
): Promise<ClassificationFormState> {
  void _previousState;
  void _formData;
  try {
    await restoreInitialCatalog();
    return { status: "success", message: "Catálogo inicial restaurado. Atualize a lista de atividades." };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado ao restaurar o catálogo.";
    return { status: "error", message };
  }
}

export async function createTask(formData: FormData) {
  const userId = await requireUser();
  const title = requiredText(formData, "title");
  const categoryId = optionalCategoryId(formData);
  const isDaily = formData.get("isDaily")?.toString() === "true";
  if (categoryId) await ensureAvailableCategory(categoryId);

  const supabase = await createClient();
  const { error } = await supabase.from("tasks").insert({
    user_id: userId,
    title,
    category_id: categoryId,
    is_daily: isDaily,
  });

  if (error) throw new Error("Não foi possível criar a tarefa.");
  revalidateTasks();
}

export async function setTaskCompletion(formData: FormData) {
  const userId = await requireUser();
  const taskId = requiredText(formData, "taskId");
  const complete = formData.get("complete")?.toString() === "true";
  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ completed_at: complete ? new Date().toISOString() : null })
    .eq("id", taskId)
    .eq("user_id", userId)
    .eq("is_daily", false);

  if (error) throw new Error("Não foi possível atualizar a tarefa.");
  revalidateTasks();
}

export async function setDailyTaskCompletion(formData: FormData) {
  const userId = await requireUser();
  const taskId = requiredText(formData, "taskId");
  const complete = formData.get("complete")?.toString() === "true";
  const completedOn = saoPauloDate();
  const supabase = await createClient();

  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("id")
    .eq("id", taskId)
    .eq("user_id", userId)
    .eq("is_daily", true)
    .maybeSingle();
  if (taskError || !task) throw new Error("A tarefa diária não está disponível.");

  if (complete) {
    const { error } = await supabase.from("daily_task_completions").upsert(
      { task_id: taskId, user_id: userId, completed_on: completedOn, completed_at: new Date().toISOString() },
      { onConflict: "task_id,completed_on" },
    );
    if (error) throw new Error("Não foi possível concluir a tarefa diária.");
  } else {
    const { error } = await supabase
      .from("daily_task_completions")
      .delete()
      .eq("task_id", taskId)
      .eq("user_id", userId)
      .eq("completed_on", completedOn);
    if (error) throw new Error("Não foi possível reabrir a tarefa diária.");
  }

  revalidateTasks();
}
