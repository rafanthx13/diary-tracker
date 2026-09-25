import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownContent({ content }: { content: string }) {
  if (!content.trim()) return <p className="text-stone-500 italic">Esta anotação ainda não possui conteúdo.</p>;

  return (
    <div className="min-w-0 text-stone-800">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="mb-4 mt-8 text-3xl font-bold tracking-tight first:mt-0">{children}</h1>,
          h2: ({ children }) => <h2 className="mb-3 mt-8 border-b border-stone-200 pb-2 text-2xl font-semibold first:mt-0">{children}</h2>,
          h3: ({ children }) => <h3 className="mb-2 mt-6 text-xl font-semibold first:mt-0">{children}</h3>,
          h4: ({ children }) => <h4 className="mb-2 mt-5 text-lg font-semibold first:mt-0">{children}</h4>,
          p: ({ children }) => <p className="my-4 leading-8 first:mt-0 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="my-4 list-disc space-y-2 pl-7">{children}</ul>,
          ol: ({ children }) => <ol className="my-4 list-decimal space-y-2 pl-7">{children}</ol>,
          li: ({ children }) => <li className="pl-1 leading-7">{children}</li>,
          blockquote: ({ children }) => <blockquote className="my-5 border-l-4 border-violet-400 bg-violet-50 px-5 py-1 text-stone-700">{children}</blockquote>,
          a: ({ children, href }) => <a href={href} className="font-medium text-violet-700 underline decoration-violet-300 underline-offset-4 hover:text-violet-900" target="_blank" rel="noreferrer noopener">{children}</a>,
          code: ({ children }) => <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[0.9em] text-violet-900">{children}</code>,
          pre: ({ children }) => <pre className="my-5 overflow-x-auto rounded-2xl bg-stone-950 p-5 text-sm leading-7 text-stone-100 [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-inherit">{children}</pre>,
          hr: () => <hr className="my-8 border-stone-200" />,
          table: ({ children }) => <div className="my-5 overflow-x-auto"><table className="w-full border-collapse text-left text-sm">{children}</table></div>,
          th: ({ children }) => <th className="border border-stone-300 bg-stone-100 px-3 py-2 font-semibold">{children}</th>,
          td: ({ children }) => <td className="border border-stone-300 px-3 py-2 align-top">{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
