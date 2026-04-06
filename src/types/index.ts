export type ProgrammingLanguage =
  | "javascript"
  | "typescript"
  | "python"
  | "go"
  | "rust"
  | "cpp";

export type CodeTopic =
  | "algorithms"
  | "functions"
  | "classes"
  | "api"
  | "utilities";

export type TypingPhase = "idle" | "running" | "finished" | "stopped";

/** Секунды лимита; `null` — классический режим до конца текста. */
export type TimedMode = 15 | 30 | 60 | 120 | null;

export type FontSize = 12 | 14 | 16 | 18 | 20;

export interface TypingStatsSnapshot {
  elapsedMs: number;
  /** Фактически набрано символов (длина ввода). */
  typedChars: number;
  typedWordCount: number;
  errorCount: number;
  correctKeypresses: number;
  totalKeypresses: number;
  manualKeystrokes: number;
}

export interface FinalStats extends TypingStatsSnapshot {
  wpm: number;
  accuracyPercent: number;
  /** Длина целевого фрагмента (для контекста, например тайм-режим). */
  codeLength: number;
}
