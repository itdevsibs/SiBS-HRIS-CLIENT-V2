import React from "react";
import { RotateCcw } from "lucide-react";

import {
  DataCard,
  ResponsiveTableShell,
  SearchInput,
  SelectDropdown,
  StatusBadge as SharedStatusBadge,
  TablePagination,
} from "../../ui";
import { formatDate } from "../../../lib/utils/Dashboards/TADashboard/taDashboardHelpers.js";

const ROLE_PAGE_SIZE = 6;

const STATUS_OPTIONS = [
  { label: "All Statuses", value: "All" },
  { label: "On Track", value: "On Track" },
  { label: "At Risk", value: "At Risk" },
  { label: "Delayed", value: "Delayed" },
];

function StatusBadge({ status }) {
  return <SharedStatusBadge status={status || "Unknown"} showDot={false} />;
}

function RiskBadge({ riskFlag }) {
  const status = `${String(riskFlag || "None").trim()} Risk`;

  return (
    <SharedStatusBadge status={status} prefix="Risk: " showDot={false} />
  );
}

function RoleMobileCard({ role, onViewRole, delay = 0 }) {
  return (
    <DataCard
      interactive
      onClick={() => onViewRole(role)}
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: "both",
      }}
    >
      <DataCard.Header
        title={role.roleTitle}
        subtitle={role.account}
        badge={
          <div className="flex shrink-0 flex-col items-end gap-1">
            <StatusBadge status={role.status} />
            <RiskBadge riskFlag={role.riskFlag} />
          </div>
        }
      />

      <DataCard.Metrics cols={3}>
        <DataCard.MetricItem
          label="Req."
          value={Number(role.req || 0)}
          tone="navy"
        />
        <DataCard.MetricItem
          label="Filled"
          value={Number(role.filled || 0)}
          tone="emerald"
        />
        <DataCard.MetricItem
          label="Open"
          value={Number(role.open || 0)}
          tone="orange"
        />
      </DataCard.Metrics>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-sibs-border pt-2.5 text-[10px] font-semibold text-sibs-muted">
        <div>
          <span>
            Owner: <strong className="text-sibs-navy">{role.taOwner || "Unassigned"}</strong>
          </span>
          {role.dueDate ? (
            <span className="ml-2 text-sibs-faint">
              Due: <strong className="font-semibold text-sibs-muted">{formatDate(role.dueDate)}</strong>
            </span>
          ) : null}
        </div>
        <span>
          Aging: <strong className="text-sibs-navy">{Number(role.aging || 0)}d</strong>
        </span>
      </div>
    </DataCard>
  );
}

export default function TARoleHiringStatus({
  roles = [],
  totalRoles = 0,
  loading = false,
  searchInput,
  onSearchChange,
  onSearchKeyDown,
  pageSize = ROLE_PAGE_SIZE,
  status,
  onStatusChange,
  hasActiveFilters,
  onClearFilters,
  onViewRole,
  currentPage,
  totalPages,
  onPageChange,
  delay = 0,
}) {
  return (
    <section
      className="sibs-page-card-in sibs-card flex h-full w-full flex-col justify-between overflow-hidden"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="border-b border-sibs-border p-4 sm:p-5 2xl:p-6">
        <h3 className="sibs-card-title">
          Role Hiring Status
        </h3>
        <p className="sibs-card-subtitle mt-1">
          Detailed recruitment telemetry per requisition
        </p>

        <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-end">
          <SearchInput
            value={searchInput}
            onChange={onSearchChange}
            onKeyDown={onSearchKeyDown}
            placeholder="Search by role, account, department, owner, status, or risk..."
            ariaLabel="Search by role, account, department, owner, status, or risk"
            inputClassName="h-8.5 2xl:h-10"
            className="min-w-0 flex-1"
          />
          <SelectDropdown
            label="Status"
            value={status || "All"}
            options={STATUS_OPTIONS}
            onChange={onStatusChange}
            clearable={false}
            className="xl:w-[190px]"
          />
          <button
            type="button"
            onClick={onClearFilters}
            disabled={!hasActiveFilters}
            className="sibs-btn-secondary !h-8.5 2xl:!h-10 !px-3 sibs-text-xs w-full xl:w-auto"
          >
            <RotateCcw size={14} />
            Clear
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between p-4 sm:p-5 2xl:p-6">
        <ResponsiveTableShell
          mobileView={
            loading ? (
              <DataCard.Skeleton count={4} lines={2} />
            ) : roles.length === 0 ? (
              <DataCard.Empty
                title="No Hiring Roles Found"
                description="No roles match the current search and status filter."
              />
            ) : (
              roles.map((role, index) => (
                <RoleMobileCard
                  key={role.id || role.roleAccount}
                  role={role}
                  onViewRole={onViewRole}
                  delay={index * 40}
                />
              ))
            )
          }
          desktopView={
            <div className="sibs-data-table-shell overflow-x-auto">
              <div className="max-h-[480px] overflow-auto sibs-scrollbar">
                <table className="w-full min-w-[920px] border-collapse bg-white text-left text-xs">
                  <thead className="sibs-data-table-head">
                    <tr className="sibs-data-table-head-row">
                      <th className="sibs-data-table-th text-left px-3 2xl:px-4 py-2.5 2xl:py-3">
                        Role / Account
                      </th>
                      <th className="sibs-data-table-th text-center px-3 2xl:px-4 py-2.5 2xl:py-3">Req.</th>
                      <th className="sibs-data-table-th text-center px-3 2xl:px-4 py-2.5 2xl:py-3">Filled</th>
                      <th className="sibs-data-table-th text-center px-3 2xl:px-4 py-2.5 2xl:py-3">Open</th>
                      <th className="sibs-data-table-th text-left px-3 2xl:px-4 py-2.5 2xl:py-3">Due Date</th>
                      <th className="sibs-data-table-th text-left px-3 2xl:px-4 py-2.5 2xl:py-3">Status</th>
                      <th className="sibs-data-table-th text-left px-3 2xl:px-4 py-2.5 2xl:py-3">TA Owner</th>
                      <th className="sibs-data-table-th text-center px-3 2xl:px-4 py-2.5 2xl:py-3">Aging</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-sibs-border">
                    {loading ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-5 py-12 text-center font-semibold text-sibs-muted"
                        >
                          Loading hiring roles...
                        </td>
                      </tr>
                    ) : roles.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-5 py-12 text-center font-semibold text-sibs-muted"
                        >
                          No roles match the current search and status filter.
                        </td>
                      </tr>
                    ) : (
                      roles.map((role, index) => (
                        <tr
                          key={role.id || role.roleAccount}
                          role="button"
                          tabIndex={0}
                          onClick={() => onViewRole(role)}
                          onKeyDown={(event) => {
                            if (event.key !== "Enter" && event.key !== " ") return;
                            event.preventDefault();
                            onViewRole(role);
                          }}
                          className="sibs-data-table-row sibs-page-card-in"
                          style={{
                            animationDelay: `${index * 35}ms`,
                            animationFillMode: "both",
                          }}
                          aria-label={`Open details for ${role.roleTitle}`}
                        >
                          <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 align-middle">
                            <strong className="block text-xs font-extrabold leading-snug text-sibs-navy">
                              {role.roleTitle}
                            </strong>
                            <span className="mt-0.5 block text-[11px] font-semibold leading-snug text-sibs-muted">
                              {role.account}
                            </span>
                          </td>
                          <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 text-center font-extrabold tabular-nums text-sibs-navy">
                            {role.req}
                          </td>
                          <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 text-center font-extrabold tabular-nums text-sibs-success">
                            {role.filled}
                          </td>
                          <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 text-center font-extrabold tabular-nums text-sibs-orange">
                            {role.open}
                          </td>
                          <td className="whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5 font-bold text-sibs-text-secondary">
                            {formatDate(role.dueDate)}
                          </td>
                          <td className="px-3 2xl:px-4 py-2 2xl:py-2.5">
                            <div className="flex flex-col items-start gap-1">
                              <StatusBadge status={role.status} />
                              <RiskBadge riskFlag={role.riskFlag} />
                            </div>
                          </td>
                          <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 font-bold text-sibs-text-secondary">
                            {role.taOwner}
                          </td>
                          <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 text-center font-extrabold tabular-nums text-sibs-text-secondary">
                            {role.aging}d
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          }
        />

        <TablePagination
          className="mt-4"
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          loadedCount={roles.length}
          totalRecords={totalRoles}
          limit={pageSize}
          recordLabel="roles"
          onPageChange={onPageChange}
        />
      </div>
    </section>
  );
}
