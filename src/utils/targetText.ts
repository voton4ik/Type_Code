export function normalizeTargetText(raw: string): string {
  const lfNormalized = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  return lfNormalized.replace(/[ \t\n]+$/g, "");
}
