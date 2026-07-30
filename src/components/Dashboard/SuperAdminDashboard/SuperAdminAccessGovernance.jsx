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
}) {
  return (
    <div className="space-y-6">
      <section className="sibs-page-card-in rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
        <h2 className="sibs-section-title flex items-center gap-2">
          <Lock size={15} className="text-[#FF5C28]" />
          Grounded 7 Admin Access Levels Hierarchy
        </h2>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
          {ACCESS_HIERARCHY.map(([level, description]) => {
            const superAdmin = level === "7 - Super Admin";

            return (
              <div
                key={level}
                className={`sibs-page-card-in rounded-lg border p-2 text-center ${
                  superAdmin
                    ? "border-[#042C51] bg-[#042C51] text-white"
                    : "border-[#E6ECF2] bg-white text-[#042C51]"
                }`}
              >
                <span
                  className={`block text-[10px] font-extrabold ${
                    superAdmin ? "text-[#FF5C28]" : ""
                  }`}
                >
                  {level}
                </span>
                <span
                  className={`mt-1 block text-[9px] font-semibold leading-4 ${
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="sibs-section-title">
            Admin Users &amp; Access Levels ({totalItems})
          </h2>
          <p className="sibs-section-subtitle">
            Review account-group mappings, access tiers, and user status.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddUser}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#042C51] px-3 text-xs font-extrabold text-white hover:bg-[#FF5C28]"
        >
          <Plus size={14} />
          New Admin Account
        </button>
      </div>

      <div className="space-y-3 lg:hidden">
        {admins.length > 0 ? (
          admins.map((item) => (
            <article key={item.id} className="sibs-card p-4">
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
                  className={`rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${getStatusPillClass(
                    item.status,
                  )}`}
                >
                  {item.status}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-[#F8FAFC] p-2.5">
                  <span className="text-[9px] font-bold uppercase text-[#98A2B3]">
                    Access
                  </span>
                  <p className="mt-1 font-extrabold text-[#042C51]">
                    {item.accessLevel}
                  </p>
                </div>
                <div className="rounded-lg bg-[#F8FAFC] p-2.5">
                  <span className="text-[9px] font-bold uppercase text-[#98A2B3]">
                    Account
                  </span>
                  <p className="mt-1 font-extrabold text-[#042C51]">
                    {item.accountGroup}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onEditAccess(item)}
                className="mt-3 h-8 rounded-lg bg-[#F2F6FA] px-3 text-[10px] font-extrabold text-[#042C51] hover:bg-[#E6ECF2]"
              >
                Edit Access
              </button>
            </article>
          ))
        ) : (
          <div className="sibs-empty-panel">No admin users match the active filters.</div>
        )}
      </div>

      <div className="sibs-data-table-shell hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] border-collapse bg-white text-left text-xs">
            <thead className="sibs-data-table-head">
              <tr className="sibs-data-table-head-row">
                <th className="sibs-data-table-th text-left">User Name &amp; Email</th>
                <th className="sibs-data-table-th text-left">Access Level</th>
                <th className="sibs-data-table-th text-left">Department</th>
                <th className="sibs-data-table-th text-left">Account Group</th>
                <th className="sibs-data-table-th text-left">Last Active</th>
                <th className="sibs-data-table-th text-left">Status</th>
                <th className="sibs-data-table-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF2F6]">
              {admins.length > 0 ? (
                admins.map((item) => (
                  <tr key={item.id} className="sibs-data-table-row">
                    <td className="px-4 py-3">
                      <p className="font-extrabold text-[#042C51]">{item.name}</p>
                      <p className="mt-0.5 text-[10px] font-semibold text-[#98A2B3]">
                        {item.email}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${getAccessLevelClass(
                          item.accessLevel,
                        )}`}
                      >
                        {item.accessLevel}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#344054]">
                      {item.department}
                    </td>
                    <td className="px-4 py-3 text-[#667085]">{item.accountGroup}</td>
                    <td className="px-4 py-3 text-[10px] text-[#98A2B3]">
                      {item.lastActive}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${getStatusPillClass(
                          item.status,
                        )}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onEditAccess(item)}
                        className="h-8 rounded-lg bg-[#F2F6FA] px-3 text-[10px] font-extrabold text-[#042C51] hover:bg-[#E6ECF2]"
                      >
                        Edit Access
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-xs font-bold text-[#667085]">
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
