import React from "react";
import { ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import PositionMobileCard from "../../recruitment/availablePositions/PositionMobileCard";
import { formatDate } from "../../layout/FormatDateTime";
import { formatPersonName } from "../../../lib/utils/availablePositions/availablePositionsHelpers";
import { StatusBadge } from "../../../lib/utils/availablePositions/reactComponents/reactHelpers";

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
        : "border-[#D6DEE8] bg-white text-sibs-primary-1 hover:border-sibs-primary-1 hover:bg-[#F8FAFC]";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex h-9 items-center justify-center whitespace-nowrap rounded-xl border px-3 text-xs font-extrabold shadow-sm transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 ${variantClass}`}
    >
      {children}
    </button>
  );
}

function EmptyTableRow() {
  return (
    <tr>
      <td colSpan={6} className="px-5 py-14 text-center">
        <div className="mx-auto max-w-sm rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] px-5 py-6">
          <p className="text-sm font-extrabold text-[#344054]">
            No positions found.
          </p>
          <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
            Try adjusting the filters or add a new available position.
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
    <div className="relative z-[1] p-4 sm:p-6">
      {isLoading ? (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-12 text-center text-sm font-extrabold text-sibs-primary-1">
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
              <div className="rounded-2xl border border-[#E6ECF2] bg-white px-5 py-10 text-center text-sm font-extrabold text-gray-500">
                No positions found.
              </div>
            )}
          </div>

          <div className="hidden lg:block">
            <div className="overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1120px] table-fixed border-separate border-spacing-0 text-left">
                  <thead>
                    <tr className="bg-[#F5F7FA] text-xs font-extrabold uppercase tracking-wide text-[#174A7C]">
                      <th className="w-[120px] px-5 py-4 text-center first:rounded-tl-2xl">
                        Pos. ID
                      </th>

                      <th className="w-[390px] px-5 py-4">Position</th>

                      <th className="w-[200px] px-5 py-4">Location / Site</th>

                      <th className="w-[220px] px-5 py-4 text-center">
                        Status
                      </th>

                      <th className="w-[190px] px-5 py-4">Last Updated</th>

                      <th className="w-[250px] px-5 py-4 text-center last:rounded-tr-2xl">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedPositions.length > 0 ? (
                      paginatedPositions.map((position) => {
                        const isActive = isSameStatus(
                          position.status,
                          activeStatus,
                        );

                        const isInactive = isSameStatus(
                          position.status,
                          inactiveStatus,
                        );

                        const positionSubText = [
                          position.jdCode,
                          position.documentTitle &&
                          position.documentTitle !== position.positionTitle
                            ? position.documentTitle
                            : "",
                        ]
                          .filter(Boolean)
                          .join("  ");

                        return (
                          <tr
                            key={position.id}
                            className="align-middle transition hover:bg-[#FAFBFC]"
                          >
                            <td className="border-b border-[#E6ECF2] px-5 py-5 text-center">
                              <span className="inline-flex whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-extrabold text-sibs-primary-1">
                                {position.positionId || "—"}
                              </span>
                            </td>

                            <td className="border-b border-[#E6ECF2] px-5 py-5">
                              <div className="min-w-0">
                                <p
                                  className="truncate whitespace-nowrap text-sm font-extrabold text-[#101828]"
                                  title={position.positionTitle || ""}
                                >
                                  {position.positionTitle || "—"}
                                </p>

                                {positionSubText && (
                                  <p
                                    className="mt-1 truncate whitespace-nowrap text-xs font-semibold text-sibs-primary-1"
                                    title={positionSubText}
                                  >
                                    {positionSubText}
                                  </p>
                                )}
                              </div>
                            </td>

                            <td className="border-b border-[#E6ECF2] px-5 py-5">
                              <p
                                className="truncate whitespace-nowrap text-sm font-bold text-[#344054]"
                                title={position.locationSite || ""}
                              >
                                {position.locationSite || "—"}
                              </p>
                            </td>

                            <td className="border-b border-[#E6ECF2] px-5 py-5 text-center">
                              <div className="flex justify-center">
                                <StatusBadge status={position.status} />
                              </div>
                            </td>

                            <td className="border-b border-[#E6ECF2] px-5 py-5">
                              <p className="truncate whitespace-nowrap text-sm font-extrabold text-[#344054]">
                                {formatDate(position.updatedAt)}
                              </p>

                              <p
                                className="mt-1 truncate whitespace-nowrap text-xs font-bold text-sibs-primary-1"
                                title={formatPersonName(
                                  position.updatedBy || position.createdBy,
                                )}
                              >
                                By:{" "}
                                {formatPersonName(
                                  position.updatedBy || position.createdBy,
                                )}
                              </p>
                            </td>

                            <td className="border-b border-[#E6ECF2] px-5 py-5 text-center">
                              <div className="inline-flex items-center justify-center gap-2">
                                {activeStatus && (
                                  <ActionButton
                                    variant="active"
                                    onClick={() =>
                                      onSetStatus?.(position, activeStatus)
                                    }
                                    disabled={isSaving || isActive}
                                  >
                                    Set Active
                                  </ActionButton>
                                )}

                                {inactiveStatus && (
                                  <ActionButton
                                    variant="inactive"
                                    onClick={() =>
                                      onSetStatus?.(position, inactiveStatus)
                                    }
                                    disabled={isSaving || isInactive}
                                  >
                                    Set Inactive
                                  </ActionButton>
                                )}

                                <button
                                  type="button"
                                  onClick={() => onEdit?.(position)}
                                  disabled={isSaving}
                                  title="Edit"
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white text-sibs-primary-1 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-sibs-primary-1 hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
                                >
                                  <Pencil size={15} />
                                </button>
                              </div>
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

          <div className="mt-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <p className="text-sm font-bold text-sibs-primary-1">
              Showing {showingFrom} to {showingTo} of {filteredPositionsCount}{" "}
              positions
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onPageChange?.(currentPage - 1)}
                disabled={currentPage <= 1}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E6ECF2] bg-white text-sibs-primary-1 shadow-sm transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:text-gray-300 disabled:opacity-60"
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
                    className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-extrabold shadow-sm transition ${
                      active
                        ? "bg-sibs-primary-1 text-white"
                        : "border border-[#E6ECF2] bg-white text-sibs-primary-1 hover:bg-[#F8FAFC]"
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
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E6ECF2] bg-white text-sibs-primary-1 shadow-sm transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:text-gray-300 disabled:opacity-60"
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
