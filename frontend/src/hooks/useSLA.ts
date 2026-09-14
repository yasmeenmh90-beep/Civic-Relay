import { useState, useEffect } from 'react';
import { calculateSLARemaining } from '../utils/date';

export interface UseSLAResult {
  remainingSeconds: number;
  isExpired: boolean;
  formatted: string;
  percentElapsed: number;
}

export function useSLA(deadline?: string | Date, totalHours = 72): UseSLAResult {
  const [slaState, setSlaState] = useState<UseSLAResult>(() =>
    calculateSLARemaining(deadline, totalHours)
  );

  useEffect(() => {
    // Immediate calculation
    setSlaState(calculateSLARemaining(deadline, totalHours));

    if (!deadline) return;

    // Tick every 1000ms
    const interval = setInterval(() => {
      const updated = calculateSLARemaining(deadline, totalHours);
      setSlaState(updated);
    }, 1000);

    return () => clearInterval(interval);
  }, [deadline, totalHours]);

  return slaState;
}
