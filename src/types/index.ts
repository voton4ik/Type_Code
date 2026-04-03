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

export interface TypingStatsSnapshot {
  elapsedMs: number;
  typedChars: number;
  errorCount: number;
  correctKeypresses: number;
  totalKeypresses: number;
}

export interface FinalStats extends TypingStatsSnapshot {
  wpm: number;
  accuracyPercent: number;
  codeLength: number;
}
