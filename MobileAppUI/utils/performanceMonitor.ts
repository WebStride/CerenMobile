/**
 * Performance Monitor Utility
 *
 * Tracks screen load times and warns when they exceed the acceptable threshold.
 * Threshold: 2500ms (2.5s) warning, 3000ms (3s) critical
 *
 * Usage:
 *   const mark = perfMark('HomeScreen');   // call at component mount / fetch start
 *   ...fetch data...
 *   mark.end();                            // call when data is ready / loading = false
 */

const WARN_THRESHOLD_MS = 2500;
const CRITICAL_THRESHOLD_MS = 3000;

export interface PerfMark {
  /** Call when the screen/fetch has finished loading */
  end: () => void;
}

/**
 * Start a performance mark for the given screen name.
 * Call `.end()` once data has finished loading.
 */
export function perfMark(screenName: string): PerfMark {
  const startTime = Date.now();

  return {
    end() {
      const elapsed = Date.now() - startTime;
      const status =
        elapsed >= CRITICAL_THRESHOLD_MS
          ? '🚨 SLOW'
          : elapsed >= WARN_THRESHOLD_MS
          ? '⚠️  WARN'
          : '✅ OK  ';

      console.log(
        `⏱️  [Perf] ${status} | ${screenName.padEnd(28)} | ${elapsed} ms`
      );

      if (elapsed >= CRITICAL_THRESHOLD_MS) {
        console.warn(
          `[Perf] ⚠️  ${screenName} exceeded ${CRITICAL_THRESHOLD_MS}ms threshold (${elapsed}ms). ` +
            `Consider optimising API calls, adding pagination, or caching.`
        );
      }
    },
  };
}
