export type BaseInterviewQuestion = {
  id: number | string;
  topic?: string | null;
  type?: string | null;
  question: string;
  choices?: string[] | null;
  correctAnswer?: number | null;
  explanation?: string | null;
};

// Format inline code wrapped in backticks for consistent styling
export function formatQuestionText(text: string | undefined | null): string {
  if (!text) return "";
  return text.replace(
    /`([^`]+)`/g,
    '<code class="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-sm font-mono">$1</code>',
  );
}
