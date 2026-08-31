import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

// Sin plugin de "hard breaks": los saltos de línea simples de un párrafo
// (soft breaks) llegan intactos como \n dentro del texto — whitespace-pre-line
// alcanza para que se vean como salto visual, sin sumar una dependencia más.
const COMPONENTS: Components = {
  h1: (props) => <h3 className="text-lg font-semibold" {...props} />,
  h2: (props) => <h3 className="text-base font-semibold" {...props} />,
  h3: (props) => <h4 className="text-sm font-semibold" {...props} />,
  p: (props) => <p className="whitespace-pre-line" {...props} />,
  ul: (props) => <ul className="list-disc space-y-1 pl-5" {...props} />,
  ol: (props) => <ol className="list-decimal space-y-1 pl-5" {...props} />,
  li: (props) => <li className="whitespace-pre-line" {...props} />,
  a: (props) => (
    <a className="text-primary-600 underline hover:text-primary-700" {...props} />
  ),
  code: (props) => (
    <code className="rounded bg-surface px-1 py-0.5 text-[0.85em]" {...props} />
  ),
  table: (props) => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm" {...props} />
    </div>
  ),
  th: (props) => (
    <th className="border border-border px-2 py-1 text-left font-medium" {...props} />
  ),
  td: (props) => <td className="border border-border px-2 py-1" {...props} />,
};

export function MarkdownText({
  texto,
  className,
}: {
  texto: string;
  className?: string;
}) {
  return (
    <div className={className ?? "mt-1 space-y-2 text-base"}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={COMPONENTS}>
        {texto}
      </ReactMarkdown>
    </div>
  );
}
