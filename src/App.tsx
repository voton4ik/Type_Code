import { useCallback, useEffect, useState } from "react";
import { CodeTypingArea } from "./components/CodeTypingArea";
import { ResultsSummary } from "./components/ResultsSummary";
import { SettingsPanel } from "./components/SettingsPanel";
import { StatsPanel } from "./components/StatsPanel";
import { useOpenRouter } from "./hooks/useOpenRouter";
import { useTypingEngine } from "./hooks/useTypingEngine";
import { normalizeTargetText } from "./utils/targetText";
import type {
  CodeTopic,
  FinalStats,
  FontSize,
  ProgrammingLanguage,
  TimedMode,
} from "./types";

export default function App() {
  const [language, setLanguage] =
    useState<ProgrammingLanguage>("typescript");
  const [topic, setTopic] = useState<CodeTopic>("functions");
  const [timedMode, setTimedMode] = useState<TimedMode>(null);
  const [fontSize, setFontSize] = useState<FontSize>(14);
  const [targetText, setTargetText] = useState("");
  const [finalStats, setFinalStats] = useState<FinalStats | null>(null);

  const { generateCode, loading, error, clearError } = useOpenRouter();

  const onFinished = useCallback((stats: FinalStats) => {
    setFinalStats(stats);
  }, []);

  const {
    reset,
    applyInput,
    markStartedFromKey,
    phase,
    userInput,
    elapsedMs,
    timeLeft,
    isStarted,
  } = useTypingEngine({ targetText, timedMode, onFinished });

  useEffect(() => {
    setFinalStats(null);
  }, [targetText]);

  useEffect(() => {
    if (phase === "stopped") {
      setFinalStats(null);
    }
  }, [phase]);

  const runGenerate = useCallback(async () => {
    clearError();
    const out = await generateCode(language, topic);
    if (out.ok) {
      setTargetText(normalizeTargetText(out.code));
      setFinalStats(null);
    }
  }, [clearError, generateCode, language, topic]);

  const onTypingChange = useCallback(
    (value: string, manualOverride?: number) => {
      applyInput(value, manualOverride);
    },
    [applyInput],
  );

  const handleRepeatFinished = useCallback(() => {
    setFinalStats(null);
    reset();
  }, [reset]);

  const handleNewTestFromFinished = useCallback(() => {
    setFinalStats(null);
    reset();
    void runGenerate();
  }, [reset, runGenerate]);

  const handleRestartAfterStop = useCallback(() => {
    reset();
  }, [reset]);

  const handleNewCodeAfterStop = useCallback(() => {
    reset();
    void runGenerate();
  }, [reset, runGenerate]);

  const settingsLocked = phase === "running" || phase === "finished";
  const typingDisabled =
    phase === "finished" || phase === "stopped" || loading;
  const isRunning = isStarted && phase === "running";
  const isFinished = phase === "finished";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="mx-auto flex max-w-4xl flex-col gap-1 px-4 py-5">
          <h1 className="text-2xl font-semibold tracking-tight">
            Тренажёр печати кода
          </h1>
          <p className="text-sm text-zinc-400">
            ИИ генерирует фрагмент — вы печатаете его с клавиатуры.
          </p>
        </div>
      </header>
      <main className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-6">
        <SettingsPanel
          language={language}
          topic={topic}
          timedMode={timedMode}
          fontSize={fontSize}
          onLanguageChange={setLanguage}
          onTopicChange={setTopic}
          onTimedModeChange={setTimedMode}
          onFontSizeChange={setFontSize}
          onGenerate={() => void runGenerate()}
          loading={loading}
          typingDisabled={settingsLocked}
        />
        {error ? (
          <div
            className="rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-200"
            role="alert"
          >
            {error}
          </div>
        ) : null}
        {isRunning ? (
          <div className="flex items-center justify-between gap-3">
            <StatsPanel
              elapsedMs={elapsedMs}
              timeLeft={timeLeft}
              timedMode={timedMode}
              isStarted={isStarted}
              isFinished={isFinished}
            />
            <button
              type="button"
              className="rounded-md border border-amber-700/80 bg-amber-950/40 px-4 py-2 text-sm font-medium text-amber-100 hover:bg-amber-900/50"
              onClick={reset}
            >
              Остановить
            </button>
          </div>
        ) : null}
        {phase === "stopped" ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="rounded-md border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800"
              onClick={handleRestartAfterStop}
            >
              Начать заново
            </button>
            <button
              type="button"
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
              onClick={handleNewCodeAfterStop}
            >
              Новый код
            </button>
          </div>
        ) : null}
        <CodeTypingArea
          targetText={targetText}
          userInput={userInput}
          language={language}
          fontSize={fontSize}
          onChange={onTypingChange}
          onKeyActivity={markStartedFromKey}
          disabled={typingDisabled}
          loading={loading}
        />
        {phase === "finished" && finalStats ? (
          <ResultsSummary
            stats={finalStats}
            onRepeat={handleRepeatFinished}
            onNewTest={handleNewTestFromFinished}
          />
        ) : null}
      </main>
    </div>
  );
}
