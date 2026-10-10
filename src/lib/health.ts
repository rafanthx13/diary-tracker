export type WeightEntry = {
  id: string;
  measured_on: string;
  weight_kg: number;
  notes: string;
};

export type SleepEntry = {
  id: string;
  slept_on: string;
  sleep_time: string;
  wake_time: string;
  quality_score: number | null;
  description: string;
  duration_minutes: number;
};

export type MeasurementType = {
  id: string;
  name: string;
  instructions: string;
  unit: string;
  sort_order: number;
};

export function formatHealthDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}

export function formatDecimal(value: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(value);
}

export function formatSleepDuration(minutes: number) {
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}min`;
}

export function sleepDurationMinutes(sleepTime: string, wakeTime: string) {
  const toMinutes = (value: string) => {
    const [hours, minutes] = value.slice(0, 5).split(":").map(Number);
    return hours * 60 + minutes;
  };
  const duration = toMinutes(wakeTime) - toMinutes(sleepTime);
  return duration > 0 ? duration : duration + 24 * 60;
}

export function validHealthDate(value: string | undefined, fallback: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return fallback;
  const parsed = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value && value <= fallback
    ? value
    : fallback;
}
