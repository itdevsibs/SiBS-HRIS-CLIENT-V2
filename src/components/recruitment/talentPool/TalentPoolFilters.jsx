import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Filter, ChevronDown } from "lucide-react";
import { useTalentPool } from "../../../services/context/TalentPoolContext";

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

function FilterDropdown({
  label,
  value,
  options = [],
  onChange,
  placeholder = "Select",
  disabled = false,
  zIndex = "z-[80]",
}) {
  const dropdownRef = useRef(null);
  const [open, setOpen] = useState(false);

  const selectedOption = options.find(
    (option) => String(option.value) === String(value),
  );

  const displayLabel = selectedOption?.label || placeholder;

  useEffect(() => {
    function handleClickOutside(event) {
      if (!dropdownRef.current) return;

      if (!dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function handleSelect(nextValue) {
    onChange(nextValue);
    setOpen(false);
  }

  return (
    <div
      ref={dropdownRef}
      className={`relative min-w-0 ${open ? zIndex : "z-[1]"}`}
    >
      <label className="mb-1.5 block text-sm font-extrabold text-[#101828]">
        {label}
      </label>

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={`flex h-12 w-full min-w-0 items-center justify-between gap-3 rounded-xl border bg-white px-4 text-left text-sm font-extrabold shadow-sm outline-none transition ${
          open
            ? "border-sibs-primary-1 ring-4 ring-sibs-primary-1/10"
            : "border-[#D0D5DD] hover:border-sibs-primary-1"
        } ${
          disabled
            ? "cursor-not-allowed bg-gray-50 text-gray-400 opacity-70"
            : "text-[#344054]"
        }`}
      >
        <span className="min-w-0 flex-1 truncate">{displayLabel}</span>

        <ChevronDown
          size={18}
          className={`shrink-0 text-sibs-primary-1 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && !disabled && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[9999] overflow-hidden rounded-xl border border-[#D9E2EC] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.18)]">
          <div className="max-h-72 overflow-y-auto">
            {options.length > 0 ? (
              options.map((option) => {
                const active = String(option.value) === String(value);

                return (
                  <button
                    key={option.id || option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`block w-full px-4 py-3.5 text-left text-sm font-semibold transition ${
                      active
                        ? "bg-[#EAF4FF] text-sibs-primary-1"
                        : "bg-white text-[#344054] hover:bg-[#F5F9FF] hover:text-sibs-primary-1"
                    }`}
                  >
                    <span className="block min-w-0 truncate">
                      {option.label}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-3.5 text-sm font-semibold text-sibs-tertiary-5">
                No options found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
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
    <div className="relative z-[90] overflow-visible border-b border-[#E6ECF2] bg-white px-4 py-5 sm:px-5 lg:px-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[minmax(280px,1fr)_minmax(210px,260px)_minmax(170px,220px)_110px] xl:items-end">
        <div className="min-w-0 md:col-span-2 xl:col-span-1">
          <label className="mb-1.5 block text-sm font-extrabold text-[#101828]">
            Search
          </label>

          <div className="relative">
            <Search
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search candidate, email, phone, position, location..."
              className="h-12 w-full min-w-0 rounded-xl border border-[#D0D5DD] bg-white px-4 pl-11 text-sm font-semibold text-sibs-primary-1 shadow-sm outline-none transition placeholder:text-sibs-tertiary-5 hover:border-sibs-primary-1 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
            />
          </div>
        </div>

        <FilterDropdown
          label="Applied Position"
          value={positionFilter}
          onChange={setPositionFilter}
          options={positionDropdownOptions}
          placeholder="All Positions"
          disabled={isLoading}
          zIndex="z-[100]"
        />

        <FilterDropdown
          label="Status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={statusDropdownOptions}
          placeholder="All Status"
          disabled={isLoading}
          zIndex="z-[90]"
        />

        <button
          type="button"
          onClick={clearFilters}
          disabled={!hasActiveFilters || isLoading}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-extrabold text-sibs-primary-1 shadow-sm transition hover:border-sibs-primary-1 hover:bg-[#F8FAFC] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 md:col-span-2 xl:col-span-1"
        >
          <Filter size={17} />
          Clear
        </button>
      </div>
    </div>
  );
}