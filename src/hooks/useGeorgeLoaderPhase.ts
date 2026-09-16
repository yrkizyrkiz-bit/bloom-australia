"use client";

import { useEffect, useRef, useState } from "react";

const COMPLETE_HOLD_MS = 700;

/**
 * Keep George on screen while generation is live, then flash `complete`
 * only after a successful finish. Errors drop the loader immediately.
 */
export function useGeorgeLoaderPhase(waiting: boolean, hasError = false) {
  const [complete, setComplete] = useState(false);
  const wasWaiting = useRef(false);

  useEffect(() => {
    if (waiting) {
      wasWaiting.current = true;
      setComplete(false);
      return;
    }

    if (!wasWaiting.current) return;
    wasWaiting.current = false;

    if (hasError) {
      setComplete(false);
      return;
    }

    setComplete(true);
    const timer = window.setTimeout(() => setComplete(false), COMPLETE_HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [waiting, hasError]);

  return {
    showLoader: waiting || complete,
    complete,
  };
}
