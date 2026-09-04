import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  Filter,
  GripHorizontal,
  LineChart,
  X,
} from "lucide-react";
import TrendSvg from "../../recruitment/workforceHiringOverview/shared/TrendSvg";
import { useWorkforceHiringView } from "../../../services/context/WorkforceHiringContextAdapter";
import PaginationTable from "../../../services/pagination/PaginationTable";
import {
  getWorkforceHiringPlanAccountTrends,
  getWorkforceHiringPlanSixWeekTable,
} from "../../../lib/axios/getWorkforceHiringPlan";
import {
  TREND_RANGE_OPTIONS,
  buildSixWeekRequestChunks,
  buildTrendSeries,
  calculateTrendRangeSummary,
  getTrendRangeDisplayLabel,
  getWeekOptionId,
  mergeRangeTableResponses,
  mergeTrendResponses,
  normalizeRequestFilterValue,
  normalizeTrendResponsePoints,
  resolveTrendRangeSelection,
  sortWeekOptionsChronologically,
} from "../../../lib/utils/workforceHiringOverview/workforceHiringTrendRangeHelpers";

const EDGE = "rounded-xl";

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

function buildTrendRequestFilterValue(value, allValue) {
  const selectedValues = normalizeArrayValue(value, allValue);

  if (!selectedValues.length || selectedValues.includes(allValue)) {
    return "All";
  }

  return selectedValues.join(",");
}

function safeNumber(value) {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function formatNumber(value) {
  return safeNumber(value).toLocaleString("en-US", {
    maximumFractionDigits: 0,
  });
}

function formatPercent(value) {
  return `${safeNumber(value).toFixed(2)}%`;
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatShortDate(value, includeYear = false) {
  if (!value) return "—";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(includeYear ? { year: "numeric" } : {}),
  });
}

function formatWeeklyVersionRange(startValue, endValue) {
  if (!startValue || !endValue) return "—";

  const startDate = new Date(`${startValue}T00:00:00`);
  const endDate = new Date(`${endValue}T00:00:00`);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return "—";
  }

  const sameYear = startDate.getFullYear() === endDate.getFullYear();

  if (sameYear) {
    return `${formatShortDate(startValue)} - ${formatShortDate(
      endValue,
      true,
    )}`;
  }

  return `${formatShortDate(startValue, true)} - ${formatShortDate(
    endValue,
    true,
  )}`;
}

function getWeekNumberFromLabel(label) {
  const match = String(label || "").match(/(?:week|wk)\s*-?\s*(\d+)/i);

  if (match?.[1]) return match[1];

  const fallbackMatch = String(label || "").match(/(\d+)/);

  return fallbackMatch?.[1] || "";
}

function getYearFromDate(value) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return "";

  return String(date.getFullYear());
}

function getWeekStartValue(item = {}) {
  return (
    item.weekStart ||
    item.week_start ||
    item.startDate ||
    item.start_date ||
    item.dateStart ||
    item.date_start ||
    ""
  );
}

function getWeekEndValue(item = {}) {
  return (
    item.weekEnd ||
    item.week_end ||
    item.endDate ||
    item.end_date ||
    item.dateEnd ||
    item.date_end ||
    ""
  );
}

function getWeekOptionYear(item = {}) {
  return String(
    item.year ||
    item.weekYear ||
    item.week_year ||
    getYearFromDate(getWeekStartValue(item)) ||
    getYearFromDate(getWeekEndValue(item)) ||
    "",
  );
}

function getWeekOptionNumber(item = {}) {
  return String(
    item.weekNumber ||
    item.week_number ||
    item.weekNo ||
    item.week_no ||
    item.week ||
    getWeekNumberFromLabel(item.label || item.weekLabel || item.week_label) ||
    "",
  );
}

function normalizeWeekOption(item = {}, index = 0) {
  const weekStart = getWeekStartValue(item);
  const weekEnd = getWeekEndValue(item);
  const year = getWeekOptionYear(item);
  const weekNumber = getWeekOptionNumber(item);
  const range = formatWeeklyVersionRange(weekStart, weekEnd);

  const title =
    year && weekNumber
      ? `${year} - Week ${weekNumber}`
      : String(
        item.label ||
        item.weekLabel ||
        item.week_label ||
        `Week ${index + 1}`,
      );

  return {
    ...item,
    id: String(
      item.id ||
      item.value ||
      item.week_id ||
      `${weekStart}-${weekEnd}-${index}`,
    ),
    title,
    range,
    value: range && range !== "—" ? `${title} | ${range}` : title,
    weekStart,
    weekEnd,
    year,
    weekNumber,
  };
}

function getWeeklyVersionOptionsFromView(view = {}) {
  const candidateLists = [
    // Same source used by WorkforceHiringOverviewFilters.
    view?.filters?.options?.weeklyVersions,
    view?.filters?.options?.weekly_versions,
    view?.filters?.options?.weeks,
    view?.filters?.options?.weekOptions,
    view?.filters?.weeklyOptions,
    view?.filters?.weekOptions,
    view?.filters?.weeklyVersions,
    view?.filters?.weeks,
    view?.weeklyOptions,
    view?.weekOptions,
    view?.weeklyVersions,
    view?.weeks,
    view?.pageHeader?.weeklyOptions,
    view?.pageHeader?.weekOptions,
    view?.pageHeader?.weeklyVersions,
    view?.overview?.weeklyOptions,
    view?.overview?.weeklyVersions,
  ];

  const source = candidateLists.find(
    (list) => Array.isArray(list) && list.length > 0,
  );

  return Array.isArray(source) ? source.map(normalizeWeekOption) : [];
}

function getTrendDetailWeekOptions(trendDetails = [], trendWeeks = []) {
  const details = Array.isArray(trendDetails) ? trendDetails : [];

  return details.map((row, index) =>
    normalizeWeekOption(
      {
        ...row,
        label:
          trendWeeks?.[index] || row.label || row.weekLabel || row.week_label,
      },
      index,
    ),
  );
}

function findMatchingWeekOption(options = [], target = {}) {
  const targetStart = getWeekStartValue(target);
  const targetEnd = getWeekEndValue(target);
  const targetWeekNumber = getWeekOptionNumber(target);

  return (
    options.find(
      (option) =>
        targetStart &&
        targetEnd &&
        option.weekStart === targetStart &&
        option.weekEnd === targetEnd,
    ) ||
    options.find((option) => targetStart && option.weekStart === targetStart) ||
    options.find(
      (option) =>
        targetWeekNumber && option.weekNumber === String(targetWeekNumber),
    ) ||
    null
  );
}

function getTrendRangeEndpointOption({
  type = "start",
  trendDetails = [],
  trendWeeks = [],
  trendMeta = {},
  weeklyOptions = [],
}) {
  const detailOptions = getTrendDetailWeekOptions(trendDetails, trendWeeks);
  const endpointDetail =
    type === "start"
      ? detailOptions[0]
      : detailOptions[detailOptions.length - 1];

  const fallbackTarget =
    type === "start"
      ? {
        label: trendWeeks?.[0],
        weekStart:
          endpointDetail?.weekStart ||
          trendMeta.trendStart ||
          trendMeta.trend_start,
        weekEnd:
          endpointDetail?.weekEnd ||
          trendMeta.trendStartEnd ||
          trendMeta.trend_start_end,
      }
      : {
        label: trendWeeks?.[trendWeeks.length - 1],
        weekStart:
          endpointDetail?.weekStart ||
          trendMeta.weekStart ||
          trendMeta.week_start,
        weekEnd:
          endpointDetail?.weekEnd || trendMeta.weekEnd || trendMeta.week_end,
      };

  const target = endpointDetail || normalizeWeekOption(fallbackTarget);

  return findMatchingWeekOption(weeklyOptions, target) || target;
}

function DropdownPortal({
  open,
  anchorRef,
  children,
  onClose,
  maxHeight = 288,
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

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={dropdownRef}
      onMouseDownCapture={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onTouchStartCapture={(event) => event.stopPropagation()}
      onTouchStart={(event) => event.stopPropagation()}
      className={`sibs-dropdown-pop-in fixed z-[999999] overflow-hidden ${EDGE} border border-[#D7DEE8] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.16)]`}
      style={{
        top: `${style.top}px`,
        left: `${style.left}px`,
        width: `${style.width}px`,
      }}
    >
      <div
        className="sibs-scrollbar overflow-y-auto py-1.5"
        style={{ maxHeight: `${style.maxHeight}px` }}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

function TrendDisplayDropdown({
  label,
  value,
  options = [],
  selectedOption = null,
  open = false,
  disabled = false,
  onToggle,
  onClose,
  onSelect,
}) {
  const buttonRef = useRef(null);
  const menuOptions =
    Array.isArray(options) && options.length > 0 ? options : [];
  const selectedId = String(selectedOption?.id || selectedOption?.value || "");

  function handleSelect(option) {
    onSelect?.(option);
    onClose?.();
  }

  return (
    <div className="relative min-w-0 overflow-visible">
      <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
        {label}
      </label>

      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={onToggle}
        className={`flex h-8.5 2xl:h-10 w-full items-center justify-between ${EDGE} border border-[#D7DEE8] bg-[#F8FAFC] px-3 2xl:px-3.5 text-left font-jakarta sibs-text-xs font-semibold text-[#042C51] outline-none transition disabled:cursor-not-allowed disabled:bg-[#F2F4F7] disabled:text-[#98A2B3] hover:border-[#FF5C28]/40 hover:bg-white focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10 ${open ? "border-[#FF5C28] bg-white ring-4 ring-[#FF5C28]/10" : ""
          }`}
      >
        <span className="min-w-0 truncate">{value || "—"}</span>

        <ChevronDown
          size={16}
          className={`ml-2 shrink-0 text-sibs-tertiary-5 transition-transform duration-300 ${open ? "rotate-180" : ""
            }`}
        />
      </button>

      <DropdownPortal
        open={open && !disabled}
        anchorRef={buttonRef}
        maxHeight={288}
        onClose={onClose}
      >
        {menuOptions.length > 0 ? (
          menuOptions.map((option, index) => {
            const optionId = getWeekOptionId(option, index);
            const isSelected =
              optionId === selectedId ||
              String(option.value || "") ===
              String(selectedOption?.value || "");

            return (
              <button
                key={optionId || option.title}
                type="button"
                onClick={() => handleSelect(option)}
                className={`block w-full px-3.5 py-2 text-left sibs-text-xs transition ${isSelected
                  ? "bg-[#FFF0EB] font-extrabold text-[#FF5C28]"
                  : "font-bold text-[#344054] hover:bg-[#FFF7F3] hover:text-[#FF5C28]"
                  }`}
              >
                <p className="truncate font-bold">{option.title}</p>

                <p className="mt-0.5 truncate sibs-text-micro font-semibold text-sibs-tertiary-5">
                  {option.range || "—"}
                </p>
              </button>
            );
          })
        ) : (
          <div className="px-3.5 py-2.5 sibs-text-xs font-semibold text-[#667085]">
            No weekly versions available.
          </div>
        )}
      </DropdownPortal>
    </div>
  );
}

function TrendDisplayField({ label, value }) {
  return (
    <div className="min-w-0">
      <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
        {label}
      </label>

      <div
        className={`flex h-8.5 2xl:h-10 w-full items-center justify-between ${EDGE} border border-[#D7DEE8] bg-[#F8FAFC] px-3 2xl:px-3.5 text-left font-jakarta sibs-text-xs font-semibold text-[#042C51] shadow-sm`}
      >
        <span className="min-w-0 truncate">{value || "—"}</span>

        <ChevronDown size={16} className="ml-2 shrink-0 text-sibs-tertiary-5" />
      </div>
    </div>
  );
}

function TrendCheckboxDropdown({
  label,
  value,
  onChange,
  options = [],
  allValue,
  allLabel,
  itemLabel,
  loading = false,
  searchable = false,
  searchPlaceholder = "Search...",
  emptyText = "No options found.",
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

  const displayLabel = getMultiSelectLabel(
    selectedValues,
    allValue,
    allLabel,
    itemLabel,
  );

  const anchorRef = searchable ? inputRef : buttonRef;

  function handleOpen() {
    if (loading) return;
    setOpen((prev) => !prev);
    setSearch("");
  }

  function handleToggle(nextValue) {
    const nextSelected = toggleMultiValue(selectedValues, nextValue, allValue);
    onChange?.(nextSelected);
    setSearch("");
  }

  return (
    <div className="relative min-w-0 overflow-visible">
      <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
        {label}
      </label>

      {searchable ? (
        <div className="relative overflow-visible">
          <input
            ref={inputRef}
            type="text"
            value={
              open
                ? search
                : loading
                  ? `Loading ${itemLabel.toLowerCase()}...`
                  : displayLabel
            }
            onChange={(event) => {
              setSearch(event.target.value);
              setOpen(true);
            }}
            onFocus={() => {
              if (!loading) {
                setOpen(true);
                setSearch("");
              }
            }}
            disabled={loading}
            placeholder={searchPlaceholder}
            autoComplete="off"
            className={`h-8.5 2xl:h-10 w-full ${EDGE} border border-[#D7DEE8] bg-[#F8FAFC] px-3 2xl:px-3.5 pr-10 font-jakarta sibs-text-xs font-semibold text-[#042C51] outline-none transition disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 placeholder:text-[#98A2B3] hover:border-[#FF5C28]/40 hover:bg-white focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10`}
          />

          <ChevronDown
            size={16}
            onClick={handleOpen}
            className={`absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer text-sibs-tertiary-5 transition-transform duration-300 ${open ? "rotate-180" : ""
              }`}
          />
        </div>
      ) : (
        <button
          ref={buttonRef}
          type="button"
          disabled={loading}
          onClick={handleOpen}
          className={`flex h-8.5 2xl:h-10 w-full items-center justify-between ${EDGE} border border-[#D7DEE8] bg-[#F8FAFC] px-3 2xl:px-3.5 text-left font-jakarta sibs-text-xs font-semibold text-[#042C51] outline-none transition disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 hover:border-[#FF5C28]/40 hover:bg-white focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10 ${open ? "border-[#FF5C28] bg-white ring-4 ring-[#FF5C28]/10" : ""
            }`}
        >
          <span className="min-w-0 truncate">
            {loading ? "Loading..." : displayLabel}
          </span>

          <ChevronDown
            size={16}
            className={`ml-2 shrink-0 text-sibs-tertiary-5 transition-transform duration-300 ${open ? "rotate-180" : ""
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
          className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-xs transition ${selectedValues.includes(allValue)
            ? "bg-[#FFF0EB] font-extrabold text-[#FF5C28]"
            : "font-bold text-[#344054] hover:bg-[#FFF7F3] hover:text-[#FF5C28]"
            }`}
        >
          <input
            type="checkbox"
            checked={selectedValues.includes(allValue)}
            readOnly
            className="h-4 w-4 rounded border-[#D0D5DD] accent-[#FF5C28]"
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
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-xs transition ${checked
                  ? "bg-[#FFF0EB] font-extrabold text-[#FF5C28]"
                  : "font-bold text-[#344054] hover:bg-[#FFF7F3] hover:text-[#FF5C28]"
                  }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  readOnly
                  className="h-4 w-4 rounded border-[#D0D5DD] accent-[#FF5C28]"
                />

                <span className="truncate">{option.label}</span>
              </button>
            );
          })
        ) : (
          <div className="px-4 py-4 text-xs font-semibold text-[#667085]">
            {emptyText}
          </div>
        )}
      </DropdownPortal>
    </div>
  );
}

function getBufferColor(value) {
  const numberValue = safeNumber(value);

  if (numberValue < 0) return "!font-jakarta !text-xs !font-black !text-rose-600";
  if (numberValue > 0) return "!font-jakarta !text-xs !font-black !text-emerald-600";

  return "font-black text-[#042C51]";
}

function getRowValue(row = {}, keys = []) {
  for (const key of keys) {
    const value = row?.[key];

    if (value !== null && value !== undefined && value !== "") {
      return safeNumber(value);
    }
  }

  return 0;
}

function buildDetailedTableTotals(rows = []) {
  const detailRows = Array.isArray(rows) ? rows : [];

  const totals = detailRows.reduce(
    (sum, row) => {
      const requiredHeadcount = getRowNumber(row, [
        "requiredHeadcount",
        "required_headcount",
      ]);

      const actualHeadcount = getRowNumber(row, [
        "actualHeadcount",
        "actual_headcount",
      ]);

      const absenteeism = getRowNumber(row, [
        "absenteeism",
        "absenteeismCount",
        "absenteeism_count",
        "averageAbsentHeadcount",
        "average_absent_headcount",
      ]);

      const attrition = getRowNumber(row, [
        "attrition",
        "attritionPastCount",
        "attrition_past_count",
        "attritionCount",
        "attrition_count",
        "attritionSixWeeks",
        "attrition_6_weeks",
      ]);

      const acceptedJo = getRowNumber(row, [
        "acceptedJo",
        "acceptedJO",
        "accepted_jo",
        "interviewCount",
        "interview_count",
        "interviewPopulationCount",
        "interview_population_count",
      ]);

      const nhoCount = getRowNumber(row, [
        "nho",
        "nhoCount",
        "nho_count",
        "nhoPopulationCount",
        "nho_population_count",
      ]);

      const fstCount = getRowNumber(row, [
        "fst",
        "fstCount",
        "fst_count",
        "fstPopulationCount",
        "fst_population_count",
      ]);

      const pstCount = getRowNumber(row, [
        "pst",
        "pstCount",
        "pst_count",
        "pstPopulationCount",
        "pst_population_count",
      ]);

      const goLive = getRowNumber(row, [
        "goLive",
        "go_live",
        "projectedToBeEndorsed",
        "projected_to_be_endorsed",
        "projectedEndorsed",
        "projected_endorsed",
      ]);

      const hiredCount = getRowNumber(
        row,
        ["hiredCount", "hired_count"],
        fstCount,
      );

      const leadsToInterview = getRowNumber(row, [
        "leadsToInterview",
        "leads_to_interview",
      ]);

      sum.requiredHeadcount += requiredHeadcount;
      sum.actualHeadcount += actualHeadcount;
      sum.absenteeism += absenteeism;
      sum.attrition += attrition;

      sum.acceptedJo += acceptedJo;
      sum.nhoCount += nhoCount;
      sum.fstCount += fstCount;
      sum.pstCount += pstCount;
      sum.goLive += goLive;
      sum.hiredCount += hiredCount;
      sum.leadsToInterview += leadsToInterview;

      sum.joNhoCount += getRowNumber(row, [
        "joNhoCount",
        "jo_nho_count",
        "attritionInterviewToNhoCount",
        "attrition_interview_to_nho_count",
      ]);

      sum.nhoFstCount += getRowNumber(row, [
        "nhoFstCount",
        "nho_fst_count",
        "attritionNhoToFstPstCount",
        "attrition_nho_to_fst_pst_count",
        "attritionNhoToFstCount",
        "attrition_nho_to_fst_count",
      ]);

      sum.fstPstCount += getRowNumber(row, [
        "fstPstCount",
        "fst_pst_count",
        "attritionFstToPstCount",
        "attrition_fst_to_pst_count",
      ]);

      sum.nhoPstCount += getRowNumber(row, [
        "nhoPstCount",
        "nho_pst_count",
        "attritionNhoToPstCount",
        "attrition_nho_to_pst_count",
      ]);

      sum.pstGoLiveCount += getRowNumber(row, [
        "pstGoLiveCount",
        "pst_go_live_count",
        "attritionPstToGoLiveCount",
        "attrition_pst_to_go_live_count",
      ]);

      return sum;
    },
    {
      requiredHeadcount: 0,
      actualHeadcount: 0,
      absenteeism: 0,
      attrition: 0,
      acceptedJo: 0,
      nhoCount: 0,
      fstCount: 0,
      pstCount: 0,
      goLive: 0,
      hiredCount: 0,
      leadsToInterview: 0,
      joNhoCount: 0,
      nhoFstCount: 0,
      fstPstCount: 0,
      nhoPstCount: 0,
      pstGoLiveCount: 0,
    },
  );

  const netActualHeadcount =
    totals.actualHeadcount - totals.absenteeism - totals.attrition;

  const hiringNeeded = Math.max(
    0,
    totals.requiredHeadcount - netActualHeadcount,
  );

  function averagePercent(numerator, denominator) {
    return denominator ? (numerator / denominator) * 100 : 0;
  }

  return {
    ...totals,

    bufferPercent: averagePercent(
      netActualHeadcount - totals.requiredHeadcount,
      totals.requiredHeadcount,
    ),

    absenteeismPercent: averagePercent(
      totals.absenteeism,
      totals.actualHeadcount,
    ),

    attritionPercent: averagePercent(totals.attrition, totals.actualHeadcount),

    netActualHeadcount,
    hiringNeeded,

    joNhoPercent: averagePercent(totals.joNhoCount, totals.acceptedJo),
    nhoFstPercent: averagePercent(totals.nhoFstCount, totals.nhoCount),
    fstPstPercent: averagePercent(totals.fstPstCount, totals.fstCount),
    nhoPstPercent: averagePercent(totals.nhoPstCount, totals.nhoCount),
    pstGoLivePercent: averagePercent(totals.pstGoLiveCount, totals.pstCount),

    hiringRate: averagePercent(totals.hiredCount, totals.leadsToInterview),
  };
}

function getNegativePositiveColor(value) {
  const numberValue = safeNumber(value);

  if (numberValue < 0) return "!font-jakarta !text-xs !font-black !text-rose-600";
  if (numberValue > 0) return "!font-jakarta !text-xs !font-black !text-emerald-600";

  return "font-black text-[#042C51]";
}

function getHiringNeededColor(value) {
  return safeNumber(value) > 0
    ? "!font-jakarta !text-xs !font-black !text-rose-600"
    : "text-slate-400";
}

function getRowNumber(row = {}, keys = [], fallback = 0) {
  for (const key of keys) {
    const value = row?.[key];

    if (value !== null && value !== undefined && value !== "") {
      return safeNumber(value);
    }
  }

  return safeNumber(fallback);
}

function getRowText(row = {}, keys = [], fallback = "—") {
  for (const key of keys) {
    const value = row?.[key];

    if (value !== null && value !== undefined && String(value).trim() !== "") {
      return String(value);
    }
  }

  return fallback;
}

function getRowClusterValue(row = {}) {
  return getRowText(row, [
    "cluster",
    "clusterName",
    "cluster_name",
    "clusterLabel",
    "cluster_label",
    "tenantCluster",
    "tenant_cluster",
  ], "");
}

function getRowAccountValue(row = {}) {
  return getRowText(row, [
    "account",
    "accountName",
    "account_name",
    "accountClient",
    "account_client",
    "clientAccount",
    "client_account",
    "departmentAccount",
    "department_account",
  ], "");
}

function MetricToggle({ active, colorClass, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex w-full items-center justify-start gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-bold transition",
        active
          ? "border-slate-300 bg-white text-sibs-primary-1 shadow-sm"
          : "border-slate-200 bg-slate-50 text-slate-400",
      ].join(" ")}
    >
      <span
        className={[
          "h-[3px] w-6 rounded-full",
          active ? colorClass : "bg-slate-300",
        ].join(" ")}
      />
      {label}
    </button>
  );
}

function DraggableXScroll({ children, className = "" }) {
  const scrollRef = useRef(null);
  const dragStateRef = useRef({
    isDown: false,
    startX: 0,
    scrollLeft: 0,
    hasMoved: false,
  });

  const [isDragging, setIsDragging] = useState(false);

  function startDragging(event) {
    if (event.button !== 0) return;

    const scrollElement = scrollRef.current;

    if (!scrollElement) return;

    dragStateRef.current = {
      isDown: true,
      startX: event.pageX - scrollElement.offsetLeft,
      scrollLeft: scrollElement.scrollLeft,
      hasMoved: false,
    };

    setIsDragging(true);
  }

  function stopDragging() {
    dragStateRef.current.isDown = false;
    setIsDragging(false);
  }

  function moveDragging(event) {
    const scrollElement = scrollRef.current;
    const dragState = dragStateRef.current;

    if (!scrollElement || !dragState.isDown) return;

    event.preventDefault();

    const currentX = event.pageX - scrollElement.offsetLeft;
    const dragDistance = currentX - dragState.startX;

    if (Math.abs(dragDistance) > 3) {
      dragState.hasMoved = true;
    }

    scrollElement.scrollLeft = dragState.scrollLeft - dragDistance;
  }

  function handleClickCapture(event) {
    if (!dragStateRef.current.hasMoved) return;

    event.preventDefault();
    event.stopPropagation();

    dragStateRef.current.hasMoved = false;
  }

  return (
    <div
      className={[
        "overflow-hidden rounded-xl border border-slate-200",
        className,
      ].join(" ")}
    >
      <div
        ref={scrollRef}
        onMouseDown={startDragging}
        onMouseLeave={stopDragging}
        onMouseUp={stopDragging}
        onMouseMove={moveDragging}
        onClickCapture={handleClickCapture}
        className={[
          "overflow-x-auto overscroll-x-contain sibs-scrollbar",
          "select-none [scrollbar-gutter:stable]",
          isDragging ? "cursor-grabbing" : "cursor-grab",
        ].join(" ")}
      >
        {children}
      </div>
    </div>
  );
}

function DetailTh({
  children,
  rowSpan,
  colSpan,
  className = "",
  group = false,
  ...props
}) {
  return (
    <th
      {...props}
      rowSpan={rowSpan}
      colSpan={colSpan}
      className={`sibs-data-table-th border border-slate-200 !px-3 text-center align-middle font-jakarta uppercase tracking-wider ${
        group
          ? "!bg-[#EBF3FA] !py-2 !text-[10px] !font-black !text-sibs-primary-1"
          : "!bg-[#F8FAFC] !py-2.5 !text-[10px] !font-extrabold !text-slate-500"
      } ${className}`}
    >
      {children}
    </th>
  );
}

const DETAIL_BOLD_NUMBER_CLASS = "!font-jakarta !text-xs !font-black !text-[#042C51]";

function DetailTd({
  children,
  className = "",
  align = "right",
  numeric = true,
  ...props
}) {
  const alignmentClass =
    align === "left"
      ? "text-left"
      : align === "center"
        ? "text-center"
        : "text-right";

  return (
    <td
      {...props}
      className={`whitespace-nowrap border-b border-[#E6ECF2] px-3 py-2.5 align-middle text-xs leading-tight ${
        numeric ? "font-mono tabular-nums" : "font-jakarta"
      } ${alignmentClass} ${className}`}
    >
      {children}
    </td>
  );
}

function SortHeaderButton({ label, active = false, direction = "asc", onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseDown={(event) => event.stopPropagation()}
      className={[
        "group inline-flex min-w-0 items-center justify-center gap-1 whitespace-nowrap rounded-none bg-transparent p-0 font-jakarta text-[10px] font-black uppercase leading-tight tracking-wider transition-colors focus:outline-none focus-visible:text-sibs-primary-1",
        active
          ? "text-sibs-primary-1"
          : "text-[#042C51] hover:text-sibs-primary-2",
      ].join(" ")}
    >
      <span>{label}</span>
      {active ? (
        <span
          aria-hidden="true"
          className={`h-0 w-0 border-x-[3px] border-x-transparent ${
            direction === "asc"
              ? "border-b-[5px] border-b-[#042C51]"
              : "border-t-[5px] border-t-[#042C51]"
          }`}
        />
      ) : null}
    </button>
  );
}

function TrendLoadingScreen({ title, classname = "" }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${classname}`}>
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-sibs-primary-2" />
      <p className="mt-4 text-sm font-extrabold text-sibs-primary-1">{title}</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">
        Please wait while the data is loading.
      </p>
    </div>
  );
}

const WORKFORCE_RISK_OPTIONS = [
  "All Risks",
  "Healthy",
  "Watch",
  "At Risk",
  "Critical",
];

function getModalWorkforceRiskLevel(row = {}) {
  const explicit = String(
    row.riskLevel || row.risk_level || row.risk || row.riskStatus || "",
  )
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ");

  if (["healthy", "low", "low risk", "good"].includes(explicit)) return "Healthy";
  if (["watch", "monitor", "medium", "medium risk"].includes(explicit)) return "Watch";
  if (["at risk", "atrisk", "high", "high risk"].includes(explicit)) return "At Risk";
  if (["critical", "severe", "urgent"].includes(explicit)) return "Critical";

  const buffer = getRowNumber(row, [
    "bufferPercent",
    "buffer_percentage",
    "bufferPercentage",
  ]);
  const hiringNeeded = getRowNumber(row, ["hiringNeeded", "hiring_needed"]);
  const absenteeism = getRowNumber(row, [
    "absenteeismPercent",
    "absenteeism_percentage",
    "absenteeismPercentage",
  ]);
  const attrition = getRowNumber(row, [
    "attritionPercent",
    "attrition_percentage",
    "attritionPercentage",
  ]);

  if (buffer <= -20 || hiringNeeded >= 20 || absenteeism >= 15 || attrition >= 10) {
    return "Critical";
  }
  if (buffer <= -10 || hiringNeeded >= 10 || absenteeism >= 10 || attrition >= 7) {
    return "At Risk";
  }
  if (buffer < 0 || hiringNeeded > 0 || absenteeism >= 5 || attrition >= 5) {
    return "Watch";
  }
  return "Healthy";
}

function SixWeekDetailedPerformanceTable({
  rows = [],
  loading = false,
  error = "",
  rangeLabel = "6-Week Range",
  rangeWeekCount = 6,
}) {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCluster, setSelectedCluster] = useState("All Clusters");
  const [selectedRisk, setSelectedRisk] = useState("All Risks");
  const [sortConfig, setSortConfig] = useState({ key: "cluster", direction: "asc" });

  const clusterOptions = useMemo(
    () => [
      "All Clusters",
      ...Array.from(
        new Set(
          (Array.isArray(rows) ? rows : [])
            .map((row) => getRowClusterValue(row))
            .filter(Boolean),
        ),
      ).sort((first, second) =>
        first.localeCompare(second, undefined, { numeric: true, sensitivity: "base" }),
      ),
    ],
    [rows],
  );

  function handleSort(key) {
    setSortConfig((current) => {
      if (current.key === key) {
        return {
          key,
          direction: current.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  }

  const filteredRows = useMemo(() => {
    const keyword = String(search || "").trim().toLowerCase();
    const safeRows = Array.isArray(rows) ? rows : [];

    const filtered = safeRows.filter((row) => {
      const matchesSearch =
        !keyword ||
        [getRowClusterValue(row), getRowAccountValue(row)].some((value) =>
          String(value || "").toLowerCase().includes(keyword),
        );
      const matchesCluster =
        selectedCluster === "All Clusters" ||
        getRowClusterValue(row) === selectedCluster;
      const matchesRisk =
        selectedRisk === "All Risks" ||
        getModalWorkforceRiskLevel(row) === selectedRisk;

      return matchesSearch && matchesCluster && matchesRisk;
    });

    if (!sortConfig.key) return filtered;

    return [...filtered].sort((first, second) => {
      const firstVal =
        sortConfig.key === "cluster"
          ? getRowClusterValue(first)
          : getRowAccountValue(first);
      const secondVal =
        sortConfig.key === "cluster"
          ? getRowClusterValue(second)
          : getRowAccountValue(second);

      const comparison = String(firstVal || "").localeCompare(
        String(secondVal || ""),
        undefined,
        { numeric: true, sensitivity: "base" },
      );

      return sortConfig.direction === "asc" ? comparison : -comparison;
    });
  }, [rows, search, selectedCluster, selectedRisk, sortConfig]);

  const hasRows = filteredRows.length > 0;
  const detailTotals = useMemo(
    () => buildDetailedTableTotals(filteredRows),
    [filteredRows],
  );

  function handleSearchKeyDown(event) {
    if (event.key !== "Enter") return;
    setSearch(searchInput.trim());
  }

  function clearAllFilters() {
    setSearchInput("");
    setSearch("");
    setSelectedCluster("All Clusters");
    setSelectedRisk("All Risks");
  }

  const hasActiveFilters =
    Boolean(searchInput || search) ||
    selectedCluster !== "All Clusters" ||
    selectedRisk !== "All Risks";

  return (
    <section className="sibs-page-card-in sibs-card mt-4 overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white shadow-sm">
      <div className="border-b border-[#E6ECF2] p-4 sm:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <h3 className="sibs-section-title">
              {rangeLabel} Detailed Performance by Cluster / Account
            </h3>
            <p className="sibs-section-subtitle">
              Same table format as the main detailed table, calculated from {rangeWeekCount} selected production weeks.
            </p>
          </div>

          <span className="inline-flex w-fit items-center gap-2 rounded-lg border border-[#E6ECF2] bg-[#F8FAFC] px-3 py-2 text-[10px] font-extrabold uppercase tracking-wide text-[#667085]">
            <GripHorizontal className="h-3.5 w-3.5 text-[#FF5C28]" />
            Drag horizontally to inspect all columns
          </span>
        </div>

        <PaginationTable
          className="mt-4 border-0 bg-transparent p-0 shadow-none"
          showPagination={false}
          searchValue={searchInput}
          searchPlaceholder="Search account or cluster, then press Enter..."
          onSearchChange={setSearchInput}
          onSearchKeyDown={handleSearchKeyDown}
          filterLayout="ta-inline"
          controlsClassName="flex flex-col gap-3 overflow-visible xl:flex-row xl:items-end"
          searchClassName="relative w-full min-w-0 xl:flex-[1_1_520px]"
          dropdownFilters={[
            {
              key: "cluster",
              value: selectedCluster,
              onChange: setSelectedCluster,
              options: clusterOptions
                .filter((option) => option !== "All Clusters")
                .map((option) => ({ label: option, value: option })),
              allLabel: "All Clusters",
              placeholder: "Search clusters...",
              includeAll: true,
              searchable: true,
              className: "w-full xl:w-[210px] xl:flex-none",
            },
            {
              key: "risk",
              value: selectedRisk,
              onChange: setSelectedRisk,
              options: WORKFORCE_RISK_OPTIONS
                .filter((option) => option !== "All Risks")
                .map((option) => ({ label: option, value: option })),
              allLabel: "All Risks",
              placeholder: "Search risks...",
              includeAll: true,
              searchable: true,
              className: "w-full xl:w-[180px] xl:flex-none",
            },
          ]}
          rightContentClassName="flex w-full items-end xl:w-auto xl:flex-none"
          rightContent={
            <div className="flex h-10 items-center gap-2">
              <span className="rounded-full border border-blue-100 bg-[#E9F0FC] px-3 py-1.5 text-[10px] font-extrabold text-[#042C51]">
                {loading ? "Loading..." : `${filteredRows.length} account rows`}
              </span>

              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="h-9 rounded-lg border border-[#D6E0EA] bg-white px-3 text-[10px] font-extrabold text-[#667085] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF7F3] hover:text-[#FF5C28]"
                >
                  Clear
                </button>
              ) : null}
            </div>
          }
        />
      </div>

      <div className="p-4 sm:p-5">
        {error ? (
          <div className="mb-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {error}
          </div>
        ) : null}

        <DraggableXScroll className="mt-4 border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[2600px] border-collapse text-left">
            <thead>
              <tr>
                <DetailTh
                  colSpan={2}
                  group
                  className="!border-r-slate-200"
                >
                  1. Identification & Scope
                </DetailTh>
                <DetailTh
                  colSpan={5}
                  group
                  className="!border-r-slate-200"
                >
                  2. Capacity & Buffer Metrics
                </DetailTh>
                <DetailTh
                  colSpan={4}
                  group
                  className="!border-r-slate-200"
                >
                  3. Current Week Loss
                </DetailTh>
                <DetailTh
                  colSpan={5}
                  group
                  className="!border-r-slate-200"
                >
                  4. Post-Offer Funnel Counts
                </DetailTh>
                <DetailTh
                  colSpan={10}
                  group
                  className="!border-r-slate-200"
                >
                  5. Attrition Between Stages
                </DetailTh>
                <DetailTh
                  colSpan={2}
                  group
                >
                  6. Hiring Yield
                </DetailTh>
              </tr>
              <tr>
                <DetailTh>
                  <SortHeaderButton
                    label="Cluster"
                    active={sortConfig.key === "cluster"}
                    direction={sortConfig.direction}
                    onClick={() => handleSort("cluster")}
                  />
                </DetailTh>
                <DetailTh className="border-r border-slate-200">
                  <SortHeaderButton
                    label="Account"
                    active={sortConfig.key === "account"}
                    direction={sortConfig.direction}
                    onClick={() => handleSort("account")}
                  />
                </DetailTh>
                <DetailTh>Required HC</DetailTh>
                <DetailTh>Actual HC</DetailTh>
                <DetailTh>Buffer %</DetailTh>
                <DetailTh>Net Actual</DetailTh>
                <DetailTh className="border-r border-slate-200">Hiring Needed</DetailTh>
                <DetailTh>Absenteeism</DetailTh>
                <DetailTh>Abs %</DetailTh>
                <DetailTh>Attrition</DetailTh>
                <DetailTh className="border-r border-slate-200">Att %</DetailTh>
                <DetailTh>Accepted JO</DetailTh>
                <DetailTh>NHO Count</DetailTh>
                <DetailTh>FST Count</DetailTh>
                <DetailTh>PST Count</DetailTh>
                <DetailTh className="border-r border-slate-200">Go Live</DetailTh>
                <DetailTh>JO - NHO Count</DetailTh>
                <DetailTh>%</DetailTh>
                <DetailTh>NHO - FST Count</DetailTh>
                <DetailTh>%</DetailTh>
                <DetailTh>FST - PST Count</DetailTh>
                <DetailTh>%</DetailTh>
                <DetailTh>NHO - PST Count</DetailTh>
                <DetailTh>%</DetailTh>
                <DetailTh>PST - Go Live Count</DetailTh>
                <DetailTh className="border-r border-slate-200">%</DetailTh>
                <DetailTh>Hired Count</DetailTh>
                <DetailTh>Hiring Rate</DetailTh>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {hasRows ? (
                filteredRows.map((row, index) => {
                  const cluster = getRowText(row, [
                    "cluster",
                    "clusterName",
                    "cluster_name",
                  ]);
                  const account = getRowText(row, [
                    "account",
                    "accountName",
                    "account_name",
                  ]);

                  const requiredHeadcount = getRowNumber(row, [
                    "requiredHeadcount",
                    "required_headcount",
                  ]);
                  const actualHeadcount = getRowNumber(row, [
                    "actualHeadcount",
                    "actual_headcount",
                  ]);
                  const bufferPercent = getRowNumber(row, [
                    "bufferPercent",
                    "buffer_percent",
                    "bufferPercentage",
                    "buffer_percentage",
                    "actualBufferPercent",
                    "actual_buffer_percent",
                  ]);
                  const absenteeismCount = getRowNumber(row, [
                    "absenteeism",
                    "absenteeismCount",
                    "absenteeism_count",
                    "averageAbsentHeadcount",
                    "average_absent_headcount",
                  ]);
                  const absenteeismPercent = getRowNumber(row, [
                    "absenteeismPercent",
                    "absenteeism_percent",
                    "averageAbsenteeismPercent",
                    "average_absenteeism_percent",
                    "absenteeismPercentage",
                    "absenteeism_percentage",
                  ]);
                  const attritionCount = getRowNumber(row, [
                    "attrition",
                    "attritionPastCount",
                    "attrition_past_count",
                    "attritionCount",
                    "attrition_count",
                    "attritionSixWeeks",
                    "attrition_6_weeks",
                  ]);
                  const attritionPercent = getRowNumber(row, [
                    "attritionPastPercent",
                    "attrition_past_percent",
                    "attritionPercent",
                    "attrition_percent",
                    "attritionPercentage",
                    "attrition_percentage",
                  ]);
                  const netActualHeadcount = getRowNumber(row, [
                    "netActualHc",
                    "netActualHeadcount",
                    "net_actual_headcount",
                    "netActualHc",
                    "net_actual_hc",
                  ]);
                  const hiringNeeded = getRowNumber(row, [
                    "hiringNeeded",
                    "hiring_needed",
                    "actualHeadcountNeeds",
                    "actual_headcount_needs",
                  ]);

                  const acceptedJo = getRowNumber(row, [
                    "acceptedJo",
                    "acceptedJO",
                    "accepted_jo",
                    "interviewCount",
                    "interview_count",
                    "interviewPopulationCount",
                    "interview_population_count",
                  ]);
                  const nhoCount = getRowNumber(row, [
                    "nho",
                    "nhoCount",
                    "nho_count",
                    "nhoPopulationCount",
                    "nho_population_count",
                  ]);
                  const fstCount = getRowNumber(row, [
                    "fst",
                    "fstCount",
                    "fst_count",
                    "fstPopulationCount",
                    "fst_population_count",
                  ]);
                  const pstCount = getRowNumber(row, [
                    "pst",
                    "pstCount",
                    "pst_count",
                    "pstPopulationCount",
                    "pst_population_count",
                  ]);
                  const goLive = getRowNumber(row, [
                    "goLive",
                    "go_live",
                    "projectedToBeEndorsed",
                    "projected_to_be_endorsed",
                    "projectedEndorsed",
                    "projected_endorsed",
                  ]);

                  const joNhoCount = getRowNumber(row, [
                    "joNhoCount",
                    "jo_nho_count",
                    "attritionInterviewToNhoCount",
                    "attrition_interview_to_nho_count",
                  ]);
                  const joNhoPercent = getRowNumber(row, [
                    "joNhoPercentage",
                    "joNhoPercent",
                    "jo_nho_percent",
                    "attritionInterviewToNhoPercent",
                    "attrition_interview_to_nho_percent",
                  ]);
                  const nhoFstCount = getRowNumber(row, [
                    "nhoFstCount",
                    "nho_fst_count",
                    "attritionNhoToFstPstCount",
                    "attrition_nho_to_fst_pst_count",
                    "attritionNhoToFstCount",
                    "attrition_nho_to_fst_count",
                  ]);
                  const nhoFstPercent = getRowNumber(row, [
                    "nhoFstPercentage",
                    "nhoFstPercent",
                    "nho_fst_percent",
                    "attritionNhoToFstPstPercent",
                    "attrition_nho_to_fst_pst_percent",
                    "attritionNhoToFstPercent",
                    "attrition_nho_to_fst_percent",
                  ]);
                  const fstPstCount = getRowNumber(row, [
                    "fstPstCount",
                    "fst_pst_count",
                    "attritionFstToPstCount",
                    "attrition_fst_to_pst_count",
                  ]);
                  const fstPstPercent = getRowNumber(row, [
                    "fstPstPercentage",
                    "fstPstPercent",
                    "fst_pst_percent",
                    "attritionFstToPstPercent",
                    "attrition_fst_to_pst_percent",
                  ]);
                  const nhoPstCount = getRowNumber(row, [
                    "nhoPstCount",
                    "nho_pst_count",
                    "attritionNhoToPstCount",
                    "attrition_nho_to_pst_count",
                  ]);
                  const nhoPstPercent = getRowNumber(row, [
                    "nhoPstPercentage",
                    "nhoPstPercent",
                    "nho_pst_percent",
                    "attritionNhoToPstPercent",
                    "attrition_nho_to_pst_percent",
                  ]);
                  const pstGoLiveCount = getRowNumber(row, [
                    "pstGoLiveCount",
                    "pst_go_live_count",
                    "attritionPstToGoLiveCount",
                    "attrition_pst_to_go_live_count",
                  ]);
                  const pstGoLivePercent = getRowNumber(row, [
                    "pstGoLivePercentage",
                    "pstGoLivePercent",
                    "pst_go_live_percent",
                    "attritionPstToGoLivePercent",
                    "attrition_pst_to_go_live_percent",
                  ]);

                  const hiredCount = getRowNumber(
                    row,
                    ["hiredCount", "hired_count"],
                    fstCount,
                  );
                  const hiringRate = getRowNumber(row, [
                    "hiringRate",
                    "hiring_rate",
                    "hiringPlanPercent",
                    "hiring_plan_percent",
                  ]);

                  return (
                                        <tr
                      key={`${cluster}-${account}-${index}`}
                      className="cursor-pointer transition-colors hover:bg-slate-50/80"
                    >
                      <DetailTd className="max-w-[120px] truncate text-left font-jakarta text-xs font-normal text-slate-600">
                        {cluster}
                      </DetailTd>
                      <DetailTd className={`max-w-[140px] truncate border-r border-slate-100 text-left ${DETAIL_BOLD_NUMBER_CLASS}`}>
                        {account}
                      </DetailTd>
                      <DetailTd className={DETAIL_BOLD_NUMBER_CLASS}>
                        {formatNumber(requiredHeadcount)}
                      </DetailTd>
                      <DetailTd>{formatNumber(actualHeadcount)}</DetailTd>
                      <DetailTd
                        className={getNegativePositiveColor(bufferPercent)}
                      >
                        {formatPercent(bufferPercent)}
                      </DetailTd>
                      <DetailTd className={DETAIL_BOLD_NUMBER_CLASS}>
                        {formatNumber(netActualHeadcount)}
                      </DetailTd>
                      <DetailTd className="border-r border-slate-100">
                        {hiringNeeded > 0 ? (
                          <span className="inline-block rounded border border-rose-100 bg-rose-50 px-1.5 py-0.5 !font-jakarta !text-xs !font-black !text-rose-600">
                            {formatNumber(hiringNeeded)}
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </DetailTd>
                      <DetailTd>{formatNumber(absenteeismCount)}</DetailTd>
                      <DetailTd className={DETAIL_BOLD_NUMBER_CLASS}>
                        {formatPercent(absenteeismPercent)}
                      </DetailTd>
                      <DetailTd>{formatNumber(attritionCount)}</DetailTd>
                      <DetailTd className={`border-r border-slate-100 ${DETAIL_BOLD_NUMBER_CLASS}`}>
                        {formatPercent(attritionPercent)}
                      </DetailTd>
                      <DetailTd className={DETAIL_BOLD_NUMBER_CLASS}>
                        {formatNumber(acceptedJo)}
                      </DetailTd>
                      <DetailTd>{formatNumber(nhoCount)}</DetailTd>
                      <DetailTd>{formatNumber(fstCount)}</DetailTd>
                      <DetailTd>{formatNumber(pstCount)}</DetailTd>
                      <DetailTd className="border-r border-slate-100 !font-jakarta !text-xs !font-black !text-emerald-600">
                        {formatNumber(goLive)}
                      </DetailTd>
                      <DetailTd>{formatNumber(joNhoCount)}</DetailTd>
                      <DetailTd>{formatPercent(joNhoPercent)}</DetailTd>
                      <DetailTd>{formatNumber(nhoFstCount)}</DetailTd>
                      <DetailTd>{formatPercent(nhoFstPercent)}</DetailTd>
                      <DetailTd>{formatNumber(fstPstCount)}</DetailTd>
                      <DetailTd>{formatPercent(fstPstPercent)}</DetailTd>
                      <DetailTd>{formatNumber(nhoPstCount)}</DetailTd>
                      <DetailTd>{formatPercent(nhoPstPercent)}</DetailTd>
                      <DetailTd>{formatNumber(pstGoLiveCount)}</DetailTd>
                      <DetailTd className="border-r border-slate-100">
                        {formatPercent(pstGoLivePercent)}
                      </DetailTd>
                      <DetailTd className="!font-jakarta !text-xs !font-black !text-emerald-600">
                        {formatNumber(hiredCount)}
                      </DetailTd>
                      <DetailTd>{formatPercent(hiringRate)}</DetailTd>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <DetailTd colSpan={28}>
                    {loading
                      ? `Loading ${rangeLabel.toLowerCase()} detailed table...`
                      : `No ${rangeLabel.toLowerCase()} detailed account rows available.`}
                  </DetailTd>
                </tr>
              )}
            </tbody>

            {hasRows ? (
              <tfoot>
                <tr className="border-t-2 border-slate-300 bg-[#EBF3FA] font-black text-[#042C51]">
                  <DetailTd
                    colSpan={2}
                    className="border-r border-slate-300 text-left font-sans text-xs font-black uppercase tracking-wider text-[#042C51]"
                  >
                    TOTAL / AVERAGE
                  </DetailTd>

                  <DetailTd className={DETAIL_BOLD_NUMBER_CLASS}>
                    {formatNumber(detailTotals.requiredHeadcount)}
                  </DetailTd>
                  <DetailTd>
                    {formatNumber(detailTotals.actualHeadcount)}
                  </DetailTd>

                  <DetailTd
                    className={getNegativePositiveColor(
                      detailTotals.bufferPercent,
                    )}
                  >
                    {formatPercent(detailTotals.bufferPercent)}
                  </DetailTd>

                  <DetailTd className={DETAIL_BOLD_NUMBER_CLASS}>
                    {formatNumber(detailTotals.netActualHeadcount)}
                  </DetailTd>

                  <DetailTd
                    className={`border-r border-slate-300 ${getHiringNeededColor(detailTotals.hiringNeeded)}`}
                  >
                    {formatNumber(detailTotals.hiringNeeded)}
                  </DetailTd>

                  <DetailTd>{formatNumber(detailTotals.absenteeism)}</DetailTd>

                  <DetailTd className={DETAIL_BOLD_NUMBER_CLASS}>
                    {formatPercent(detailTotals.absenteeismPercent)}
                  </DetailTd>

                  <DetailTd>{formatNumber(detailTotals.attrition)}</DetailTd>

                  <DetailTd className={`border-r border-slate-300 ${DETAIL_BOLD_NUMBER_CLASS}`}>
                    {formatPercent(detailTotals.attritionPercent)}
                  </DetailTd>

                  <DetailTd className={DETAIL_BOLD_NUMBER_CLASS}>
                    {formatNumber(detailTotals.acceptedJo)}
                  </DetailTd>
                  <DetailTd>{formatNumber(detailTotals.nhoCount)}</DetailTd>
                  <DetailTd>{formatNumber(detailTotals.fstCount)}</DetailTd>
                  <DetailTd>{formatNumber(detailTotals.pstCount)}</DetailTd>

                  <DetailTd className="border-r border-slate-300 !font-jakarta !text-xs !font-black !text-emerald-600">
                    {formatNumber(detailTotals.goLive)}
                  </DetailTd>

                  <DetailTd>{formatNumber(detailTotals.joNhoCount)}</DetailTd>
                  <DetailTd>{formatPercent(detailTotals.joNhoPercent)}</DetailTd>

                  <DetailTd>{formatNumber(detailTotals.nhoFstCount)}</DetailTd>
                  <DetailTd>{formatPercent(detailTotals.nhoFstPercent)}</DetailTd>

                  <DetailTd>{formatNumber(detailTotals.fstPstCount)}</DetailTd>
                  <DetailTd>{formatPercent(detailTotals.fstPstPercent)}</DetailTd>

                  <DetailTd>{formatNumber(detailTotals.nhoPstCount)}</DetailTd>
                  <DetailTd>{formatPercent(detailTotals.nhoPstPercent)}</DetailTd>

                  <DetailTd>{formatNumber(detailTotals.pstGoLiveCount)}</DetailTd>
                  <DetailTd className="border-r border-slate-300">
                    {formatPercent(detailTotals.pstGoLivePercent)}
                  </DetailTd>

                  <DetailTd className="!font-jakarta !text-xs !font-black !text-emerald-600">
                    {formatNumber(detailTotals.hiredCount)}
                  </DetailTd>

                  <DetailTd>{formatPercent(detailTotals.hiringRate)}</DetailTd>
                </tr>
              </tfoot>
            ) : null}
          </table>
        </DraggableXScroll>
      </div>
    </section>
  );
}

function buildFallbackTrendResponse({ trendWeeks = [], trends = {}, trendDetails = [] }) {
  return {
    labels: trendWeeks,
    trends,
    data: trendDetails,
  };
}

function getInitialEndOption({ options = [], trendDetails = [], trendWeeks = [], trendMeta = {} }) {
  return getTrendRangeEndpointOption({
    type: "end",
    trendDetails,
    trendWeeks,
    trendMeta,
    weeklyOptions: options,
  });
}

function TrendRangeSelector({ value, onChange }) {
  return (
    <div>
      <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
        Trend Range
      </label>
      <div className="grid grid-cols-4 rounded-xl border border-[#D7DEE8] bg-[#F8FAFC] p-1 shadow-sm">
        {TREND_RANGE_OPTIONS.map((option) => {
          const active = value === option.key;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => onChange(option.key)}
              className={`min-w-0 rounded-lg py-1.5 2xl:py-2 text-[9px] 2xl:text-[10px] font-extrabold transition ${active
                ? "bg-[#042C51] text-white shadow-sm"
                : "text-[#042C51] hover:bg-[#FFF0EB] hover:text-[#FF5C28]"
                }`}
              aria-pressed={active}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function WorkforceHiringTrendDetailsModal({
  open,
  onClose,
  trendWeeks = [],
  trends = {},
  trendDetails = [],
  trendSummary = {},
  trendMeta = {},
}) {
  const workforceHiringView = useWorkforceHiringView();
  const sixWeekTable = workforceHiringView?.sixWeekTable || {};
  const filterState = workforceHiringView?.filters || {};
  const filterOptions = filterState?.options || {};
  const statusState = workforceHiringView?.status || {};

  const selectedClusters = useMemo(
    () =>
      normalizeArrayValue(
        filterState.cluster || trendMeta.cluster || "All Clusters",
        "All Clusters",
      ),
    [filterState.cluster, trendMeta.cluster],
  );
  const selectedAccounts = useMemo(
    () =>
      normalizeArrayValue(
        filterState.account || trendMeta.account || "All Accounts",
        "All Accounts",
      ),
    [filterState.account, trendMeta.account],
  );

  const clusterOptions = useMemo(
    () =>
      (filterOptions?.clusters || []).filter(
        (item) => getOptionValue(item) !== "All Clusters",
      ),
    [filterOptions?.clusters],
  );

  const accountOptions = useMemo(
    () =>
      (filterOptions?.accounts || []).filter(
        (item) => getOptionValue(item) !== "All Accounts",
      ),
    [filterOptions?.accounts],
  );

  const [visibleMetrics, setVisibleMetrics] = useState({
    absenteeism: true,
    attrition: true,
    buffer: true,
  });
  const [rangeMode, setRangeMode] = useState("6");
  const [selectedStartId, setSelectedStartId] = useState("");
  const [selectedEndId, setSelectedEndId] = useState("");
  const [openTrendDropdown, setOpenTrendDropdown] = useState(null);
  const [rangeState, setRangeState] = useState({
    loading: false,
    error: "",
    points: [],
    rows: [],
    returnedWeeks: 0,
  });

  const weeklyVersionOptions = useMemo(
    () =>
      sortWeekOptionsChronologically(
        getWeeklyVersionOptionsFromView(workforceHiringView),
      ).reverse(),
    [filterOptions?.weeklyVersions],
  );

  const trendDetailWeekOptions = useMemo(
    () =>
      sortWeekOptionsChronologically(
        getTrendDetailWeekOptions(trendDetails, trendWeeks),
      ).reverse(),
    [trendDetails, trendWeeks],
  );

  const weekDropdownOptions = useMemo(
    () =>
      weeklyVersionOptions.length > 0
        ? weeklyVersionOptions
        : trendDetailWeekOptions,
    [weeklyVersionOptions, trendDetailWeekOptions],
  );

  useEffect(() => {
    if (!open || !weekDropdownOptions.length) return;

    const initialEnd = getInitialEndOption({
      options: weekDropdownOptions,
      trendDetails,
      trendWeeks,
      trendMeta,
    });
    const nextEndId = getWeekOptionId(
      initialEnd || weekDropdownOptions[weekDropdownOptions.length - 1],
    );

    setSelectedEndId((current) => current || nextEndId);
  }, [open, trendDetails, trendMeta, trendWeeks, weekDropdownOptions]);

  const rangeSelection = useMemo(
    () =>
      resolveTrendRangeSelection({
        options: weekDropdownOptions,
        mode: rangeMode,
        startId: selectedStartId,
        endId: selectedEndId,
      }),
    [rangeMode, selectedEndId, selectedStartId, weekDropdownOptions],
  );

  useEffect(() => {
    if (!rangeSelection.startOption || !rangeSelection.endOption) return;

    const resolvedStartId = getWeekOptionId(rangeSelection.startOption);
    const resolvedEndId = getWeekOptionId(rangeSelection.endOption);

    if (rangeMode !== "custom" && selectedStartId !== resolvedStartId) {
      setSelectedStartId(resolvedStartId);
    }
    if (!selectedEndId && resolvedEndId) setSelectedEndId(resolvedEndId);
  }, [
    rangeMode,
    rangeSelection.endOption,
    rangeSelection.startOption,
    selectedEndId,
    selectedStartId,
  ]);

  const fallbackPoints = useMemo(
    () =>
      normalizeTrendResponsePoints(
        buildFallbackTrendResponse({ trendWeeks, trends, trendDetails }),
      ),
    [trendDetails, trendWeeks, trends],
  );

  useEffect(() => {
    if (!open || !rangeSelection.selectedOptions.length) return undefined;

    let cancelled = false;
    const chunks = buildSixWeekRequestChunks(rangeSelection.selectedOptions);
    const cluster = normalizeRequestFilterValue(selectedClusters, "All");
    const account = normalizeRequestFilterValue(selectedAccounts, "All");

    async function fetchRangeData() {
      setRangeState((current) => ({ ...current, loading: true, error: "" }));

      try {
        const chunkResults = await Promise.all(
          chunks.map(async (chunk, order) => {
            const request = {
              cluster,
              account,
              weekStart: chunk.weekStart,
              weekEnd: chunk.weekEnd,
              startDate: chunk.weekStart,
              endDate: chunk.weekEnd,
            };

            const [trendResult, tableResult] = await Promise.all([
              getWorkforceHiringPlanAccountTrends(request),
              getWorkforceHiringPlanSixWeekTable(request),
            ]);

            return {
              order,
              weight: chunk.weight,
              trendResult,
              tableResult,
            };
          }),
        );

        if (cancelled) return;

        const trendResponses = chunkResults
          .map((item) => item.trendResult)
          .filter(Boolean);
        const points = mergeTrendResponses(
          trendResponses,
          rangeSelection.selectedOptions,
        );
        const rows = mergeRangeTableResponses(
          chunkResults.map((item) => ({
            response: item.tableResult,
            order: item.order,
            weight: item.weight,
          })),
        );

        setRangeState({
          loading: false,
          error: "",
          points: points.length ? points : fallbackPoints,
          rows:
            rows.length > 0
              ? rows
              : Array.isArray(sixWeekTable.rows)
                ? sixWeekTable.rows
                : [],
          returnedWeeks: points.length,
        });
      } catch (error) {
        if (cancelled) return;

        setRangeState({
          loading: false,
          error:
            error?.message ||
            "The selected trend range could not be loaded. Existing available data is displayed.",
          points: fallbackPoints,
          rows: Array.isArray(sixWeekTable.rows) ? sixWeekTable.rows : [],
          returnedWeeks: fallbackPoints.length,
        });
      }
    }

    fetchRangeData();

    return () => {
      cancelled = true;
    };
  }, [
    fallbackPoints,
    open,
    rangeSelection.selectedOptions,
    selectedAccounts,
    selectedClusters,
  ]);

  const activePoints = rangeState.points.length ? rangeState.points : fallbackPoints;
  const displaySeries = useMemo(() => buildTrendSeries(activePoints), [activePoints]);
  const displaySummary = useMemo(
    () => calculateTrendRangeSummary(activePoints, trendSummary),
    [activePoints, trendSummary],
  );

  const chartTrends = useMemo(
    () => ({
      absenteeism: visibleMetrics.absenteeism
        ? displaySeries.trends.absenteeism
        : [],
      attrition: visibleMetrics.attrition ? displaySeries.trends.attrition : [],
      buffer: visibleMetrics.buffer ? displaySeries.trends.buffer : [],
    }),
    [displaySeries.trends, visibleMetrics],
  );

  const filteredRangeRows = useMemo(
    () => (Array.isArray(rangeState.rows) ? rangeState.rows : []),
    [rangeState.rows],
  );

  const rangeLabel = getTrendRangeDisplayLabel({
    mode: rangeMode,
    selectedOptions: rangeSelection.selectedOptions,
  });
  const selectedWeekCount = rangeSelection.selectedOptions.length;
  const requestedWeekCount = rangeSelection.requestedWeeks;
  const coverageLimited =
    !rangeState.loading &&
    requestedWeekCount > 0 &&
    activePoints.length < requestedWeekCount;
  const customTableCoverageLimited =
    rangeMode === "custom" && selectedWeekCount > 0 && selectedWeekCount % 6 !== 0;
  const combinedTrendLoading = Boolean(
    rangeState.loading ||
    (!activePoints.length &&
      (statusState.isLoadingTrends || statusState.isLoading || trendsLoading)),
  );

  function toggleTrendDropdown(key) {
    setOpenTrendDropdown((current) => (current === key ? null : key));
  }

  function closeTrendDropdown() {
    setOpenTrendDropdown(null);
  }

  function toggleMetric(key) {
    setVisibleMetrics((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  function handleRangeModeChange(nextMode) {
    setRangeMode(nextMode);
    setOpenTrendDropdown(null);
  }

  function handleEndSelect(option) {
    const nextId = getWeekOptionId(option);
    setSelectedEndId(nextId);
    filterState.setWeeklyVersion?.(option.id || option.value || nextId);
  }

  function handleStartSelect(option) {
    setSelectedStartId(getWeekOptionId(option));
  }

  if (!open) return null;

  return createPortal(
    <div className="sibs-modal-blur sibs-modal-backdrop-in fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto p-3 sm:p-5">
      <div className="sibs-modal-pop-in flex max-h-[94vh] w-full max-w-[1480px] flex-col overflow-hidden rounded-2xl border border-[#315779] bg-[#F8FAFC] font-jakarta text-[#042C51] shadow-2xl">
        <header className="shrink-0 border-b border-white/10 bg-[#042C51] px-5 py-3 text-white sm:px-6 2xl:py-3.5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-2.5 2xl:gap-3">
              <span className="flex h-8 w-8 2xl:h-8.5 2xl:w-8.5 shrink-0 items-center justify-center rounded-lg bg-[#FF5C28] text-white shadow-sm">
                <BarChart3 size={16} />
              </span>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="sibs-modal-title truncate text-white">
                    {rangeLabel} Trend Details
                  </h2>
                  <span className="rounded-full bg-[#FF5C28] px-2 py-0.5 text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wider text-white">
                    Executive Suite
                  </span>
                </div>

                <p className="sibs-modal-subtitle mt-0.5 max-w-4xl text-white/75 truncate sm:text-clip">
                  Inspect the selected trend range, operational filters, workforce trends, and detailed account performance.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 2xl:h-8.5 2xl:w-8.5 shrink-0 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white"
              aria-label="Close trend details"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="sibs-scrollbar min-h-0 flex-1 overflow-y-auto">
          <main className="space-y-5 p-4 sm:p-6">
            <div className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
              <aside className="sibs-page-card-in sibs-card overflow-visible rounded-2xl border border-[#E6ECF2] bg-white shadow-sm">
                <div className="border-b border-[#E6ECF2] px-4 py-4 sm:px-5">
                  <div className="flex items-center gap-2">
                    <CalendarDays
                      className="h-4 w-4 text-[#FF5C28]"
                      strokeWidth={2.4}
                    />
                    <h3 className="text-xs font-extrabold uppercase tracking-wide text-[#042C51]">
                      Scope Controls
                    </h3>
                  </div>
                  <p className="sibs-section-subtitle mt-1 text-xs font-semibold text-[#667085]">
                    Range, weekly version, cluster, and account controls refresh the graph and table together.
                  </p>
                </div>

                <div className="flex h-full flex-col gap-5 p-4 sm:p-5">
                  <section className="space-y-4">
                    <TrendRangeSelector
                      value={rangeMode}
                      onChange={handleRangeModeChange}
                    />

                    <TrendDisplayDropdown
                      label="Week End"
                      value={rangeSelection.endOption?.value}
                      selectedOption={rangeSelection.endOption}
                      options={weekDropdownOptions}
                      open={openTrendDropdown === "weekEnd"}
                      onToggle={() => toggleTrendDropdown("weekEnd")}
                      onClose={closeTrendDropdown}
                      onSelect={handleEndSelect}
                    />

                    <TrendDisplayDropdown
                      label="Week Start"
                      value={rangeSelection.startOption?.value}
                      selectedOption={rangeSelection.startOption}
                      options={weekDropdownOptions.filter((option, index) => {
                        const endIndex = rangeSelection.options.findIndex(
                          (item, itemIndex) =>
                            getWeekOptionId(item, itemIndex) ===
                            getWeekOptionId(rangeSelection.endOption),
                        );
                        return endIndex < 0 || index <= endIndex;
                      })}
                      open={openTrendDropdown === "weekStart"}
                      disabled={rangeMode !== "custom"}
                      onToggle={() => toggleTrendDropdown("weekStart")}
                      onClose={closeTrendDropdown}
                      onSelect={handleStartSelect}
                    />

                    <TrendCheckboxDropdown
                      label="Cluster"
                      value={selectedClusters}
                      onChange={(nextSelected) => {
                        const nextValue = nextSelected.includes("All Clusters")
                          ? "All Clusters"
                          : nextSelected;
                        filterState.setCluster?.(nextValue);
                        filterState.setAccount?.("All Accounts");
                      }}
                      options={clusterOptions}
                      allValue="All Clusters"
                      allLabel="All Clusters"
                      itemLabel="Clusters"
                      loading={statusState?.isLoadingFilters}
                      emptyText="No clusters available."
                    />

                    <TrendCheckboxDropdown
                      label="Account"
                      value={selectedAccounts}
                      onChange={(nextSelected) => {
                        const nextValue = nextSelected.includes("All Accounts")
                          ? "All Accounts"
                          : nextSelected;
                        filterState.setAccount?.(nextValue);
                      }}
                      options={accountOptions}
                      allValue="All Accounts"
                      allLabel="All Accounts"
                      itemLabel="Accounts"
                      loading={statusState?.isLoadingAccounts}
                      searchable
                      searchPlaceholder="Search accounts..."
                      emptyText="No accounts found."
                    />
                  </section>

                  <section className="border-t border-[#E6ECF2] pt-5">
                    <div className="mb-3 flex items-center gap-2">
                      <Filter
                        className="h-4 w-4 text-[#FF5C28]"
                        strokeWidth={2.4}
                      />
                      <h4 className="text-[10px] font-black uppercase tracking-wide text-[#042C51]">
                        Metric Visibility
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      <MetricToggle
                        active={visibleMetrics.absenteeism}
                        colorClass="bg-blue-600"
                        label="Absenteeism %"
                        onClick={() => toggleMetric("absenteeism")}
                      />
                      <MetricToggle
                        active={visibleMetrics.attrition}
                        colorClass="bg-orange-600"
                        label="Attrition %"
                        onClick={() => toggleMetric("attrition")}
                      />
                      <MetricToggle
                        active={visibleMetrics.buffer}
                        colorClass="bg-emerald-600"
                        label="Buffer %"
                        onClick={() => toggleMetric("buffer")}
                      />
                    </div>
                  </section>

                </div>
              </aside>

              <section className="sibs-page-card-in sibs-card flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white shadow-sm">
                <div className="border-b border-[#E6ECF2] px-4 py-4 sm:px-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="sibs-section-title flex items-center gap-2 text-base font-extrabold text-[#042C51]">
                        Interactive Multi-Series {rangeLabel}
                      </h3>
                      <p className="sibs-section-subtitle mt-1 text-xs font-semibold text-[#667085]">
                        Move the cursor across the graph to inspect each production week.
                      </p>
                    </div>

                    <span className="inline-flex w-fit shrink-0 items-center gap-2 rounded-lg border border-blue-100 bg-[#E9F0FC] px-3 py-2 text-[10px] font-extrabold uppercase tracking-wide text-[#042C51]">
                      <LineChart className="h-3.5 w-3.5 text-[#FF5C28]" />
                      {selectedWeekCount}-week view
                    </span>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-4 sm:p-5">
                  {rangeState.error ? (
                    <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
                      {rangeState.error}
                    </div>
                  ) : null}

                  {coverageLimited ? (
                    <div className="mb-3 rounded-xl border border-blue-100 bg-[#E9F0FC] px-4 py-3 text-xs font-semibold text-[#315779]">
                      Requested {requestedWeekCount} weeks; {activePoints.length} production weeks were returned and displayed. No missing values were generated.
                    </div>
                  ) : null}

                  <div className="min-h-0 rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] p-3 sm:h-[420px] sm:p-4 xl:h-[500px]">
                    {combinedTrendLoading ? (
                      <TrendLoadingScreen
                        title={`Loading ${rangeLabel.toLowerCase()} graph...`}
                        classname="h-full min-h-0"
                      />
                    ) : activePoints.length ? (
                      <div className="flex h-full min-h-0 w-full items-center justify-center">
                        <TrendSvg
                          weeks={displaySeries.weeks}
                          trends={chartTrends}
                          variant="modal"
                          className="block h-full w-full"
                        />
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-[#D6E0EA] bg-white px-5 text-center text-xs font-semibold text-[#667085]">
                        No production trend data is available for the selected range.
                      </div>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <article className="rounded-xl border border-blue-100 bg-blue-50/70 p-3.5">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-blue-900/70">
                        Absenteeism Average
                      </span>
                      <strong className="mt-1 block font-heading text-xl 2xl:text-2xl font-bold tabular-nums text-blue-700">
                        {formatPercent(displaySummary.absenteeismPercentage)}
                      </strong>
                      <p className="mt-1 text-[10px] font-semibold text-blue-700/70">
                        Mean absence rate across the displayed range.
                      </p>
                    </article>

                    <article className="rounded-xl border border-orange-100 bg-orange-50/70 p-3.5">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-orange-900/70">
                        Attrition Average
                      </span>
                      <strong className="mt-1 block font-heading text-xl 2xl:text-2xl font-bold tabular-nums text-orange-700">
                        {formatPercent(displaySummary.attritionPercentage)}
                      </strong>
                      <p className="mt-1 text-[10px] font-semibold text-orange-700/70">
                        Mean attrition rate across the displayed range.
                      </p>
                    </article>

                    <article
                      className={`rounded-xl border p-3.5 ${safeNumber(displaySummary.bufferPercentage) < 0
                        ? "border-rose-100 bg-rose-50/70"
                        : "border-emerald-100 bg-emerald-50/70"
                        }`}
                    >
                      <span
                        className={`text-[9px] font-extrabold uppercase tracking-wider ${safeNumber(displaySummary.bufferPercentage) < 0
                          ? "text-rose-900/70"
                          : "text-emerald-900/70"
                          }`}
                      >
                        Buffer Average
                      </span>
                      <strong
                        className={`mt-1 block font-heading text-xl 2xl:text-2xl font-bold tabular-nums ${safeNumber(displaySummary.bufferPercentage) < 0
                          ? "text-rose-700"
                          : "text-emerald-700"
                          }`}
                      >
                        {formatPercent(displaySummary.bufferPercentage)}
                      </strong>
                      <p
                        className={`mt-1 text-[10px] font-semibold ${safeNumber(displaySummary.bufferPercentage) < 0
                          ? "text-rose-700/70"
                          : "text-emerald-700/70"
                          }`}
                      >
                        Average workforce cushion versus required headcount.
                      </p>
                    </article>
                  </div>
                </div>
              </section>
            </div>

            {customTableCoverageLimited ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
                The graph is filtered to the exact custom dates. The existing table endpoint returns six-week aggregates, so the table combines the complete six-week request blocks that cover this custom range.
              </div>
            ) : null}

            {combinedTrendLoading ? (
              <TrendLoadingScreen
                title={`Loading ${rangeLabel.toLowerCase()} detailed table...`}
                classname="min-h-[500px]"
              />
            ) : (
              <SixWeekDetailedPerformanceTable
                rows={filteredRangeRows}
                loading={false}
                error={rangeState.error || sixWeekTable.error || ""}
                rangeLabel={rangeLabel}
                rangeWeekCount={selectedWeekCount || requestedWeekCount}
              />
            )}
          </main>
        </div>
      </div>
    </div>,
    document.body,
  );
}

