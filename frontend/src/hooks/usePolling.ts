import { useEffect, useRef } from 'react';

export function usePolling(
  callback: () => Promise<void> | void,
  intervalMs: number,
  shouldPoll = true
) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!shouldPoll || intervalMs <= 0) return;

    let isMounted = true;
    let timerId: any = null;

    const tick = async () => {
      if (document.hidden) return; // Pause polling when tab is hidden
      try {
        await savedCallback.current();
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    timerId = setInterval(tick, intervalMs);

    return () => {
      isMounted = false;
      if (timerId) clearInterval(timerId);
    };
  }, [intervalMs, shouldPoll]);
}
