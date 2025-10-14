// Utility to wrap code-like segments with backticks for consistent inline code rendering
// Applies to questions, choices, and explanations across modules

// Heuristics:
// - Preserve existing backticks
// - Wrap obvious code snippets (contains semicolons, braces, parentheses with operators, keywords)
// - Avoid wrapping normal prose

const CODE_KEYWORDS = [
  'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'switch', 'case',
  'class', 'new', 'try', 'catch', 'finally', 'import', 'export', 'await', 'async'
];

function looksLikeCodeToken(token: string): boolean {
  const t = token.trim();
  if (!t) return false;
  // Already backticked
  if ((t.startsWith('`') && t.endsWith('`')) || (t.match(/^`.*`$/))) return false;
  // Contains typical code punctuation patterns
  const hasCodePunct = /[;{}()=<>+\-/*\[\]]/.test(t);
  const hasArrow = /=>/.test(t);
  const hasDots = /\./.test(t);
  const hasQuotes = /['"]/g.test(t);
  const hasKeywords = CODE_KEYWORDS.some(k => new RegExp(`\\b${k}\\b`).test(t));
  // Consider code if combination suggests code
  const score = [hasCodePunct, hasArrow, hasDots, hasQuotes, hasKeywords].filter(Boolean).length;
  return score >= 2;
}

export function wrapInlineCode(text: string): string {
  if (!text || typeof text !== 'string') return text;
  // Process segments while preserving any existing backticked parts
  const segments = String(text).split(/(`[^`]+`)/g);
  let anyCodeWrapped = false;
  const processed = segments.map(seg => {
    // Preserve existing backticked segments
    if (/^`[^`]+`$/.test(seg)) {
      return seg;
    }
    // If the whole segment looks like code, wrap it
    if (looksLikeCodeToken(seg)) {
      anyCodeWrapped = true;
      return `\`${seg.trim()}\``;
    }
    // Otherwise, tokenize by spaces and wrap code-like tokens within the segment
    const tokens = seg.split(/(\s+)/);
    const normalized = tokens.map(tok => (looksLikeCodeToken(tok) ? `\`${tok.trim()}\`` : tok)).join('');
    if (normalized !== seg) anyCodeWrapped = true;
    return normalized;
  }).join('');
  // If nothing was wrapped but overall text looks like code, wrap entire text
  if (!anyCodeWrapped && looksLikeCodeToken(text)) {
    return `\`${text}\``;
  }
  return processed;
}

interface ProgrammingQuestion {
  id?: number;
  topic?: string;
  type?: string;
  question: string;
  choices?: string[];
  correctAnswer?: number;
  acceptedAnswers?: string[];
  explanation?: string;
}

export function normalizeQuestion(input: unknown): ProgrammingQuestion {
  const raw = (input ?? {}) as Record<string, unknown>;
  const questionText =
    typeof raw.question === 'string' ? raw.question.trim() : '';
  const question =
    questionText.length > 0 ? questionText : 'Untitled question';

  const choices =
    Array.isArray(raw.choices)
      ? (raw.choices as unknown[])
          .map((c) => (typeof c === 'string' ? c.trim() : String(c)))
          .filter((c) => (c ?? '').length > 0)
      : undefined;

  const correctAnswer =
    typeof (raw as { correctAnswer?: number }).correctAnswer === 'number'
      ? (raw as { correctAnswer: number }).correctAnswer
      : typeof (raw as { correctIndex?: number }).correctIndex === 'number'
      ? (raw as { correctIndex: number }).correctIndex
      : undefined;

  const acceptedAnswers =
    Array.isArray((raw as { acceptedAnswers?: unknown[] }).acceptedAnswers)
      ? ((raw as { acceptedAnswers: unknown[] }).acceptedAnswers || [])
          .map((a) => (typeof a === 'string' ? a.trim() : String(a)))
          .filter((a) => (a ?? '').length > 0)
      : undefined;

  return {
    ...(raw as object),
    question,
    choices,
    correctAnswer,
    acceptedAnswers,
    type: typeof raw.type === 'string' ? (raw.type as string) : undefined,
  };
}