import type { CSSProperties } from "react";
import type { PrismTheme } from "prism-react-renderer";
import { Prism } from "./prismLanguages";

function visitTokenized(
  node: unknown,
  types: string[],
  out: { ch: string; types: string[] }[],
): void {
  if (typeof node === "string") {
    for (const ch of node) {
      out.push({ ch, types });
    }
    return;
  }
  if (Array.isArray(node)) {
    for (const n of node) {
      visitTokenized(n, types, out);
    }
    return;
  }
  if (node && typeof node === "object" && "content" in node) {
    const o = node as { type?: string; content?: unknown };
    const nextTypes = [...types, o.type ?? "plain"];
    visitTokenized(o.content, nextTypes, out);
    return;
  }
}

function styleForTypes(
  theme: PrismTheme,
  types: string[],
): CSSProperties {
  for (let i = types.length - 1; i >= 0; i--) {
    const t = types[i];
    if (!t) continue;
    for (const entry of theme.styles) {
      if (entry.types.includes(t)) {
        return { ...entry.style } as CSSProperties;
      }
    }
  }
  return { ...theme.plain } as CSSProperties;
}

export function buildCharStyleMap(
  code: string,
  language: string,
  theme: PrismTheme,
): CSSProperties[] {
  const grammar = Prism.languages[language];
  if (!grammar) {
    return code.split("").map(() => ({}));
  }
  const nested = Prism.tokenize(code, grammar);
  const flat: { ch: string; types: string[] }[] = [];
  visitTokenized(nested, ["plain"], flat);
  if (flat.length !== code.length) {
    return code.split("").map(() => ({}));
  }
  return flat.map((cell) => styleForTypes(theme, cell.types));
}
