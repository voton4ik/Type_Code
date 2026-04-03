import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TypingStatsSnapshot } from "../types";

export interface UseTypingEngineOptions {
  targetText: string;
}

export interface UseTypingEngineResult {
  userInput: string;
  setUserInput: (value: string) => void;
  applyInput: (next: string) => void;
  isComplete: boolean;
  isStarted: boolean;
  elapsedMs: number;
  errorCount: number;
  correctKeypresses: number;
  totalKeypresses: number;
  reset: () => void;
  markStartedFromKey: () => void;
  getSnapshot: () => TypingStatsSnapshot;
}

export function useTypingEngine({
  targetText,
}: UseTypingEngineOptions): UseTypingEngineResult {
  const [userInput, setUserInputState] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [correctKeypresses, setCorrectKeypresses] = useState(0);
  const [totalKeypresses, setTotalKeypresses] = useState(0);

  const startedAtRef = useRef<number | null>(null);
  const endedAtRef = useRef<number | null>(null);
  const [tick, setTick] = useState(0);

  const targetRef = useRef(targetText);
  targetRef.current = targetText;

  useEffect(() => {
    setUserInputState("");
    setIsComplete(false);
    setHasStarted(false);
    setErrorCount(0);
    setCorrectKeypresses(0);
    setTotalKeypresses(0);
    startedAtRef.current = null;
    endedAtRef.current = null;
  }, [targetText]);

  const elapsedMs = useMemo(() => {
    if (!startedAtRef.current) return 0;
    const end = endedAtRef.current ?? Date.now();
    return Math.max(0, end - startedAtRef.current);
  }, [isComplete, tick, targetText, hasStarted]);

  useEffect(() => {
    if (!hasStarted || isComplete) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 100);
    return () => window.clearInterval(id);
  }, [hasStarted, isComplete, targetText]);

  const markStartedFromKey = useCallback(() => {
    if (startedAtRef.current !== null) return;
    startedAtRef.current = Date.now();
    setHasStarted(true);
    setTick((t) => t + 1);
  }, []);

  const applyInput = useCallback(
    (nextRaw: string) => {
      const tgt = targetRef.current;
      const next = nextRaw.slice(0, tgt.length);
      const prev = userInput;

      if (next === prev) return;

      if (next.length < prev.length) {
        setUserInputState(next);
        return;
      }

      if (isComplete) return;

      markStartedFromKey();

      const added = next.slice(prev.length);
      let errs = 0;
      let correct = 0;

      for (let i = 0; i < added.length; i++) {
        const ch = added[i];
        if (!ch) continue;
        const idx = prev.length + i;
        const expected = tgt[idx];
        if (expected === undefined) break;
        if (ch === expected) correct += 1;
        else errs += 1;
      }

      if (errs > 0) setErrorCount((c) => c + errs);
      if (correct > 0) setCorrectKeypresses((c) => c + correct);
      if (added.length > 0) {
        setTotalKeypresses((c) => c + added.length);
      }

      setUserInputState(next);

      if (tgt.length > 0 && next === tgt) {
        endedAtRef.current = Date.now();
        setIsComplete(true);
        setTick((t) => t + 1);
      }
    },
    [userInput, isComplete, markStartedFromKey],
  );

  const setUserInput = useCallback(
    (value: string) => {
      applyInput(value);
    },
    [applyInput],
  );

  const reset = useCallback(() => {
    setUserInputState("");
    setIsComplete(false);
    setHasStarted(false);
    setErrorCount(0);
    setCorrectKeypresses(0);
    setTotalKeypresses(0);
    startedAtRef.current = null;
    endedAtRef.current = null;
    setTick((t) => t + 1);
  }, []);

  const getSnapshot = useCallback((): TypingStatsSnapshot => {
    const start = startedAtRef.current;
    const end = endedAtRef.current ?? (start !== null ? Date.now() : null);
    const elapsed =
      start !== null && end !== null ? Math.max(0, end - start) : 0;
    return {
      elapsedMs: elapsed,
      typedChars: targetRef.current.length,
      errorCount,
      correctKeypresses,
      totalKeypresses,
    };
  }, [errorCount, correctKeypresses, totalKeypresses]);

  return {
    userInput,
    setUserInput,
    applyInput,
    isComplete,
    isStarted: hasStarted,
    elapsedMs,
    errorCount,
    correctKeypresses,
    totalKeypresses,
    reset,
    markStartedFromKey,
    getSnapshot,
  };
}
