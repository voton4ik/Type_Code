import type { FinalStats } from "../types";

export interface ResultsSummaryProps {
  stats: FinalStats;
  onRepeat: () => void;
  onNewTest: () => void;
}

export function ResultsSummary({
  stats,
  onRepeat,
  onNewTest,
}: ResultsSummaryProps) {
  const seconds = Math.round(stats.elapsedMs / 100) / 10;

  return (
    <section
      className="rounded-xl border border-zinc-700 bg-zinc-900/80 p-5"
      aria-labelledby="results-heading"
    >
      <h2
        id="results-heading"
        className="text-lg font-semibold text-zinc-100"
      >
        Результат
      </h2>
      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-zinc-950/80 px-3 py-2">
          <dt className="text-xs text-zinc-500">Символов</dt>
          <dd className="text-xl font-semibold text-zinc-100">
            {stats.typedChars}
          </dd>
        </div>
        <div className="rounded-lg bg-zinc-950/80 px-3 py-2">
          <dt className="text-xs text-zinc-500">Слов</dt>
          <dd className="text-xl font-semibold text-zinc-100">
            {stats.typedWordCount}
          </dd>
        </div>
        <div className="rounded-lg bg-zinc-950/80 px-3 py-2">
          <dt className="text-xs text-zinc-500">WPM</dt>
          <dd className="text-xl font-semibold text-zinc-100">{stats.wpm}</dd>
        </div>
        <div className="rounded-lg bg-zinc-950/80 px-3 py-2">
          <dt className="text-xs text-zinc-500">Точность</dt>
          <dd className="text-xl font-semibold text-zinc-100">
            {stats.accuracyPercent}%
          </dd>
        </div>
        <div className="rounded-lg bg-zinc-950/80 px-3 py-2">
          <dt className="text-xs text-zinc-500">Ошибки</dt>
          <dd className="text-xl font-semibold text-zinc-100">
            {stats.errorCount}
          </dd>
        </div>
        <div className="rounded-lg bg-zinc-950/80 px-3 py-2">
          <dt className="text-xs text-zinc-500">Время</dt>
          <dd className="text-xl font-semibold text-zinc-100">
            {seconds} с
          </dd>
        </div>
      </dl>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          className="rounded-md border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800"
          onClick={onRepeat}
        >
          Пройти ещё раз
        </button>
        <button
          type="button"
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          onClick={onNewTest}
        >
          Новый тест
        </button>
      </div>
    </section>
  );
}
