import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

const components: Components = {
  p: ({ children }) => (
    <p className="text-fg mb-4 leading-relaxed last:mb-0">{children}</p>
  ),

  h1: ({ children }) => (
    <h1 className="text-2xl font-bold text-fg mb-4 mt-6 first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-xl font-semibold text-fg mb-3 mt-5 first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-lg font-semibold text-fg mb-2 mt-4 first:mt-0">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-base font-semibold text-fg mb-2 mt-3 first:mt-0">
      {children}
    </h4>
  ),

  ul: ({ children }) => (
    <ul className="list-disc pl-6 mb-4 space-y-1 text-fg">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-6 mb-4 space-y-1 text-fg">{children}</ol>
  ),
  li: ({ children }) => <li className="text-fg leading-relaxed">{children}</li>,

  // Fenced code blocks — use the same dark block style as lesson.code.example
  pre: ({ children }) => (
    <div className="bg-gray-900 rounded-lg p-4 mb-4 overflow-x-auto">
      <pre className="text-sm text-gray-100 font-mono whitespace-pre-wrap">
        {children}
      </pre>
    </div>
  ),
  // code inside pre = block; code on its own = inline
  code: ({ className: codeClass, children, ...props }) => {
    const isBlock = !!codeClass?.startsWith('language-');
    if (isBlock) {
      // Rendered inside the <pre> above; just pass through with no extra bg
      return (
        <code
          className={`${codeClass ?? ''} text-gray-100 font-mono bg-transparent`}
          {...props}
        >
          {children}
        </code>
      );
    }
    // Inline code
    return (
      <code
        className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 px-1.5 py-0.5 rounded text-sm font-mono"
        {...props}
      >
        {children}
      </code>
    );
  },

  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-border pl-4 italic text-muted mb-4">
      {children}
    </blockquote>
  ),

  a: ({ href, children, ...props }) => {
    const isExternal =
      href?.startsWith('https://') || href?.startsWith('http://');
    // Block unsafe schemes (javascript:, data:, vbscript:, etc.)
    const isSafe =
      !href ||
      isExternal ||
      href.startsWith('/') ||
      href.startsWith('#') ||
      href.startsWith('mailto:');
    const safeHref = isSafe ? href : '#';
    return (
      <a
        href={safeHref}
        className="text-primary underline hover:opacity-80 transition-opacity"
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        {...props}
      >
        {children}
      </a>
    );
  },

  hr: () => <hr className="border-border my-6" />,

  strong: ({ children }) => (
    <strong className="font-semibold text-fg">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,

  // GFM tables
  table: ({ children }) => (
    <div className="overflow-x-auto mb-4">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-surface-alt">{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr className="border-b border-border">{children}</tr>,
  th: ({ children }) => (
    <th className="border border-border px-3 py-2 text-left font-semibold text-fg text-sm">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-border px-3 py-2 text-fg text-sm">
      {children}
    </td>
  ),
};

/**
 * Renders a Markdown string as styled HTML.
 * Supports GitHub Flavored Markdown (tables, strikethrough, task lists).
 * Styling uses the design system tokens (text-fg, border-border, etc.)
 * so it works correctly in both light and dark mode.
 */
export default function MarkdownContent({
  content,
  className = '',
}: MarkdownContentProps) {
  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
