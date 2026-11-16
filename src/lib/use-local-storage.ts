"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

const EVENT = "caviti:local-storage";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

/**
 * Small persisted preference (view mode, pinned reports). Reads localStorage
 * without a setState-in-effect and stays in sync across tabs. Pass a stable `initial`.
 */
export function useLocalStorage<T>(key: string, initial: T): [T, (value: T) => void] {
  const raw = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    () => null
  );

  const value = useMemo(() => {
    if (raw === null) return initial;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return initial;
    }
  }, [raw, initial]);

  const set = useCallback(
    (next: T) => {
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* storage unavailable: the choice lasts until reload */
      }
      window.dispatchEvent(new Event(EVENT));
    },
    [key]
  );

  return [value, set];
}
