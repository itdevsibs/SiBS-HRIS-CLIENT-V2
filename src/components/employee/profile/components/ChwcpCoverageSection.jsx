import { useCallback, useEffect, useState } from "react";
import {
  Eye,
  HeartPulse,
  Hospital,
  Pill,
  RefreshCcw,
  Smile,
} from "lucide-react";

import {
  getEmployeeChwcpCoverage,
  getMyChwcpCoverage,
} from "../../../../lib/axios/getChwcp";
import { useUser } from "../../../../services/context/UserContext";

function normalizeSibsId(value) {
  return String(value ?? "").trim().toLowerCase();
}

function getCurrentUserSibsId(user = {}) {
  return normalizeSibsId(
    user?.sibsId ||
      user?.sibs_id ||
      user?.employeeSibsId ||
      user?.employee_sibs_id ||
      user?.gy_emp_code ||
      user?.gy_user_code ||
      user?.userCode ||
      user?.user_code ||
      user?.employeeCode ||
      user?.employee_code ||
      user?.username ||
      "",
  );
}

const COVERAGE_ICONS = {
  medical: HeartPulse,
  hospicash: Hospital,
  "prescribed-medication": Pill,
  dental: Smile,
  vision: Eye,
};

function formatCurrency(value) {
  const amount = Number(value);

  return `₱ ${Number.isFinite(amount) ? amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) : "0.00"}`;
}

function formatDate(value) {
  const text = String(value ?? "").trim();
  if (!text) return "N/A";

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) return text;

  const parsed = new Date(
    `${match[1]}-${match[2]}-${match[3]}T00:00:00+08:00`,
  );

  if (Number.isNaN(parsed.getTime())) return text;

  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function CoverageRow({ item }) {
  const Icon = COVERAGE_ICONS[item?.key] || HeartPulse;
  const used = Math.max(0, Number(item?.used || 0));
  const total = Math.max(0, Number(item?.total || 0));
  const percentage =
    total > 0 ? Math.min((used / total) * 100, 100) : used > 0 ? 100 : 0;

  return (
    <div className="flex items-center gap-3 sm:gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F1F5F9] text-[#042C51] sm:h-11 sm:w-11">
        <Icon size={21} strokeWidth={1.9} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3">
          <div className="relative hidden h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[#E4EAF1] sm:block">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-[#042C51] transition-[width] duration-500 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>

          <span className="ml-auto shrink-0 whitespace-nowrap text-[10px] font-extrabold tabular-nums text-[#042C51] sm:text-[11px]">
            {formatCurrency(used)} / {formatCurrency(total)}
          </span>
        </div>

        <p className="mt-1.5 text-xs font-bold text-[#042C51]">
          {item?.label || "Coverage"}
        </p>
      </div>
    </div>
  );
}

function CoverageCard({ title, accentText, items }) {
  return (
    <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm sm:p-6">
      <h3 className="text-base font-black text-[#042C51] sm:text-lg">
        {title}
        {accentText ? (
          <>
            {" "}
            <span className="text-[#FF5C28]">{accentText}</span>
          </>
        ) : null}
      </h3>

      <div className="mt-5 space-y-6">
        {(items || []).map((item) => (
          <CoverageRow key={item.key || item.label} item={item} />
        ))}
      </div>
    </section>
  );
}

export default function ChwcpCoverageSection({ sibsId = "" }) {
  const { user: currentUser } = useUser();
  const selectedSibsId = normalizeSibsId(sibsId);
  const currentUserSibsId = getCurrentUserSibsId(currentUser);
  const canRedirectToChwcp =
    !selectedSibsId ||
    (Boolean(currentUserSibsId) && selectedSibsId === currentUserSibsId);

  const [coverage, setCoverage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadCoverage = useCallback(async ({ silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const result = sibsId
        ? await getEmployeeChwcpCoverage(sibsId)
        : await getMyChwcpCoverage();
      setCoverage(result?.data || null);
    } catch (loadError) {
      setCoverage(null);
      setError(loadError?.message || "Failed to load CHWCP coverage.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sibsId]);

  useEffect(() => {
    void loadCoverage();
  }, [loadCoverage]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-36 animate-pulse rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC]" />
        <div className="h-72 animate-pulse rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-8 text-center">
        <p className="text-sm font-black text-red-700">
          Unable to load CHWCP coverage
        </p>
        <p className="mt-1 text-xs font-semibold text-red-600/80">
          {error}
        </p>
        <button
          type="button"
          onClick={() => loadCoverage()}
          className="mt-4 inline-flex h-9 items-center gap-2 rounded-xl bg-[#042C51] px-4 text-xs font-extrabold text-white transition hover:bg-[#063B69]"
        >
          <RefreshCcw size={14} />
          Retry
        </button>
      </div>
    );
  }

  if (!coverage?.eligible) {
    return (
      <div className="rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] px-5 py-10 text-center">
        <HeartPulse size={32} className="mx-auto text-[#98A2B3]" />
        <p className="mt-3 text-sm font-black text-[#042C51]">
          CHWCP coverage is currently unavailable
        </p>
        <p className="mx-auto mt-1 max-w-xl text-xs font-semibold leading-5 text-[#667085]">
          Coverage is available to regular employees based on the CHWCP
          eligibility and fiscal-period rules.
        </p>
      </div>
    );
  }

  const employeeName =
    String(coverage?.employee?.name || "").trim() || "Employee";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 py-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-[#7B8DB3]">
            CHWCP Coverage Period
          </p>
          <p className="mt-0.5 text-xs font-extrabold text-[#042C51]">
            {formatDate(coverage?.fiscalPeriod?.start)} –{" "}
            {formatDate(coverage?.fiscalPeriod?.end)}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {canRedirectToChwcp ? (
            <a
              href="https://chwcp.mysibs.info/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 items-center justify-center rounded-lg border border-[#D6DEE8] bg-white px-3 text-[10px] font-extrabold text-[#042C51] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF7F3] hover:text-[#FF5C28]"
            >
              Redirect to CHWCP Site
            </a>
          ) : null}

          <button
            type="button"
            onClick={() => loadCoverage({ silent: true })}
            disabled={refreshing}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E6ECF2] bg-white text-[#042C51] transition hover:border-[#FF5C28]/40 hover:text-[#FF5C28] disabled:opacity-50"
            title="Refresh CHWCP coverage"
            aria-label="Refresh CHWCP coverage"
          >
            <RefreshCcw
              size={14}
              className={refreshing ? "animate-spin" : ""}
            />
          </button>
        </div>
      </div>

      <CoverageCard
        title="Shared"
        accentText="Coverage"
        items={coverage?.sharedCoverage || []}
      />

      <CoverageCard
        title="My Personal Coverage"
        accentText={`(${employeeName})`}
        items={coverage?.personalCoverage || []}
      />
    </div>
  );
}
