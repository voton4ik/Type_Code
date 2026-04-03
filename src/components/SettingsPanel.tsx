import type { CodeTopic, ProgrammingLanguage } from "../types";

const languages: { id: ProgrammingLanguage; label: string }[] = [
  { id: "javascript", label: "JavaScript" },
  { id: "typescript", label: "TypeScript" },
  { id: "python", label: "Python" },
  { id: "go", label: "Go" },
  { id: "rust", label: "Rust" },
  { id: "cpp", label: "C++" },
];

const topics: { id: CodeTopic; label: string }[] = [
  { id: "algorithms", label: "Алгоритмы" },
  { id: "functions", label: "Функции" },
  { id: "classes", label: "Классы" },
  { id: "api", label: "API-запросы" },
  { id: "utilities", label: "Утилиты" },
];

export interface SettingsPanelProps {
  language: ProgrammingLanguage;
  topic: CodeTopic;
  onLanguageChange: (v: ProgrammingLanguage) => void;
  onTopicChange: (v: CodeTopic) => void;
  onGenerate: () => void;
  loading: boolean;
  typingDisabled: boolean;
}

export function SettingsPanel({
  language,
  topic,
  onLanguageChange,
  onTopicChange,
  onGenerate,
  loading,
  typingDisabled,
}: SettingsPanelProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:flex-row sm:flex-wrap sm:items-end">
      <label className="flex min-w-[180px] flex-1 flex-col gap-1 text-sm text-zinc-300">
        Язык
        <select
          className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-emerald-600"
          value={language}
          onChange={(e) =>
            onLanguageChange(e.target.value as ProgrammingLanguage)
          }
          disabled={loading || typingDisabled}
        >
          {languages.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex min-w-[180px] flex-1 flex-col gap-1 text-sm text-zinc-300">
        Тема
        <select
          className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-emerald-600"
          value={topic}
          onChange={(e) => onTopicChange(e.target.value as CodeTopic)}
          disabled={loading || typingDisabled}
        >
          {topics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
        onClick={onGenerate}
        disabled={loading || typingDisabled}
      >
        {loading ? "Генерация…" : "Сгенерировать новый код"}
      </button>
    </div>
  );
}
