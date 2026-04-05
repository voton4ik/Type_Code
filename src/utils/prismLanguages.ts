import { Prism } from "prism-react-renderer";
import type { ProgrammingLanguage } from "../types";

const map: Record<ProgrammingLanguage, string> = {
  javascript: "javascript",
  typescript: "typescript",
  python: "python",
  go: "go",
  rust: "rust",
  cpp: "cpp",
};

export function getPrismLanguageId(lang: ProgrammingLanguage): string {
  const id = map[lang];
  if (Prism.languages[id]) {
    return id;
  }
  return Prism.languages.javascript ? "javascript" : "clike";
}
