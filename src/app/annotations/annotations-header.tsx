import Link from "next/link";

type Props = {
  active?: "home" | "protocols" | "notes";
  title: string;
  description?: string;
};

const tabs = [
  { href: "/annotations", label: "Visão geral", value: "home" },
  { href: "/annotations/protocols", label: "Protocolos", value: "protocols" },
  { href: "/annotations/notes", label: "Anotações", value: "notes" },
] as const;

export function AnnotationsHeader({ active, title, description }: Props) {
  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto max-w-6xl px-5 py-5 sm:px-8">
        <p className="text-sm font-semibold tracking-[0.16em] text-violet-700 uppercase">Módulo Anotações</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">{description}</p>}
        <nav aria-label="Submódulos de Anotações" className="mt-5 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <Link
              key={tab.value}
              href={tab.href}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                active === tab.value ? "bg-violet-700 text-white" : "bg-stone-100 text-stone-700 hover:bg-violet-50 hover:text-violet-800"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
