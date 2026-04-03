import { themes } from "prism-react-renderer";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { buildCharStyleMap } from "../utils/prismCharStyles";
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
  const prismLang = getPrismLanguageId(language);
  const theme = themes.vsDark;

  const charStyles = useMemo(
    () => buildCharStyleMap(targetText, prismLang, theme),
    [targetText, prismLang, theme],
  );

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

  const cells = useMemo(() => {
    return targetText.split("").map((ch, i) => ({ ch, i }));
  }, [targetText]);

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
          <pre
            className="m-0 overflow-auto p-4 font-mono text-[15px] leading-relaxed text-zinc-100"
            style={{ background: "transparent" }}
          >
            <code>
              {cells.map(({ ch, i }) => {
                const typed = userInput[i];
                const done = i < userInput.length;
                const correct = done && typed === ch;
                const wrong = done && typed !== ch;
                const cursorHere = i === userInput.length && !disabled;
                let stateClass = "rounded-sm px-[1px] transition-colors";
                if (!done) {
                  stateClass += " text-zinc-500";
                } else if (correct) {
                  stateClass += " bg-emerald-950/80 text-emerald-200";
                } else if (wrong) {
                  stateClass += " bg-red-950/80 text-red-200";
                }
                const baseStyle = charStyles[i] ?? {};
                if (ch === "\n") {
                  return (
                    <span key={i}>
                      <span
                        className={
                          stateClass +
                          (cursorHere
                            ? " code-cursor align-middle"
                            : "")
                        }
                        style={baseStyle}
                      >
                        {"\u00a0"}
                      </span>
                      {"\n"}
                    </span>
                  );
                }
                return (
                  <span
                    key={i}
                    className={
                      stateClass + (cursorHere ? " code-cursor" : "")
                    }
                    style={baseStyle}
                  >
                    {ch === " " ? "\u00a0" : ch}
                  </span>
                );
              })}
            </code>
          </pre>
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
