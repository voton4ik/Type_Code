import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  FinalStats,
  TimedMode,
  TypingPhase,
  TypingStatsSnapshot,
} from "../types";
import { buildFinalStats, countWords } from "../utils/statsCalculator";

export interface UseTypingEngineOptions {
  targetText: string;
  timedMode: TimedMode;
  onFinished?: (stats: FinalStats) => void;
}

export interface UseTypingEngineResult {
  userInput: string;
  setUserInput: (value: string) => void;
  applyInput: (next: string, manualOverride?: number) => void;
  phase: TypingPhase;
  isComplete: boolean;
  isStarted: boolean;
  elapsedMs: number;
  /** Оставшиеся секунды в тайм-режиме во время набора; в классическом режиме — null. */
  timeLeft: number | null;
  errorCount: number;
  correctKeypresses: number;
  totalKeypresses: number;
  manualKeystrokes: number;
  reset: () => void;
  stopTest: () => void;
  markStartedFromKey: () => void;
  getSnapshot: () => TypingStatsSnapshot;
}

function appendAutoIndentAfterNewline(tgt: string, next: string): string {
  if (!tgt.startsWith(next) || next.length === 0) return next;
  const last = next[next.length - 1];
  if (last !== "\n") return next;
  let j = next.length;
  while (j < tgt.length && (tgt[j] === " " || tgt[j] === "\t")) {
    j += 1;
  }
  if (j <= next.length) return next;
  return tgt.slice(0, j);
}

function prefixMatches(a: string, b: string, len: number): boolean {
  for (let i = 0; i < len; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function useTypingEngine({
  targetText,
  timedMode,
  onFinished,
}: UseTypingEngineOptions): UseTypingEngineResult {
  const [userInput, setUserInputState] = useState("");
  const [phase, setPhase] = useState<TypingPhase>("idle");
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const [hasStarted, setHasStarted] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [correctKeypresses, setCorrectKeypresses] = useState(0);
  const [totalKeypresses, setTotalKeypresses] = useState(0);
  const [manualKeystrokes, setManualKeystrokes] = useState(0);

  const startedAtRef = useRef<number | null>(null);
  const endedAtRef = useRef<number | null>(null);
  const [tick, setTick] = useState(0);
  const onFinishedRef = useRef(onFinished);
  onFinishedRef.current = onFinished;

  const targetRef = useRef(targetText);
  targetRef.current = targetText;

  const timedModeRef = useRef(timedMode);
  timedModeRef.current = timedMode;

  const timedDeadlineRef = useRef<number | null>(null);
  const timeEndHandledRef = useRef(false);

  const userInputRef = useRef("");
  userInputRef.current = userInput;

  const errorCountRef = useRef(0);
  errorCountRef.current = errorCount;
  const correctKeypressesRef = useRef(0);
  correctKeypressesRef.current = correctKeypresses;
  const totalKeypressesRef = useRef(0);
  totalKeypressesRef.current = totalKeypresses;
  const manualKeystrokesRef = useRef(0);
  manualKeystrokesRef.current = manualKeystrokes;

  useEffect(() => {
    setUserInputState("");
    setPhase("idle");
    setHasStarted(false);
    setErrorCount(0);
    setCorrectKeypresses(0);
    setTotalKeypresses(0);
    setManualKeystrokes(0);
    startedAtRef.current = null;
    endedAtRef.current = null;
    timedDeadlineRef.current = null;
    timeEndHandledRef.current = false;
  }, [targetText]);

  const elapsedMs = useMemo(() => {
    if (!startedAtRef.current) return 0;
    const end = endedAtRef.current ?? Date.now();
    return Math.max(0, end - startedAtRef.current);
  }, [phase, tick, targetText, hasStarted]);

  const finishDueToTimer = useCallback(() => {
    if (phaseRef.current !== "running") return;
    if (timeEndHandledRef.current) return;
    timeEndHandledRef.current = true;
    const start = startedAtRef.current;
    const deadline = timedDeadlineRef.current;
    const end =
      deadline !== null ? Math.min(Date.now(), deadline) : Date.now();
    endedAtRef.current = end;
    setPhase("finished");
    setTick((t) => t + 1);

    const typed = userInputRef.current;
    const tgt = targetRef.current;
    const elapsed = start !== null ? Math.max(0, end - start) : 0;
    const snap: TypingStatsSnapshot = {
      elapsedMs: elapsed,
      typedChars: typed.length,
      typedWordCount: countWords(typed),
      errorCount: errorCountRef.current,
      correctKeypresses: correctKeypressesRef.current,
      totalKeypresses: totalKeypressesRef.current,
      manualKeystrokes: manualKeystrokesRef.current,
    };
    const fin = buildFinalStats(snap, tgt.length);
    onFinishedRef.current?.(fin);
  }, []);

  useEffect(() => {
    if (phase !== "running") return;
    const id = window.setInterval(() => {
      setTick((t) => t + 1);
      const mode = timedModeRef.current;
      const deadline = timedDeadlineRef.current;
      if (
        mode !== null &&
        deadline !== null &&
        Date.now() >= deadline
      ) {
        finishDueToTimer();
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [phase, targetText, finishDueToTimer]);

  const markStartedFromKey = useCallback(() => {
    if (startedAtRef.current !== null) return;
    startedAtRef.current = Date.now();
    if (timedModeRef.current !== null) {
      timedDeadlineRef.current =
        startedAtRef.current + timedModeRef.current * 1000;
    }
    setHasStarted(true);
    setTick((t) => t + 1);
  }, []);

  const applyInput = useCallback(
    (nextRaw: string, manualOverride?: number) => {
      const tgt = targetRef.current;
      const normalized = nextRaw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
      const rawClamped = normalized.slice(0, tgt.length);
      const prev = userInput;

      if (phase === "finished" || phase === "stopped") return;

      if (rawClamped.length < prev.length) {
        setUserInputState(rawClamped);
        return;
      }

      if (rawClamped === prev) return;

      const userGrowth =
        manualOverride !== undefined
          ? Math.max(0, manualOverride)
          : Math.max(0, rawClamped.length - prev.length);

      let next = appendAutoIndentAfterNewline(tgt, rawClamped);
      let overshoot = false;
      if (next.length > tgt.length) {
        overshoot = true;
        next = next.slice(0, tgt.length);
      }

      if (next === prev) return;

      if (userGrowth > 0) {
        markStartedFromKey();
      }
      setPhase((p) => (p === "idle" ? "running" : p));

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
      if (userGrowth > 0) {
        setManualKeystrokes((c) => c + userGrowth);
      }

      setUserInputState(next);

      const atEnd = tgt.length > 0 && next.length === tgt.length;
      const allMatch =
        atEnd && prefixMatches(next, tgt, tgt.length);
      const shouldFinish = atEnd && (allMatch || overshoot);

      if (shouldFinish) {
        endedAtRef.current = Date.now();
        setPhase("finished");
        setTick((t) => t + 1);
        const snapErr = errorCount + errs;
        const snapCorr = correctKeypresses + correct;
        const snapTot = totalKeypresses + added.length;
        const snapManual = manualKeystrokes + (userGrowth > 0 ? userGrowth : 0);
        const start = startedAtRef.current;
        const elapsed =
          start !== null
            ? Math.max(0, endedAtRef.current - start)
            : 0;
        const snap: TypingStatsSnapshot = {
          elapsedMs: elapsed,
          typedChars: next.length,
          typedWordCount: countWords(next),
          errorCount: snapErr,
          correctKeypresses: snapCorr,
          totalKeypresses: snapTot,
          manualKeystrokes: snapManual,
        };
        const fin = buildFinalStats(snap, tgt.length);
        onFinishedRef.current?.(fin);
      }
    },
    [
      userInput,
      phase,
      markStartedFromKey,
      errorCount,
      correctKeypresses,
      totalKeypresses,
      manualKeystrokes,
    ],
  );

  const setUserInput = useCallback(
    (value: string) => {
      applyInput(value);
    },
    [applyInput],
  );

  const reset = useCallback(() => {
    setUserInputState("");
    setPhase("idle");
    setHasStarted(false);
    setErrorCount(0);
    setCorrectKeypresses(0);
    setTotalKeypresses(0);
    setManualKeystrokes(0);
    startedAtRef.current = null;
    endedAtRef.current = null;
    timedDeadlineRef.current = null;
    timeEndHandledRef.current = false;
    setTick((t) => t + 1);
  }, []);

  const stopTest = useCallback(() => {
    if (phaseRef.current !== "running") return;
    setUserInputState("");
    setHasStarted(false);
    setErrorCount(0);
    setCorrectKeypresses(0);
    setTotalKeypresses(0);
    setManualKeystrokes(0);
    startedAtRef.current = null;
    endedAtRef.current = null;
    timedDeadlineRef.current = null;
    timeEndHandledRef.current = false;
    setPhase("stopped");
    setTick((t) => t + 1);
  }, []);

  const getSnapshot = useCallback((): TypingStatsSnapshot => {
    const start = startedAtRef.current;
    const end = endedAtRef.current ?? (start !== null ? Date.now() : null);
    const elapsed =
      start !== null && end !== null ? Math.max(0, end - start) : 0;
    const typed = userInputRef.current;
    return {
      elapsedMs: elapsed,
      typedChars: typed.length,
      typedWordCount: countWords(typed),
      errorCount,
      correctKeypresses,
      totalKeypresses,
      manualKeystrokes,
    };
  }, [errorCount, correctKeypresses, totalKeypresses, manualKeystrokes]);

  const timeLeft = useMemo(() => {
    if (timedMode === null) return null;
    if (phase !== "running") return null;
    const deadline = timedDeadlineRef.current;
    if (deadline === null) return null;
    return Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
  }, [timedMode, phase, tick]);

  const isComplete = phase === "finished";

  return {
    userInput,
    setUserInput,
    applyInput,
    phase,
    isComplete,
    isStarted: hasStarted,
    elapsedMs,
    timeLeft,
    errorCount,
    correctKeypresses,
    totalKeypresses,
    manualKeystrokes,
    reset,
    stopTest,
    markStartedFromKey,
    getSnapshot,
  };
}
