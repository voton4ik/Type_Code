import type { TimedMode } from "../types";

export interface StatsPanelProps {
  elapsedMs: number;
  timeLeft: number | null;
  timedMode: TimedMode;
  isStarted: boolean;
  isFinished: boolean;
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
  isStarted,
  isFinished,
}: StatsPanelProps) {
  if (!isStarted || isFinished) return null;
  const showCountdown = timedMode !== null && timeLeft !== null;

  const timeDisplay = showCountdown
    ? formatSeconds((timeLeft as number) * 1000)
    : formatSeconds(elapsedMs);

  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm font-medium text-zinc-100">
      ⏱ {timeDisplay}
    </div>
  );
}
