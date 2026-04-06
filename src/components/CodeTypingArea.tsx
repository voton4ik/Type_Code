import {
  Highlight,
  themes,
  type Token,
  type TokenOutputProps,
} from "prism-react-renderer";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef } from "react";
import { getPrismLanguageId } from "../utils/prismLanguages";
import type { FontSize, ProgrammingLanguage } from "../types";

const CODE_LINE_HEIGHT = 1.625;

export interface CodeTypingAreaProps {
  targetText: string;
  userInput: string;
  language: ProgrammingLanguage;
  fontSize: FontSize;
  onChange: (value: string, manualOverride?: number) => void;
  onKeyActivity: () => void;
  disabled: boolean;
  loading: boolean;
}

function expandTabFromTarget(target: string, pos: number): string {
  if (pos < 0 || pos >= target.length) return "";
  if (target[pos] === "\t") return "\t";
  let n = 0;
  while (pos + n < target.length && target[pos + n] === " ") {
    n += 1;
  }
  return " ".repeat(n);
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
    const arrowClass = !done
      ? "text-zinc-500"
      : correct
        ? "text-emerald-400"
        : "text-red-300";
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
        <span className={`select-none text-xs font-normal ${arrowClass}`}>
          ↵
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
  fontSize,
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
        const indent = expandTabFromTarget(targetText, start);
        if (indent.length === 0) return;
        const next = userInput.slice(0, start) + indent + userInput.slice(end);
        onChange(next, 1);
        queueMicrotask(() => {
          const pos = start + indent.length;
          el.selectionStart = el.selectionEnd = pos;
        });
      }
    },
    [disabled, loading, onChange, onKeyActivity, userInput, targetText],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onKeyActivity();
      const v = e.target.value;
      const delta = Math.max(0, v.length - userInput.length);
      onChange(v, delta > 0 ? delta : undefined);
    },
    [onChange, onKeyActivity, userInput],
  );

  useEffect(() => {
    if (!disabled && !loading && targetText.length > 0) {
      taRef.current?.focus();
    }
  }, [disabled, loading, targetText]);

  const monoBoxStyle: CSSProperties = {
    fontSize: `${fontSize}px`,
    lineHeight: CODE_LINE_HEIGHT,
    tabSize: 4,
  };

  return (
    <div className="relative min-h-[300px] w-full overflow-hidden rounded-lg border border-zinc-700 bg-zinc-950 [contain:layout]">
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
                  className={`${className} m-0 min-h-[260px] overflow-x-auto overflow-y-auto whitespace-pre p-4 font-mono`}
                  style={{
                    ...style,
                    ...monoBoxStyle,
                    background: "transparent",
                  }}
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
            className="absolute inset-0 z-10 cursor-default resize-none overflow-auto bg-transparent p-4 font-mono text-transparent caret-transparent outline-none selection:bg-transparent"
            style={monoBoxStyle}
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
