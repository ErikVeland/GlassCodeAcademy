export const ui = {
  buttons: {
    base: "inline-flex items-center rounded-lg transition-colors shadow-sm hover:shadow-md focus:outline-none focus:ring-2",
    lessons:
      "bg-blue-600/85 hover:bg-blue-500/85 text-white focus:ring-blue-300/50 dark:focus:ring-blue-400/40",
    quiz: "bg-emerald-600/85 hover:bg-emerald-500/85 text-white focus:ring-emerald-300/50 dark:focus:ring-emerald-400/40",
  },
};

export function classes(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}
