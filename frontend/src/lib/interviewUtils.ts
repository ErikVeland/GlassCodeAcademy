// Shared interview/quiz utilities for consistent behavior across modules
// Types are intentionally generic to match backend contract

export type BaseInterviewQuestion = {
  id: number | string;
  topic: string;
  type?: string;
  question: string;
  choices?: string[];
  correctAnswer?: number; // original index referencing choices
  explanation?: string;
  choiceOrder?: number[]; // display order indices
};

// Normalize question type to expected values
export function normalizeType(type?: string): 'multiple-choice' | 'open-ended' {
  const t = (type || '').toLowerCase().trim().replace(/[_\s]+/g, '-');
  if (t === 'multiple-choice') return 'multiple-choice';
  // If choices and correct answer exist, treat as multiple-choice even if type is missing/mislabelled
  return 'open-ended';
}

// Shuffle helper
export function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Track display order of choices without mutating original indices
export function shuffleQuestionChoices<T extends BaseInterviewQuestion>(question: T): T {
  if (!question.choices || question.choices.length <= 1) return question;
  const indices = question.choices.map((_, idx) => idx);
  const shuffledIndices = shuffle(indices);
  return { ...question, choiceOrder: shuffledIndices };
}

// Sanitize question: trim text, validate choices/correctAnswer, normalize type
export function sanitizeQuestion<T extends BaseInterviewQuestion>(q: T): T | null {
  const trimmedQuestion = (q.question || '').trim();
  if (!trimmedQuestion) return null;

  const type = normalizeType(q.type);
  if (type === 'multiple-choice') {
    const choices = Array.isArray(q.choices)
      ? q.choices.map(c => (c || '').trim()).filter(c => c.length > 0)
      : [];
    const correct = typeof q.correctAnswer === 'number' ? q.correctAnswer : -1;
    if (choices.length < 2) return null;
    if (correct < 0 || correct >= choices.length) return null;
    const base: T = { ...q, type, question: trimmedQuestion, choices, correctAnswer: correct };
    return shuffleQuestionChoices(base);
  }
  // open-ended
  return { ...q, type, question: trimmedQuestion } as T;
}

// Map a selected display index back to original index using choiceOrder
export function mapDisplayToOriginalIndex(question: BaseInterviewQuestion, selectedDisplayIndex: number): number {
  if (question.choiceOrder && question.correctAnswer !== undefined) {
    return question.choiceOrder[selectedDisplayIndex];
  }
  return selectedDisplayIndex;
}

// Format code keywords to inline code tags (basic)
export function formatQuestionText(text: string) {
  return text.replace(
    /\b(JavaScript|TypeScript|React|GraphQL|Node|Next\.js|CSS|HTML|Git|API|HTTP|SSR|SSG|SQL|NoSQL|fetch|async|await|function|const|let|var|return|if|else|for|while|true|false|null)\b/g,
    '<code class="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-sm font-mono">$1</code>'
  );
}

// Persist quiz state
export function persistQuizState(storageKey: string, state: unknown) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {}
}

// Load quiz state safely
export function loadQuizState<T = any>(storageKey: string): T | null {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}