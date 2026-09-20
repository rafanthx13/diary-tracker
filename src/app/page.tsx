export default function Home() {
  return (
    <main className="min-h-screen bg-stone-50 px-6 py-12 text-stone-900 sm:px-10 lg:px-16">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-5xl flex-col justify-between">
        <header className="flex items-center justify-between">
          <span className="text-lg font-semibold tracking-tight">Meu Diário</span>
          <span className="rounded-full border border-stone-200 bg-white px-3 py-1 text-sm text-stone-600">
            Em construção
          </span>
        </header>

        <section className="my-16 max-w-3xl">
          <p className="mb-4 text-sm font-medium tracking-[0.2em] text-emerald-700 uppercase">
            Diary tracker
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
            Um lugar simples para registrar seus dias.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-600">
            Esta é a base da aplicação. Em seguida, vamos conectar o Supabase
            para salvar entradas, autenticar usuários e montar o seu diário.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            ["1", "Next.js", "Estrutura da aplicação pronta com App Router."],
            ["2", "TypeScript", "Código com tipos para evoluir com segurança."],
            ["3", "Tailwind CSS", "Estilos rápidos e responsivos já configurados."],
          ].map(([number, title, description]) => (
            <article key={number} className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <span className="text-sm font-semibold text-emerald-700">{number}</span>
              <h2 className="mt-4 text-xl font-semibold">{title}</h2>
              <p className="mt-2 leading-7 text-stone-600">{description}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
