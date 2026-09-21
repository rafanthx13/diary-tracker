import type { Task } from "@/lib/tasks";
import { formatReportDate } from "@/lib/time-reports";

type MatrixRow = {
  task: Task;
  dates: string[];
};

function shortDate(value: string) {
  const date = new Date(`${value}T12:00:00-03:00`);
  return {
    day: new Intl.DateTimeFormat("pt-BR", { day: "2-digit", timeZone: "America/Sao_Paulo" }).format(date),
    weekday: new Intl.DateTimeFormat("pt-BR", { weekday: "narrow", timeZone: "America/Sao_Paulo" }).format(date),
  };
}

export function CompletionMatrix({ rows, dates }: { rows: MatrixRow[]; dates: string[] }) {
  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
      <div>
        <p className="text-sm font-medium text-stone-500">Visualização em malha</p>
        <h2 className="mt-1 text-xl font-semibold">Tarefas por dia</h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">Cada quadrado verde indica que a tarefa daquela linha foi concluída na data da coluna.</p>
      </div>

      {rows.length ? (
        <>
          <div className="mt-5 overflow-x-auto rounded-2xl border border-stone-200 bg-stone-50 p-2">
            <table className="w-max min-w-full border-separate border-spacing-1 text-left">
              <thead>
                <tr>
                  <th className="sticky left-0 z-20 min-w-64 bg-stone-50 px-2 py-1 text-xs font-semibold text-stone-600">Atividade e desempenho</th>
                  {dates.map((date) => {
                    const label = shortDate(date);
                    return <th key={date} title={formatReportDate(date)} className="w-6 min-w-6 pb-1 text-center text-[10px] font-medium text-stone-500"><span className="block uppercase">{label.weekday}</span><span className="block tabular-nums">{label.day}</span></th>;
                  })}
                </tr>
              </thead>
              <tbody>
                {rows.map(({ task, dates: completedDates }) => {
                  const completed = new Set(completedDates);
                  const percentage = dates.length ? Math.round((completed.size / dates.length) * 100) : 0;
                  return (
                    <tr key={task.id}>
                      <th className="sticky left-0 z-10 min-w-64 bg-stone-50 px-2 py-1 text-sm font-medium text-stone-800">
                        <div className="flex items-center justify-between gap-3">
                          <span title={task.title} className="max-w-36 truncate">{task.title}</span>
                          <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-800">{completed.size} feita{completed.size === 1 ? "" : "s"} · {percentage}%</span>
                        </div>
                      </th>
                      {dates.map((date) => {
                        const wasCompleted = completed.has(date);
                        return (
                          <td key={date} className="p-0.5">
                            <span title={`${task.title} — ${formatReportDate(date)}: ${wasCompleted ? "concluída" : "não concluída"}`} className={`grid size-5 place-items-center rounded-[5px] ring-1 ${wasCompleted ? "bg-emerald-600 ring-emerald-700" : "bg-white ring-stone-200"}`}>
                              <span className="sr-only">{wasCompleted ? "Concluída" : "Não concluída"}</span>
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-end gap-2 text-xs text-stone-500"><span>Não feita</span><span className="size-4 rounded-[4px] bg-white ring-1 ring-stone-200" /><span className="size-4 rounded-[4px] bg-emerald-600 ring-1 ring-emerald-700" /><span>Feita</span></div>
        </>
      ) : (
        <p className="mt-5 rounded-2xl border border-dashed border-stone-300 px-4 py-8 text-center text-sm text-stone-500">Nenhuma tarefa diária foi criada ainda.</p>
      )}
    </section>
  );
}
