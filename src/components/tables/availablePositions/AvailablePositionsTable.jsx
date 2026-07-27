import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Pencil,
} from "lucide-react";

import PositionMobileCard from "../../recruitment/availablePositions/PositionMobileCard";
import { formatDate } from "../../layout/FormatDateTime";
import { formatPersonName } from "../../../lib/utils/availablePositions/availablePositionsHelpers";
import { StatusBadge } from "../../../lib/utils/availablePositions/reactComponents/reactHelpers";
import { formatAvailablePositionId } from "../../../lib/utils/availablePositions/availablePositionId";
import {
  getAvailablePositionAccount,
  getAvailablePositionDepartment,
  getAvailablePositionLinkedJd,
  getAvailablePositionSkills,
  getAvailablePositionUpdatedAt,
  getAvailablePositionUpdatedBy,
} from "../../../lib/utils/availablePositions/availablePositionsPresentation";

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
      className={`inline-flex h-8 items-center justify-center whitespace-nowrap rounded-lg border px-2.5 text-[10px] font-extrabold transition disabled:cursor-not-allowed disabled:opacity-45 ${variantClass}`}
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

export default function AvailablePositionsTable({
  isLoading = false,
  paginatedPositions = [],
  filteredPositionsCount = 0,
  showingFrom = 0,
  showingTo = 0,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  onEdit,
  onSetStatus,
  isSaving = false,
  activeStatus = "Active",
  inactiveStatus = "Inactive",
}) {
  return (
    <div className="relative z-[1] px-4 pb-4 pt-0 font-jakarta sm:px-5 sm:pb-5">
      {isLoading ? (
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-12 text-center text-sm font-extrabold text-[#042C51]">
          Loading available positions from the database...
        </div>
      ) : (
        <>
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
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1380px] border-collapse bg-white text-left text-xs">
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
                        Location / Site
                      </th>

                      <th className="sibs-data-table-th text-left">
                        Core Skills
                      </th>

                      <th className="sibs-data-table-th text-center">
                        Status
                      </th>

                      <th className="sibs-data-table-th text-left">
                        Last Updated
                      </th>

                      <th className="sibs-data-table-th text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#E6ECF2]">
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

                          const skillSummary =
                            getAvailablePositionSkills(
                              position,
                              3,
                            );

                          const department =
                            getAvailablePositionDepartment(
                              position,
                            );

                          const account =
                            getAvailablePositionAccount(
                              position,
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

                              <td className="px-4 py-2.5 align-middle">
                                <p
                                  className="max-w-[280px] truncate text-xs font-extrabold text-[#042C51]"
                                  title={
                                    position.positionTitle || ""
                                  }
                                >
                                  {position.positionTitle || "—"}
                                </p>

                                <p
                                  className="mt-0.5 max-w-[280px] truncate text-[10px] font-semibold text-[#667085]"
                                  title={department}
                                >
                                  {department}
                                </p>

                                <p
                                  className="mt-0.5 max-w-[280px] truncate text-[10px] font-semibold text-[#98A2B3]"
                                  title={account}
                                >
                                  {account}
                                </p>
                              </td>

                              <td className="px-4 py-2.5 align-middle">
                                <p
                                  className="max-w-[260px] truncate text-xs font-extrabold text-[#042C51]"
                                  title={linkedJd.documentTitle}
                                >
                                  {linkedJd.documentTitle}
                                </p>

                                <p
                                  className="mt-0.5 max-w-[260px] truncate text-[10px] font-semibold text-[#98A2B3]"
                                  title={linkedJd.code}
                                >
                                  {linkedJd.code}
                                </p>
                              </td>

                              <td className="px-4 py-2.5 align-middle">
                                <p
                                  className="max-w-[180px] truncate text-xs font-semibold text-[#475467]"
                                  title={
                                    position.locationSite || ""
                                  }
                                >
                                  {position.locationSite || "—"}
                                </p>
                              </td>

                              <td className="px-4 py-2.5 align-middle">
                                <div className="flex max-w-[250px] flex-wrap gap-1">
                                  {skillSummary.visible.length >
                                  0 ? (
                                    <>
                                      {skillSummary.visible.map(
                                        (skill) => (
                                          <span
                                            key={skill}
                                            className="inline-flex rounded-md bg-[#F2F6FA] px-2 py-1 text-[9px] font-extrabold text-[#475467]"
                                          >
                                            {skill}
                                          </span>
                                        ),
                                      )}

                                      {skillSummary.hiddenCount >
                                      0 ? (
                                        <span className="inline-flex rounded-md bg-[#EAF2FB] px-2 py-1 text-[9px] font-extrabold text-[#042C51]">
                                          +
                                          {
                                            skillSummary.hiddenCount
                                          }{" "}
                                          more
                                        </span>
                                      ) : null}
                                    </>
                                  ) : (
                                    <span className="text-[10px] font-semibold text-[#98A2B3]">
                                      No skills listed
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="px-4 py-2.5 text-center align-middle">
                                <div className="flex justify-center">
                                  <StatusBadge
                                    status={position.status}
                                  />
                                </div>
                              </td>

                              <td className="px-4 py-2.5 align-middle">
                                <p className="text-xs font-extrabold text-[#344054]">
                                  {formatDate(
                                    getAvailablePositionUpdatedAt(
                                      position,
                                    ),
                                  )}
                                </p>

                                <p
                                  className="mt-0.5 max-w-[180px] truncate text-[10px] font-bold text-[#667085]"
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

                              <td className="px-4 py-2.5 text-right align-middle">
                                <div className="inline-flex items-center justify-end gap-1.5">
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

          <div className="mt-4 flex flex-col justify-between gap-3 border-t border-[#E6ECF2] pt-4 md:flex-row md:items-center">
            <p className="text-xs font-bold text-[#667085]">
              Showing {showingFrom} to {showingTo} of{" "}
              {filteredPositionsCount} positions
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  onPageChange?.(currentPage - 1)
                }
                disabled={currentPage <= 1}
                aria-label="Previous page"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E6ECF2] bg-white text-[#042C51] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({
                length: totalPages,
              }).map((_, index) => {
                const pageNumber = index + 1;
                const active =
                  currentPage === pageNumber;

                return (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() =>
                      onPageChange?.(pageNumber)
                    }
                    className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-xs font-extrabold transition ${
                      active
                        ? "bg-[#042C51] text-white"
                        : "border border-[#E6ECF2] bg-white text-[#042C51] hover:bg-[#F8FAFC]"
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() =>
                  onPageChange?.(currentPage + 1)
                }
                disabled={currentPage >= totalPages}
                aria-label="Next page"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E6ECF2] bg-white text-[#042C51] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
