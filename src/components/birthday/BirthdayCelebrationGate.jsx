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
  const activeEventIdRef = useRef(null);

  const enabled =
    import.meta.env?.VITE_BIRTHDAY_CELEBRATION_ENABLED === "true";

  useEffect(() => {
    if (!postLoginCelebrationEvent) return;

    const eventId = postLoginCelebrationEvent.id;
    if (activeEventIdRef.current === eventId) return;

    const shouldPrepare = shouldPrepareBirthdayCelebration({
      enabled,
      event: postLoginCelebrationEvent,
      user,
      pathname: location.pathname,
    });

    if (!shouldPrepare) {
      if (location.pathname !== "/login" && location.pathname !== "/") {
        activeEventIdRef.current = eventId;
        consumePostLoginCelebrationEvent(eventId);
      }
      return;
    }

    activeEventIdRef.current = eventId;

    let isSubscribed = true;

    async function triggerCelebration() {
      try {
        const [overlayModule, claimResult] = await Promise.all([
          import("./BirthdayCelebrationOverlay.jsx"),
          claimBirthdayCelebration(),
        ]);

        if (isSubscribed && claimResult?.show === true) {
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
    }

    void triggerCelebration();

    return () => {
      isSubscribed = false;
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

