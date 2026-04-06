import { useMemo } from "react";
import type { TimedMode } from "../types";
import { computeAccuracyPercent, computeWpm } from "../utils/statsCalculator";

export interface StatsPanelProps {
  elapsedMs: number;
  timeLeft: number | null;
  timedMode: TimedMode;
  errorCount: number;
  correctKeypresses: number;
  totalKeypresses: number;
  manualKeystrokes: number;
  isStarted: boolean;
  isTyping: boolean;
}

function formatSeconds(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function StatsPanel({
  elapsedMs,
  timeLeft,
  timedMode,
  errorCount,
  correctKeypresses,
  totalKeypresses,
  manualKeystrokes,
  isStarted,
  isTyping,
}: StatsPanelProps) {
  const liveWpm = useMemo(() => {
    if (!isStarted || elapsedMs <= 0) return 0;
    const basis = manualKeystrokes;
    return Math.round(computeWpm(basis, elapsedMs) * 10) / 10;
  }, [isStarted, elapsedMs, manualKeystrokes]);

  const accuracy = useMemo(() => {
    if (!isStarted || totalKeypresses <= 0) return 100;
    return computeAccuracyPercent(correctKeypresses, totalKeypresses);
  }, [isStarted, totalKeypresses, correctKeypresses]);

  const showCountdown =
    timedMode !== null && isStarted && isTyping && timeLeft !== null;

  const timeDisplay = showCountdown
    ? formatSeconds((timeLeft as number) * 1000)
    : formatSeconds(elapsedMs);

  const metricsHidden = isTyping ? "invisible" : "";

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div
        className={`rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 ${metricsHidden}`}
      >
        <div className="text-xs uppercase tracking-wide text-zinc-500">
          WPM
        </div>
        <div className="text-xl font-semibold text-zinc-100">{liveWpm}</div>
      </div>
      <div
        className={`rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 ${metricsHidden}`}
      >
        <div className="text-xs uppercase tracking-wide text-zinc-500">
          Точность
        </div>
        <div className="text-xl font-semibold text-zinc-100">
          {accuracy}%
        </div>
      </div>
      <div
        className={`rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 ${metricsHidden}`}
      >
        <div className="text-xs uppercase tracking-wide text-zinc-500">
          Ошибки
        </div>
        <div className="text-xl font-semibold text-zinc-100">{errorCount}</div>
      </div>
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2">
        <div className="text-xs uppercase tracking-wide text-zinc-500">
          {showCountdown ? "Осталось" : "Время"}
        </div>
        <div className="text-xl font-semibold text-zinc-100">{timeDisplay}</div>
      </div>
    </div>
  );
}
