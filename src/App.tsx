import { useCallback, useEffect, useRef, useState } from "react";
import { CodeTypingArea } from "./components/CodeTypingArea";
import { ResultsModal } from "./components/ResultsModal";
import { SettingsPanel } from "./components/SettingsPanel";
import { StatsPanel } from "./components/StatsPanel";
import { useOpenRouter } from "./hooks/useOpenRouter";
import { useTypingEngine } from "./hooks/useTypingEngine";
import type { CodeTopic, FinalStats, ProgrammingLanguage } from "./types";
import { buildFinalStats } from "./utils/statsCalculator";

export default function App() {
  const [language, setLanguage] =
    useState<ProgrammingLanguage>("typescript");
  const [topic, setTopic] = useState<CodeTopic>("functions");
  const [targetText, setTargetText] = useState("");
  const [finalStats, setFinalStats] = useState<FinalStats | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { generateCode, loading, error, clearError } = useOpenRouter();

  const {
    isComplete,
    getSnapshot,
    reset,
    applyInput,
    markStartedFromKey,
    userInput,
    elapsedMs,
    errorCount,
    correctKeypresses,
    totalKeypresses,
    isStarted,
  } = useTypingEngine({ targetText });

  const modalShownRef = useRef(false);

  useEffect(() => {
    modalShownRef.current = false;
  }, [targetText]);

  const runGenerate = useCallback(async () => {
    clearError();
    const out = await generateCode(language, topic);
    if (out.ok) {
      setTargetText(out.code);
      setModalOpen(false);
      setFinalStats(null);
    }
  }, [clearError, generateCode, language, topic]);

  useEffect(() => {
    if (!isComplete || targetText.length === 0) return;
    if (modalShownRef.current) return;
    modalShownRef.current = true;
    setFinalStats(buildFinalStats(getSnapshot(), targetText.length));
    setModalOpen(true);
  }, [isComplete, targetText, getSnapshot]);

  const onTypingChange = useCallback(
    (value: string) => {
      applyInput(value);
    },
    [applyInput],
  );

  const handleRepeat = useCallback(() => {
    setModalOpen(false);
    modalShownRef.current = false;
    reset();
  }, [reset]);

  const handleNewCodeFromModal = useCallback(() => {
    setModalOpen(false);
    modalShownRef.current = false;
    reset();
    void runGenerate();
  }, [reset, runGenerate]);

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
          onLanguageChange={setLanguage}
          onTopicChange={setTopic}
          onGenerate={() => void runGenerate()}
          loading={loading}
          typingDisabled={isComplete}
        />
        {error ? (
          <div
            className="rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-200"
            role="alert"
          >
            {error}
          </div>
        ) : null}
        <StatsPanel
          targetLength={targetText.length}
          userInputLength={userInput.length}
          elapsedMs={elapsedMs}
          errorCount={errorCount}
          correctKeypresses={correctKeypresses}
          totalKeypresses={totalKeypresses}
          isStarted={isStarted}
          isComplete={isComplete}
        />
        <CodeTypingArea
          targetText={targetText}
          userInput={userInput}
          language={language}
          onChange={onTypingChange}
          onKeyActivity={markStartedFromKey}
          disabled={isComplete || loading}
          loading={loading}
        />
      </main>
      <ResultsModal
        open={modalOpen}
        stats={finalStats}
        onRepeat={handleRepeat}
        onNewCode={handleNewCodeFromModal}
      />
    </div>
  );
}
