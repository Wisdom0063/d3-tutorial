import { useRef, useCallback } from "react";

export function useThrottle<T extends (...args: never[]) => void>(
  callback: T,
  delay: number,
): T {
  const lastRun = useRef<number | null>(null);
  const timeoutRef = useRef<number | undefined>(undefined);

  const throttled = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      if (lastRun.current === null) {
        lastRun.current = now;
      }
      const timeSinceLastRun = now - lastRun.current;

      if (timeSinceLastRun >= delay) {
        callback(...args);
        lastRun.current = now;
      } else {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = window.setTimeout(() => {
          callback(...args);
          lastRun.current = Date.now();
        }, delay - timeSinceLastRun);
      }
    },
    [callback, delay],
  );

  return throttled as T;
}
