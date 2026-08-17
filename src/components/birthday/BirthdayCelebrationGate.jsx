import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";
import { useUser } from "../../services/context/UserContext";
import { claimBirthdayCelebration } from "../../lib/axios/claimBirthdayCelebration.js";
import { shouldPrepareBirthdayCelebration } from "./birthdayCelebrationGatePolicy.js";
import BirthdayCelebrationErrorBoundary from "./BirthdayCelebrationErrorBoundary.jsx";

export default function BirthdayCelebrationGate() {
  const {
    user,
    postLoginCelebrationEvent,
    consumePostLoginCelebrationEvent,
  } = useUser();
  const location = useLocation();

  const [celebration, setCelebration] = useState(null);
  const handledEventsRef = useRef(new Set());
  const timerRef = useRef(null);
  const abortControllerRef = useRef(null);

  const enabled =
    import.meta.env?.VITE_BIRTHDAY_CELEBRATION_ENABLED === "true";

  useEffect(() => {
    if (!postLoginCelebrationEvent) return;

    const eventId = postLoginCelebrationEvent.id;
    if (handledEventsRef.current.has(eventId)) return;

    const shouldPrepare = shouldPrepareBirthdayCelebration({
      enabled,
      event: postLoginCelebrationEvent,
      user,
      pathname: location.pathname,
    });

    if (!shouldPrepare) {
      if (location.pathname !== "/login" && location.pathname !== "/") {
        handledEventsRef.current.add(eventId);
        consumePostLoginCelebrationEvent(eventId);
      }
      return;
    }

    handledEventsRef.current.add(eventId);

    timerRef.current = window.setTimeout(async () => {
      abortControllerRef.current = new AbortController();
      try {
        const [overlayModule, claimResult] = await Promise.all([
          import("./BirthdayCelebrationOverlay.jsx"),
          claimBirthdayCelebration({ signal: abortControllerRef.current.signal }),
        ]);

        if (claimResult?.show === true) {
          const rawFirstName =
            user?.firstName ||
            user?.gy_emp_fname ||
            user?.name?.split(" ")[0] ||
            "";
          setCelebration({
            Component: overlayModule.default,
            firstName: rawFirstName,
          });
        }
      } catch {
        // Fail silently
      } finally {
        consumePostLoginCelebrationEvent(eventId);
      }
    }, 400);

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [
    consumePostLoginCelebrationEvent,
    enabled,
    location.pathname,
    postLoginCelebrationEvent,
    user,
  ]);

  if (!celebration) return null;

  const { Component: Overlay, firstName } = celebration;

  return (
    <BirthdayCelebrationErrorBoundary>
      <Overlay
        firstName={firstName}
        onDismiss={() => setCelebration(null)}
      />
    </BirthdayCelebrationErrorBoundary>
  );
}
