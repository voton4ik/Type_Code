import { useCallback, useState } from "react";
import type { CodeTopic, ProgrammingLanguage } from "../types";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "meta-llama/llama-4-scout:free";

const topicPrompt: Record<CodeTopic, string> = {
  algorithms: "algorithms and data structures (sorting, search, simple DS)",
  functions: "small pure functions and helpers",
  classes: "classes or structs with methods",
  api: "HTTP client or API request handling",
  utilities: "CLI-style utilities and file/string processing",
};

function buildUserMessage(lang: ProgrammingLanguage, topic: CodeTopic): string {
  const topicLine = topicPrompt[topic];
  return [
    `Language: ${lang}. Topic: ${topicLine}.`,
    "Return ONLY raw source code, 5 to 15 lines.",
    "No markdown fences, no backticks, no explanations, no comments outside the code if the language usually uses them sparingly.",
    "Use typical idioms for the language. Include newlines between statements.",
  ].join(" ");
}

export interface GenerateResult {
  ok: true;
  code: string;
}

export interface GenerateError {
  ok: false;
  message: string;
}

export type GenerateOutcome = GenerateResult | GenerateError;

export function useOpenRouter() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const generateCode = useCallback(
    async (
      language: ProgrammingLanguage,
      topic: CodeTopic,
    ): Promise<GenerateOutcome> => {
      // INSERT YOUR OPENROUTER API KEY HERE
      const key = import.meta.env.VITE_OPENROUTER_API_KEY;
      if (!key || key.trim() === "") {
        const msg =
          "Ключ API не задан. Скопируйте .env.example в .env и укажите VITE_OPENROUTER_API_KEY.";
        setError(msg);
        return { ok: false, message: msg };
      }

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(OPENROUTER_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
            "HTTP-Referer": window.location.origin,
            "X-Title": "Code Typing Trainer",
          },
          body: JSON.stringify({
            model: MODEL,
            messages: [
              {
                role: "system",
                content:
                  "You output only raw code. Never wrap in markdown. Never add prose. 5-15 lines.",
              },
              {
                role: "user",
                content: buildUserMessage(language, topic),
              },
            ],
            temperature: 0.6,
            max_tokens: 1024,
          }),
        });

        const raw: unknown = await res.json().catch(() => null);

        if (!res.ok) {
          const msg = extractApiErrorMessage(raw, res.status);
          setError(msg);
          return { ok: false, message: msg };
        }

        const text = extractAssistantText(raw);
        const code = sanitizeModelCode(text);

        if (!code.trim()) {
          const msg = "Модель вернула пустой ответ. Попробуйте сгенерировать снова.";
          setError(msg);
          return { ok: false, message: msg };
        }

        return { ok: true, code };
      } catch {
        const msg =
          "Сеть недоступна или запрос прерван. Проверьте соединение и попробуйте снова.";
        setError(msg);
        return { ok: false, message: msg };
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { generateCode, loading, error, clearError };
}

function extractApiErrorMessage(raw: unknown, status: number): string {
  if (raw && typeof raw === "object" && "error" in raw) {
    const err = (raw as { error?: { message?: string } }).error;
    const m = err?.message;
    if (typeof m === "string" && m.trim()) {
      if (status === 401 || status === 403) {
        return "Ключ API отклонён. Проверьте VITE_OPENROUTER_API_KEY в .env.";
      }
      return m;
    }
  }
  if (status === 401 || status === 403) {
    return "Ключ API отклонён. Проверьте VITE_OPENROUTER_API_KEY в .env.";
  }
  return `Запрос к OpenRouter завершился с кодом ${String(status)}.`;
}

function extractAssistantText(raw: unknown): string {
  if (!raw || typeof raw !== "object") return "";
  const choices = (raw as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) return "";
  const first = choices[0];
  if (!first || typeof first !== "object") return "";
  const msg = (first as { message?: { content?: unknown } }).message;
  const content = msg?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (!part || typeof part !== "object") return "";
        const t = (part as { text?: unknown; type?: unknown }).text;
        if (typeof t === "string") return t;
        return "";
      })
      .join("");
  }
  return "";
}

function sanitizeModelCode(text: string): string {
  let s = text.trim();
  if (s.startsWith("```")) {
    const firstNl = s.indexOf("\n");
    s = firstNl === -1 ? "" : s.slice(firstNl + 1);
    const fence = s.lastIndexOf("```");
    if (fence !== -1) s = s.slice(0, fence);
  }
  return s.replace(/\r\n/g, "\n").trim();
}
