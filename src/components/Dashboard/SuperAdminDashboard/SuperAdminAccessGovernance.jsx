import { Lock, Plus } from "lucide-react";

import PaginationTable from "../../../services/pagination/PaginationTable";
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
          Grounded 7 Admin Access Levels Hierarchy
        </h2>

        <div className="mt-2 2xl:mt-2.5 grid grid-cols-2 gap-1.5 2xl:gap-2 sm:grid-cols-4 xl:grid-cols-7">
          {ACCESS_HIERARCHY.map(([level, description], index) => {
            const superAdmin = level === "7 - Super Admin";

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
                  className={`block text-[9px] 2xl:text-[10px] font-extrabold ${
                    superAdmin ? "text-[#FF5C28]" : ""
                  }`}
                >
                  {level}
                </span>
                <span
                  className={`mt-0.5 block text-[8px] 2xl:text-[9px] font-semibold leading-3.5 ${
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
          <h2 className="text-sm 2xl:text-base font-extrabold text-[#042C51]">
            Admin Users &amp; Access Levels ({totalItems})
          </h2>
          <p className="sibs-text-xs font-semibold text-[#667085]">
            Review account-group mappings, access tiers, and user status.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddUser}
          className="inline-flex h-8.5 2xl:h-9 shrink-0 items-center justify-center gap-1.5 2xl:gap-2 rounded-lg border border-[#E6ECF2] bg-[#F8FAFC] px-3 2xl:px-3.5 sibs-text-xs font-extrabold text-[#042C51] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF0EB] hover:text-[#FF5C28]"
        >
          <Plus className="h-3.5 w-3.5 2xl:h-4 2xl:w-4 text-[#FF5C28]" />
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
              includeAll: false,
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
              includeAll: false,
            },
          ]}
          className="border-0 bg-transparent p-0 shadow-none"
        />
      </div>

      <div className="space-y-3 lg:hidden">
        {admins.length > 0 ? (
          admins.map((item, index) => (
            <article
              key={item.id}
              className="sibs-card sibs-page-card-in p-3.5 sm:p-4"
              style={{
                animationDelay: `${index * 40}ms`,
                animationFillMode: "both",
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words text-sm font-extrabold text-[#042C51]">
                    {item.name}
                  </p>
                  <p className="mt-0.5 break-all text-[10px] font-semibold text-[#98A2B3]">
                    {item.email}
                  </p>
                </div>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold ${getStatusPillClass(
                    item.status,
                  )}`}
                >
                  {item.status}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-[#F8FAFC] p-2">
                  <span className="text-[9px] font-bold uppercase text-[#98A2B3]">
                    Access
                  </span>
                  <p className="mt-0.5 font-extrabold text-[#042C51]">
                    {item.accessLevel}
                  </p>
                </div>
                <div className="rounded-lg bg-[#F8FAFC] p-2">
                  <span className="text-[9px] font-bold uppercase text-[#98A2B3]">
                    Account
                  </span>
                  <p className="mt-0.5 font-extrabold text-[#042C51]">
                    {item.accountGroup}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onEditAccess(item)}
                className="mt-3 h-7.5 2xl:h-8 rounded-lg bg-[#F2F6FA] px-3 text-[10px] font-extrabold text-[#042C51] hover:bg-[#E6ECF2]"
              >
                Edit Access
              </button>
            </article>
          ))
        ) : (
          <div className="sibs-empty-panel">No admin users match the active filters.</div>
        )}
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-[#E6ECF2] bg-white hidden lg:block">
        <div className="max-h-[520px] overflow-auto sibs-scrollbar">
          <table className="w-full min-w-[980px] border-collapse bg-white text-left text-xs">
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
                      <p className="font-extrabold text-[#042C51]">{item.name}</p>
                      <p className="mt-0.5 text-[10px] font-semibold text-[#98A2B3]">
                        {item.email}
                      </p>
                    </td>
                    <td className="px-3 2xl:px-4 py-2 2xl:py-2.5">
                      <span
                        className={`rounded-full px-2 2xl:px-2.5 py-0.5 text-[9px] 2xl:text-[10px] font-extrabold ${getAccessLevelClass(
                          item.accessLevel,
                        )}`}
                      >
                        {item.accessLevel}
                      </span>
                    </td>
                    <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 font-semibold text-[#344054]">
                      {item.department}
                    </td>
                    <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 text-[#667085]">{item.accountGroup}</td>
                    <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 text-[10px] text-[#98A2B3]">
                      {item.lastActive}
                    </td>
                    <td className="px-3 2xl:px-4 py-2 2xl:py-2.5">
                      <span
                        className={`rounded-full border px-2 2xl:px-2.5 py-0.5 text-[9px] 2xl:text-[10px] font-extrabold ${getStatusPillClass(
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
                        className="h-7.5 2xl:h-8 rounded-lg border border-[#E6ECF2] bg-[#F8FAFC] px-2.5 2xl:px-3 sibs-text-micro font-extrabold text-[#042C51] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF0EB] hover:text-[#FF5C28]"
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

