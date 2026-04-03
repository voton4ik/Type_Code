import { useMemo } from "react";
import { computeAccuracyPercent, computeWpm } from "../utils/statsCalculator";

export interface StatsPanelProps {
  targetLength: number;
  userInputLength: number;
  elapsedMs: number;
  errorCount: number;
  correctKeypresses: number;
  totalKeypresses: number;
  isStarted: boolean;
  isComplete: boolean;
}

function formatSeconds(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function StatsPanel({
  targetLength,
  userInputLength,
  elapsedMs,
  errorCount,
  correctKeypresses,
  totalKeypresses,
  isStarted,
  isComplete,
}: StatsPanelProps) {
  const liveWpm = useMemo(() => {
    if (!isStarted || elapsedMs <= 0) return 0;
    const basis = isComplete ? targetLength : userInputLength;
    return Math.round(computeWpm(basis, elapsedMs) * 10) / 10;
  }, [
    isStarted,
    elapsedMs,
    isComplete,
    targetLength,
    userInputLength,
  ]);

  const accuracy = useMemo(() => {
    if (!isStarted || totalKeypresses <= 0) return 100;
    return computeAccuracyPercent(correctKeypresses, totalKeypresses);
  }, [isStarted, totalKeypresses, correctKeypresses]);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2">
        <div className="text-xs uppercase tracking-wide text-zinc-500">
          WPM
        </div>
        <div className="text-xl font-semibold text-zinc-100">{liveWpm}</div>
      </div>
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2">
        <div className="text-xs uppercase tracking-wide text-zinc-500">
          Точность
        </div>
        <div className="text-xl font-semibold text-zinc-100">
          {accuracy}%
        </div>
      </div>
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2">
        <div className="text-xs uppercase tracking-wide text-zinc-500">
          Ошибки
        </div>
        <div className="text-xl font-semibold text-zinc-100">{errorCount}</div>
      </div>
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2">
        <div className="text-xs uppercase tracking-wide text-zinc-500">
          Время
        </div>
        <div className="text-xl font-semibold text-zinc-100">
          {formatSeconds(elapsedMs)}
        </div>
      </div>
    </div>
  );
}
