export type CategoryOption = {
  id: string;
  name: string;
  color: string;
};

export type Task = {
  id: string;
  title: string;
  category_id: string | null;
  is_daily: boolean;
  completed_at: string | null;
  created_at: string;
};

export function saoPauloDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((value) => value.type === type)?.value ?? "";

  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

export function monthBounds(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const start = new Date(Date.UTC(year, monthNumber - 1, 1));
  const end = new Date(Date.UTC(year, monthNumber, 1));
  return { start: start.toISOString(), end: end.toISOString() };
}
