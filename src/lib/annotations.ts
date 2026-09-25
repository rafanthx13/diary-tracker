export type ProtocolDemand = {
  id: string;
  content: string;
  sort_order: number;
};

export type Protocol = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export type MarkdownNote = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export function formatAnnotationDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}
