import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import type {
  FinalStats,
  TimedMode,
  TypingPhase,
  TypingStatsSnapshot,
} from "../types";
import { buildFinalStats, countWords } from "../utils/statsCalculator";
import { normalizeTargetText } from "../utils/targetText";

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

type EngineState = {
  userInput: string;
  phase: TypingPhase;
  isStarted: boolean;
  errorCount: number;
  correctKeypresses: number;
  totalKeypresses: number;
  manualKeystrokes: number;
  startTime: number | null;
  endTime: number | null;
};

type EngineAction =
  | { type: "RESET" }
  | { type: "MARK_STARTED"; now: number }
  | { type: "APPLY_INPUT"; nextRaw: string; manualOverride?: number; targetText: string; now: number }
  | { type: "FINISH_TIMER"; now: number }
  | { type: "STOP" };

const initialState: EngineState = {
  userInput: "",
  phase: "idle",
  isStarted: false,
  errorCount: 0,
  correctKeypresses: 0,
  totalKeypresses: 0,
  manualKeystrokes: 0,
  startTime: null,
  endTime: null,
};

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

function isFullyMatchedInput(userInput: string, targetText: string): boolean {
  return targetText.length > 0 && userInput.length >= targetText.length;
}

function engineReducer(state: EngineState, action: EngineAction): EngineState {
  if (action.type === "RESET") {
    return initialState;
  }

  if (action.type === "MARK_STARTED") {
    if (state.startTime !== null || state.phase === "finished" || state.phase === "stopped") {
      return state;
    }
    return {
      ...state,
      isStarted: true,
      phase: "running",
      startTime: action.now,
    };
  }

  if (action.type === "STOP") {
    if (state.phase !== "running") return state;
    return {
      ...initialState,
      phase: "stopped",
    };
  }

  if (action.type === "FINISH_TIMER") {
    if (state.phase !== "running" || state.startTime === null) return state;
    return {
      ...state,
      phase: "finished",
      endTime: action.now,
    };
  }

  if (action.type === "APPLY_INPUT") {
    if (state.phase === "finished" || state.phase === "stopped") return state;

    const normalized = action.nextRaw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const rawClamped = normalized.slice(0, action.targetText.length);
    const prev = state.userInput;

    if (rawClamped.length < prev.length) {
      return { ...state, userInput: rawClamped };
    }
    if (rawClamped === prev) return state;

    let next = appendAutoIndentAfterNewline(action.targetText, rawClamped);
    if (next.length > action.targetText.length) {
      next = next.slice(0, action.targetText.length);
    }
    if (next === prev) return state;
    const userGrowth = Math.max(0, next.length - prev.length);
    const manualGrowth =
      action.manualOverride !== undefined
        ? Math.max(0, action.manualOverride)
        : userGrowth;

    const added = next.slice(prev.length);
    let errs = 0;
    let correct = 0;
    for (let i = 0; i < added.length; i++) {
      const ch = added[i];
      if (!ch) continue;
      const idx = prev.length + i;
      const expected = action.targetText[idx];
      if (expected === undefined) break;
      if (ch === expected) correct += 1;
      else errs += 1;
    }

    const startedNow = userGrowth > 0 && state.startTime === null;
    const nextStartTime = startedNow ? action.now : state.startTime;
    const nextPhase =
      state.phase === "idle" && userGrowth > 0 ? "running" : state.phase;
    const nextFinished = isFullyMatchedInput(next, action.targetText);

    return {
      ...state,
      userInput: next,
      phase: nextFinished ? "finished" : nextPhase,
      isStarted: state.isStarted || userGrowth > 0,
      errorCount: state.errorCount + errs,
      correctKeypresses: state.correctKeypresses + correct,
      totalKeypresses: state.totalKeypresses + added.length,
      manualKeystrokes:
        state.manualKeystrokes + (manualGrowth > 0 ? manualGrowth : 0),
      startTime: nextStartTime,
      endTime: nextFinished ? action.now : state.endTime,
    };
  }

  return state;
}

export function useTypingEngine({
  targetText,
  timedMode,
  onFinished,
}: UseTypingEngineOptions): UseTypingEngineResult {
  const normalizedTargetText = useMemo(
    () => normalizeTargetText(targetText),
    [targetText],
  );
  const [state, dispatch] = useReducer(engineReducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;
  const [tick, setTick] = useState(0);
  const onFinishedRef = useRef(onFinished);
  onFinishedRef.current = onFinished;
  const targetTextRef = useRef(normalizedTargetText);
  targetTextRef.current = normalizedTargetText;

  const emitFinished = useCallback((nextState: EngineState) => {
    if (nextState.phase !== "finished" || nextState.endTime === null) return;
    const elapsed =
      nextState.startTime !== null
        ? Math.max(0, nextState.endTime - nextState.startTime)
        : 0;
    const snap: TypingStatsSnapshot = {
      elapsedMs: elapsed,
      typedChars: nextState.userInput.length,
      typedWordCount: countWords(nextState.userInput),
      errorCount: nextState.errorCount,
      correctKeypresses: nextState.correctKeypresses,
      totalKeypresses: nextState.totalKeypresses,
      manualKeystrokes: nextState.manualKeystrokes,
    };
    const fin = buildFinalStats(snap, targetTextRef.current.length);
    onFinishedRef.current?.(fin);
  }, []);

  useEffect(() => {
    dispatch({ type: "RESET" });
    stateRef.current = initialState;
  }, [normalizedTargetText]);

  const elapsedMs = useMemo(() => {
    if (!state.startTime) return 0;
    const end = state.endTime ?? Date.now();
    return Math.max(0, end - state.startTime);
  }, [state.startTime, state.endTime, tick]);

  useEffect(() => {
    if (state.phase !== "running") return;
    const id = window.setInterval(() => {
      setTick((t) => t + 1);
      if (timedMode !== null && state.startTime !== null) {
        const deadline = state.startTime + timedMode * 1000;
        if (Date.now() >= deadline) {
          const action: EngineAction = {
            type: "FINISH_TIMER",
            now: deadline,
          };
          const prev = stateRef.current;
          const next = engineReducer(prev, action);
          stateRef.current = next;
          dispatch(action);
          if (prev.phase !== "finished" && next.phase === "finished") {
            emitFinished(next);
          }
        }
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [emitFinished, state.phase, state.startTime, timedMode]);

  const markStartedFromKey = useCallback(() => {
    dispatch({ type: "MARK_STARTED", now: Date.now() });
    setTick((t) => t + 1);
  }, []);

  const applyInput = useCallback(
    (nextRaw: string, manualOverride?: number) => {
      const action: EngineAction = {
        type: "APPLY_INPUT",
        nextRaw,
        manualOverride,
        targetText: targetTextRef.current,
        now: Date.now(),
      };
      const prev = stateRef.current;
      const next = engineReducer(prev, action);
      stateRef.current = next;
      dispatch(action);
      if (prev.phase !== "finished" && next.phase === "finished") {
        emitFinished(next);
      }
    },
    [emitFinished],
  );

  const setUserInput = useCallback(
    (value: string) => {
      applyInput(value);
    },
    [applyInput],
  );

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
    stateRef.current = initialState;
    setTick((t) => t + 1);
  }, []);

  const stopTest = useCallback(() => {
    dispatch({ type: "STOP" });
    stateRef.current = engineReducer(stateRef.current, { type: "STOP" });
    setTick((t) => t + 1);
  }, []);

  const getSnapshot = useCallback((): TypingStatsSnapshot => {
    const start = state.startTime;
    const end = state.endTime ?? (start !== null ? Date.now() : null);
    const elapsed =
      start !== null && end !== null ? Math.max(0, end - start) : 0;
    return {
      elapsedMs: elapsed,
      typedChars: state.userInput.length,
      typedWordCount: countWords(state.userInput),
      errorCount: state.errorCount,
      correctKeypresses: state.correctKeypresses,
      totalKeypresses: state.totalKeypresses,
      manualKeystrokes: state.manualKeystrokes,
    };
  }, [state]);

  const timeLeft = useMemo(() => {
    if (timedMode === null) return null;
    if (state.phase !== "running") return null;
    if (state.startTime === null) return null;
    const deadline = state.startTime + timedMode * 1000;
    return Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
  }, [timedMode, state.phase, state.startTime, tick]);

  const isComplete = state.phase === "finished";

  return {
    userInput: state.userInput,
    setUserInput,
    applyInput,
    phase: state.phase,
    isComplete,
    isStarted: state.isStarted,
    elapsedMs,
    timeLeft,
    errorCount: state.errorCount,
    correctKeypresses: state.correctKeypresses,
    totalKeypresses: state.totalKeypresses,
    manualKeystrokes: state.manualKeystrokes,
    reset,
    stopTest,
    markStartedFromKey,
    getSnapshot,
  };
}
