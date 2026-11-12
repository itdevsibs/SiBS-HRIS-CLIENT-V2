import { useCallback, useEffect, useRef, useState } from "react";
import useRefetchOnFocus from "../../../hooks/useRefetchOnFocus";
import { getTodayDate, parseHrisDateTime } from "../../../lib/axios/dateFormatter";
import { getLeavesSummary, getLeaveSummaryCacheKey } from "../../../lib/axios/getLeaves";
import { normalizeSuperAdminQueueMetrics } from "../../../lib/utils/Dashboards/SuperAdminDashboard/superAdminDashboardHelpers";

const POLL_INTERVAL_MS = 500;
const REQUEST_BUDGET_MS = 10_000;
const DAY_MS = 24 * 60 * 60 * 1000;
const UNAVAILABLE = { leavesTotal: null, leavesDateRange: null, leavesStatus: "unavailable" };
const UPDATING = { ...UNAVAILABLE, leavesStatus: "updating" };

export default function useRecentPendingLeaves(user) {
  const cacheKey = getLeaveSummaryCacheKey(user, { requireIdentifier: true });
  const [dateTo, setDateTo] = useState(getTodayDate);
  const [result, setResult] = useState(null);
  const active = useRef(null);

  const refresh = useCallback(({ forceRefresh = false } = {}) => {
    if (!cacheKey) return;

    const today = getTodayDate();
    setDateTo(today);
    const scope = JSON.stringify([cacheKey, today]);
    const previous = active.current;
    if (previous?.scope === scope && (!forceRefresh || previous.forceRefresh)) {
      return previous.promise;
    }
    previous?.cancel();

    const controller = new AbortController();
    const deadline = Date.now() + REQUEST_BUDGET_MS;
    let resolveRequest;
    const promise = new Promise((resolve) => { resolveRequest = resolve; });
    let pollTimer;
    let deadlineTimer;

    function finish(metrics) {
      if (active.current !== request) return;
      active.current = null;
      window.clearTimeout(pollTimer);
      window.clearTimeout(deadlineTimer);
      if (metrics && today === getTodayDate()) setResult({ scope, metrics });
      resolveRequest();
    }

    function cancel(metrics) {
      controller.abort();
      finish(metrics);
    }

    const request = { scope, forceRefresh, promise, cancel };
    active.current = request;
    deadlineTimer = window.setTimeout(() => cancel(UNAVAILABLE), REQUEST_BUDGET_MS);

    async function check(bypassCache) {
      if (Date.now() >= deadline) {
        cancel(UNAVAILABLE);
        return;
      }

      let response;
      try {
        response = await getLeavesSummary({
          cacheKey,
          window: "recent",
          forceRefresh: bypassCache,
          signal: controller.signal,
        });
      } catch {
        finish(UNAVAILABLE);
        return;
      }

      if (active.current !== request) return;
      if (Date.now() >= deadline) {
        cancel(UNAVAILABLE);
        return;
      }
      if (today !== getTodayDate()) {
        finish();
        setDateTo(getTodayDate());
        return;
      }

      const { leavesTotal, leavesDateRange, leavesStatus } = normalizeSuperAdminQueueMetrics(null, response);
      if (leavesStatus === "updating") {
        setResult({ scope, metrics: UPDATING });
        if (Date.now() + POLL_INTERVAL_MS < deadline) {
          pollTimer = window.setTimeout(() => void check(true), POLL_INTERVAL_MS);
        }
      } else {
        finish({ leavesTotal, leavesDateRange, leavesStatus });
      }
    }

    void check(forceRefresh);
    return promise;
  }, [cacheKey]);

  const scope = JSON.stringify([cacheKey, dateTo]);
  useEffect(() => {
    if (!cacheKey) return undefined;
    let disposed = false;
    // Run after StrictMode's effect cleanup so it starts only one initial request.
    queueMicrotask(() => {
      if (!disposed) void refresh();
    });
    const nextMidnight = parseHrisDateTime(dateTo).getTime() + DAY_MS;
    const midnightTimer = window.setTimeout(() => setDateTo(getTodayDate()), nextMidnight - Date.now());

    return () => {
      disposed = true;
      window.clearTimeout(midnightTimer);
      if (active.current?.scope === scope) active.current.cancel();
    };
  }, [cacheKey, dateTo, refresh, scope]);
  useRefetchOnFocus(refresh);

  const metrics = !cacheKey ? UNAVAILABLE : result?.scope === scope ? result.metrics : UPDATING;
  return { metrics, refresh };
}
