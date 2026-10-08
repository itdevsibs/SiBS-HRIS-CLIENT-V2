import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  UsersRound,
  WalletCards,
} from "lucide-react";

import ModalShell from "../../ui/ModalShell";
import SearchInput from "../../ui/SearchInput";
import { getFinanceStatutoryEmployees } from "../../../lib/axios/getFinanceDashboard";

const PAGE_SIZE = 15;

const AVATAR_TONES = [
  "border-orange-100 bg-orange-50 text-sibs-orange",
  "border-emerald-100 bg-emerald-50 text-emerald-700",
  "border-blue-100 bg-blue-50 text-sibs-navy",
  "border-pink-100 bg-pink-50 text-pink-700",
  "border-violet-100 bg-violet-50 text-violet-700",
];

function cleanText(value) {
  return String(value ?? "").trim();
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-PH", {
    maximumFractionDigits: 0,
  });
}

function formatEmployeeName(employee = {}) {
  const lastName = cleanText(employee.lastName);
  const firstName = cleanText(employee.firstName);
  const middleName = cleanText(employee.middleName);

  if (lastName && firstName) {
    return `${lastName}, ${firstName}${middleName ? ` ${middleName}` : ""}`;
  }

  return [firstName, middleName, lastName].filter(Boolean).join(" ") || "Unnamed Employee";
}

function getEmployeeInitials(employee = {}) {
  const firstName = cleanText(employee.firstName);
  const lastName = cleanText(employee.lastName);

  if (firstName || lastName) {
    return `${firstName.slice(0, 1)}${lastName.slice(0, 1)}`.toUpperCase();
  }

  const tokens = formatEmployeeName(employee)
    .replace(",", " ")
    .split(/\s+/)
    .filter(Boolean);

  return `${tokens[0]?.[0] || "E"}${tokens[1]?.[0] || ""}`.toUpperCase();
}

function getAvatarTone(employee = {}) {
  const seed = formatEmployeeName(employee)
    .split("")
    .reduce((total, character) => total + character.charCodeAt(0), 0);

  return AVATAR_TONES[seed % AVATAR_TONES.length];
}

function getEmployeeProfilePictureUrl(employee = {}) {
  return cleanText(
    employee.profilePictureUrl ||
      employee.profile_picture_url ||
      employee.profilePicture ||
      employee.profile_picture,
  );
}

function getAvatarPreviewPosition(element) {
  if (!element || typeof window === "undefined") return null;

  const rect = element.getBoundingClientRect();
  const previewHeight = 176;
  const gap = 12;
  const placeBelow = rect.top < previewHeight + gap;

  return {
    left: rect.left + rect.width / 2,
    top: placeBelow ? rect.bottom + gap : rect.top - gap,
    placeBelow,
  };
}

function EmployeeAvatar({ employee }) {
  const profilePictureUrl = getEmployeeProfilePictureUrl(employee);
  const [failedImageUrl, setFailedImageUrl] = useState("");
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewPosition, setPreviewPosition] = useState(null);
  const avatarRef = useRef(null);
  const initials = getEmployeeInitials(employee);
  const avatarTone = getAvatarTone(employee);
  const employeeName = formatEmployeeName(employee);
  const showImage =
    Boolean(profilePictureUrl) && failedImageUrl !== profilePictureUrl;

  const showPreview = () => {
    setPreviewPosition(getAvatarPreviewPosition(avatarRef.current));
    setPreviewVisible(true);
  };

  const hidePreview = () => {
    setPreviewVisible(false);
  };

  useEffect(() => {
    if (!previewVisible) return undefined;

    const updatePreviewPosition = () => {
      setPreviewPosition(getAvatarPreviewPosition(avatarRef.current));
    };

    window.addEventListener("resize", updatePreviewPosition);
    window.addEventListener("scroll", updatePreviewPosition, true);

    return () => {
      window.removeEventListener("resize", updatePreviewPosition);
      window.removeEventListener("scroll", updatePreviewPosition, true);
    };
  }, [previewVisible]);

  const preview =
    previewVisible && previewPosition && typeof document !== "undefined"
      ? createPortal(
          <span
            className="employee-avatar-preview pointer-events-none fixed z-[9999] rounded-2xl border border-sibs-border bg-white p-2 shadow-[0_18px_45px_rgba(4,44,81,0.22)]"
            style={{
              left: previewPosition.left,
              top: previewPosition.top,
              transform: previewPosition.placeBelow
                ? "translate(-50%, 0)"
                : "translate(-50%, -100%)",
            }}
            aria-hidden="true"
          >
            <span
              className={`relative flex h-40 w-40 items-center justify-center overflow-hidden rounded-xl border text-[24px] font-extrabold ${avatarTone}`}
            >
              <span>{initials}</span>
              {showImage ? (
                <img
                  src={profilePictureUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  onError={() => setFailedImageUrl(profilePictureUrl)}
                />
              ) : null}
            </span>
          </span>,
          document.body,
        )
      : null;

  return (
    <>
      <span
        ref={avatarRef}
        className="relative inline-flex shrink-0 outline-none"
        tabIndex={0}
        aria-label={`${employeeName || "Employee"} profile picture`}
        onMouseEnter={showPreview}
        onMouseLeave={hidePreview}
        onFocus={showPreview}
        onBlur={hidePreview}
      >
        <span
          className={`relative inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border text-[10px] font-extrabold shadow-inner ${avatarTone}`}
        >
          <span aria-hidden="true">{initials}</span>
          {showImage ? (
            <img
              src={profilePictureUrl}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
              onError={() => setFailedImageUrl(profilePictureUrl)}
            />
          ) : null}
        </span>
      </span>
      {preview}
    </>
  );
}

function SummaryCard({ label, value, tone = "navy" }) {
  const valueClass =
    tone === "success"
      ? "text-emerald-700"
      : tone === "warning"
        ? "text-[#D94816]"
        : "text-sibs-navy";

  return (
    <div className="rounded-xl border border-sibs-border bg-white px-4 py-4 text-center">
      <p className="text-[10px] font-extrabold uppercase tracking-wide text-sibs-muted">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-black ${valueClass}`}>{value}</p>
    </div>
  );
}

function TabButton({ active, count, icon: Icon, label, tone, onClick }) {
  const activeClass =
    tone === "complete"
      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
      : "border-[#FFB49D] bg-[#FFF4EF] text-[#D94816]";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-w-[145px] items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-xs font-extrabold transition ${
        active
          ? activeClass
          : "border-sibs-border bg-white text-sibs-muted hover:border-sibs-orange/40 hover:text-sibs-navy"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
      <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black shadow-sm ring-1 ring-black/5">
        {formatNumber(count)}
      </span>
    </button>
  );
}

export default function StatutoryCoverageModal({
  open,
  onClose,
  benefit,
  label,
  coverage,
}) {
  const [activeTab, setActiveTab] = useState("complete");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setActiveTab("complete");
    setSearch("");
    setDebouncedSearch("");
    setPage(1);
    setEmployees([]);
    setError("");
  }, [open, benefit]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!open || !benefit) return undefined;

    let cancelled = false;

    const loadEmployees = async () => {
      setLoading(true);
      setError("");

      try {
        const payload = await getFinanceStatutoryEmployees({
          benefit,
          status: activeTab,
          search: debouncedSearch,
          page,
          limit: PAGE_SIZE,
        });

        if (cancelled) return;

        setEmployees(Array.isArray(payload?.employees) ? payload.employees : []);
        setPagination({
          page: Number(payload?.pagination?.page || page),
          limit: Number(payload?.pagination?.limit || PAGE_SIZE),
          total: Number(payload?.pagination?.total || 0),
          totalPages: Math.max(1, Number(payload?.pagination?.totalPages || 1)),
        });
      } catch (loadError) {
        if (cancelled) return;
        setEmployees([]);
        setError(
          loadError?.response?.data?.message ||
            loadError?.message ||
            `Unable to load ${label || "statutory"} employees.`,
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadEmployees();

    return () => {
      cancelled = true;
    };
  }, [open, benefit, label, activeTab, debouncedSearch, page]);

  const completeCount = Number(coverage?.count || 0);
  const missingCount = Number(coverage?.missing || 0);
  const totalCount = completeCount + missingCount;
  const coverageRate = totalCount > 0 ? (completeCount / totalCount) * 100 : 0;

  const tabCount = useMemo(
    () => (activeTab === "complete" ? completeCount : missingCount),
    [activeTab, completeCount, missingCount],
  );

  const safePage = Math.min(
    Math.max(Number(pagination.page || 1), 1),
    Math.max(Number(pagination.totalPages || 1), 1),
  );

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={`${label || "Statutory"} Coverage`}
      subtitle={`${formatNumber(totalCount)} active employee${totalCount === 1 ? "" : "s"} included in this statutory coverage.`}
      icon={ShieldCheck}
      badge="Finance · Active Employees"
      maxWidth="max-w-6xl"
      className="sibs-finance-statutory-modal"
      headerClassName="sibs-finance-statutory-modal-header"
      bodyClassName="max-h-[72vh] overflow-y-auto"
      closeOnBackdrop={false}
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-xs font-extrabold text-sibs-muted">
            <WalletCards className="h-4 w-4 text-emerald-600" />
            Active employee statutory coverage from SiBS HRIS
          </span>

          <button type="button" className="sibs-btn-primary !text-sm" onClick={onClose}>
            Close Coverage
          </button>
        </div>
      }
    >
      <style>{`
        .sibs-finance-statutory-modal .sibs-modal-title {
          font-size: 1.25rem !important;
          line-height: 1.75rem !important;
        }

        .sibs-finance-statutory-modal .sibs-modal-subtitle {
          font-size: 0.875rem !important;
          line-height: 1.25rem !important;
        }

        .sibs-finance-statutory-modal-header span.rounded-full {
          font-size: 0.625rem !important;
          line-height: 0.875rem !important;
        }

        .sibs-finance-statutory-search {
          width: 100% !important;
          max-width: 340px !important;
          flex: 0 1 340px !important;
        }

        @media (max-width: 767px) {
          .sibs-finance-statutory-search {
            max-width: none !important;
            flex-basis: 100% !important;
          }
        }
      `}</style>

      <div className="space-y-5">
        <div className="flex flex-col gap-3 rounded-xl border border-sibs-border bg-sibs-surface p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#EAF2FF] text-sibs-navy">
              <ShieldCheck className="h-6 w-6" />
            </span>

            <div className="min-w-0">
              <p className="sibs-field-label !text-xs">Statutory Requirement</p>
              <p className="text-base font-extrabold text-sibs-navy">
                {label || "Statutory Coverage"}
              </p>
              <p className="text-xs font-semibold text-sibs-muted">
                Complete and missing status is based on active employee records. Government ID values remain hidden.
              </p>
            </div>
          </div>

          <span
            className={`inline-flex self-start items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-extrabold sm:self-auto ${
              coverageRate >= 100
                ? "bg-emerald-100 text-emerald-700"
                : "bg-[#FFF1EC] text-[#D94816]"
            }`}
          >
            {coverageRate >= 100 ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            {coverageRate.toFixed(1)}% Complete
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryCard label="Complete" value={formatNumber(completeCount)} tone="success" />
          <SummaryCard label="Missing" value={formatNumber(missingCount)} tone="warning" />
          <SummaryCard label="Coverage Rate" value={`${coverageRate.toFixed(1)}%`} tone="success" />
        </div>

        <section>
          <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <UsersRound className="h-4 w-4 text-sibs-orange" />
                <h3 className="text-base font-extrabold text-sibs-navy">
                  Employee Coverage Directory
                </h3>
              </div>
              <p className="mt-1 text-xs font-semibold text-sibs-muted">
                Switch between employees with completed records and employees still missing this requirement.
              </p>
            </div>

            <span className="self-start rounded-lg border border-sibs-border bg-sibs-surface px-3 py-2 text-xs font-extrabold text-sibs-secondary lg:self-auto">
              {formatNumber(tabCount)} employee{tabCount === 1 ? "" : "s"}
            </span>
          </div>

          <div className="overflow-hidden rounded-xl border border-sibs-border bg-white">
            <div className="border-b border-sibs-border bg-sibs-surface px-4 py-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap gap-2">
                  <TabButton
                    active={activeTab === "complete"}
                    count={completeCount}
                    icon={CheckCircle2}
                    label="Complete"
                    tone="complete"
                    onClick={() => {
                      setActiveTab("complete");
                      setPage(1);
                    }}
                  />
                  <TabButton
                    active={activeTab === "missing"}
                    count={missingCount}
                    icon={AlertCircle}
                    label="Missing"
                    tone="missing"
                    onClick={() => {
                      setActiveTab("missing");
                      setPage(1);
                    }}
                  />
                </div>

                <SearchInput
                  value={search}
                  onChange={(value) => setSearch(value)}
                  onClear={() => setSearch("")}
                  placeholder="Search employee, SIBS ID, account..."
                  ariaLabel={`Search ${label || "statutory"} employee coverage`}
                  disabled={loading}
                  className="sibs-finance-statutory-search md:ml-auto"
                  inputClassName="!h-10 !w-full !rounded-[10px]"
                />
              </div>
            </div>

            {error ? (
              <div className="m-4 flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-6 text-center">
                <AlertCircle className="h-8 w-8 text-rose-500" />
                <p className="mt-3 text-sm font-extrabold text-rose-700">Unable to load employees</p>
                <p className="mt-1 max-w-lg text-xs font-medium text-rose-600">{error}</p>
              </div>
            ) : (
              <div className="relative min-h-[330px]">
                {loading ? (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/75 backdrop-blur-[1px]">
                    <span className="inline-flex items-center gap-2 rounded-lg border border-sibs-border bg-white px-4 py-2 text-xs font-extrabold text-sibs-muted shadow-sm">
                      <Loader2 className="h-4 w-4 animate-spin text-sibs-orange" />
                      Loading employees...
                    </span>
                  </div>
                ) : null}

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-sibs-border">
                    <thead className="bg-[#F8FAFC]">
                      <tr>
                        <th className="px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-wide text-sibs-secondary">Employee</th>
                        <th className="px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-wide text-sibs-secondary">SIBS ID</th>
                        <th className="px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-wide text-sibs-secondary">Department</th>
                        <th className="px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-wide text-sibs-secondary">Account</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sibs-border bg-white">
                      {!loading && employees.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-16 text-center">
                            <UsersRound className="mx-auto h-8 w-8 text-sibs-faint" />
                            <p className="mt-3 text-sm font-extrabold text-sibs-navy">No employees found</p>
                            <p className="mt-1 text-xs font-medium text-sibs-muted">
                              {debouncedSearch
                                ? "Try another employee, SIBS ID, department, or account search."
                                : `There are no active employees in this ${activeTab} list.`}
                            </p>
                          </td>
                        </tr>
                      ) : (
                        employees.map((employee, index) => (
                          <tr
                            key={`${employee.sibsId || "employee"}-${employee.account || "account"}-${employee.department || "department"}-${index}`}
                            className="transition hover:bg-sibs-surface/70"
                          >
                            <td className="px-4 py-3.5">
                              <div className="flex min-w-[220px] items-center gap-3">
                                <EmployeeAvatar employee={employee} />
                                <div className="min-w-0">
                                  <p className="whitespace-nowrap text-xs font-extrabold text-sibs-navy">
                                    {formatEmployeeName(employee)}
                                  </p>
                                  <p className="mt-0.5 text-[10px] font-semibold text-sibs-muted">
                                    Active Employee
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-xs font-bold text-sibs-secondary">
                              {cleanText(employee.sibsId) || "—"}
                            </td>
                            <td className="px-4 py-3.5 text-xs font-semibold text-sibs-secondary">
                              {cleanText(employee.department) || "Unassigned"}
                            </td>
                            <td className="px-4 py-3.5 text-xs font-semibold text-sibs-secondary">
                              {cleanText(employee.account) || "Unassigned"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {!error && pagination.total > 0 ? (
              <div className="flex flex-col gap-3 border-t border-sibs-border bg-sibs-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-semibold text-sibs-muted">
                  Showing {employees.length ? (safePage - 1) * PAGE_SIZE + 1 : 0}–{Math.min(safePage * PAGE_SIZE, pagination.total)} of {formatNumber(pagination.total)}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((value) => Math.max(1, value - 1))}
                    disabled={loading || safePage <= 1}
                    className="rounded-lg border border-sibs-border bg-white px-3 py-2 text-xs font-bold text-sibs-navy transition hover:border-sibs-orange/40 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="rounded-lg bg-sibs-orange px-3 py-2 text-xs font-black text-white">
                    {safePage}
                  </span>
                  <span className="text-xs font-semibold text-sibs-muted">
                    of {pagination.totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setPage((value) => Math.min(pagination.totalPages, value + 1))
                    }
                    disabled={loading || safePage >= pagination.totalPages}
                    className="rounded-lg border border-sibs-border bg-white px-3 py-2 text-xs font-bold text-sibs-navy transition hover:border-sibs-orange/40 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </ModalShell>
  );
}
