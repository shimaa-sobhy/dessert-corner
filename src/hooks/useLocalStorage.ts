import { useCallback, useState } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return initialValue;
      const parsed = JSON.parse(raw) as T;
      return parsed;
    } catch {
      return initialValue;
    }
  });

  const setPersisted = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? (next as (prev: T) => T)(prev) : next;
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          // ignore quota / serialization errors
        }
        return resolved;
      });
    },
    [key]
  );

  return [value, setPersisted] as const;
}
