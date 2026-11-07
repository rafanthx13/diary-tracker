export const agendaColors = ["emerald", "blue", "violet", "amber", "rose", "cyan", "orange", "lime"] as const;

export type AgendaColor = (typeof agendaColors)[number];

export type Agenda = {
  id: string;
  title: string;
  day_starts_at: number;
  updated_at: string;
};

export type AgendaInterval = {
  id: string;
  agenda_id: string;
  title: string;
  color: AgendaColor;
  sort_order: number;
  starts_at: number;
  ends_at: number;
};

export function minutesToTime(minutes: number) {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}`;
}

export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours}h${rest ? ` ${rest}min` : ""}` : `${rest}min`;
}
