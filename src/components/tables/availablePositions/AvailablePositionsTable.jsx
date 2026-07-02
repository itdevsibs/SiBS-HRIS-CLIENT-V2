import React from "react";
import { ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import PositionMobileCard from "../../recruitment/availablePositions/PositionMobileCard";
import { formatDate } from "../../layout/FormatDateTime";
import { formatPersonName } from "../../../lib/utils/availablePositions/availablePositionsHelpers";
import { StatusBadge } from "../../../lib/utils/availablePositions/reactComponents/reactHelpers";

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
    <div className="relative z-[1] p-4 sm:p-6">
      {isLoading ? (
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-12 text-center text-sm font-bold text-sibs-primary-1">
          Loading available positions from database...
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
              <div className="rounded-xl border border-[#E6ECF2] bg-white px-5 py-10 text-center text-sm font-bold text-gray-500">
                No positions found.
              </div>
            )}
          </div>

          <div className="hidden lg:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1500px] border-separate border-spacing-0 overflow-hidden rounded-2xl border border-[#D9E2EC] text-left">
                <thead>
                  <tr className="bg-[#F5F7FA] text-xs font-bold uppercase tracking-wide text-[#174A7C]">
                    <th className="px-5 py-4 first:rounded-tl-2xl">Pos. ID</th>
                    <th className="px-5 py-4 first:rounded-tl-2xl">Position</th>
                    <th className="px-5 py-4">Location / Site</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Last Updated</th>
                    <th className="px-5 py-4 text-right last:rounded-tr-2xl">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedPositions.length > 0 ? (
                    paginatedPositions.map((position) => (
                      <tr
                        key={position.id}
                        className="align-top transition hover:bg-[#FAFBFC]"
                      >
                        <td className="border-b border-[#E6ECF2] px-5 py-5">
                          <p className="mt-1 text-xs font-bold text-sibs-primary-1">
                            {position.positionId}
                          </p>
                        </td>

                        <td className="border-b border-[#E6ECF2] px-5 py-5">
                          <p className="text-sm font-bold text-[#101828]">
                            {position.positionTitle}
                          </p>

                          {position.jdCode && (
                            <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                              {position.jdCode}
                            </p>
                          )}
                        </td>

                        <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-semibold text-[#344054]">
                          {position.locationSite || "—"}
                        </td>

                        <td className="border-b border-[#E6ECF2] px-5 py-5">
                          <StatusBadge status={position.status} />
                        </td>

                        <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-semibold text-[#344054]">
                          <p>{formatDate(position.updatedAt)}</p>

                          <p className="mt-1 text-xs text-sibs-tertiary-5">
                            By:{" "}
                            {formatPersonName(
                              position.updatedBy || position.createdBy,
                            )}
                          </p>
                        </td>

                        <td className="border-b border-[#E6ECF2] px-5 py-5 text-right">
                          <div className="inline-flex items-center gap-2">
                            {activeStatus && (
                              <button
                                type="button"
                                onClick={() =>
                                  onSetStatus?.(position, activeStatus)
                                }
                                disabled={
                                  isSaving || position.status === activeStatus
                                }
                                className="inline-flex h-9 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Set {activeStatus}
                              </button>
                            )}

                            {inactiveStatus && (
                              <button
                                type="button"
                                onClick={() =>
                                  onSetStatus?.(position, inactiveStatus)
                                }
                                disabled={
                                  isSaving || position.status === inactiveStatus
                                }
                                className="inline-flex h-9 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-bold text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Set {inactiveStatus}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => onEdit?.(position)}
                              disabled={isSaving}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white text-sibs-primary-1 transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"
                              title="Edit"
                            >
                              <Pencil size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-5 py-12 text-center text-sm font-bold text-gray-500"
                      >
                        No positions found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <p className="text-sm font-semibold text-sibs-tertiary-5">
              Showing {showingFrom} to {showingTo} of {filteredPositionsCount}{" "}
              positions
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onPageChange?.(currentPage - 1)}
                disabled={currentPage <= 1}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E6ECF2] text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }).map((_, index) => {
                const pageNumber = index + 1;
                const active = currentPage === pageNumber;

                return (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => onPageChange?.(pageNumber)}
                    className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-bold transition ${
                      active
                        ? "bg-sibs-primary-1 text-white shadow-sm"
                        : "border border-[#E6ECF2] bg-white text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => onPageChange?.(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E6ECF2] text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
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
