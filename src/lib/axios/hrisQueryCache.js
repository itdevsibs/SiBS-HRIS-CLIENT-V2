import { QueryClient } from "@tanstack/react-query";
import { readCachedAuthSession } from "../../services/auth/auth-session-cache";

const MAX_QUERIES = 100;
const MAX_ENTRY_BYTES = 2 * 1024 * 1024;
const SLOW_READ_MS = 750;

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key, item]) => !["_t", "refresh", "forceRefresh"].includes(key) && item !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, canonical(item)]),
    );
  }
  return value;
}

export function currentHrisCacheScope() {
  const user = readCachedAuthSession()?.user;
  const id = user?.sibsId ?? user?.sibs_id ?? user?.gy_user_code ?? user?.gy_emp_code;
  if (!id) return "";
  return JSON.stringify(canonical({
    id: String(id),
    role: user.role ?? user.userRole ?? user.user_type ?? "",
    adminAccess: user.adminAccess ?? user.admin_access ?? "",
    tokenType: user.tokenType ?? "",
    permissions: user.permissions ?? user.moduleAccess ?? null,
    accounts: user.assignedAccounts ?? user.assigned_accounts ?? null,
    clusters: user.assignedClusters ?? user.assigned_clusters ?? null,
  }));
}

export function createHrisQueryCache({
  now = () => Date.now(),
  getScope = currentHrisCacheScope,
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 180_000 } } }),
} = {}) {
  let generation = 0;
  const stats = { hit: 0, stale: 0, miss: 0, coalesced: 0, error: 0 };

  function trim() {
    const queries = queryClient.getQueryCache().getAll()
      .filter((query) => query.queryKey[0] === "hris" && query.state.fetchStatus === "idle")
      .sort((a, b) => a.state.dataUpdatedAt - b.state.dataUpdatedAt);
    const excess = queryClient.getQueryCache().getAll().length - MAX_QUERIES;
    for (let index = 0; index < excess && index < queries.length; index += 1) {
      queryClient.removeQueries({ queryKey: queries[index].queryKey, exact: true });
    }
  }

  async function get({ path, params, ttlMs = 0, staleMs = 0, forceRefresh = false }, loader) {
    const scope = getScope();
    if (!scope || !path) return loader();
    const queryKey = ["hris", generation, scope, path, canonical(params || {})];
    const state = queryClient.getQueryState(queryKey);
    const age = state?.data ? now() - state.data.storedAt : Infinity;
    if (!forceRefresh && age < ttlMs) {
      stats.hit += 1;
      return state.data.value;
    }

    const fetch = () => queryClient.fetchQuery({
      queryKey,
      queryFn: async ({ signal }) => {
        const startedAt = now();
        try {
          const value = await loader(signal);
          const durationMs = now() - startedAt;
          if (durationMs >= SLOW_READ_MS) {
            console.warn(`[HRIS read cache] Slow ${path}: ${Math.round(durationMs)} ms`);
          }
          return { value, storedAt: now() };
        } catch (error) {
          stats.error += 1;
          throw error;
        }
      },
      staleTime: 0,
      gcTime: Math.max(ttlMs + staleMs, 1_000),
    }).then((result) => {
      try {
        if (JSON.stringify(result.value).length * 2 > MAX_ENTRY_BYTES) {
          queryClient.removeQueries({ queryKey, exact: true });
        } else {
          trim();
        }
      } catch {
        queryClient.removeQueries({ queryKey, exact: true });
      }
      return result;
    });

    if (!forceRefresh && age < ttlMs + staleMs) {
      stats.stale += 1;
      void fetch().catch(() => {});
      return state.data.value;
    }

    if (state?.fetchStatus === "fetching") stats.coalesced += 1;
    else stats.miss += 1;
    const result = await fetch();
    return result.value;
  }

  function invalidate(filter) {
    if (!filter) {
      generation += 1;
      queryClient.removeQueries({ queryKey: ["hris"] });
      return;
    }
    const matcher = typeof filter === "function"
      ? filter
      : filter instanceof RegExp
      ? (path) => filter.test(path)
      : (path) => path === filter;

    const queries = queryClient.getQueryCache().getAll();
    for (const query of queries) {
      if (query.queryKey[0] === "hris") {
        const queryPath = query.queryKey[3];
        if (matcher(queryPath)) {
          queryClient.removeQueries({ queryKey: query.queryKey, exact: true });
        }
      }
    }
  }

  return { get, invalidate, getStats: () => ({ ...stats, queries: queryClient.getQueryCache().getAll().length }), queryClient };
}

export const hrisQueryCache = createHrisQueryCache();
