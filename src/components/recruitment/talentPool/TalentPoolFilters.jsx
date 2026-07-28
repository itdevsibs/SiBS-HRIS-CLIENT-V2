import { useMemo } from "react";
import { Filter } from "lucide-react";
import { useTalentPool } from "../../../services/context/TalentPoolContext";
import PaginationTable from "../../../services/pagination/PaginationTable";

function cleanText(value) {
  return String(value ?? "").trim();
}

function normalizePositionOption(position) {
  if (!position) return null;

  if (typeof position === "string") {
    const title = cleanText(position);

    if (!title) return null;

    return {
      id: title,
      value: title,
      label: title,
    };
  }

  const title =
    position.positionTitle ||
    position.position_title ||
    position.title ||
    position.position ||
    position.name ||
    position.label ||
    position.value ||
    "";

  const id =
    position.id ||
    position.positionId ||
    position.position_id ||
    position.positionCode ||
    position.position_code ||
    title;

  const finalTitle = cleanText(title);
  const finalId = cleanText(id || finalTitle);

  if (!finalTitle && !finalId) return null;

  return {
    id: finalId || finalTitle,
    value: finalTitle || finalId,
    label: finalTitle || finalId,
  };
}

function buildPositionOptions(activePositionOptions = []) {
  const map = new Map();

  activePositionOptions.forEach((position) => {
    const normalized = normalizePositionOption(position);

    if (!normalized) return;

    const key = normalized.value.toLowerCase();

    if (!map.has(key)) {
      map.set(key, normalized);
    }
  });

  return Array.from(map.values()).sort((a, b) =>
    a.label.localeCompare(b.label),
  );
}

export default function TalentPoolFilters() {
  const {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    positionFilter,
    setPositionFilter,
    activePositionOptions,
    statusOptions,
    clearFilters,
    isLoading,
  } = useTalentPool();

  const positionDropdownOptions = useMemo(() => {
    return [
      {
        id: "All",
        value: "All",
        label: "All Positions",
      },
      ...buildPositionOptions(activePositionOptions),
    ];
  }, [activePositionOptions]);

  const statusDropdownOptions = useMemo(() => {
    const list = Array.isArray(statusOptions) ? statusOptions : [];

    return list.map((status) => ({
      id: status,
      value: status,
      label: status === "All" ? "All Status" : status,
    }));
  }, [statusOptions]);

  const hasActiveFilters =
    cleanText(search) || statusFilter !== "All" || positionFilter !== "All";

  return (
    <div className="relative z-[90] overflow-visible rounded-t-2xl border-b border-[#E6ECF2] bg-white p-4 sm:p-5">
      <div className="mb-4">
        <h2 className="sibs-section-title">
          Candidate Directory
        </h2>
        <p className="sibs-section-subtitle">
          Search and narrow the reusable candidate database
        </p>
      </div>

      <PaginationTable
        filterLayout="ta-inline"
        showFilterPanel={false}
        showFilterHeader={false}
        showPagination={false}
        loading={isLoading}
        searchValue={search}
        searchPlaceholder="Search candidate, email, phone, position, location..."
        onSearchChange={setSearch}
        dropdownFilters={[
          {
            key: "position",
            value: positionFilter,
            options: positionDropdownOptions,
            onChange: setPositionFilter,
            includeAll: false,
            allLabel: "All Positions",
            label: "Applied Position",
            placeholder: "Search positions...",
            searchable: true,
            disabled: isLoading,
          },
          {
            key: "status",
            value: statusFilter,
            options: statusDropdownOptions,
            onChange: setStatusFilter,
            includeAll: false,
            allLabel: "All Status",
            label: "Status",
            placeholder: "All Status",
            searchable: false,
            disabled: isLoading,
          },
        ]}
        rightContent={
          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasActiveFilters || isLoading}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[10px] border border-[#E6ECF2] bg-white px-3 text-xs font-extrabold text-[#98A2B3] outline-none transition hover:border-[#FF5C28]/40 hover:bg-[#FFF8F5] hover:text-[#FF5C28] focus-visible:ring-2 focus-visible:ring-[#FF5C28]/25 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 xl:w-auto"
          >
            <Filter size={15} />
            Clear
          </button>
        }
        className="border-0 bg-transparent p-0 shadow-none"
      />
    </div>
  );
}
