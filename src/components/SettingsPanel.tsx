import type {
  CodeTopic,
  FontSize,
  ProgrammingLanguage,
  TimedMode,
} from "../types";

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

const FONT_SIZES: FontSize[] = [12, 14, 16, 18, 20];

const TIMED_OPTIONS: { value: TimedMode; label: string }[] = [
  { value: 15, label: "15 с" },
  { value: 30, label: "30 с" },
  { value: 60, label: "60 с" },
  { value: 120, label: "120 с" },
  { value: null, label: "Без лимита" },
];

export interface SettingsPanelProps {
  language: ProgrammingLanguage;
  topic: CodeTopic;
  timedMode: TimedMode;
  fontSize: FontSize;
  onLanguageChange: (v: ProgrammingLanguage) => void;
  onTopicChange: (v: CodeTopic) => void;
  onTimedModeChange: (v: TimedMode) => void;
  onFontSizeChange: (v: FontSize) => void;
  onGenerate: () => void;
  loading: boolean;
  typingDisabled: boolean;
}

export function SettingsPanel({
  language,
  topic,
  timedMode,
  fontSize,
  onLanguageChange,
  onTopicChange,
  onTimedModeChange,
  onFontSizeChange,
  onGenerate,
  loading,
  typingDisabled,
}: SettingsPanelProps) {
  const fontIdx = FONT_SIZES.indexOf(fontSize);

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
      <div className="flex min-w-[220px] flex-1 flex-col gap-2">
        <span className="text-sm text-zinc-300">Лимит времени</span>
        <div className="flex flex-wrap gap-1.5">
          {TIMED_OPTIONS.map((opt) => {
            const active = timedMode === opt.value;
            return (
              <button
                key={String(opt.value)}
                type="button"
                className={`rounded-md border px-2.5 py-1.5 text-xs font-medium transition sm:text-sm ${
                  active
                    ? "border-emerald-600 bg-emerald-950/50 text-emerald-100"
                    : "border-zinc-700 bg-zinc-950 text-zinc-300 hover:border-zinc-600"
                } disabled:cursor-not-allowed disabled:opacity-50`}
                onClick={() => onTimedModeChange(opt.value)}
                disabled={loading || typingDisabled}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex min-w-[160px] flex-col gap-2">
        <span className="text-sm text-zinc-300">Размер шрифта</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-md border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 text-sm font-medium text-zinc-100 hover:border-zinc-600 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => {
              if (fontIdx > 0) onFontSizeChange(FONT_SIZES[fontIdx - 1]!);
            }}
            disabled={fontIdx <= 0 || loading}
            aria-label="Уменьшить шрифт"
          >
            A−
          </button>
          <span className="min-w-[2.5rem] text-center text-sm tabular-nums text-zinc-200">
            {fontSize}px
          </span>
          <button
            type="button"
            className="rounded-md border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 text-sm font-medium text-zinc-100 hover:border-zinc-600 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => {
              if (fontIdx < FONT_SIZES.length - 1)
                onFontSizeChange(FONT_SIZES[fontIdx + 1]!);
            }}
            disabled={fontIdx >= FONT_SIZES.length - 1 || loading}
            aria-label="Увеличить шрифт"
          >
            A+
          </button>
        </div>
      </div>
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
