import { useCallback, useRef, useState } from "react";

export function useSubmissionGuard() {
  const inFlightRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const runWithGuard = useCallback(async <T,>(action: () => Promise<T>) => {
    if (inFlightRef.current) {
      return undefined;
    }

    inFlightRef.current = true;
    setIsSubmitting(true);

    try {
      return await action();
    } finally {
      inFlightRef.current = false;
      setIsSubmitting(false);
    }
  }, []);

  return {
    isSubmitting,
    runWithGuard,
  };
}