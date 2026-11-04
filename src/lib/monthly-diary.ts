export type MonthlyDiaryEntry = {
  id: string;
  entry_date: string;
  notes: string;
  did_klap: boolean;
  did_exercise: boolean;
};

export function validMonthlyDiaryMonth(value: string | undefined, fallbackDate: string) {
  const fallback = fallbackDate.slice(0, 7);
  if (!value || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return fallback;
  return value;
}

export function monthDays(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
}

export function isoDateInMonth(month: string, day: number) {
  return `${month}-${String(day).padStart(2, "0")}`;
}

export function formatMonthlyDiaryDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`)).replace(".", "");
}

export function formatMonthlyDiaryMonth(month: string) {
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" })
    .format(new Date(`${month}-01T12:00:00Z`));
}
