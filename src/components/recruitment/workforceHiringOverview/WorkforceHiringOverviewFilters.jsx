import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { useWorkforceHiring } from "../../../services/context/WorkforceHiringContext";
import { useWorkforceHiringView } from "../../../services/context/WorkforceHiringContextAdapter";

function getText(value) {
  return String(value || "").trim();
}

function getOptionLabel(option) {
  if (typeof option === "string" || typeof option === "number") {
    return String(option);
  }

  return getText(
    option?.label ||
      option?.name ||
      option?.accountName ||
      option?.account ||
      option?.account_name ||
      option?.gy_acc_name ||
      option?.clusterName ||
      option?.cluster ||
      option?.weeklyVersion ||
      option?.weekly_version ||
      option?.weekRange ||
      option?.value,
  );
}

function getOptionValue(option) {
  if (typeof option === "string" || typeof option === "number") {
    return String(option);
  }

  return getText(
    option?.value ||
      option?.id ||
      option?.accountName ||
      option?.account ||
      option?.account_name ||
      option?.gy_acc_name ||
      option?.clusterName ||
      option?.cluster ||
      option?.label ||
      option?.weeklyVersion ||
      option?.weekly_version,
  );
}

function normalizeArrayValue(value, allValue) {
  if (Array.isArray(value)) {
    return value.length ? value : [allValue];
  }

  if (!value || value === allValue || value === "All") {
    return [allValue];
  }

  return [value];
}

function getMultiSelectLabel(selected = [], allValue, allLabel, itemLabel) {
  const cleanSelected = normalizeArrayValue(selected, allValue);

  if (!cleanSelected.length || cleanSelected.includes(allValue)) {
    return allLabel;
  }

  if (cleanSelected.length === 1) {
    return cleanSelected[0];
  }

  return `${cleanSelected.length} ${itemLabel} Selected`;
}

function toggleMultiValue(currentValue, nextValue, allValue) {
  const current = normalizeArrayValue(currentValue, allValue);

  if (nextValue === allValue) {
    return [allValue];
  }

  const withoutAll = current.filter((item) => item !== allValue);

  if (withoutAll.includes(nextValue)) {
    const next = withoutAll.filter((item) => item !== nextValue);
    return next.length ? next : [allValue];
  }

  return [...withoutAll, nextValue];
}

function DropdownPortal({
  open,
  anchorRef,
  children,
  onClose,
  maxHeight = 256,
  minWidth = 0,
}) {
  const dropdownRef = useRef(null);
  const [style, setStyle] = useState({
    top: 0,
    left: 0,
    width: 0,
    maxHeight,
  });

  useLayoutEffect(() => {
    if (!open || !anchorRef?.current) return undefined;

    function updatePosition() {
      const anchor = anchorRef.current;
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      const viewportWidth =
        window.innerWidth || document.documentElement.clientWidth || 0;
      const viewportHeight =
        window.innerHeight || document.documentElement.clientHeight || 0;

      const gap = 8;
      const safePadding = 8;
      const dropdownWidth = Math.max(rect.width, minWidth);
      const spaceBelow = viewportHeight - rect.bottom - gap - safePadding;
      const spaceAbove = rect.top - gap - safePadding;
      const shouldOpenUp = spaceBelow < 180 && spaceAbove > spaceBelow;

      const availableHeight = shouldOpenUp ? spaceAbove : spaceBelow;
      const cleanMaxHeight = Math.max(
        160,
        Math.min(maxHeight, Math.max(availableHeight, 160)),
      );

      const top = shouldOpenUp
        ? Math.max(safePadding, rect.top - cleanMaxHeight - gap)
        : Math.min(
            rect.bottom + gap,
            viewportHeight - cleanMaxHeight - safePadding,
          );

      const maxLeft = Math.max(
        safePadding,
        viewportWidth - dropdownWidth - safePadding,
      );

      const left = Math.min(Math.max(safePadding, rect.left), maxLeft);

      setStyle({
        top,
        left,
        width: dropdownWidth,
        maxHeight: cleanMaxHeight,
      });
    }

    updatePosition();

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [anchorRef, maxHeight, minWidth, open]);

  useEffect(() => {
    if (!open) return undefined;

    function handleClickOutside(event) {
      const clickedAnchor = anchorRef?.current?.contains(event.target);
      const clickedDropdown = dropdownRef.current?.contains(event.target);

      if (!clickedAnchor && !clickedDropdown) {
        onClose?.();
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose?.();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [anchorRef, onClose, open]);

  const [isRendered, setIsRendered] = useState(open);
  const [isAnimatedOpen, setIsAnimatedOpen] = useState(open);

  useEffect(() => {
    if (open) {
      setIsRendered(true);
      const timer = setTimeout(() => setIsAnimatedOpen(true), 15);
      return () => clearTimeout(timer);
    } else {
      setIsAnimatedOpen(false);
      const timer = setTimeout(() => setIsRendered(false), 200);
      return () => clearTimeout(timer);
    }
  }, [open]);

  if (!isRendered || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={dropdownRef}
      onMouseDownCapture={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onTouchStartCapture={(event) => event.stopPropagation()}
      onTouchStart={(event) => event.stopPropagation()}
      className={`fixed z-[999999] grid transition-all duration-200 ease-out ${
        isAnimatedOpen
          ? "grid-rows-[1fr] opacity-100"
          : "pointer-events-none grid-rows-[0fr] opacity-0"
      }`}
      style={{
        top: `${style.top}px`,
        left: `${style.left}px`,
        width: `${style.width}px`,
      }}
    >
      <div className="min-h-0 overflow-hidden">
        <div
          className={`overflow-hidden rounded-[10px] border border-[#D7DEE8] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.16)] transition-all duration-200 ease-out ${
            isAnimatedOpen
              ? "translate-y-0 scale-100"
              : "-translate-y-1 scale-[0.99]"
          }`}
        >
          <div
            className="sibs-scrollbar overflow-y-auto py-2"
            style={{ maxHeight: `${style.maxHeight}px` }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function WeeklyVersionDropdown({
  value,
  onChange,
  options = [],
  loading = false,
  onOpen,
}) {
  const buttonRef = useRef(null);
  const [open, setOpen] = useState(false);

  function formatWeekLabel(week) {
    if (!week) return "";

    const rawLabel = String(week?.label || "").trim();

    if (week?.year && week?.weekNumber) {
      return `${week.year} - Week ${week.weekNumber}`;
    }

    if (week?.weekNumber && rawLabel.match(/^\d{4}$/)) {
      return `${rawLabel} - Week ${week.weekNumber}`;
    }

    const match = rawLabel.match(/^(\d{4})\s*-?\s*week\s*(\d+)$/i);

    if (match) {
      return `${match[1]} - Week ${match[2]}`;
    }

    return rawLabel || "Weekly Version";
  }

  function formatWeeklyVersionDisplay(week) {
    if (!week) return "";

    const label = formatWeekLabel(week);
    const weekRange = week?.weekRange || week?.week_range || "";

    return weekRange ? `${label} | ${weekRange}` : label;
  }

  const normalizedOptions = useMemo(() => {
    const mappedOptions = (options || [])
      .map((week, index) => {
        const label = formatWeeklyVersionDisplay(week);
        const value =
          week?.id ||
          week?.weekKey ||
          week?.week_key ||
          `${week?.startDate || week?.weekStart || ""}__${
            week?.endDate || week?.weekEnd || ""
          }` ||
          label ||
          `week-${index}`;

        return {
          raw: week,
          label,
          value,
        };
      })
      .filter((option) => option.label && option.value);

    const hasForecastOptions = mappedOptions.some(
      (option) =>
        option.raw?.isForecast ||
        option.raw?.forecast ||
        option.raw?.type === "forecast",
    );

    return mappedOptions.sort((a, b) => {
      const dateA = new Date(
        a.raw?.startDate || a.raw?.weekStart || a.raw?.week_start || 0,
      ).getTime();
      const dateB = new Date(
        b.raw?.startDate || b.raw?.weekStart || b.raw?.week_start || 0,
      ).getTime();

      if (dateA && dateB && dateA !== dateB) {
        return hasForecastOptions ? dateA - dateB : dateB - dateA;
      }

      const yearA = Number(
        a.raw?.year || String(a.label || "").match(/\d{4}/)?.[0] || 0,
      );
      const yearB = Number(
        b.raw?.year || String(b.label || "").match(/\d{4}/)?.[0] || 0,
      );

      if (yearA !== yearB) {
        return hasForecastOptions ? yearA - yearB : yearB - yearA;
      }

      const weekA = Number(a.raw?.weekNumber || a.raw?.week_number || 0);
      const weekB = Number(b.raw?.weekNumber || b.raw?.week_number || 0);

      if (weekA !== weekB) {
        return hasForecastOptions ? weekA - weekB : weekB - weekA;
      }

      return 0;
    });
  }, [options]);

  const selectedOption = useMemo(() => {
    return (
      normalizedOptions.find((option) => option.value === value) ||
      normalizedOptions.find((option) => option.raw?.id === value) ||
      normalizedOptions.find((option) => option.label === value) ||
      normalizedOptions[0] ||
      null
    );
  }, [normalizedOptions, value]);

  function handleOpen() {
    if (loading) return;
    setOpen((prev) => !prev);
    onOpen?.();
  }

  function handleSelect(option) {
    onChange?.(option.value, option.raw);
    setOpen(false);
  }

  return (
    <div className="relative z-[80] min-w-0 overflow-visible">
      <label className="mb-1 block font-jakarta sibs-text-micro font-extrabold tracking-normal text-[#101828]">
        Weekly Version
      </label>

      <button
        ref={buttonRef}
        type="button"
        disabled={loading}
        onClick={handleOpen}
        className={`flex h-8.5 2xl:h-10 w-full items-center justify-between rounded-[10px] border border-[#E6ECF2] bg-[#F8FAFC] px-2.5 2xl:px-3 text-left font-jakarta sibs-text-xs font-bold text-[#042C51] outline-none transition disabled:cursor-not-allowed disabled:bg-[#F8FAFC] disabled:text-[#98A2B3] hover:border-[#FF5C28]/40 hover:bg-white focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10 ${
          open
            ? "border-[#FF5C28] bg-white ring-4 ring-[#FF5C28]/10"
            : ""
        }`}
      >
        <span className="min-w-0 truncate">
          {loading
            ? "Loading weekly versions..."
            : selectedOption?.label || "Select weekly version"}
        </span>

        <ChevronDown
          className={`ml-1.5 2xl:ml-2 h-3.5 w-3.5 2xl:h-4 2xl:w-4 shrink-0 transition-all duration-300 ${
            open ? "rotate-180 text-[#FF5C28]" : "text-[#667085]"
          }`}
        />
      </button>

      <DropdownPortal
        open={open && !loading}
        anchorRef={buttonRef}
        maxHeight={288}
        onClose={() => setOpen(false)}
      >
        {normalizedOptions.length > 0 ? (
          normalizedOptions.map((option) => {
            const week = option.raw;
            const isSelected =
              option.value === value ||
              week?.id === value ||
              option.label === value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option)}
                className={`block w-full px-4 py-2.5 text-left font-jakarta text-xs transition ${
                  isSelected
                    ? "bg-[#FFF0EB] font-extrabold text-[#FF5C28]"
                    : "font-bold text-[#344054] hover:bg-[#FFF7F3] hover:text-[#FF5C28]"
                }`}
              >
                <p className="truncate font-extrabold">{formatWeekLabel(week)}</p>

                <p className="mt-1 truncate text-[10px] font-semibold text-[#667085]">
                  {week?.weekRange || week?.week_range || "—"}
                </p>
              </button>
            );
          })
        ) : (
          <div className="px-4 py-3 font-jakarta text-xs font-semibold text-[#667085]">
            No weekly versions available.
          </div>
        )}
      </DropdownPortal>
    </div>
  );
}

function CheckboxDropdown({
  label,
  value,
  onChange,
  options = [],
  allValue,
  allLabel,
  selectedLabel,
  itemLabel,
  loading = false,
  searchable = false,
  searchPlaceholder = "Search...",
  emptyText = "No options found.",
  onOpen,
}) {
  const buttonRef = useRef(null);
  const inputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedValues = normalizeArrayValue(value, allValue);

  const normalizedOptions = useMemo(
    () =>
      (options || [])
        .map((option) => ({
          raw: option,
          label: getOptionLabel(option),
          value: getOptionValue(option) || getOptionLabel(option),
        }))
        .filter((option) => option.label && option.value),
    [options],
  );

  const filteredOptions = useMemo(() => {
    const cleanSearch = search.trim().toLowerCase();

    if (!cleanSearch) return normalizedOptions;

    return normalizedOptions.filter((option) =>
      option.label.toLowerCase().includes(cleanSearch),
    );
  }, [normalizedOptions, search]);

  function handleOpen() {
    if (loading) return;
    setOpen((prev) => !prev);
    setSearch("");
    onOpen?.();
  }

  function handleToggle(nextValue) {
    const nextSelected = toggleMultiValue(selectedValues, nextValue, allValue);
    onChange?.(nextSelected);
    setSearch("");
  }

  const displayLabel =
    selectedLabel ||
    getMultiSelectLabel(selectedValues, allValue, allLabel, itemLabel);

  const anchorRef = searchable ? inputRef : buttonRef;

  return (
    <div className="relative z-[70] min-w-0 overflow-visible">
      <label className="mb-1 block font-jakarta sibs-text-micro font-extrabold tracking-normal text-[#101828]">
        {label}
      </label>

      {searchable ? (
        <div className="relative overflow-visible">
          <input
            ref={inputRef}
            type="text"
            value={
              open ? search : loading ? "Loading..." : displayLabel
            }
            onChange={(event) => {
              setSearch(event.target.value);
              setOpen(true);
              onOpen?.();
            }}
            onFocus={() => {
              if (!loading) {
                setOpen(true);
                setSearch("");
                onOpen?.();
              }
            }}
            disabled={loading}
            placeholder={searchPlaceholder}
            autoComplete="off"
            className={`h-8.5 2xl:h-10 w-full rounded-[10px] border border-[#E6ECF2] bg-[#F8FAFC] px-2.5 2xl:px-3 pr-8 2xl:pr-10 font-jakarta sibs-text-xs font-bold text-[#042C51] outline-none transition disabled:cursor-not-allowed disabled:bg-[#F8FAFC] disabled:text-[#98A2B3] placeholder:text-[#98A2B3] hover:border-[#FF5C28]/40 hover:bg-white focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10 ${
              open
                ? "border-[#FF5C28] bg-white ring-4 ring-[#FF5C28]/10"
                : ""
            }`}
          />

          <ChevronDown
            onClick={handleOpen}
            className={`absolute right-2.5 2xl:right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 2xl:h-4 2xl:w-4 cursor-pointer transition-all duration-300 ${
              open ? "rotate-180 text-[#FF5C28]" : "text-[#667085]"
            }`}
          />
        </div>
      ) : (
        <button
          ref={buttonRef}
          type="button"
          disabled={loading}
          onClick={handleOpen}
          className={`flex h-8.5 2xl:h-10 w-full items-center justify-between rounded-[10px] border border-[#E6ECF2] bg-[#F8FAFC] px-2.5 2xl:px-3 text-left font-jakarta sibs-text-xs font-bold text-[#042C51] outline-none transition disabled:cursor-not-allowed disabled:bg-[#F8FAFC] disabled:text-[#98A2B3] hover:border-[#FF5C28]/40 hover:bg-white focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10 ${
            open
              ? "border-[#FF5C28] bg-white ring-4 ring-[#FF5C28]/10"
              : ""
          }`}
        >
          <span className="min-w-0 truncate">
            {loading ? "Loading..." : displayLabel}
          </span>

          <ChevronDown
            className={`ml-1.5 2xl:ml-2 h-3.5 w-3.5 2xl:h-4 2xl:w-4 shrink-0 transition-all duration-300 ${
            open ? "rotate-180 text-[#FF5C28]" : "text-[#667085]"
          }`}
          />
        </button>
      )}

      <DropdownPortal
        open={open && !loading}
        anchorRef={anchorRef}
        maxHeight={256}
        onClose={() => setOpen(false)}
      >
        <button
          type="button"
          onClick={() => handleToggle(allValue)}
          className={`flex w-full items-center gap-3 px-4 py-2.5 text-left font-jakarta text-xs transition ${
            selectedValues.includes(allValue)
              ? "bg-[#FFF0EB] font-extrabold text-[#FF5C28]"
              : "font-bold text-[#344054] hover:bg-[#FFF7F3] hover:text-[#FF5C28]"
          }`}
        >
          <input
            type="checkbox"
            checked={selectedValues.includes(allValue)}
            readOnly
            className="h-4 w-4 rounded border-[#D6E0EA] accent-[#FF5C28]"
          />

          <span className="truncate">{allLabel}</span>
        </button>

        {filteredOptions.length > 0 ? (
          filteredOptions.map((option) => {
            const checked =
              !selectedValues.includes(allValue) &&
              selectedValues.includes(option.value);

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleToggle(option.value)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left font-jakarta text-xs transition ${
                  checked
                    ? "bg-[#FFF0EB] font-extrabold text-[#FF5C28]"
                    : "font-bold text-[#344054] hover:bg-[#FFF7F3] hover:text-[#FF5C28]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  readOnly
                  className="h-4 w-4 rounded border-[#D6E0EA] accent-[#FF5C28]"
                />

                <span className="truncate">{option.label}</span>
              </button>
            );
          })
        ) : (
          <div className="px-4 py-4 font-jakarta text-xs font-semibold text-[#667085]">
            {emptyText}
          </div>
        )}
      </DropdownPortal>
    </div>
  );
}

export default function WorkforceHiringOverviewFilters({ weekMode = "actual" } = {}) {
  const workforceHiring = useWorkforceHiring();
  const {
    filters: {
      weeklyVersion,
      cluster,
      account,
      setWeeklyVersion,
      setCluster,
      setAccount,
      options,
    },
    status,
  } = useWorkforceHiringView();

  const registeredWeeklyVersion = workforceHiring?.weeklyVersion || {};
  const usesForecastWeeks = weekMode === "forecast";
  const weeklyVersionValue = usesForecastWeeks
    ? registeredWeeklyVersion.selectedForecastWeekId || ""
    : weeklyVersion;
  const weeklyVersionOptions = usesForecastWeeks
    ? registeredWeeklyVersion.forecastWeeklyVersions || []
    : options?.weeklyVersions || [];
  const weeklyVersionLoading = usesForecastWeeks
    ? Boolean(registeredWeeklyVersion.forecastLoading)
    : Boolean(status?.isLoadingWeeks);
  const handleWeeklyVersionChange = usesForecastWeeks
    ? registeredWeeklyVersion.setSelectedForecastWeekId
    : setWeeklyVersion;

  const [, setOpenName] = useState("");

  const selectedClusters = normalizeArrayValue(cluster, "All Clusters");
  const selectedAccounts = normalizeArrayValue(account, "All Accounts");

  function closeOtherDropdowns(nextOpenName) {
    setOpenName(nextOpenName);
  }

  return (
    <div className="relative z-[100] w-full overflow-visible">
      <div className="flex w-full justify-start xl:justify-end">
        <div className="flex w-full flex-col gap-2.5 2xl:gap-3 overflow-visible xl:w-auto xl:flex-row xl:items-end">
          <div className="w-full xl:w-[240px] 2xl:w-[310px] xl:flex-none">
            <WeeklyVersionDropdown
              value={weeklyVersionValue}
              onChange={(nextValue) => {
                handleWeeklyVersionChange?.(nextValue);

                if (!usesForecastWeeks) {
                  setCluster?.("All Clusters");
                  setAccount?.("All Accounts");
                }
              }}
              options={weeklyVersionOptions}
              loading={weeklyVersionLoading}
              onOpen={() => closeOtherDropdowns("week")}
            />
          </div>

          <div className="w-full xl:w-[140px] 2xl:w-[180px] xl:flex-none">
            <CheckboxDropdown
              label="Cluster"
              value={selectedClusters}
              onChange={(nextSelected) => {
                const nextValue = nextSelected.includes("All Clusters")
                  ? "All Clusters"
                  : nextSelected;

                setCluster?.(nextValue);
                setAccount?.("All Accounts");
              }}
              options={(options?.clusters || []).filter(
                (item) => getOptionValue(item) !== "All Clusters",
              )}
              allValue="All Clusters"
              allLabel="All Clusters"
              itemLabel="Clusters"
              selectedLabel={getMultiSelectLabel(
                selectedClusters,
                "All Clusters",
                "All Clusters",
                "Clusters",
              )}
              loading={status?.isLoadingFilters}
              emptyText="No clusters available."
              onOpen={() => closeOtherDropdowns("cluster")}
            />
          </div>

          <div className="w-full xl:w-[150px] 2xl:w-[190px] xl:flex-none">
            <CheckboxDropdown
              label="Account"
              value={selectedAccounts}
              onChange={(nextSelected) => {
                const nextValue = nextSelected.includes("All Accounts")
                  ? "All Accounts"
                  : nextSelected;

                setAccount?.(nextValue);
              }}
              options={(options?.accounts || []).filter(
                (item) => getOptionValue(item) !== "All Accounts",
              )}
              allValue="All Accounts"
              allLabel="All Accounts"
              itemLabel="Accounts"
              selectedLabel={getMultiSelectLabel(
                selectedAccounts,
                "All Accounts",
                "All Accounts",
                "Accounts",
              )}
              loading={status?.isLoadingAccounts}
              searchable
              searchPlaceholder="Search accounts..."
              emptyText="No accounts found."
              onOpen={() => closeOtherDropdowns("account")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}


