import React from "react";
import {
  CheckCircle2,
  FileText,
  Pencil,
  XCircle,
} from "lucide-react";

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

function isSameStatus(left = "", right = "") {
  return normalizeText(left) === normalizeText(right);
}

function ActionButton({
  children,
  onClick,
  disabled = false,
  variant = "default",
  title,
}) {
  const variantClass =
    variant === "active"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100"
      : variant === "inactive"
        ? "border-red-200 bg-red-50 text-red-700 hover:border-red-300 hover:bg-red-100"
        : "border-[#D7DEE8] bg-white text-[#042C51] hover:border-[#FF5C28]/40 hover:bg-[#FFF7F3] hover:text-[#FF5C28]";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex h-7 items-center justify-center gap-1 whitespace-nowrap rounded-lg border px-2 text-[9.5px] font-extrabold transition disabled:cursor-not-allowed disabled:opacity-40 ${variantClass}`}
    >
      {children}
    </button>
  );
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
            Adjust the active filters or register a new
            position.
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
  if (status === "rejected" || status === "declined") return "Rejected";

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

function getAvailablePositionApprovalRequestId(position = {}) {
  const raw = position.raw || {};

  return (
    position.approvalRequestId ||
    position.approval_request_id ||
    position.requestId ||
    position.request_id ||
    raw.approvalRequestId ||
    raw.approval_request_id ||
    ""
  );
}

function canShowApprovalActions(position = {}, canApprove = false) {
  return (
    canApprove &&
    Boolean(getAvailablePositionApprovalRequestId(position)) &&
    getAvailablePositionApprovalStatus(position) === "For Approval"
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
  onApproveRequest,
  onRejectRequest,
  statusTabs = [],
  statusFilter = "All",
  statusCounts = {},
  onStatusFilterChange,
  isSaving = false,
  canApproveAvailablePositions = false,
  activeStatus = "Active",
  inactiveStatus = "Inactive",
}) {
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
              tabs={statusTabs}
              activeValue={statusFilter}
              counts={statusCounts}
              onChange={onStatusFilterChange}
            />
          </div>

          <div className="space-y-3 lg:hidden">
            {paginatedPositions.length > 0 ? (
              paginatedPositions.map((position) => (
                <PositionMobileCard
                  key={position.id}
                  position={position}
                  onEdit={onEdit}
                  onSetStatus={onSetStatus}
                  isSaving={isSaving}
                  activeStatus={activeStatus}
                  inactiveStatus={inactiveStatus}
                />
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-[#D7DEE8] bg-[#F8FAFC] px-5 py-10 text-center text-sm font-extrabold text-[#667085]">
                No positions found.
              </div>
            )}
          </div>

          <div className="hidden lg:block">
            <div className="overflow-hidden rounded-xl border border-[#E6ECF2] bg-white">
              <StatusFilterTabs
                tabs={statusTabs}
                activeValue={statusFilter}
                counts={statusCounts}
                onChange={onStatusFilterChange}
              />

              <div className="overflow-x-auto">
                <table className="w-full border-collapse bg-white text-left text-xs">
                  <thead className="sibs-data-table-head">
                    <tr className="sibs-data-table-head-row">
                      <th className="sibs-data-table-th text-left">
                        Position ID
                      </th>

                      <th className="sibs-data-table-th text-left">
                        Position & Mapping
                      </th>

                      <th className="sibs-data-table-th text-left">
                        Linked JD Manual
                      </th>

                      <th className="sibs-data-table-th text-left">
                        Location
                      </th>

                      <th className="sibs-data-table-th text-center">
                        Status
                      </th>

                      <th className="sibs-data-table-th text-center">
                        Approval Status
                      </th>

                      <th className="sibs-data-table-th text-left">
                        Last Updated
                      </th>

                      <th className="sibs-data-table-th text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody key={statusFilter} className="divide-y divide-[#E6ECF2]">
                    {paginatedPositions.length > 0 ? (
                      paginatedPositions.map(
                        (position, index) => {
                          const isActive = isSameStatus(
                            position.status,
                            activeStatus,
                          );

                          const isInactive = isSameStatus(
                            position.status,
                            inactiveStatus,
                          );

                          const linkedJd =
                            getAvailablePositionLinkedJd(
                              position,
                            );

                          const department =
                            getAvailablePositionDepartment(
                              position,
                            );

                          const account =
                            getAvailablePositionAccount(
                              position,
                            );
                          const approvalStatus =
                            getAvailablePositionApprovalStatus(
                              position,
                            );
                          const showApprovalActions =
                            canShowApprovalActions(
                              position,
                              canApproveAvailablePositions,
                            );

                          return (
                            <tr
                              key={position.id}
                              className="sibs-data-table-row sibs-page-card-in align-middle"
                              style={{
                                animationDelay: `${index * 30}ms`,
                              }}
                            >
                              <td className="px-4 py-2.5 align-middle">
                                <span className="inline-flex whitespace-nowrap rounded-lg bg-[#F2F6FA] px-2.5 py-1 text-[10px] font-extrabold text-[#042C51]">
                                  {formatAvailablePositionId(
                                    position.positionId,
                                    position.id,
                                  )}
                                </span>
                              </td>

                              <td className="px-3 py-2.5 align-middle">
                                <p
                                  className="max-w-[220px] truncate text-xs font-extrabold text-[#042C51]"
                                  title={
                                    position.positionTitle || ""
                                  }
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

                              <td className="px-3 py-2.5 align-middle">
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

                              <td className="px-3 py-2.5 align-middle">
                                <p
                                  className="max-w-[130px] truncate text-xs font-semibold text-[#475467]"
                                  title={
                                    position.locationSite || ""
                                  }
                                >
                                  {position.locationSite || "—"}
                                </p>
                              </td>

                              <td className="px-3 py-2.5 text-center align-middle">
                                <div className="flex justify-center">
                                  <StatusBadge
                                    status={position.status}
                                  />
                                </div>
                              </td>

                              <td className="px-3 py-2.5 text-center align-middle">
                                <div className="flex justify-center">
                                  <StatusBadge
                                    status={approvalStatus}
                                  />
                                </div>
                              </td>

                              <td className="px-3 py-2.5 align-middle">
                                <p className="text-xs font-extrabold text-[#344054]">
                                  {formatDate(
                                    getAvailablePositionUpdatedAt(
                                      position,
                                    ),
                                  )}
                                </p>

                                <p
                                  className="mt-0.5 max-w-[130px] truncate text-[10px] font-bold text-[#667085]"
                                  title={formatPersonName(
                                    getAvailablePositionUpdatedBy(
                                      position,
                                    ),
                                  )}
                                >
                                  By:{" "}
                                  {formatPersonName(
                                    getAvailablePositionUpdatedBy(
                                      position,
                                    ),
                                  )}
                                </p>
                              </td>

                              <td className="px-3 py-2.5 text-right align-middle">
                                <div className="inline-flex items-center justify-end gap-1">
                                  {showApprovalActions ? (
                                    <>
                                      <ActionButton
                                        variant="active"
                                        onClick={() =>
                                          onApproveRequest?.(
                                            position,
                                          )
                                        }
                                        disabled={isSaving}
                                        title="Approve available position"
                                      >
                                        <CheckCircle2 size={12} />
                                        Approve
                                      </ActionButton>

                                      <ActionButton
                                        variant="inactive"
                                        onClick={() =>
                                          onRejectRequest?.(
                                            position,
                                          )
                                        }
                                        disabled={isSaving}
                                        title="Reject available position"
                                      >
                                        <XCircle size={12} />
                                        Reject
                                      </ActionButton>
                                    </>
                                  ) : null}

                                  {activeStatus ? (
                                    <ActionButton
                                      variant="active"
                                      onClick={() =>
                                        onSetStatus?.(
                                          position,
                                          activeStatus,
                                        )
                                      }
                                      disabled={
                                        isSaving || isActive
                                      }
                                    >
                                      Set Active
                                    </ActionButton>
                                  ) : null}

                                  {inactiveStatus ? (
                                    <ActionButton
                                      variant="inactive"
                                      onClick={() =>
                                        onSetStatus?.(
                                          position,
                                          inactiveStatus,
                                        )
                                      }
                                      disabled={
                                        isSaving ||
                                        isInactive
                                      }
                                    >
                                      Set Inactive
                                    </ActionButton>
                                  ) : null}

                                  <button
                                    type="button"
                                    onClick={() =>
                                      onEdit?.(position)
                                    }
                                    disabled={isSaving}
                                    title="Edit position"
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#D7DEE8] bg-white text-[#042C51] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF7F3] hover:text-[#FF5C28] disabled:cursor-not-allowed disabled:opacity-45"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        },
                      )
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
              onPrevious={() =>
                onPageChange?.(Math.max(currentPage - 1, 1))
              }
              onNext={() =>
                onPageChange?.(
                  Math.min(currentPage + 1, totalPages),
                )
              }
              className="border-0 bg-transparent p-0 shadow-none"
            />
          </div>
        </>
      )}
    </div>
  );
}
