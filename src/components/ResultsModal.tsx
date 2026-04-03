import type { FinalStats } from "../types";

export interface ResultsModalProps {
  open: boolean;
  stats: FinalStats | null;
  onRepeat: () => void;
  onNewCode: () => void;
}

function formatSeconds(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function ResultsModal({
  open,
  stats,
  onRepeat,
  onNewCode,
}: ResultsModalProps) {
  if (!open || !stats) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="results-title"
    >
      <div className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl">
        <h2
          id="results-title"
          className="text-lg font-semibold text-zinc-100"
        >
          Готово
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          Итоги этого упражнения.
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-zinc-950/80 px-3 py-2">
            <dt className="text-zinc-500">WPM</dt>
            <dd className="text-lg font-semibold text-zinc-100">
              {stats.wpm}
            </dd>
          </div>
          <div className="rounded-lg bg-zinc-950/80 px-3 py-2">
            <dt className="text-zinc-500">Точность</dt>
            <dd className="text-lg font-semibold text-zinc-100">
              {stats.accuracyPercent}%
            </dd>
          </div>
          <div className="rounded-lg bg-zinc-950/80 px-3 py-2">
            <dt className="text-zinc-500">Ошибки</dt>
            <dd className="text-lg font-semibold text-zinc-100">
              {stats.errorCount}
            </dd>
          </div>
          <div className="rounded-lg bg-zinc-950/80 px-3 py-2">
            <dt className="text-zinc-500">Время</dt>
            <dd className="text-lg font-semibold text-zinc-100">
              {formatSeconds(stats.elapsedMs)}
            </dd>
          </div>
        </dl>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="rounded-md border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800"
            onClick={onRepeat}
          >
            Повторить
          </button>
          <button
            type="button"
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
            onClick={onNewCode}
          >
            Новый код
          </button>
        </div>
      </div>
    </div>
  );
}
