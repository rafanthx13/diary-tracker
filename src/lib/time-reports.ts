export type TimeReportPeriod = "day" | "week" | "month" | "year" | "all";

export type ReportActivity = {
  id: string;
  title: string;
  started_at: string;
  ended_at: string | null;
  classification: {
    id: string;
    name: string;
    category: {
      id: string;
      name: string;
    } | null;
  } | null;
};

export type TimeTotal = {
  label: string;
  minutes: number;
};

export type TimeReport = {
  activityCount: number;
  totalMinutes: number;
  byActivity: TimeTotal[];
  byClassification: TimeTotal[];
  byCategory: TimeTotal[];
};

function durationInMinutes(activity: ReportActivity) {
  if (!activity.ended_at) return 0;
  return Math.max(0, Math.round((new Date(activity.ended_at).getTime() - new Date(activity.started_at).getTime()) / 60000));
}

function totalsFrom(activities: ReportActivity[], labelFor: (activity: ReportActivity) => string) {
  const totals = new Map<string, number>();

  for (const activity of activities) {
    const label = labelFor(activity);
    totals.set(label, (totals.get(label) ?? 0) + durationInMinutes(activity));
  }

  return [...totals.entries()]
    .map(([label, minutes]) => ({ label, minutes }))
    .sort((first, second) => second.minutes - first.minutes || first.label.localeCompare(second.label, "pt-BR"));
}

export function createTimeReport(activities: ReportActivity[], options: { includeActivityTotals?: boolean } = {}): TimeReport {
  const completedActivities = activities.filter((activity) => activity.ended_at);
  const totalMinutes = completedActivities.reduce((total, activity) => total + durationInMinutes(activity), 0);
  const includeActivityTotals = options.includeActivityTotals ?? true;

  return {
    activityCount: completedActivities.length,
    totalMinutes,
    byActivity: includeActivityTotals ? totalsFrom(completedActivities, (activity) => activity.title) : [],
    byClassification: totalsFrom(completedActivities, (activity) => activity.classification?.name ?? "Sem classificação"),
    byCategory: totalsFrom(completedActivities, (activity) => activity.classification?.category?.name ?? "Sem categoria"),
  };
}

export function formatReportDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return hours ? `${hours}h ${String(minutes).padStart(2, "0")}min` : `${minutes}min`;
}

export function isTimeReportPeriod(value: string): value is TimeReportPeriod {
  return ["day", "week", "month", "year", "all"].includes(value);
}

export function shiftIsoDate(value: string, days: number) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function formatReportDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric", timeZone: "America/Sao_Paulo" })
    .format(new Date(`${value}T12:00:00-03:00`));
}

export function getIsoWeekValue(dateValue: string) {
  const date = new Date(`${dateValue}T12:00:00Z`);
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const year = date.getUTCFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const week = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

  return `${year}-W${String(week).padStart(2, "0")}`;
}

export function isoWeekStart(weekValue: string) {
  const match = /^(\d{4})-W(\d{2})$/.exec(weekValue);
  if (!match) return null;
  const year = Number(match[1]);
  const week = Number(match[2]);
  if (week < 1 || week > 53) return null;

  const januaryFourth = new Date(Date.UTC(year, 0, 4));
  const day = januaryFourth.getUTCDay() || 7;
  januaryFourth.setUTCDate(januaryFourth.getUTCDate() - day + 1 + (week - 1) * 7);
  const start = januaryFourth.toISOString().slice(0, 10);

  return getIsoWeekValue(start) === weekValue ? start : null;
}

export function nextMonthStart(monthValue: string) {
  const [year, month] = monthValue.split("-").map(Number);
  const date = new Date(Date.UTC(year, month, 1));
  return date.toISOString().slice(0, 10);
}
