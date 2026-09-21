import { formatDecimal, formatHealthDate } from "@/lib/health";

type Point = { date: string; value: number };

export function HealthLineChart({ points, unit, label }: { points: Point[]; unit: string; label: string }) {
  if (!points.length) {
    return <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-5 text-center text-sm text-stone-500">Ainda não há dados suficientes para desenhar o gráfico.</div>;
  }

  const width = 900;
  const height = 330;
  const padding = { top: 24, right: 30, bottom: 54, left: 60 };
  const values = points.map((point) => point.value);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const spread = rawMax - rawMin || Math.max(rawMax * 0.04, 1);
  const min = Math.max(0, rawMin - spread * 0.18);
  const max = rawMax + spread * 0.18;
  const x = (index: number) => padding.left + (points.length === 1 ? (width - padding.left - padding.right) / 2 : index * (width - padding.left - padding.right) / (points.length - 1));
  const y = (value: number) => padding.top + (max - value) * (height - padding.top - padding.bottom) / (max - min || 1);
  const polyline = points.map((point, index) => `${x(index)},${y(point.value)}`).join(" ");
  const tickIndexes = Array.from(new Set([0, Math.floor((points.length - 1) / 2), points.length - 1]));

  return (
    <div className="overflow-x-auto rounded-2xl border border-rose-100 bg-rose-50/40 p-3 sm:p-5">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${label}: evolução de ${points.length} registros`} className="min-w-[680px]">
        {[0, 1, 2, 3, 4].map((tick) => {
          const tickValue = min + (max - min) * tick / 4;
          const tickY = y(tickValue);
          return <g key={tick}><line x1={padding.left} x2={width - padding.right} y1={tickY} y2={tickY} stroke="#e7e5e4" /><text x={padding.left - 10} y={tickY + 4} textAnchor="end" className="fill-stone-500 text-[12px]">{formatDecimal(tickValue, 1)}</text></g>;
        })}
        <polyline points={polyline} fill="none" stroke="#be123c" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((point, index) => <g key={`${point.date}-${index}`}><circle cx={x(index)} cy={y(point.value)} r="6" fill="#fff" stroke="#be123c" strokeWidth="4"><title>{formatHealthDate(point.date)}: {formatDecimal(point.value)} {unit}</title></circle></g>)}
        {tickIndexes.map((index) => <text key={index} x={x(index)} y={height - 18} textAnchor={index === 0 ? "start" : index === points.length - 1 ? "end" : "middle"} className="fill-stone-500 text-[12px]">{formatHealthDate(points[index].date)}</text>)}
      </svg>
    </div>
  );
}
