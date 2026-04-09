import {
  Highlight,
  themes,
  type Token,
  type TokenOutputProps,
} from "prism-react-renderer";
import type { CSSProperties, RefObject } from "react";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
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
  cursorRef: RefObject<HTMLSpanElement | null>,
  spaceWidthPx: number,
  markerHeightPx: number,
): JSX.Element {
  const typed = userInput[index];
  const done = index < userInput.length;
  const wrong = done && typed !== ch;
  const isWhitespaceTarget = ch === " " || ch === "\n";
  const wrongWhitespace = wrong && isWhitespaceTarget;
  const cursorHere = index === userInput.length && !disabled;
  const whitespaceErrorMarkerStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: `${spaceWidthPx}px`,
    height: `${markerHeightPx}px`,
    backgroundColor: "rgba(239, 68, 68, 0.35)",
    borderRadius: "0.125rem",
    verticalAlign: "middle",
    lineHeight: 1,
    userSelect: "none",
    pointerEvents: "none",
  };
  const baseStyle: CSSProperties = {
    ...tp.style,
    fontFamily: "inherit",
    fontWeight: "inherit",
    fontStyle: "inherit",
    letterSpacing: "inherit",
  };
  const colorOverrideStyle: CSSProperties = !done
    ? { color: "#71717a" }
    : wrong && !isWhitespaceTarget
      ? { color: "#ef4444" }
      : {};
  const mergedStyle: CSSProperties = {
    ...baseStyle,
    ...colorOverrideStyle,
  };
  if (ch === "\n") {
    return (
      <Fragment key={index}>
        <span
          data-index={index}
          ref={cursorHere ? cursorRef : undefined}
          className={`${tp.className}`.trim() + (cursorHere ? " code-cursor" : "")}
          style={{
            ...mergedStyle,
            display: "inline",
            width: "0px",
            maxWidth: "0px",
            overflow: "hidden",
            whiteSpace: "nowrap",
            fontSize: "0px",
            lineHeight: "inherit",
            padding: 0,
            margin: 0,
            verticalAlign: "baseline",
          }}
        />
        {wrongWhitespace && (
          <span
            aria-hidden="true"
            style={whitespaceErrorMarkerStyle}
          >
            <span
              style={{
                fontSize: "0.52em",
                color: "#fecaca",
                lineHeight: 1,
                transform: "translateY(0.02em)",
              }}
            >
              ↵
            </span>
          </span>
        )}
        {!done && (
          <span
            aria-hidden="true"
            style={{
              display: "inline",
              color: "#4b5563",
              userSelect: "none",
              pointerEvents: "none",
              fontSize: "inherit",
              lineHeight: "inherit",
              verticalAlign: "baseline",
            }}
          >
            ↵
          </span>
        )}
        <br />
      </Fragment>
    );
  }
  return (
    <span
      key={index}
      data-index={index}
      ref={cursorHere ? cursorRef : undefined}
      className={`${tp.className}`.trim() + (cursorHere ? " code-cursor" : "")}
      style={mergedStyle}
    >
      {ch === " " && wrongWhitespace ? (
        <span aria-hidden="true" style={whitespaceErrorMarkerStyle} />
      ) : ch === " " ? (
        "\u00a0"
      ) : (
        ch
      )}
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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const cursorRef = useRef<HTMLSpanElement | null>(null);
  const preRef = useRef<HTMLPreElement | null>(null);
  const [offsetY, setOffsetY] = useState(0);
  const [spaceWidthPx, setSpaceWidthPx] = useState(fontSize * 0.6);
  const [markerHeightPx, setMarkerHeightPx] = useState(fontSize);
  const highlightLang = getPrismLanguageId(language);
  const theme = themes.vsDark;
  const plainToken: Token = { types: ["plain"], content: " " };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.repeat) {
        e.preventDefault();
        return;
      }
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
      onChange(v);
    },
    [onChange, onKeyActivity],
  );

  useEffect(() => {
    if (!disabled && !loading && targetText.length > 0) {
      taRef.current?.focus();
    }
  }, [disabled, loading, targetText]);

  useEffect(() => {
    if (!disabled && !loading && targetText.length > 0) {
      const el = taRef.current;
      if (el && document.activeElement !== el) {
        el.focus();
      }
    }
  }, [disabled, loading, targetText, userInput.length]);

  useEffect(() => {
    const cursor = cursorRef.current;
    const inner = innerRef.current;
    const container = containerRef.current;
    if (!cursor || !inner || !container) return;

    const cursorTop = cursor.offsetTop;
    const containerCenter = container.clientHeight / 2;
    const newOffset = containerCenter - cursorTop - cursor.offsetHeight / 2;
    setOffsetY(Math.min(0, newOffset));
  }, [userInput.length, targetText]);

  useEffect(() => {
    const sample = preRef.current ?? taRef.current;
    if (!sample) return;
    const cs = window.getComputedStyle(sample);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const font = [
      cs.fontStyle,
      cs.fontVariant,
      cs.fontWeight,
      cs.fontSize,
      cs.fontFamily,
    ]
      .filter(Boolean)
      .join(" ");
    if (!font) return;
    ctx.font = font;
    const measured = ctx.measureText(" ").width;
    if (Number.isFinite(measured) && measured > 0) {
      setSpaceWidthPx(measured);
    }
    const metrics = ctx.measureText("M");
    const capHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
    if (Number.isFinite(capHeight) && capHeight > 0) {
      setMarkerHeightPx(capHeight);
    }
  }, [fontSize, targetText]);

  const monoBoxStyle: CSSProperties = {
    fontSize: `${fontSize}px`,
    lineHeight: CODE_LINE_HEIGHT,
    tabSize: 4,
    whiteSpace: "pre-wrap",
    wordBreak: "break-all",
  };

  return (
    <div
      ref={containerRef}
      className="code-typing-container relative w-full rounded-lg border border-zinc-700 bg-zinc-950 [contain:layout]"
      style={{ height: 320, overflow: "hidden", position: "relative" }}
    >
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
          <div
            ref={innerRef}
            style={{
              transform: `translateY(${offsetY}px)`,
              transition: "transform 0.15s ease",
              willChange: "transform",
            }}
          >
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
                          cursorRef,
                          spaceWidthPx,
                          markerHeightPx,
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
                          cursorRef,
                          spaceWidthPx,
                          markerHeightPx,
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
                      cursorRef,
                      spaceWidthPx,
                      markerHeightPx,
                    ),
                  );
                  idx += 1;
                }
                return (
                  <pre
                    ref={preRef}
                    className={`${className} code-typing-container m-0 min-h-[260px] overflow-hidden whitespace-pre-wrap break-all p-4 font-mono`}
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
          </div>
          <textarea
            ref={taRef}
            className="code-typing-container absolute inset-0 z-10 h-full cursor-default resize-none overflow-hidden bg-transparent p-4 font-mono text-transparent caret-transparent outline-none selection:bg-transparent"
            style={{
              ...monoBoxStyle,
            }}
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
