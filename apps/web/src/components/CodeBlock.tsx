import { codeToTokensBase, type BundledLanguage } from 'shiki';
import CopyButton from './CopyButton';

// Map module technology names → shiki language IDs
const TECH_TO_LANG: Record<string, string> = {
  'C#': 'csharp',
  'ASP.NET Core': 'csharp',
  'ASP.NET': 'csharp',
  '.NET': 'csharp',
  TypeScript: 'typescript',
  JavaScript: 'javascript',
  'Node.js': 'javascript',
  React: 'tsx',
  'Next.js': 'tsx',
  Vue: 'vue',
  PHP: 'php',
  Laravel: 'php',
  Python: 'python',
  GraphQL: 'graphql',
  SQL: 'sql',
  'Entity Framework': 'csharp',
  SASS: 'scss',
  SCSS: 'scss',
  CSS: 'css',
  HTML: 'html',
  Bash: 'bash',
  Shell: 'bash',
  JSON: 'json',
  YAML: 'yaml',
  Docker: 'dockerfile',
  Tailwind: 'css',
};

const LANGUAGE_LABELS: Record<string, string> = {
  csharp: 'C#',
  typescript: 'TypeScript',
  javascript: 'JavaScript',
  tsx: 'TSX / React',
  jsx: 'JSX',
  php: 'PHP',
  python: 'Python',
  graphql: 'GraphQL',
  sql: 'SQL',
  scss: 'SCSS',
  css: 'CSS',
  html: 'HTML',
  bash: 'Bash',
  json: 'JSON',
  yaml: 'YAML',
  dockerfile: 'Dockerfile',
  vue: 'Vue',
};

function detectLanguage(code: string, hint?: string): string {
  if (hint && TECH_TO_LANG[hint]) return TECH_TO_LANG[hint];
  if (code.includes('namespace ') && code.includes('class ')) return 'csharp';
  if (code.includes('<?php')) return 'php';
  if (code.includes('import React') || code.includes('JSX')) return 'tsx';
  if (code.includes('const ') || code.includes('=>')) return 'typescript';
  if (code.includes('def ') && code.includes(':')) return 'python';
  if (code.includes('SELECT ') || code.includes('CREATE TABLE')) return 'sql';
  if (code.includes('query ') && code.includes('{')) return 'graphql';
  return 'typescript';
}

interface CodeBlockProps {
  code: string;
  languageHint?: string;
  className?: string;
}

export default async function CodeBlock({
  code,
  languageHint,
  className = '',
}: CodeBlockProps) {
  const lang = detectLanguage(code, languageHint);
  const label = LANGUAGE_LABELS[lang] || lang;

  type TokenLine = { content: string; color?: string }[];
  let lines: TokenLine[] = [];

  try {
    const raw = await codeToTokensBase(code, {
      lang: lang as BundledLanguage,
      theme: 'github-dark',
    });
    lines = raw.map((line) =>
      line.map((t) => ({ content: t.content, color: t.color }))
    );
  } catch {
    lines = code.split('\n').map((l) => [{ content: l }]);
  }

  return (
    <div
      className={`relative group rounded-xl overflow-hidden border border-white/10 shadow-xl ${className}`}
    >
      {/* Header bar — macOS-style */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#161b22] border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <span className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>
          <span className="text-xs font-mono text-gray-400">{label}</span>
        </div>
        <CopyButton code={code} />
      </div>

      {/* Token-rendered code — no dangerouslySetInnerHTML */}
      <div className="overflow-x-auto bg-[#0d1117] p-5">
        <pre className="text-sm font-mono leading-relaxed m-0">
          {lines.map((line, li) => (
            <div key={li} className="table-row">
              <span className="table-cell pr-6 select-none text-right text-gray-600 text-xs w-8">
                {li + 1}
              </span>
              <span className="table-cell">
                {line.length === 0 ? (
                  <span>&nbsp;</span>
                ) : (
                  line.map((token, ti) => (
                    <span
                      key={ti}
                      style={token.color ? { color: token.color } : undefined}
                    >
                      {token.content}
                    </span>
                  ))
                )}
              </span>
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}
