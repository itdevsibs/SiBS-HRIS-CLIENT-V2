import React from "react";
import { Lock } from "lucide-react";

import {
  DataCard,
  ResponsiveTableShell,
  SearchInput,
  SelectDropdown,
  TablePagination,
} from "@/components/ui";
import {
  ACCESS_HIERARCHY,
  getAccessLevelClass,
  getStatusPillClass,
} from "../../../lib/utils/Dashboards/SuperAdminDashboard/superAdminDashboardHelpers.js";

function getAccessDisplayName(value) {
  const text = String(value ?? "").trim();
  return text.replace(/^\d+\s*-\s*/, "");
}

export default function SuperAdminAccessGovernance({
  admins,
  totalItems,
  pagination,
  searchInput = "",
  onSearchChange,
  onSearchKeyDown,
  accessLevel = "All Access Levels",
  account = "All Accounts",
  status = "All Statuses",
  accessOptions = [],
  accountOptions = [],
  statusOptions = [],
  onFilterChange,
}) {
  const formattedAccessOptions = React.useMemo(() => {
    const hasAll = accessOptions.some(
      (opt) =>
        (typeof opt === "string" ? opt : opt.value) === "All Access Levels",
    );
    const mapped = accessOptions.map((opt) => {
      if (typeof opt === "string") {
        return { value: opt, label: getAccessDisplayName(opt) };
      }

      return {
        ...opt,
        label: getAccessDisplayName(opt.label ?? opt.value),
      };
    });
    return hasAll
      ? mapped
      : [{ value: "All Access Levels", label: "All Access Levels" }, ...mapped];
  }, [accessOptions]);

  const formattedAccountOptions = React.useMemo(() => {
    const hasAll = accountOptions.some(
      (opt) => (typeof opt === "string" ? opt : opt.value) === "All Accounts",
    );
    const mapped = accountOptions.map((opt) =>
      typeof opt === "string" ? { value: opt, label: opt } : opt,
    );
    return hasAll
      ? mapped
      : [{ value: "All Accounts", label: "All Accounts" }, ...mapped];
  }, [accountOptions]);

  const formattedStatusOptions = React.useMemo(() => {
    const hasAll = statusOptions.some(
      (opt) => (typeof opt === "string" ? opt : opt.value) === "All Statuses",
    );
    const mapped = statusOptions.map((opt) =>
      typeof opt === "string" ? { value: opt, label: opt } : opt,
    );
    return hasAll
      ? mapped
      : [{ value: "All Statuses", label: "All Statuses" }, ...mapped];
  }, [statusOptions]);
  return (
    <div className="space-y-4 2xl:space-y-5 font-jakarta">
      <section
        className="sibs-page-card-in rounded-xl border border-sibs-border bg-sibs-surface p-3 2xl:p-3.5"
        style={{ animationDelay: "240ms", animationFillMode: "both" }}
      >
        <h2 className="sibs-section-title flex items-center gap-1.5 2xl:gap-2">
          <Lock size={14} className="text-sibs-orange" />
          User Access Levels Hierarchy
        </h2>

        <div className="mt-2 2xl:mt-2.5 grid grid-cols-2 gap-1.5 2xl:gap-2 sm:grid-cols-5 xl:grid-cols-10">
          {ACCESS_HIERARCHY.map(([level, description], index) => {
            const superAdmin = String(level).startsWith("7");

            return (
              <div
                key={level}
                className={`sibs-page-card-in rounded-lg border p-1.5 2xl:p-2 text-center ${
                  superAdmin
                    ? "border-sibs-navy bg-sibs-navy text-white"
                    : "border-sibs-border bg-white text-sibs-navy"
                }`}
                style={{
                  animationDelay: `${index * 35}ms`,
                  animationFillMode: "both",
                }}
              >
                <span
                  className={`block text-[9px] 2xl:text-[10px] font-extrabold whitespace-nowrap truncate ${
                    superAdmin ? "text-sibs-orange" : ""
                  }`}
                >
                  {getAccessDisplayName(level)}
                </span>
                <span
                  className={`mt-0.5 block text-[8px] 2xl:text-[9px] font-semibold leading-3.5 line-clamp-2 ${
                    superAdmin ? "text-slate-200" : "text-sibs-muted"
                  }`}
                >
                  {description}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-base 2xl:text-lg font-bold text-sibs-navy tracking-tight">
            User Accounts &amp; Access Levels ({totalItems})
          </h2>
          <p className="sibs-text-xs font-semibold text-sibs-muted">
            View assigned account mappings, access tiers, and user status.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
        <div className="w-full lg:w-72 2xl:w-80">
          <SearchInput
            value={searchInput}
            onChange={(val) => onSearchChange?.(val)}
            onClear={() => onSearchChange?.("")}
            onKeyDown={onSearchKeyDown}
            placeholder="Search user name or email..."
            ariaLabel="Search user name or email"
          />
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 lg:flex lg:flex-1 lg:items-center">
          <div className="w-full lg:w-48 2xl:w-56">
            <SelectDropdown
              label="Access Level"
              hideLabel
              value={accessLevel}
              options={formattedAccessOptions}
              onChange={(val) => onFilterChange?.("accessLevel", val)}
              searchable={false}
              clearable={false}
              triggerClassName="w-full"
            />
          </div>

          <div className="w-full lg:w-48 2xl:w-56">
            <SelectDropdown
              label="Account Group"
              hideLabel
              value={account}
              options={formattedAccountOptions}
              onChange={(val) => onFilterChange?.("account", val)}
              searchable
              clearable={false}
              triggerClassName="w-full"
            />
          </div>

          <div className="w-full lg:w-40 2xl:w-44">
            <SelectDropdown
              label="Status"
              hideLabel
              value={status}
              options={formattedStatusOptions}
              onChange={(val) => onFilterChange?.("status", val)}
              searchable={false}
              clearable={false}
              triggerClassName="w-full"
            />
          </div>
        </div>
      </div>

      <ResponsiveTableShell
        mobileView={
          admins.length > 0 ? (
            admins.map((item, index) => (
              <DataCard
                key={item.id}
                interactive={false}
                style={{
                  animationDelay: `${index * 40}ms`,
                  animationFillMode: "both",
                }}
              >
                <DataCard.Header
                  title={item.name}
                  subtitle={item.email}
                  badge={
                    <span
                      className={`inline-flex items-center justify-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold capitalize ${getStatusPillClass(
                        item.status,
                      )}`}
                    >
                      {item.status}
                    </span>
                  }
                />

                <DataCard.Metrics cols={2}>
                  <DataCard.MetricItem
                    label="Access Level"
                    value={getAccessDisplayName(item.accessLevel)}
                    tone="orange"
                  />
                  <DataCard.MetricItem
                    label="Account Group"
                    value={item.accountGroup}
                    tone="navy"
                  />
                </DataCard.Metrics>

                <div className="mt-3 flex items-center justify-between border-t border-sibs-border pt-2.5 text-[10px] font-semibold text-sibs-muted">
                  <div className="flex flex-col">
                    <span>
                      Dept: <strong className="text-sibs-navy">{item.department || "—"}</strong>
                    </span>
                    <span className="text-[9.5px] text-sibs-faint">
                      Last active: {item.lastActive || "—"}
                    </span>
                  </div>
                </div>
              </DataCard>
            ))
          ) : (
            <DataCard.Empty
              title="No User Accounts Found"
              description="No users match the active filters."
            />
          )
        }
        desktopView={
          <div className="overflow-hidden rounded-xl border border-sibs-border bg-white">
            <div className="max-h-[520px] overflow-auto sibs-scrollbar">
              <table className="w-full min-w-[1020px] table-fixed border-collapse bg-white text-left text-xs">
                <colgroup>
                  <col className="w-[22%]" />
                  <col className="w-[16%]" />
                  <col className="w-[20%]" />
                  <col className="w-[25%]" />
                  <col className="w-[9%]" />
                  <col className="w-[8%]" />
                </colgroup>
                <thead className="sibs-data-table-head">
                  <tr className="sibs-data-table-head-row">
                    <th className="sibs-data-table-th text-left px-3 2xl:px-4 py-2.5 2xl:py-3">Name & Email</th>
                    <th className="sibs-data-table-th text-left px-3 2xl:px-4 py-2.5 2xl:py-3">Access Level</th>
                    <th className="sibs-data-table-th text-left px-3 2xl:px-4 py-2.5 2xl:py-3">Department</th>
                    <th className="sibs-data-table-th text-left px-3 2xl:px-4 py-2.5 2xl:py-3">Account Group</th>
                    <th className="sibs-data-table-th text-left px-3 2xl:px-4 py-2.5 2xl:py-3">Last Active</th>
                    <th className="sibs-data-table-th text-left px-3 2xl:px-4 py-2.5 2xl:py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sibs-border">
                  {admins.length > 0 ? (
                    admins.map((item, index) => (
                      <tr
                        key={item.id}
                        className="sibs-data-table-row sibs-page-card-in hover:bg-sibs-cream-light/60 transition-colors"
                        style={{
                          animationDelay: `${index * 35}ms`,
                          animationFillMode: "both",
                        }}
                      >
                        <td className="px-3 2xl:px-4 py-2 2xl:py-2.5">
                          <p className="font-extrabold text-sibs-navy truncate">{item.name}</p>
                          <p className="mt-0.5 text-[10px] font-semibold text-sibs-faint truncate">
                            {item.email}
                          </p>
                        </td>
                        <td className="px-3 2xl:px-4 py-2 2xl:py-2.5">
                          <span
                            className={`inline-flex items-center justify-center whitespace-nowrap rounded-full px-2.5 py-1 text-[9.5px] 2xl:text-[10px] font-extrabold ${getAccessLevelClass(
                              item.accessLevel,
                            )}`}
                          >
                            {getAccessDisplayName(item.accessLevel)}
                          </span>
                        </td>
                        <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 font-semibold text-sibs-secondary truncate">
                          {item.department}
                        </td>
                        <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 text-sibs-muted truncate">{item.accountGroup}</td>
                        <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 text-[10px] text-sibs-faint whitespace-nowrap">
                          {item.lastActive}
                        </td>
                        <td className="px-3 2xl:px-4 py-2 2xl:py-2.5">
                          <span
                            className={`inline-flex items-center justify-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[9.5px] 2xl:text-[10px] font-extrabold capitalize ${getStatusPillClass(
                              item.status,
                            )}`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-xs font-bold text-sibs-muted">
                        No users match the active filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        }
      />

      <TablePagination
        currentPage={pagination?.currentPage || 1}
        totalPages={pagination?.totalPages || 1}
        loadedCount={admins.length}
        totalItems={totalItems}
        itemName="users"
        onPageChange={pagination?.onPageChange}
      />
    </div>
  );
}

