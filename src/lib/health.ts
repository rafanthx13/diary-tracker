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

export function averageClockTime(values: string[]) {
  if (!values.length) return null;

  const { horizontal, vertical } = values.reduce((total, value) => {
    const [hours, minutes] = value.slice(0, 5).split(":").map(Number);
    const angle = ((hours * 60 + minutes) / (24 * 60)) * Math.PI * 2;
    return { horizontal: total.horizontal + Math.cos(angle), vertical: total.vertical + Math.sin(angle) };
  }, { horizontal: 0, vertical: 0 });
  const angle = (Math.atan2(vertical, horizontal) + Math.PI * 2) % (Math.PI * 2);
  const averageMinutes = Math.round((angle / (Math.PI * 2)) * 24 * 60) % (24 * 60);

  return `${String(Math.floor(averageMinutes / 60)).padStart(2, "0")}:${String(averageMinutes % 60).padStart(2, "0")}`;
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
