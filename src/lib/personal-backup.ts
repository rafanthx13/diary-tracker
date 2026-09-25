export const PERSONAL_BACKUP_FORMAT = "diary-tracker-personal-backup";
export const PERSONAL_BACKUP_VERSION = 1;
export const PERSONAL_BACKUP_MAX_BYTES = 8 * 1024 * 1024;

export const personalBackupCollections = [
  "activities",
  "task_lists",
  "tasks",
  "daily_task_completions",
  "health_weight_entries",
  "body_measurement_types",
  "body_measurement_sessions",
  "body_measurement_values",
  "protocols",
  "protocol_demands",
  "markdown_notes",
] as const;

export type PersonalBackupCollection = (typeof personalBackupCollections)[number];
export type PersonalBackupData = Record<PersonalBackupCollection, unknown[]>;

export type PersonalBackup = {
  format: typeof PERSONAL_BACKUP_FORMAT;
  version: typeof PERSONAL_BACKUP_VERSION;
  exportedAt: string;
  data: PersonalBackupData;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parsePersonalBackup(value: string): PersonalBackup {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error("O arquivo não contém um JSON válido.");
  }

  if (!isRecord(parsed) || parsed.format !== PERSONAL_BACKUP_FORMAT || parsed.version !== PERSONAL_BACKUP_VERSION || !isRecord(parsed.data)) {
    throw new Error("Este arquivo não é um backup compatível do Diary Tracker.");
  }

  const exportedAt = typeof parsed.exportedAt === "string" ? parsed.exportedAt : "";
  if (Number.isNaN(new Date(exportedAt).getTime())) {
    throw new Error("A data de exportação do backup é inválida.");
  }

  const data = {} as PersonalBackupData;
  for (const collection of personalBackupCollections) {
    const rows = parsed.data[collection];
    if (!Array.isArray(rows)) {
      throw new Error("O backup está incompleto ou possui um formato inválido.");
    }
    data[collection] = rows;
  }

  return { format: PERSONAL_BACKUP_FORMAT, version: PERSONAL_BACKUP_VERSION, exportedAt, data };
}
