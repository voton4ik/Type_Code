import Prism from "prismjs";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-python";
import "prismjs/components/prism-go";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-cpp";

export { Prism };

export function getPrismLanguageId(
  lang: import("../types").ProgrammingLanguage,
): string {
  const map: Record<import("../types").ProgrammingLanguage, string> = {
    javascript: "javascript",
    typescript: "typescript",
    python: "python",
    go: "go",
    rust: "rust",
    cpp: "cpp",
  };
  return map[lang];
}
