import type { FinalStats, TypingStatsSnapshot } from "../types";

export function countWords(s: string): number {
  const t = s.trim();
  if (!t) return 0;
  return t.split(/\s+/).filter(Boolean).length;
}

export function computeWpm(typedChars: number, elapsedMs: number): number {
  if (elapsedMs <= 0) return 0;
  const minutes = elapsedMs / 60_000;
  return (typedChars / 5) / minutes;
}

export function computeAccuracyPercent(
  correctKeypresses: number,
  totalKeypresses: number,
): number {
  if (totalKeypresses <= 0) return 100;
  return Math.round((correctKeypresses / totalKeypresses) * 1000) / 10;
}

export function buildFinalStats(
  snapshot: TypingStatsSnapshot,
  codeLength: number,
): FinalStats {
  return {
    ...snapshot,
    codeLength,
    wpm:
      Math.round(
        computeWpm(snapshot.correctKeypresses, snapshot.elapsedMs) * 10,
      ) / 10,
    accuracyPercent: computeAccuracyPercent(
      snapshot.correctKeypresses,
      snapshot.totalKeypresses,
    ),
  };
}
