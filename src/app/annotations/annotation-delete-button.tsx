"use client";

import { deleteNote, deleteProtocol } from "@/app/annotations/actions";
import { useFormStatus } from "react-dom";

type Props = {
  type: "note" | "protocol";
  id: string;
  title: string;
};

function DeleteSubmitButton({ type }: Pick<Props, "type">) {
  const { pending } = useFormStatus();
  const label = type === "note" ? "anotação" : "protocolo";

  return (
    <button
      disabled={pending}
      className="rounded-xl border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-700 transition hover:border-red-400 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Excluindo..." : `Excluir ${label}`}
    </button>
  );
}

export function AnnotationDeleteButton({ type, id, title }: Props) {
  const action = type === "note" ? deleteNote : deleteProtocol;
  const fieldName = type === "note" ? "noteId" : "protocolId";
  const label = type === "note" ? "a anotação" : "o protocolo";

  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(`Excluir ${label} “${title}”? Esta ação não pode ser desfeita.`)) event.preventDefault();
      }}
    >
      <input type="hidden" name={fieldName} value={id} />
      <DeleteSubmitButton type={type} />
    </form>
  );
}
