import Link from "next/link";

export function HealthHeader({ title, description, backHref = "/health-data", backLabel = "Dados de Saúde", actions }: { title: string; description?: string; backHref?: string; backLabel?: string; actions?: React.ReactNode }) {
  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-8">
        <div>
          <Link href={backHref} className="text-sm font-semibold text-rose-700 hover:text-rose-900">← {backLabel}</Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="mt-1 max-w-2xl text-sm leading-6 text-stone-600">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  );
}
