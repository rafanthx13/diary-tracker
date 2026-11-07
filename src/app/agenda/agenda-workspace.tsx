"use client";

import { deleteAgenda, saveAgenda } from "./actions";
import { agendaColors, type Agenda, type AgendaColor, type AgendaInterval, formatDuration, minutesToTime } from "@/lib/agenda";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useMemo, useState } from "react";

type Draft = { key: string; title: string; color: AgendaColor; endTime: string };
type Computed = Draft & { startOffset: number; endOffset: number | null };

const shades: Record<AgendaColor, string> = {
  emerald: "bg-emerald-500 border-emerald-600 text-emerald-950", blue: "bg-blue-500 border-blue-600 text-blue-950",
  violet: "bg-violet-500 border-violet-600 text-violet-950", amber: "bg-amber-400 border-amber-500 text-amber-950",
  rose: "bg-rose-500 border-rose-600 text-rose-950", cyan: "bg-cyan-500 border-cyan-600 text-cyan-950",
  orange: "bg-orange-400 border-orange-500 text-orange-950", lime: "bg-lime-400 border-lime-500 text-lime-950",
};
const colorNames: Record<AgendaColor, string> = { emerald: "Verde", blue: "Azul", violet: "Violeta", amber: "Âmbar", rose: "Rosa", cyan: "Ciano", orange: "Laranja", lime: "Lima" };

function toMinutes(time: string) {
  const match = time.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}
function endOffset(time: string, start: number, previous: number) {
  const value = toMinutes(time);
  if (value === null) return null;
  let offset = (value - start + 1440) % 1440;
  if (offset <= previous) offset += 1440;
  return offset;
}
function draftFrom(agenda: Agenda | undefined, intervals: AgendaInterval[]): Draft[] {
  if (!agenda) return [];
  return intervals.filter((item) => item.agenda_id === agenda.id).map((item) => ({ key: item.id, title: item.title, color: item.color, endTime: minutesToTime(agenda.day_starts_at + item.ends_at) }));
}

export function AgendaWorkspace({ agendas, intervals }: { agendas: Agenda[]; intervals: AgendaInterval[] }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(agendas[0]?.id ?? null);
  const selected = agendas.find((agenda) => agenda.id === selectedId);
  const [title, setTitle] = useState(selected?.title ?? "");
  const [dayStart, setDayStart] = useState(selected ? minutesToTime(selected.day_starts_at) : "06:30");
  const [draft, setDraft] = useState<Draft[]>(() => draftFrom(selected, intervals));
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const startMinutes = toMinutes(dayStart);
  const computed = useMemo<Computed[]>(() => {
    if (startMinutes === null) return [];
    let previous = 0;
    return draft.map((item) => {
      const end = endOffset(item.endTime, startMinutes, previous);
      const result = { ...item, startOffset: previous, endOffset: end };
      if (end !== null) previous = end;
      return result;
    });
  }, [draft, startMinutes]);
  const complete = computed.at(-1)?.endOffset === 1440;
  const choose = (agenda: Agenda) => {
    setSelectedId(agenda.id); setTitle(agenda.title); setDayStart(minutesToTime(agenda.day_starts_at));
    setDraft(draftFrom(agenda, intervals)); setMessage("");
  };
  const create = () => { setSelectedId(null); setTitle(""); setDayStart("06:30"); setDraft([]); setMessage(""); };
  const change = (id: string, value: Partial<Draft>) => setDraft((rows) => rows.map((row) => row.key === id ? { ...row, ...value } : row));
  const add = () => setDraft((rows) => [...rows, { key: crypto.randomUUID(), title: "", color: agendaColors[rows.length % agendaColors.length], endTime: dayStart }]);
  const remove = (id: string) => setDraft((rows) => rows.filter((row) => row.key !== id));

  function save() {
    if (!title.trim()) { setMessage("Dê um nome à agenda antes de salvar."); return; }
    if (!complete || computed.some((row) => row.endOffset === null || row.endOffset > 1440)) {
      setMessage("Complete os intervalos em ordem e termine no mesmo horário inicial para fechar as 24 horas."); return;
    }
    const formData = new FormData();
    if (selectedId) formData.set("agendaId", selectedId);
    formData.set("title", title); formData.set("dayStartsAt", dayStart);
    formData.set("intervals", JSON.stringify(computed.map((row) => ({ title: row.title, color: row.color, endOffset: row.endOffset }))));
    setPending(true); setMessage("");
    startTransition(async () => {
      try { const result = await saveAgenda(formData); setSelectedId(result.id); setMessage("Agenda salva."); router.refresh(); }
      catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível salvar a agenda."); }
      finally { setPending(false); }
    });
  }
  function erase() {
    if (!selectedId || !confirm("Excluir esta agenda?")) return;
    const formData = new FormData(); formData.set("agendaId", selectedId); setPending(true);
    startTransition(async () => {
      try { await deleteAgenda(formData); create(); router.refresh(); }
      catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível excluir a agenda."); }
      finally { setPending(false); }
    });
  }

  return <main className="min-h-screen bg-stone-50 pb-12 text-stone-900">
    <header className="border-b border-stone-200 bg-white"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-6 sm:px-8"><div><p className="text-sm font-semibold tracking-[0.18em] text-sky-700 uppercase">Agenda</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">O desenho do seu dia</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">Organize um ciclo completo de 24 horas em blocos de atividades, como uma visão simples de calendário.</p></div><div className="flex flex-wrap gap-3"><Link href="/agenda/visualizar" className="rounded-xl border border-sky-200 px-4 py-3 text-sm font-semibold text-sky-800 hover:bg-sky-50">Ver todas</Link><button type="button" onClick={create} className="rounded-xl bg-sky-700 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-800">+ Criar agenda</button></div></div></header>
    <div className="mx-auto grid max-w-7xl gap-6 px-5 py-7 sm:px-8 lg:grid-cols-[250px_minmax(0,1fr)_minmax(330px,0.9fr)]">
      <AgendaList agendas={agendas} selectedId={selectedId} choose={choose} />
      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold tracking-wide text-sky-700 uppercase">{selected ? "Editar agenda" : "Nova agenda"}</p><h2 className="mt-1 text-xl font-semibold">Intervalos do ciclo</h2></div>{selected ? <button type="button" onClick={erase} disabled={pending} className="rounded-lg px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50">Excluir</button> : null}</div>
        <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_150px]"><label className="block text-sm font-medium">Nome da agenda<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={100} placeholder="Ex.: Dia de academia" className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-3 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100" /></label><label className="block text-sm font-medium">O dia começa às<input type="time" value={dayStart} onChange={(event) => setDayStart(event.target.value)} className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-3 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100" /></label></div>
        <div className="mt-6"><div className="flex items-center justify-between gap-3"><h3 className="font-semibold">Blocos de tempo</h3><button type="button" onClick={add} className="rounded-lg border border-sky-200 px-3 py-2 text-sm font-semibold text-sky-800 hover:bg-sky-50">+ Adicionar intervalo</button></div>{draft.length ? <div className="mt-3 space-y-3">{draft.map((row, index) => <IntervalEditor key={row.key} row={row} index={index} computed={computed[index]} startMinutes={startMinutes ?? 0} change={change} remove={remove} />)}</div> : <p className="mt-3 rounded-2xl border border-dashed border-stone-300 p-5 text-sm text-stone-500">Adicione o primeiro intervalo do seu dia.</p>}</div>
        <div className={"mt-5 rounded-2xl p-4 text-sm " + (complete ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-950")}>{complete ? "Ciclo completo: os intervalos somam exatamente 24 horas." : "O último bloco deve terminar às " + dayStart + " para fechar as 24 horas."}</div>{message ? <p role="status" className="mt-3 text-sm font-medium text-stone-700">{message}</p> : null}<button type="button" onClick={save} disabled={pending || !complete} className="mt-5 w-full rounded-xl bg-sky-700 px-5 py-3 font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50">{pending ? "Salvando…" : "Salvar agenda"}</button>
      </section>
      <AgendaPreview agenda={selected ? { ...selected, title, day_starts_at: startMinutes ?? selected.day_starts_at } : (title ? { id: "draft", title, day_starts_at: startMinutes ?? 390, updated_at: "" } : undefined)} rows={computed} />
    </div>
  </main>;
}

function AgendaList({ agendas, selectedId, choose }: { agendas: Agenda[]; selectedId: string | null; choose: (agenda: Agenda) => void }) {
  return <aside className="h-fit rounded-3xl border border-stone-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><h2 className="font-semibold">Minhas agendas</h2><span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs text-stone-600">{agendas.length}</span></div>{agendas.length ? <div className="mt-3 space-y-1">{agendas.map((agenda) => <button key={agenda.id} type="button" onClick={() => choose(agenda)} className={"w-full rounded-xl px-3 py-3 text-left transition " + (agenda.id === selectedId ? "bg-sky-50 text-sky-950 ring-1 ring-sky-200" : "hover:bg-stone-50")}><span className="block truncate font-medium">{agenda.title}</span><span className="mt-1 block text-xs text-stone-500">Começa às {minutesToTime(agenda.day_starts_at)}</span></button>)}</div> : <p className="mt-4 rounded-2xl bg-stone-50 p-4 text-sm leading-6 text-stone-500">Crie sua primeira agenda para montar a rotina visual do dia.</p>}</aside>;
}
function IntervalEditor({ row, index, computed, startMinutes, change, remove }: { row: Draft; index: number; computed: Computed | undefined; startMinutes: number; change: (id: string, value: Partial<Draft>) => void; remove: (id: string) => void }) {
  const duration = computed?.endOffset === null || !computed ? null : computed.endOffset - computed.startOffset;
  return <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3"><div className="grid gap-3 sm:grid-cols-[110px_1fr_128px_42px]"><label className="text-xs font-medium text-stone-600">Termina às<input type="time" value={row.endTime} onChange={(event) => change(row.key, { endTime: event.target.value })} className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-2 py-2 text-sm" /></label><label className="text-xs font-medium text-stone-600">Atividade<input value={row.title} onChange={(event) => change(row.key, { title: event.target.value })} maxLength={300} placeholder="Ex.: Academia" className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-2 py-2 text-sm" /></label><label className="text-xs font-medium text-stone-600">Cor<select value={row.color} onChange={(event) => change(row.key, { color: event.target.value as AgendaColor })} className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-2 py-2 text-sm">{agendaColors.map((color) => <option key={color} value={color}>{colorNames[color]}</option>)}</select></label><button type="button" aria-label={"Remover intervalo " + (index + 1)} onClick={() => remove(row.key)} className="self-end rounded-lg px-2 py-2 text-rose-700 hover:bg-rose-50">×</button></div>{duration !== null ? <p className="mt-2 text-xs text-stone-500">{minutesToTime(startMinutes + (computed?.startOffset ?? 0))} – {row.endTime} · {formatDuration(duration)}</p> : null}</div>;
}
function AgendaPreview({ agenda, rows }: { agenda?: Agenda; rows: Computed[] }) {
  if (!agenda || !rows.length || rows.some((row) => row.endOffset === null)) return <section className="rounded-3xl border border-dashed border-stone-300 bg-white p-6 text-sm leading-6 text-stone-500"><h2 className="font-semibold text-stone-800">Visualização do dia</h2><p className="mt-2">Os blocos aparecerão aqui conforme você preenche os horários.</p></section>;
  return <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm"><div><p className="text-sm font-semibold tracking-wide text-sky-700 uppercase">Visualização</p><h2 className="mt-1 text-xl font-semibold">{agenda.title || "Sua agenda"}</h2></div><div className="mt-5 max-h-[70vh] overflow-y-auto pr-2"><div className="relative ml-12 border-l-2 border-stone-200 pt-3">{rows.map((row, index) => { const duration = (row.endOffset ?? row.startOffset) - row.startOffset; const height = Math.max(76, duration * 0.52); return <div key={row.key} className="relative border-b border-white/70" style={{ height: height + "px" }}><time className="absolute -left-12 -top-2 w-10 text-right text-xs text-stone-500">{minutesToTime(agenda.day_starts_at + row.startOffset)}</time><article className={"ml-3 h-full rounded-xl border p-3 pb-5 " + shades[row.color]}><p className="font-semibold leading-5">{row.title || "Sem atividade"}</p><p className="mt-1 text-xs opacity-80">{minutesToTime(agenda.day_starts_at + row.startOffset)} – {minutesToTime(agenda.day_starts_at + (row.endOffset ?? row.startOffset))} · {formatDuration(duration)}</p></article>{index === rows.length - 1 ? <time className="absolute -bottom-2 -left-12 w-10 text-right text-xs text-stone-500">{minutesToTime(agenda.day_starts_at + (row.endOffset ?? row.startOffset))}</time> : null}</div>; })}</div></div></section>;
}
