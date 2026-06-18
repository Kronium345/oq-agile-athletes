import { useEffect, useRef, useState } from 'react';

const TICK_MS = 90;
const STEPS_PER_TICK_SMALL = 1;
const STEPS_PER_TICK_MEDIUM = 2;
const STEPS_PER_TICK_LARGE = 3;

/**
 * Eases the displayed step count toward the live total so updates feel
 * readable instead of jumping in large batches (common with motion sensors).
 */
export function useAnimatedStepCount(targetSteps: number): number {
  const [displaySteps, setDisplaySteps] = useState(targetSteps);
  const targetRef = useRef(targetSteps);

  useEffect(() => {
    targetRef.current = Math.max(0, Math.round(targetSteps));
  }, [targetSteps]);

  useEffect(() => {
    setDisplaySteps((current) => {
      const target = targetRef.current;
      if (target < current) return target;
      return current;
    });
  }, [targetSteps]);

  useEffect(() => {
    const timer = setInterval(() => {
      setDisplaySteps((current) => {
        const target = targetRef.current;
        if (current >= target) return current;

        const gap = target - current;
        const increment =
          gap > 80
            ? STEPS_PER_TICK_LARGE
            : gap > 25
              ? STEPS_PER_TICK_MEDIUM
              : STEPS_PER_TICK_SMALL;

        return Math.min(target, current + increment);
      });
    }, TICK_MS);

    return () => clearInterval(timer);
  }, []);

  return displaySteps;
}
