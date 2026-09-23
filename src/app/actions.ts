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
  const localDateTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(value);
  const normalized = localDateTime ? `${value.length === 16 ? `${value}:00` : value}-03:00` : value;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) throw new Error("Data ou horário inválido.");
  return date.toISOString();
}

function completionDate(formData: FormData) {
  const value = formData.get("completedOn")?.toString().trim();
  if (!value) return saoPauloDate();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || new Date(`${value}T12:00:00-03:00`).toISOString().slice(0, 10) !== value) {
    throw new Error("A data da conclusão é inválida.");
  }
  if (value > saoPauloDate()) throw new Error("Não é possível concluir uma tarefa em uma data futura.");
  return value;
}

function activityInsertError(error: { code?: string; message?: string }) {
  if (error.code === "23505") {
    return new Error("Já existe uma atividade em andamento. Encerre-a antes de iniciar outra.");
  }
  if (error.code === "42501") {
    return new Error("Sua conta não tem permissão para registrar atividades. Execute a migração 20260921010000 no Supabase.");
  }
  if (error.code === "23503") {
    return new Error("A classificação escolhida não existe mais. Atualize a página e escolha outra.");
  }

  return new Error(`Não foi possível iniciar a atividade${error.code ? ` (${error.code})` : ""}: ${error.message ?? "erro desconhecido"}`);
}

function revalidateDiaryConfiguration() {
  revalidatePath("/categories");
  revalidatePath("/today/categories");
  revalidatePath("/today");
  revalidatePath("/today/reports/[period]", "page");
}

function revalidateTasks() {
  revalidatePath("/tasks");
  revalidatePath("/routine");
  revalidatePath("/tasks/completed");
  revalidatePath("/tasks/reports");
  revalidatePath("/diary-task");
  revalidatePath("/diary-task/reports/[period]", "page");
}

function optionalCategoryId(formData: FormData) {
  const value = formData.get("categoryId")?.toString().trim();
  return value || null;
}

function optionalTaskListId(formData: FormData) {
  const value = formData.get("taskListId")?.toString().trim();
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

async function ensureAvailableClassification(classificationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("classifications")
    .select("id")
    .eq("id", classificationId)
    .maybeSingle();

  if (error || !data) throw new Error("A classificação selecionada não está disponível.");
}

async function ensureAvailableTaskList(taskListId: string, userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("task_lists")
    .select("id")
    .eq("id", taskListId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) throw new Error("A aba escolhida não está disponível.");
}

export async function signIn(formData: FormData) {
  const email = requiredText(formData, "email");
  const password = requiredText(formData, "password");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) redirect("/login?erro=credenciais");
  redirect("/");
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

  if (error) throw activityInsertError(error);
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

  if (error) throw activityInsertError(error);
  revalidatePath("/today");
}

export async function updateActivity(formData: FormData) {
  const userId = await requireUser();
  const activityId = requiredText(formData, "activityId");
  const title = requiredText(formData, "title");
  const classificationId = requiredText(formData, "classificationId");
  const startedAt = asIsoDate(requiredText(formData, "startedAt"));
  const endedAtValue = formData.get("endedAt")?.toString().trim();
  const endedAt = endedAtValue ? asIsoDate(endedAtValue) : null;

  if (endedAt && new Date(endedAt) <= new Date(startedAt)) {
    throw new Error("O fim precisa ser posterior ao início.");
  }

  await ensureAvailableClassification(classificationId);
  const supabase = await createClient();
  const { error } = await supabase
    .from("activities")
    .update({ title, classification_id: classificationId, started_at: startedAt, ended_at: endedAt })
    .eq("id", activityId)
    .eq("user_id", userId);

  if (error?.code === "23P01") throw new Error("Este período se sobrepõe a outra atividade registrada.");
  if (error?.code === "23505") throw new Error("Já existe outra atividade em andamento.");
  if (error) throw new Error("Não foi possível atualizar a atividade.");

  revalidatePath("/today");
  revalidatePath("/today/reports/[period]", "page");
}

export async function deleteActivity(formData: FormData) {
  const userId = await requireUser();
  const activityId = requiredText(formData, "activityId");
  const supabase = await createClient();
  const { error } = await supabase
    .from("activities")
    .delete()
    .eq("id", activityId)
    .eq("user_id", userId);

  if (error) throw new Error("Não foi possível excluir a atividade.");

  revalidatePath("/today");
  revalidatePath("/today/reports/[period]", "page");
}

async function saveClassification(formData: FormData) {
  await requireUser();
  const name = requiredText(formData, "name");
  const categoryId = optionalCategoryId(formData);
  if (categoryId) await ensureAvailableCategory(categoryId);
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
  const categoryId = optionalCategoryId(formData);
  if (categoryId) await ensureAvailableCategory(categoryId);
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
    { name: "TEMPO PERDIDO", color: "#9333ea" },
    { name: "WORK", color: "#2563eb" },
    { name: "ROTINA QUARTO", color: "#db2777" },
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
  const defaultClassifications: Array<[string | null, string]> = [
    ["TEMPO PERDIDO", "Klap"],
    ["TEMPO PERDIDO", "SemiKlap"],
    ["TEMPO PERDIDO", "Relax or Games"],
    ["TEMPO PERDIDO", "Brawl"],
    ["WORK", "TASK"],
    ["WORK", "Book"],
    ["WORK", "Corrrer"],
    ["WORK", "Academia"],
    ["WORK", "Arrumação PC"],
    [null, "Mercado"],
    [null, "Arrumação Quarto"],
    [null, "Fazer Jantar"],
    [null, "Finalizar Dia"],
    [null, "Higiene"],
    [null, "Arrumar pra sair"],
    [null, "Next Day"],
    [null, "Jantar"],
    [null, "Almoçar"],
    [null, "Fazer Almoço"],
    [null, "Sair Casa"],
    [null, "Notes PC or Diary"],
    [null, "Obsidian Notes"],
    [null, "Conversa Vilma"],
    [null, "Tomar Café"],
  ];

  const { data: currentClassifications, error: classificationsError } = await supabase
    .from("classifications")
    .select("name");
  if (classificationsError) throw new Error("Não foi possível ler as classificações atuais.");

  const existingClassificationNames = new Set((currentClassifications ?? []).map((classification) => classification.name.toLocaleLowerCase("pt-BR")));
  const missingClassifications = defaultClassifications
    .filter(([, name]) => !existingClassificationNames.has(name.toLocaleLowerCase("pt-BR")))
    .map(([categoryName, name]) => ({
      category_id: categoryName ? categoryIds.get(categoryName.toLocaleLowerCase("pt-BR")) : null,
      name,
    }));

  if (missingClassifications.some((classification) => classification.category_id === undefined)) {
    throw new Error("Não foi possível encontrar uma categoria necessária para o catálogo inicial.");
  }
  if (missingClassifications.length) {
    const { error } = await supabase.from("classifications").insert(missingClassifications as { category_id: string | null; name: string }[]);
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
  const isDaily = formData.get("isDaily")?.toString() === "true";
  const taskListId = isDaily ? null : optionalTaskListId(formData);
  if (taskListId) await ensureAvailableTaskList(taskListId, userId);

  const supabase = await createClient();
  const { error } = await supabase.from("tasks").insert({
    user_id: userId,
    title,
    is_daily: isDaily,
    task_list_id: taskListId,
  });

  if (error) throw new Error("Não foi possível criar a tarefa.");
  revalidateTasks();
}

export async function createTaskList(formData: FormData) {
  const userId = await requireUser();
  const name = requiredText(formData, "name");
  const description = formData.get("description")?.toString().trim() ?? "";
  if (description.length > 300) throw new Error("A descrição deve ter no máximo 300 caracteres.");
  const supabase = await createClient();
  const { data: lastList, error: orderError } = await supabase
    .from("task_lists")
    .select("sort_order")
    .eq("user_id", userId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (orderError) throw new Error("Não foi possível determinar a ordem da nova aba.");
  const { error } = await supabase.from("task_lists").insert({ user_id: userId, name, description, sort_order: (lastList?.sort_order ?? -1) + 1 });

  if (error?.code === "23505") throw new Error("Já existe uma aba com esse nome.");
  if (error) throw new Error("Não foi possível criar a aba.");
  revalidateTasks();
}

export async function reorderTaskList(formData: FormData) {
  const userId = await requireUser();
  const taskListId = requiredText(formData, "taskListId");
  const direction = requiredText(formData, "direction");
  if (direction !== "up" && direction !== "down") throw new Error("Direção inválida.");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("task_lists")
    .select("id")
    .eq("user_id", userId)
    .order("sort_order")
    .order("created_at");
  if (error) throw new Error("Não foi possível carregar a ordem das abas.");

  const orderedIds = (data ?? []).map((list) => list.id);
  const currentIndex = orderedIds.indexOf(taskListId);
  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= orderedIds.length) return;
  [orderedIds[currentIndex], orderedIds[targetIndex]] = [orderedIds[targetIndex], orderedIds[currentIndex]];

  const updates = await Promise.all(orderedIds.map((id, sortOrder) => supabase.from("task_lists").update({ sort_order: sortOrder }).eq("id", id).eq("user_id", userId)));
  if (updates.some((result) => result.error)) throw new Error("Não foi possível alterar a ordem das abas.");
  revalidateTasks();
}

export async function setTaskImportance(formData: FormData) {
  const userId = await requireUser();
  const taskId = requiredText(formData, "taskId");
  const important = formData.get("important")?.toString() === "true";
  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ is_important: important })
    .eq("id", taskId)
    .eq("user_id", userId)
    .eq("is_daily", false);

  if (error) throw new Error("Não foi possível alterar a importância da tarefa.");
  revalidateTasks();
}

export async function updateTaskTitle(formData: FormData) {
  const userId = await requireUser();
  const taskId = requiredText(formData, "taskId");
  const title = requiredText(formData, "title");
  if (title.length > 240) throw new Error("O nome da tarefa deve ter no máximo 240 caracteres.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ title })
    .eq("id", taskId)
    .eq("user_id", userId)
    .eq("is_daily", false);

  if (error) throw new Error("Não foi possível alterar o nome da tarefa.");
  revalidateTasks();
}

export async function deleteTask(formData: FormData) {
  const userId = await requireUser();
  const taskId = requiredText(formData, "taskId");
  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("user_id", userId)
    .eq("is_daily", false);

  if (error) throw new Error("Não foi possível excluir a tarefa.");
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
  const completedOn = completionDate(formData);
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
