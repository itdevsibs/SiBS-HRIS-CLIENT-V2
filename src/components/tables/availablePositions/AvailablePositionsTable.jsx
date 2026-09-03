import React from "react";
import { AlertTriangle, CheckCircle2, FileText } from "lucide-react";

import PositionMobileCard from "../../recruitment/availablePositions/PositionMobileCard";
import StatusFilterTabs from "../../recruitment/StatusFilterTabs";
import { formatDate } from "../../layout/FormatDateTime";
import { formatPersonName } from "../../../lib/utils/availablePositions/availablePositionsHelpers";
import { StatusBadge } from "../../../lib/utils/availablePositions/reactComponents/reactHelpers";
import { formatAvailablePositionId } from "../../../lib/utils/availablePositions/availablePositionId";
import {
  getAvailablePositionAccount,
  getAvailablePositionDepartment,
  getAvailablePositionLinkedJd,
  getAvailablePositionUpdatedAt,
  getAvailablePositionUpdatedBy,
} from "../../../lib/utils/availablePositions/availablePositionsPresentation";
import PaginationTable from "../../../services/pagination/PaginationTable";

function normalizeText(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function getUpdatedByDisplay(position = {}) {
  const value = String(
    getAvailablePositionUpdatedBy(position) || "",
  ).trim();

  if (!value) return "—";

  /*
   * New audit values are stored as:
   * SIBS ID - Lastname, Firstname Middlename
   * Preserve that exact value instead of passing it through formatPersonName.
   * Older name-only rows keep the existing formatter for backward compatibility.
   */
  if (/^[^-]+\s-\s.+/.test(value)) {
    return value;
  }

  return formatPersonName(value);
}

function EmptyTableRow() {
  return (
    <tr>
      <td colSpan={8} className="px-5 py-14 text-center">
        <div className="mx-auto max-w-sm rounded-2xl border border-dashed border-[#D7DEE8] bg-[#F8FAFC] px-5 py-8">
          <FileText className="mx-auto h-9 w-9 text-[#CBD5E1]" />

          <p className="mt-3 text-sm font-extrabold text-[#042C51]">
            No Available Positions Found
          </p>

          <p className="mt-1 text-xs font-semibold text-[#98A2B3]">
            Adjust the active filters or register a new position.
          </p>
        </div>
      </td>
    </tr>
  );
}

function normalizeApprovalStatus(value = "") {
  const status = normalizeText(value);

  if (!status) return "Approved";
  if (status === "pending") return "For Approval";
  if (status === "for approval") return "For Approval";
  if (status === "for review") return "For Approval";
  if (status === "approved") return "Approved";

  if (status === "rejected" || status === "declined") {
    return "Rejected";
  }

  return String(value || "Approved").trim();
}

function getAvailablePositionApprovalStatus(position = {}) {
  const raw = position.raw || {};

  return normalizeApprovalStatus(
    position.approvalStatus ||
      position.approval_status ||
      position.recruitmentSettingsStatus ||
      position.recruitment_settings_status ||
      raw.approvalStatus ||
      raw.approval_status ||
      raw.recruitmentSettingsStatus ||
      raw.recruitment_settings_status ||
      "",
  );
}

function getAvailablePositionJdLinkStatus(position = {}) {
  const raw = position.raw || {};

  const value =
    position.jdLinkStatus ||
    position.jd_link_status ||
    raw.jdLinkStatus ||
    raw.jd_link_status ||
    "Linked";

  return String(value || "Linked").trim();
}

function isPositionUnlinked(position = {}) {
  return (
    normalizeText(getAvailablePositionJdLinkStatus(position)) ===
    "unlinked from jd"
  );
}

function JdLinkStatusBadge({ status = "Linked" }) {
  const normalizedStatus = normalizeText(status);

  const isUnlinked = normalizedStatus === "unlinked from jd";

  if (isUnlinked) {
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[#FFB39F] bg-[#FFE1D8] px-2.5 py-1 text-[9px] font-extrabold text-[#D92D20]">
        <AlertTriangle size={11} strokeWidth={2} />
        Unlinked from JD
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[9px] font-extrabold text-emerald-700">
      <CheckCircle2 size={11} strokeWidth={2} />
      Linked
    </span>
  );
}

export default function AvailablePositionsTable({
  isLoading = false,
  paginatedPositions = [],
  filteredPositionsCount = 0,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  onEdit,
  onSetStatus,
  statusTabs = [],
  statusFilter = "All",
  statusCounts = {},
  onStatusFilterChange,
  isSaving = false,
  canApproveAvailablePositions = false,
  activeStatus = "Active",
  inactiveStatus = "Inactive",
}) {
  const visibleStatusTabs = statusTabs.filter(
    (tab) => tab.value !== "For Approval" || canApproveAvailablePositions,
  );

  function handleRowClick(position) {
    if (isSaving) {
      return;
    }

    onEdit?.(position);
  }

  function handleRowKeyDown(event, position) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();

    if (isSaving) {
      return;
    }

    onEdit?.(position);
  }

  return (
    <div className="relative z-[1] font-jakarta">
      {isLoading ? (
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-12 text-center text-sm font-extrabold text-[#042C51]">
          Loading available positions from the database...
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-[#E6ECF2] bg-white lg:hidden">
            <StatusFilterTabs
              tabs={visibleStatusTabs}
              activeValue={statusFilter}
              counts={statusCounts}
              onChange={onStatusFilterChange}
            />
          </div>

          <div className="space-y-3 lg:hidden">
            {paginatedPositions.length > 0 ? (
              paginatedPositions.map((position) => {
                const unlinked = isPositionUnlinked(position);

                return (
                  <div
                    key={position.id}
                    className={
                      unlinked
                        ? "rounded-xl border border-[#FFD1C4] bg-[#FFF4EF]"
                        : ""
                    }
                  >
                    <PositionMobileCard
                      position={position}
                      onEdit={onEdit}
                      onSetStatus={onSetStatus}
                      isSaving={isSaving}
                      activeStatus={activeStatus}
                      inactiveStatus={inactiveStatus}
                    />
                  </div>
                );
              })
            ) : (
              <div className="rounded-xl border border-dashed border-[#D7DEE8] bg-[#F8FAFC] px-5 py-10 text-center text-sm font-extrabold text-[#667085]">
                No positions found.
              </div>
            )}
          </div>

          <div className="hidden lg:block">
            <div className="overflow-hidden rounded-xl border border-[#E6ECF2] bg-white">
              <StatusFilterTabs
                tabs={visibleStatusTabs}
                activeValue={statusFilter}
                counts={statusCounts}
                onChange={onStatusFilterChange}
              />

              <div className="overflow-x-auto max-h-[480px] 2xl:max-h-[640px] overflow-y-auto sibs-scrollbar">
                <table className="w-full border-collapse bg-white text-left text-xs">
                  <thead className="bg-[#F8FAFC]">
                    <tr className="border-b border-[#E6ECF2]">
                      <th className="px-4 py-3 text-left text-[10px] font-extrabold uppercase text-[#667085]">
                        Position ID
                      </th>

                      <th className="px-3 py-3 text-left text-[10px] font-extrabold uppercase text-[#667085]">
                        Position & Mapping
                      </th>

                      <th className="px-3 py-3 text-left text-[10px] font-extrabold uppercase text-[#667085]">
                        Linked JD Manual
                      </th>

                      <th className="px-3 py-3 text-left text-[10px] font-extrabold uppercase text-[#667085]">
                        Location
                      </th>

                      <th className="px-3 py-3 text-center text-[10px] font-extrabold uppercase text-[#667085]">
                        Status
                      </th>

                      <th className="px-3 py-3 text-center text-[10px] font-extrabold uppercase text-[#667085]">
                        Approval Status
                      </th>

                      <th className="px-3 py-3 text-center text-[10px] font-extrabold uppercase text-[#667085]">
                        JD Link Status
                      </th>

                      <th className="px-3 py-3 text-left text-[10px] font-extrabold uppercase text-[#667085]">
                        Last Updated
                      </th>
                    </tr>
                  </thead>

                  <tbody
                    key={statusFilter}
                    className="divide-y divide-[#E6ECF2]"
                  >
                    {paginatedPositions.length > 0 ? (
                      paginatedPositions.map((position, index) => {
                        const linkedJd = getAvailablePositionLinkedJd(position);

                        const department =
                          getAvailablePositionDepartment(position);

                        const account = getAvailablePositionAccount(position);

                        const approvalStatus =
                          getAvailablePositionApprovalStatus(position);

                        const jdLinkStatus =
                          getAvailablePositionJdLinkStatus(position);

                        const unlinked = isPositionUnlinked(position);

                        const rowClickable = !isSaving;

                        const updatedByDisplay =
                          getUpdatedByDisplay(position);

                        return (
                          <tr
                            key={position.id}
                            role={rowClickable ? "button" : undefined}
                            tabIndex={rowClickable ? 0 : undefined}
                            onClick={
                              rowClickable
                                ? () => handleRowClick(position)
                                : undefined
                            }
                            onKeyDown={
                              rowClickable
                                ? (event) => handleRowKeyDown(event, position)
                                : undefined
                            }
                            className={[
                              "sibs-page-card-in align-middle transition-colors duration-150",

                              unlinked
                                ? "bg-[#FFF4EF] hover:bg-[#FFE9E0]"
                                : "bg-white hover:bg-[#F8FAFC]",

                              rowClickable
                                ? `cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FF5C28]/25 ${
                                    unlinked
                                      ? "focus-visible:bg-[#FFE9E0]"
                                      : "focus-visible:bg-[#F8FAFC]"
                                  }`
                                : "cursor-wait",
                            ].join(" ")}
                            style={{
                              animationDelay: `${index * 30}ms`,
                            }}
                            aria-label={
                              rowClickable
                                ? `Open available position ${
                                    position.positionTitle ||
                                    position.positionId ||
                                    position.id ||
                                    ""
                                  }`
                                : undefined
                            }
                          >
                            <td className="px-4 py-3 align-middle">
                              <span
                                className={[
                                  "inline-flex whitespace-nowrap rounded-lg px-2.5 py-1 text-[10px] font-extrabold",

                                  unlinked
                                    ? "border border-[#FFD1C4] bg-[#FFF0EA] text-[#A5492B]"
                                    : "bg-[#F2F6FA] text-[#042C51]",
                                ].join(" ")}
                              >
                                {formatAvailablePositionId(
                                  position.positionId,
                                  position.id,
                                )}
                              </span>
                            </td>

                            <td className="px-3 py-3 align-middle">
                              <p
                                className="max-w-[220px] truncate text-xs font-extrabold text-[#042C51]"
                                title={position.positionTitle || ""}
                              >
                                {position.positionTitle || "—"}
                              </p>

                              <p
                                className="mt-0.5 max-w-[220px] truncate text-[10px] font-semibold text-[#667085]"
                                title={department}
                              >
                                {department}
                              </p>

                              <p
                                className="mt-0.5 max-w-[220px] truncate text-[10px] font-semibold text-[#98A2B3]"
                                title={account}
                              >
                                {account}
                              </p>
                            </td>

                            <td className="px-3 py-3 align-middle">
                              <p
                                className="max-w-[200px] truncate text-xs font-extrabold text-[#042C51]"
                                title={linkedJd.documentTitle}
                              >
                                {linkedJd.documentTitle}
                              </p>

                              <p
                                className="mt-0.5 max-w-[200px] truncate text-[10px] font-semibold text-[#98A2B3]"
                                title={linkedJd.code}
                              >
                                {linkedJd.code}
                              </p>
                            </td>

                            <td className="px-3 py-3 align-middle">
                              <p
                                className="max-w-[130px] truncate text-xs font-semibold text-[#475467]"
                                title={position.locationSite || ""}
                              >
                                {position.locationSite || "—"}
                              </p>
                            </td>

                            <td className="px-3 py-3 text-center align-middle">
                              <div className="flex justify-center">
                                <StatusBadge status={position.status} />
                              </div>
                            </td>

                            <td className="px-3 py-3 text-center align-middle">
                              <div className="flex justify-center">
                                <StatusBadge status={approvalStatus} />
                              </div>
                            </td>

                            <td className="px-3 py-3 text-center align-middle">
                              <div className="flex justify-center">
                                <JdLinkStatusBadge status={jdLinkStatus} />
                              </div>
                            </td>

                            <td className="px-3 py-3 align-middle">
                              <p className="text-xs font-extrabold text-[#344054]">
                                {formatDate(
                                  getAvailablePositionUpdatedAt(position),
                                )}
                              </p>

                              <p
                                className="mt-0.5 max-w-[220px] truncate text-[10px] font-bold text-[#667085]"
                                title={updatedByDisplay}
                              >
                                By: {updatedByDisplay}
                              </p>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <EmptyTableRow />
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div>
            <PaginationTable
              showSearch={false}
              showPagination
              showCount
              loading={isLoading}
              currentPage={currentPage}
              totalPages={totalPages}
              loadedCount={paginatedPositions.length}
              totalRecords={filteredPositionsCount}
              recordLabel="positions"
              onPrevious={() => onPageChange?.(Math.max(currentPage - 1, 1))}
              onNext={() =>
                onPageChange?.(Math.min(currentPage + 1, totalPages))
              }
              className="border-0 bg-transparent p-0 shadow-none"
            />
          </div>
        </>
      )}
    </div>
  );
}
