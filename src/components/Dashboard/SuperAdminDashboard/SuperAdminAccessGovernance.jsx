import { Lock, Plus } from "lucide-react";

import PaginationTable from "../../../services/pagination/PaginationTable";
import { DataCard, ResponsiveTableShell } from "../../ui";
import {
  ACCESS_HIERARCHY,
  getAccessLevelClass,
  getStatusPillClass,
} from "../../../lib/utils/Dashboards/SuperAdminDashboard/superAdminDashboardHelpers.js";

export default function SuperAdminAccessGovernance({
  admins,
  totalItems,
  pagination,
  onAddUser,
  onEditAccess,
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
  return (
    <div className="space-y-4 2xl:space-y-5 font-jakarta">
      <section
        className="sibs-page-card-in rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-3 2xl:p-3.5"
        style={{ animationDelay: "240ms", animationFillMode: "both" }}
      >
        <h2 className="sibs-section-title flex items-center gap-1.5 2xl:gap-2">
          <Lock size={14} className="text-[#FF5C28]" />
          Grounded Admin Access Levels Hierarchy
        </h2>

        <div className="mt-2 2xl:mt-2.5 grid grid-cols-2 gap-1.5 2xl:gap-2 sm:grid-cols-5 xl:grid-cols-10">
          {ACCESS_HIERARCHY.map(([level, description], index) => {
            const superAdmin = String(level).startsWith("7");

            return (
              <div
                key={level}
                className={`sibs-page-card-in rounded-lg border p-1.5 2xl:p-2 text-center ${
                  superAdmin
                    ? "border-[#042C51] bg-[#042C51] text-white"
                    : "border-[#E6ECF2] bg-white text-[#042C51]"
                }`}
                style={{
                  animationDelay: `${index * 35}ms`,
                  animationFillMode: "both",
                }}
              >
                <span
                  className={`block text-[9px] 2xl:text-[10px] font-extrabold whitespace-nowrap truncate ${
                    superAdmin ? "text-[#FF5C28]" : ""
                  }`}
                >
                  {level}
                </span>
                <span
                  className={`mt-0.5 block text-[8px] 2xl:text-[9px] font-semibold leading-3.5 line-clamp-2 ${
                    superAdmin ? "text-slate-200" : "text-[#667085]"
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
          <h2 className="font-heading text-base 2xl:text-lg font-bold text-[#042C51] tracking-tight">
            Admin Users &amp; Access Levels ({totalItems})
          </h2>
          <p className="sibs-text-xs font-semibold text-[#667085]">
            Review account-group mappings, access tiers, and user status.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddUser}
          className="inline-flex h-8.5 2xl:h-9 shrink-0 items-center justify-center gap-1.5 2xl:gap-2 rounded-lg bg-[#FF5C28] px-3 2xl:px-3.5 sibs-text-xs font-extrabold text-white shadow-xs transition hover:bg-[#EB3800] active:bg-[#FF8450]"
        >
          <Plus className="h-3.5 w-3.5 2xl:h-4 2xl:w-4 text-white" />
          New Admin Account
        </button>
      </div>

      <div className="relative overflow-visible">
        <PaginationTable
          filterLayout="ta-inline"
          showFilterPanel={false}
          showFilterHeader={false}
          showPagination={false}
          searchValue={searchInput}
          searchPlaceholder="Search admin name or email..."
          onSearchChange={onSearchChange}
          onSearchKeyDown={onSearchKeyDown}
          filters={[
            {
              key: "accessLevel",
              label: "Access Level",
              value: accessLevel,
              options: accessOptions,
              onChange: (value) => onFilterChange?.("accessLevel", value),
              searchable: false,
              allLabel: "All Access Levels",
              includeAll: true,
            },
            {
              key: "account",
              label: "Account Group",
              value: account,
              options: accountOptions,
              onChange: (value) => onFilterChange?.("account", value),
              searchable: true,
              allLabel: "All Accounts",
              includeAll: true,
            },
            {
              key: "status",
              label: "Status",
              value: status,
              options: statusOptions,
              onChange: (value) => onFilterChange?.("status", value),
              searchable: false,
              allLabel: "All Statuses",
              includeAll: true,
            },
          ]}
          className="border-0 bg-transparent p-0 shadow-none"
        />
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
                    value={item.accessLevel}
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
                    <span className="text-[9.5px] text-[#98A2B3]">
                      Last active: {item.lastActive || "—"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditAccess(item);
                    }}
                    className="inline-flex items-center justify-center whitespace-nowrap h-7.5 2xl:h-8 rounded-lg bg-sibs-surface border border-sibs-border px-3 text-[10px] font-extrabold text-sibs-navy transition hover:border-sibs-orange/40 hover:bg-sibs-cream-subtle hover:text-sibs-orange"
                  >
                    Edit Access
                  </button>
                </div>
              </DataCard>
            ))
          ) : (
            <DataCard.Empty
              title="No Admin Users Found"
              description="No admin users match the active filters."
            />
          )
        }
        desktopView={
          <div className="overflow-hidden rounded-xl border border-sibs-border bg-white">
            <div className="max-h-[520px] overflow-auto sibs-scrollbar">
              <table className="w-full min-w-[1020px] table-fixed border-collapse bg-white text-left text-xs">
                <colgroup>
                  <col className="w-[19%]" />
                  <col className="w-[14%]" />
                  <col className="w-[18%]" />
                  <col className="w-[23%]" />
                  <col className="w-[9%]" />
                  <col className="w-[8%]" />
                  <col className="w-[9%]" />
                </colgroup>
                <thead className="sibs-data-table-head">
                  <tr className="sibs-data-table-head-row">
                    <th className="sibs-data-table-th text-left px-3 2xl:px-4 py-2.5 2xl:py-3">Name & Email</th>
                    <th className="sibs-data-table-th text-left px-3 2xl:px-4 py-2.5 2xl:py-3">Access Level</th>
                    <th className="sibs-data-table-th text-left px-3 2xl:px-4 py-2.5 2xl:py-3">Department</th>
                    <th className="sibs-data-table-th text-left px-3 2xl:px-4 py-2.5 2xl:py-3">Account Group</th>
                    <th className="sibs-data-table-th text-left px-3 2xl:px-4 py-2.5 2xl:py-3">Last Active</th>
                    <th className="sibs-data-table-th text-left px-3 2xl:px-4 py-2.5 2xl:py-3">Status</th>
                    <th className="sibs-data-table-th text-right px-3 2xl:px-4 py-2.5 2xl:py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF2F6]">
                  {admins.length > 0 ? (
                    admins.map((item, index) => (
                      <tr
                        key={item.id}
                        className="sibs-data-table-row sibs-page-card-in"
                        style={{
                          animationDelay: `${index * 35}ms`,
                          animationFillMode: "both",
                        }}
                      >
                        <td className="px-3 2xl:px-4 py-2 2xl:py-2.5">
                          <p className="font-extrabold text-[#042C51] truncate">{item.name}</p>
                          <p className="mt-0.5 text-[10px] font-semibold text-[#98A2B3] truncate">
                            {item.email}
                          </p>
                        </td>
                        <td className="px-3 2xl:px-4 py-2 2xl:py-2.5">
                          <span
                            className={`inline-flex items-center justify-center whitespace-nowrap rounded-full px-2.5 py-1 text-[9.5px] 2xl:text-[10px] font-extrabold ${getAccessLevelClass(
                              item.accessLevel,
                            )}`}
                          >
                            {item.accessLevel}
                          </span>
                        </td>
                        <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 font-semibold text-[#344054] truncate">
                          {item.department}
                        </td>
                        <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 text-[#667085] truncate">{item.accountGroup}</td>
                        <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 text-[10px] text-[#98A2B3] whitespace-nowrap">
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
                        <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => onEditAccess(item)}
                            className="inline-flex items-center justify-center whitespace-nowrap h-7.5 2xl:h-8 rounded-lg border border-[#E6ECF2] bg-[#F8FAFC] px-2.5 2xl:px-3 text-[10px] 2xl:text-[11px] font-extrabold text-[#042C51] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF0EB] hover:text-[#FF5C28]"
                          >
                            Edit Access
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-xs font-bold text-[#667085]">
                        No admin users match the active filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        }
      />

      <PaginationTable
        className="border-0 bg-transparent p-0 shadow-none"
        showSearch={false}
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        loadedCount={admins.length}
        totalRecords={totalItems}
        recordLabel="admin users"
        onPrevious={() => pagination.onPageChange(pagination.currentPage - 1)}
        onNext={() => pagination.onPageChange(pagination.currentPage + 1)}
      />
    </div>
  );
}

