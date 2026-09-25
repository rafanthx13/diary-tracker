"use client";

import { createProtocol, updateProtocol } from "@/app/annotations/actions";
import type { ProtocolDemand } from "@/lib/annotations";
import Link from "next/link";
import { useState, type DragEvent, type KeyboardEvent } from "react";

type EditableDemand = { clientId: string; content: string };

type Props = {
  mode: "create" | "edit";
  protocolId?: string;
  initialTitle?: string;
  initialDemands?: ProtocolDemand[];
};

export function ProtocolForm({ mode, protocolId, initialTitle = "", initialDemands = [] }: Props) {
  const [demands, setDemands] = useState<EditableDemand[]>(() =>
    initialDemands.map((demand, index) => ({ clientId: demand.id || `initial-${index}`, content: demand.content })),
  );
  const [isAdding, setIsAdding] = useState(false);
  const [newDemand, setNewDemand] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  function addDemand() {
    const content = newDemand.trim();
    if (!content) return;
    setDemands((current) => [...current, { clientId: crypto.randomUUID(), content }]);
    setNewDemand("");
    setIsAdding(false);
  }

  function handleNewDemandKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      addDemand();
    }
  }

  function moveDemand(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex || toIndex < 0 || toIndex >= demands.length) return;
    setDemands((current) => {
      const reordered = [...current];
      const [moved] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, moved);
      return reordered;
    });
  }

  function dropDemand(event: DragEvent<HTMLElement>, targetIndex: number) {
    event.preventDefault();
    if (draggedIndex !== null) moveDemand(draggedIndex, targetIndex);
    setDraggedIndex(null);
  }

  const formAction = mode === "create" ? createProtocol : updateProtocol;
  const cancelHref = mode === "edit" && protocolId ? `/annotations/protocols/${protocolId}` : "/annotations/protocols";

  return (
    <form action={formAction} className="space-y-7">
      {protocolId && <input type="hidden" name="protocolId" value={protocolId} />}
      <input type="hidden" name="demands" value={JSON.stringify(demands.map((demand) => demand.content))} />

      <label className="block text-sm font-semibold text-stone-800">
        Título <span className="text-red-600">*</span>
        <input
          name="title"
          required
          maxLength={160}
          defaultValue={initialTitle}
          autoFocus
          placeholder="Ex.: Protocolo de atendimento ao cliente"
          className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-base outline-none transition focus:border-violet-600 focus:ring-2 focus:ring-violet-100"
        />
      </label>

      <section aria-labelledby="demands-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="demands-heading" className="text-lg font-semibold">Demandas</h2>
            <p className="mt-1 text-sm text-stone-600">Arraste os itens ou altere o número para reorganizá-los.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-800"
          >
            + Adicionar demanda
          </button>
        </div>

        {isAdding && (
          <div className="mt-4 rounded-2xl border border-violet-200 bg-violet-50 p-4">
            <label className="block text-sm font-semibold text-violet-950">
              Nova demanda
              <textarea
                value={newDemand}
                onChange={(event) => setNewDemand(event.target.value)}
                onKeyDown={handleNewDemandKeyDown}
                maxLength={1000}
                rows={3}
                autoFocus
                placeholder="Descreva a demanda e pressione Enter para adicionar"
                className="mt-2 w-full resize-y rounded-xl border border-violet-200 bg-white px-3 py-3 text-stone-900 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-100"
              />
            </label>
            <div className="mt-3 flex justify-end gap-2">
              <button type="button" onClick={() => { setIsAdding(false); setNewDemand(""); }} className="rounded-xl px-4 py-2 text-sm font-medium text-stone-700 hover:bg-white">Cancelar</button>
              <button type="button" onClick={addDemand} disabled={!newDemand.trim()} className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-40">Confirmar</button>
            </div>
          </div>
        )}

        {demands.length ? (
          <ol className="mt-4 space-y-3">
            {demands.map((demand, index) => (
              <li
                key={demand.clientId}
                draggable
                onDragStart={() => setDraggedIndex(index)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => dropDemand(event, index)}
                onDragEnd={() => setDraggedIndex(null)}
                className={`grid gap-3 rounded-2xl border bg-white p-4 shadow-sm transition sm:grid-cols-[auto_5rem_1fr_auto] sm:items-center ${draggedIndex === index ? "border-violet-500 opacity-60" : "border-stone-200"}`}
              >
                <span aria-hidden="true" title="Arraste para reordenar" className="hidden cursor-grab select-none text-xl text-stone-400 sm:block">⠿</span>
                <label className="text-xs font-semibold tracking-wide text-stone-500 uppercase">
                  Ordem
                  <input
                    type="number"
                    min={1}
                    max={demands.length}
                    value={index + 1}
                    onChange={(event) => moveDemand(index, Number(event.target.value) - 1)}
                    aria-label={`Ordem da demanda ${index + 1}`}
                    className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 text-center text-base font-semibold text-violet-800 outline-none focus:border-violet-600"
                  />
                </label>
                <label className="text-xs font-semibold tracking-wide text-stone-500 uppercase">
                  Demanda
                  <textarea
                    value={demand.content}
                    onChange={(event) => setDemands((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, content: event.target.value } : item))}
                    required
                    maxLength={1000}
                    rows={2}
                    aria-label={`Texto da demanda ${index + 1}`}
                    className="mt-1 w-full resize-y rounded-xl border border-stone-300 px-3 py-2 text-sm leading-6 text-stone-800 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-100"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setDemands((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                  className="rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 transition hover:border-red-400 hover:bg-red-50"
                  aria-label={`Remover demanda ${index + 1}`}
                >
                  Remover
                </button>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-4 rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-5 py-8 text-center text-sm text-stone-500">Nenhuma demanda adicionada.</p>
        )}
      </section>

      <div className="flex flex-wrap justify-end gap-3 border-t border-stone-200 pt-6">
        <Link href={cancelHref} className="rounded-xl px-5 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-100">Cancelar</Link>
        <button className="rounded-xl bg-violet-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-800">
          {mode === "create" ? "Criar protocolo" : "Salvar alterações"}
        </button>
      </div>
    </form>
  );
}
