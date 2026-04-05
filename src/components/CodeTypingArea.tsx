import {
  Highlight,
  themes,
  type Token,
  type TokenOutputProps,
} from "prism-react-renderer";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef } from "react";
import { getPrismLanguageId } from "../utils/prismLanguages";
import type { ProgrammingLanguage } from "../types";

export interface CodeTypingAreaProps {
  targetText: string;
  userInput: string;
  language: ProgrammingLanguage;
  onChange: (value: string) => void;
  onKeyActivity: () => void;
  disabled: boolean;
  loading: boolean;
}

function renderStyledChar(
  ch: string,
  index: number,
  userInput: string,
  disabled: boolean,
  tp: TokenOutputProps,
): JSX.Element {
  const typed = userInput[index];
  const done = index < userInput.length;
  const correct = done && typed === ch;
  const wrong = done && typed !== ch;
  const cursorHere = index === userInput.length && !disabled;
  let stateClass = "rounded-sm px-[1px] transition-colors";
  if (!done) {
    stateClass += " text-zinc-500";
  } else if (correct) {
    stateClass += " bg-emerald-950/80 text-emerald-200";
  } else if (wrong) {
    stateClass += " bg-red-950/80 text-red-200";
  }
  const mergedStyle: CSSProperties = { ...tp.style };
  if (ch === "\n") {
    return (
      <span key={index}>
        <span
          className={
            `${tp.className} ${stateClass}`.trim() +
            (cursorHere ? " code-cursor align-middle" : "")
          }
          style={mergedStyle}
        >
          {"\u00a0"}
        </span>
        {"\n"}
      </span>
    );
  }
  return (
    <span
      key={index}
      className={
        `${tp.className} ${stateClass}`.trim() +
        (cursorHere ? " code-cursor" : "")
      }
      style={mergedStyle}
    >
      {ch === " " ? "\u00a0" : ch}
    </span>
  );
}

export function CodeTypingArea({
  targetText,
  userInput,
  language,
  onChange,
  onKeyActivity,
  disabled,
  loading,
}: CodeTypingAreaProps) {
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const highlightLang = getPrismLanguageId(language);
  const theme = themes.vsDark;
  const plainToken: Token = { types: ["plain"], content: " " };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      onKeyActivity();
      if (e.key === "Tab") {
        e.preventDefault();
        if (disabled || loading) return;
        const el = e.currentTarget;
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const next =
          userInput.slice(0, start) + "\t" + userInput.slice(end);
        onChange(next);
        queueMicrotask(() => {
          el.selectionStart = el.selectionEnd = start + 1;
        });
      }
    },
    [disabled, loading, onChange, onKeyActivity, userInput],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onKeyActivity();
      onChange(e.target.value);
    },
    [onChange, onKeyActivity],
  );

  useEffect(() => {
    if (!disabled && !loading && targetText.length > 0) {
      taRef.current?.focus();
    }
  }, [disabled, loading, targetText]);

  return (
    <div className="relative min-h-[220px] w-full rounded-lg border border-zinc-700 bg-zinc-950">
      {loading ? (
        <div className="space-y-3 p-4" aria-busy="true" aria-label="Загрузка">
          <div className="h-4 w-[92%] animate-pulse rounded bg-zinc-800" />
          <div className="h-4 w-full animate-pulse rounded bg-zinc-800" />
          <div className="h-4 w-[84%] animate-pulse rounded bg-zinc-800" />
          <div className="h-4 w-[76%] animate-pulse rounded bg-zinc-800" />
          <div className="h-4 w-full animate-pulse rounded bg-zinc-800" />
        </div>
      ) : targetText.length === 0 ? (
        <div className="p-4 text-sm text-zinc-500">
          Выберите язык и тему, затем нажмите «Сгенерировать новый код».
        </div>
      ) : (
        <>
          <Highlight
            theme={theme}
            code={targetText}
            language={highlightLang}
          >
            {({ tokens, className, style, getLineProps, getTokenProps }) => {
              const n = targetText.length;
              let idx = 0;
              const plainProps = getTokenProps({ token: plainToken });
              const lineBlocks = tokens.map((line, lineIdx) => {
                const parts: JSX.Element[] = [];
                for (const token of line) {
                  const tp = getTokenProps({ token });
                  for (const ch of token.content) {
                    if (idx >= n) break;
                    parts.push(
                      renderStyledChar(
                        ch,
                        idx,
                        userInput,
                        disabled,
                        tp,
                      ),
                    );
                    idx += 1;
                  }
                }
                if (lineIdx < tokens.length - 1) {
                  while (idx < n && targetText[idx] === "\n") {
                    parts.push(
                      renderStyledChar(
                        "\n",
                        idx,
                        userInput,
                        disabled,
                        plainProps,
                      ),
                    );
                    idx += 1;
                  }
                }
                return (
                  <div key={lineIdx} {...getLineProps({ line })}>
                    {parts}
                  </div>
                );
              });
              const tail: JSX.Element[] = [];
              while (idx < n) {
                const ch = targetText[idx];
                if (!ch) break;
                tail.push(
                  renderStyledChar(
                    ch,
                    idx,
                    userInput,
                    disabled,
                    plainProps,
                  ),
                );
                idx += 1;
              }
              return (
                <pre
                  className={`${className} m-0 overflow-auto p-4 text-[15px] leading-relaxed`}
                  style={{ ...style, background: "transparent" }}
                >
                  <code className="font-mono">
                    {lineBlocks}
                    {tail}
                  </code>
                </pre>
              );
            }}
          </Highlight>
          <textarea
            ref={taRef}
            className="absolute inset-0 z-10 cursor-default resize-none bg-transparent p-4 font-mono text-[15px] leading-relaxed text-transparent caret-transparent outline-none selection:bg-transparent"
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            value={userInput}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            aria-label="Поле ввода кода"
          />
        </>
      )}
    </div>
  );
}
