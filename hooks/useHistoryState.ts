import { useState, useCallback } from 'react';

interface HistoryState<T> {
  state: T;
  setState: (newState: T) => void;
  resetState: (newState: T) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const useHistoryState = <T>(initialState: T): HistoryState<T> => {
  const [history, setHistory] = useState<T[]>([initialState]);
  const [index, setIndex] = useState(0);

  const state = history[index];
  const canUndo = index > 0;
  const canRedo = index < history.length - 1;

  const setState = useCallback((newState: T) => {
    // When a new state is set, we erase the "future" history
    const newHistory = history.slice(0, index + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setIndex(newHistory.length - 1);
  }, [history, index]);

  const resetState = useCallback((newState: T) => {
    setHistory([newState]);
    setIndex(0);
  }, []);

  const undo = useCallback(() => {
    if (canUndo) {
      setIndex(index - 1);
    }
  }, [canUndo, index]);

  const redo = useCallback(() => {
    if (canRedo) {
      setIndex(index + 1);
    }
  }, [canRedo, index]);

  return { state, setState, resetState, undo, redo, canUndo, canRedo };
};
