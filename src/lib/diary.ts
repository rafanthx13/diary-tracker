export type Classification = {
  id: string;
  name: string;
  category: {
    id: string;
    name: string;
    color: string;
  } | null;
};

export type Activity = {
  id: string;
  title: string;
  started_at: string;
  ended_at: string | null;
  diary_date: string;
  classification: Classification | null;
};

export function currentDiaryDate(now = new Date()) {
  const diaryDay = new Date(now.getTime() - 5 * 60 * 60 * 1000);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(diaryDay);
  const getPart = (type: string) => parts.find((part) => part.type === type)?.value ?? "";

  return `${getPart("year")}-${getPart("month")}-${getPart("day")}`;
}

export function formatTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

export function formatDuration(startedAt: string, endedAt: string | null) {
  const end = endedAt ? new Date(endedAt) : new Date();
  const minutes = Math.max(0, Math.floor((end.getTime() - new Date(startedAt).getTime()) / 60000));
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}:${String(remainingMinutes).padStart(2, "0")}`;
}

export function toDateTimeLocal(value: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(value);
  const getPart = (type: string) => parts.find((part) => part.type === type)?.value ?? "";

  return `${getPart("year")}-${getPart("month")}-${getPart("day")}T${getPart("hour")}:${getPart("minute")}`;
}
