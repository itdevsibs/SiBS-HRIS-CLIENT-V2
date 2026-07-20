import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, CalendarDays, LineChart, ChevronDown, Search } from "lucide-react";
import TrendSvg from "../../recruitment/workforceHiringOverview/shared/TrendSvg";
import { useWorkforceHiringView } from "../../../services/context/WorkforceHiringContextAdapter";
import {
  getWorkforceHiringPlanAccountTrends,
  getWorkforceHiringPlanSixWeekTable,
} from "../../../lib/axios/getWorkforceHiringPlan";

const EDGE = "rounded-[10px]";

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
      className={`fixed z-[999999] overflow-hidden ${EDGE} border border-[#D7DEE8] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.16)]`}
      style={{
        top: `${style.top}px`,
        left: `${style.left}px`,
        width: `${style.width}px`,
      }}
    >
      <div
        className="sibs-scrollbar overflow-y-auto py-2"
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
  onToggle,
  onClose,
  onSelect,
}) {
  const buttonRef = useRef(null);
  const menuOptions =
    Array.isArray(options) && options.length > 0 ? options : [];
  const selectedId = String(selectedOption?.id || selectedOption?.value || "");

  return (
    <div className="relative min-w-0 overflow-visible">
      <label className="mb-1 block text-sm font-bold text-[#101828]">
        {label}
      </label>

      <button
        ref={buttonRef}
        type="button"
        onClick={onToggle}
        className={`flex h-11 w-full items-center justify-between ${EDGE} border border-[#D0D5DD] bg-white px-4 text-left text-sm font-bold text-[#344054] outline-none transition hover:border-sibs-primary-1/30 hover:bg-[#F8FAFC] focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${
          open ? "border-sibs-primary-1 ring-4 ring-sibs-primary-1/10" : ""
        }`}
      >
        <span className="min-w-0 truncate">{value || "—"}</span>

        <ChevronDown
          size={18}
          className={`ml-2 shrink-0 text-sibs-tertiary-5 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <DropdownPortal
        open={open}
        anchorRef={buttonRef}
        maxHeight={288}
        onClose={onClose}
      >
        {menuOptions.length > 0 ? (
          menuOptions.map((option) => {
            const isSelected =
              String(option.id || option.value || "") === selectedId ||
              String(option.value || "") ===
                String(selectedOption?.value || "");

            return (
              <button
                key={option.id || option.value || option.title}
                type="button"
                onClick={() => {
                  onSelect?.(option);
                  onClose?.();
                }}
                className={`block w-full px-4 py-3 text-left text-sm transition ${
                  isSelected
                    ? "bg-[#EAF2FB] font-bold text-sibs-primary-1"
                    : "text-sibs-primary-1 hover:bg-[#F8FAFC]"
                }`}
              >
                <p className="truncate font-bold">{option.title}</p>

                <p className="mt-1 truncate text-xs font-semibold text-sibs-tertiary-5">
                  {option.range || "—"}
                </p>
              </button>
            );
          })
        ) : (
          <div className="px-4 py-3 text-sm font-semibold text-sibs-tertiary-5">
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
      <label className="mb-1 block text-sm font-bold text-[#101828]">
        {label}
      </label>

      <div
        className={`flex h-11 w-full items-center justify-between ${EDGE} border border-[#D0D5DD] bg-white px-4 text-left text-sm font-bold text-[#344054] shadow-sm`}
      >
        <span className="min-w-0 truncate">{value || "—"}</span>

        <ChevronDown size={18} className="ml-2 shrink-0 text-sibs-tertiary-5" />
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
      <label className="mb-1 block text-sm font-bold text-[#101828]">
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
            className={`h-11 w-full ${EDGE} border border-[#D0D5DD] bg-white px-4 pr-11 text-sm font-bold text-[#344054] outline-none transition disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 placeholder:text-sibs-tertiary-5 hover:border-sibs-primary-1/30 hover:bg-[#F8FAFC] focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10`}
          />

          <ChevronDown
            size={18}
            onClick={handleOpen}
            className={`absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-sibs-tertiary-5 transition-transform duration-300 ${
              open ? "rotate-180" : ""
            }`}
          />
        </div>
      ) : (
        <button
          ref={buttonRef}
          type="button"
          disabled={loading}
          onClick={handleOpen}
          className={`flex h-11 w-full items-center justify-between ${EDGE} border border-[#D0D5DD] bg-white px-4 text-left text-sm font-bold text-[#344054] outline-none transition disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 hover:border-sibs-primary-1/30 hover:bg-[#F8FAFC] focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${
            open ? "border-sibs-primary-1 ring-4 ring-sibs-primary-1/10" : ""
          }`}
        >
          <span className="min-w-0 truncate">
            {loading ? "Loading..." : displayLabel}
          </span>

          <ChevronDown
            size={18}
            className={`ml-2 shrink-0 text-sibs-tertiary-5 transition-transform duration-300 ${
              open ? "rotate-180" : ""
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
          className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition ${
            selectedValues.includes(allValue)
              ? "bg-[#EAF2FB] font-bold text-sibs-primary-1"
              : "text-[#344054] hover:bg-[#F8FAFC]"
          }`}
        >
          <input
            type="checkbox"
            checked={selectedValues.includes(allValue)}
            readOnly
            className="h-4 w-4 rounded border-[#D0D5DD] accent-sibs-primary-1"
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
                className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition ${
                  checked
                    ? "bg-[#EAF2FB] font-bold text-sibs-primary-1"
                    : "text-[#344054] hover:bg-[#F8FAFC]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  readOnly
                  className="h-4 w-4 rounded border-[#D0D5DD] accent-sibs-primary-1"
                />

                <span className="truncate">{option.label}</span>
              </button>
            );
          })
        ) : (
          <div className="px-4 py-4 text-sm font-semibold text-sibs-tertiary-5">
            {emptyText}
          </div>
        )}
      </DropdownPortal>
    </div>
  );
}

function getBufferColor(value) {
  const numberValue = safeNumber(value);

  if (numberValue < 0) return "text-red-600";
  if (numberValue > 0) return "text-emerald-600";

  return "text-sibs-primary-90";
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

  if (numberValue < 0) return "text-red-600";
  if (numberValue > 0) return "text-emerald-600";

  return "text-sibs-primary-90";
}

function getHiringNeededColor(value) {
  return safeNumber(value) > 0 ? "text-red-600" : "text-emerald-600";
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
          "overflow-x-auto overscroll-x-contain",
          "select-none [scrollbar-gutter:stable]",
          isDragging ? "cursor-grabbing" : "cursor-grab",
        ].join(" ")}
      >
        {children}
      </div>
    </div>
  );
}

function DetailTh({ children, className = "", ...props }) {
  return (
    <th
      {...props}
      className={[
        "border border-slate-200 bg-slate-50 px-3 py-3 text-center align-middle text-[11px] font-extrabold uppercase leading-tight text-sibs-primary-90",
        className,
      ].join(" ")}
    >
      {children}
    </th>
  );
}

function DetailTd({ children, className = "", ...props }) {
  return (
    <td
      {...props}
      className={[
        "border border-slate-200 px-3 py-2.5 text-center align-middle text-xs font-semibold text-sibs-primary-90",
        className,
      ].join(" ")}
    >
      {children}
    </td>
  );
}

function SortHeaderButton({
  label,
  active = false,
  direction = "asc",
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-extrabold uppercase leading-tight transition",
        active
          ? "bg-[#EAF2FB] text-sibs-primary-1"
          : "text-sibs-primary-90 hover:bg-slate-100 hover:text-sibs-primary-1",
      ].join(" ")}
    >
      <span>{label}</span>

      <span className="relative flex h-4 w-3 shrink-0 flex-col items-center justify-center">
        <span
          className={[
            "h-0 w-0 border-x-[4px] border-b-[5px] border-x-transparent transition",
            active && direction === "asc"
              ? "border-b-sibs-primary-1"
              : "border-b-slate-300 group-hover:border-b-sibs-primary-1/70",
          ].join(" ")}
        />

        <span
          className={[
            "mt-0.5 h-0 w-0 border-x-[4px] border-t-[5px] border-x-transparent transition",
            active && direction === "desc"
              ? "border-t-sibs-primary-1"
              : "border-t-slate-300 group-hover:border-t-sibs-primary-1/70",
          ].join(" ")}
        />
      </span>
    </button>
  );
}

function SixWeekDetailedPerformanceTable({
  rows = [],
  loading = false,
  error = "",
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "cluster",
    direction: "asc",
  });

  const sourceRows = Array.isArray(rows) ? rows : [];

  function getSortableText(row, key) {
    if (key === "cluster") {
      return getRowText(row, ["cluster", "clusterName", "cluster_name"], "");
    }

    if (key === "account") {
      return getRowText(row, ["account", "accountName", "account_name"], "");
    }

    return "";
  }

  function handleSort(nextKey) {
    setSortConfig((current) => {
      if (current.key === nextKey) {
        return {
          key: nextKey,
          direction: current.direction === "asc" ? "desc" : "asc",
        };
      }

      return {
        key: nextKey,
        direction: "asc",
      };
    });
  }

  const visibleRows = useMemo(() => {
    const cleanSearch = searchQuery.trim().toLowerCase();

    const filteredRows = cleanSearch
      ? sourceRows.filter((row) => {
          const cluster = getSortableText(row, "cluster").toLowerCase();
          const account = getSortableText(row, "account").toLowerCase();

          return cluster.includes(cleanSearch) || account.includes(cleanSearch);
        })
      : sourceRows;

    return [...filteredRows].sort((firstRow, secondRow) => {
      const firstValue = getSortableText(firstRow, sortConfig.key);
      const secondValue = getSortableText(secondRow, sortConfig.key);

      const comparison = firstValue.localeCompare(secondValue, undefined, {
        numeric: true,
        sensitivity: "base",
      });

      return sortConfig.direction === "asc" ? comparison : -comparison;
    });
  }, [searchQuery, sortConfig.direction, sortConfig.key, sourceRows]);

  const hasRows = visibleRows.length > 0;

  const detailTotals = useMemo(
    () => buildDetailedTableTotals(visibleRows),
    [visibleRows],
  );

  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 border-b border-slate-200 pb-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 pt-1">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-base font-extrabold uppercase text-sibs-primary-90">
                Expanded Week Detailed Performance by Cluster / Account
              </h3>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                {loading
                  ? "Loading..."
                  : sourceRows.length > 0
                    ? `${visibleRows.length} of ${sourceRows.length} account rows`
                    : "No rows"}
              </span>
            </div>

            <p className="mt-1 text-xs font-semibold text-slate-500">
              Same table format as the main detailed table, calculated from the
              previous 6 weeks.
            </p>
          </div>

          <div className="w-full xl:w-[520px]">
            <div className="relative">
              <Search
                size={20}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sibs-primary-70"
                strokeWidth={2.25}
              />

              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search cluster or account then press Enter..."
                className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-12 pr-24 text-sm font-semibold text-sibs-primary-90 outline-none transition placeholder:text-slate-400 hover:border-sibs-primary-1/40 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
              />

              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-3 py-1.5 text-xs font-extrabold text-slate-500 transition hover:bg-slate-100 hover:text-sibs-primary-90"
                >
                  Clear
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="mb-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          {error}
        </div>
      ) : null}

      <DraggableXScroll>
        <table className="w-full min-w-[2600px] border-collapse">
          <thead>
            <tr>
              <DetailTh rowSpan={2}>
                <SortHeaderButton
                  label="Cluster"
                  active={sortConfig.key === "cluster"}
                  direction={sortConfig.direction}
                  onClick={() => handleSort("cluster")}
                />
              </DetailTh>
              <DetailTh rowSpan={2}>
                <SortHeaderButton
                  label="Account"
                  active={sortConfig.key === "account"}
                  direction={sortConfig.direction}
                  onClick={() => handleSort("account")}
                />
              </DetailTh>
              <DetailTh rowSpan={2}>
                Required
                <br />
                Headcount
              </DetailTh>
              <DetailTh rowSpan={2}>
                Actual
                <br />
                Headcount
              </DetailTh>
              <DetailTh rowSpan={2}>
                Buffer
                <br />%
              </DetailTh>
              <DetailTh rowSpan={2}>
                Absenteeism
                <br />
                (6 Weeks Avg)
              </DetailTh>
              <DetailTh rowSpan={2}>
                Absenteeism
                <br />%
              </DetailTh>
              <DetailTh rowSpan={2}>
                Attrition
                <br />
                (6 Weeks Total)
              </DetailTh>
              <DetailTh rowSpan={2}>
                Attrition
                <br />%
              </DetailTh>
              <DetailTh rowSpan={2}>
                Net
                <br />
                Actual HC
              </DetailTh>
              <DetailTh rowSpan={2}>
                Hiring
                <br />
                Needed
              </DetailTh>
              <DetailTh colSpan={5}>Hiring Funnel Counts</DetailTh>
              <DetailTh colSpan={10}>Attrition Between Stages</DetailTh>
              <DetailTh rowSpan={2}>
                Hired
                <br />
                Count
              </DetailTh>
              <DetailTh rowSpan={2}>
                Hiring Rate
                <br />
                (Leads to JO)
              </DetailTh>
            </tr>
            <tr>
              <DetailTh>
                Accepted
                <br />
                JO
              </DetailTh>
              <DetailTh>
                NHO
                <br />
                Count
              </DetailTh>
              <DetailTh>
                FST
                <br />
                Count
              </DetailTh>
              <DetailTh>
                PST
                <br />
                Count
              </DetailTh>
              <DetailTh>
                Go
                <br />
                Live
              </DetailTh>
              <DetailTh>
                JO - NHO
                <br />
                Count
              </DetailTh>
              <DetailTh>%</DetailTh>
              <DetailTh>
                NHO - FST
                <br />
                Count
              </DetailTh>
              <DetailTh>%</DetailTh>
              <DetailTh>
                FST - PST
                <br />
                Count
              </DetailTh>
              <DetailTh>%</DetailTh>
              <DetailTh>
                NHO - PST
                <br />
                Count
              </DetailTh>
              <DetailTh>%</DetailTh>
              <DetailTh>
                PST - Go Live
                <br />
                Count
              </DetailTh>
              <DetailTh>%</DetailTh>
            </tr>
          </thead>

          <tbody>
            {hasRows ? (
              visibleRows.map((row, index) => {
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
                    className={index % 2 === 0 ? "bg-white" : "bg-slate-50/60"}
                  >
                    <DetailTd>{cluster}</DetailTd>
                    <DetailTd className="text-left">{account}</DetailTd>
                    <DetailTd>{formatNumber(requiredHeadcount)}</DetailTd>
                    <DetailTd>{formatNumber(actualHeadcount)}</DetailTd>
                    <DetailTd
                      className={getNegativePositiveColor(bufferPercent)}
                    >
                      {formatPercent(bufferPercent)}
                    </DetailTd>
                    <DetailTd>{formatNumber(absenteeismCount)}</DetailTd>
                    <DetailTd className="text-blue-600">
                      {formatPercent(absenteeismPercent)}
                    </DetailTd>
                    <DetailTd>{formatNumber(attritionCount)}</DetailTd>
                    <DetailTd className="text-red-600">
                      {formatPercent(attritionPercent)}
                    </DetailTd>
                    <DetailTd>{formatNumber(netActualHeadcount)}</DetailTd>
                    <DetailTd className={getHiringNeededColor(hiringNeeded)}>
                      {formatNumber(hiringNeeded)}
                    </DetailTd>
                    <DetailTd>{formatNumber(acceptedJo)}</DetailTd>
                    <DetailTd>{formatNumber(nhoCount)}</DetailTd>
                    <DetailTd>{formatNumber(fstCount)}</DetailTd>
                    <DetailTd>{formatNumber(pstCount)}</DetailTd>
                    <DetailTd className="text-emerald-600">
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
                    <DetailTd>{formatPercent(pstGoLivePercent)}</DetailTd>
                    <DetailTd className="text-emerald-600">
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
                    ? "Loading 6-week detailed table..."
                    : searchQuery
                      ? "No rows matched your search."
                      : "No 6-week detailed account rows available."}
                </DetailTd>
              </tr>
            )}
          </tbody>

          {hasRows ? (
            <tfoot>
              <tr className="bg-slate-100 font-extrabold">
                <DetailTd className="text-left">
                  TOTAL /
                  <br />
                  AVERAGE
                </DetailTd>

                <DetailTd />

                <DetailTd>
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

                <DetailTd>{formatNumber(detailTotals.absenteeism)}</DetailTd>

                <DetailTd className="text-blue-600">
                  {formatPercent(detailTotals.absenteeismPercent)}
                </DetailTd>

                <DetailTd>{formatNumber(detailTotals.attrition)}</DetailTd>

                <DetailTd className="text-red-600">
                  {formatPercent(detailTotals.attritionPercent)}
                </DetailTd>

                <DetailTd>
                  {formatNumber(detailTotals.netActualHeadcount)}
                </DetailTd>

                <DetailTd
                  className={getHiringNeededColor(detailTotals.hiringNeeded)}
                >
                  {formatNumber(detailTotals.hiringNeeded)}
                </DetailTd>

                <DetailTd>{formatNumber(detailTotals.acceptedJo)}</DetailTd>
                <DetailTd>{formatNumber(detailTotals.nhoCount)}</DetailTd>
                <DetailTd>{formatNumber(detailTotals.fstCount)}</DetailTd>
                <DetailTd>{formatNumber(detailTotals.pstCount)}</DetailTd>

                <DetailTd className="text-emerald-600">
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
                <DetailTd>
                  {formatPercent(detailTotals.pstGoLivePercent)}
                </DetailTd>

                <DetailTd className="text-emerald-600">
                  {formatNumber(detailTotals.hiredCount)}
                </DetailTd>

                <DetailTd>{formatPercent(detailTotals.hiringRate)}</DetailTd>
              </tr>
            </tfoot>
          ) : null}
        </table>
      </DraggableXScroll>
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
  const sixWeekDetailRows = Array.isArray(sixWeekTable.rows)
    ? sixWeekTable.rows
    : [];
  const sixWeekTableLoading = Boolean(sixWeekTable.loading);
  const sixWeekTableError = sixWeekTable.error || "";

  const filterState = workforceHiringView?.filters || {};
  const filterOptions = filterState?.options || {};
  const statusState = workforceHiringView?.status || {};

  const selectedClusters = normalizeArrayValue(
    filterState.cluster || trendMeta.cluster || "All Clusters",
    "All Clusters",
  );
  const selectedAccounts = normalizeArrayValue(
    filterState.account || trendMeta.account || "All Accounts",
    "All Accounts",
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

  const [openTrendDropdown, setOpenTrendDropdown] = useState(null);
  const [selectedWeekStartId, setSelectedWeekStartId] = useState("");
  const [selectedWeekEndId, setSelectedWeekEndId] = useState("");
  const [selectedTrendPreset, setSelectedTrendPreset] = useState(6);
  const [modalTrendData, setModalTrendData] = useState(null);
  const [modalTrendLoading, setModalTrendLoading] = useState(false);
  const [modalTrendError, setModalTrendError] = useState("");

  const [modalTableData, setModalTableData] = useState(null);
  const [modalTableLoading, setModalTableLoading] = useState(false);
  const [modalTableError, setModalTableError] = useState("");

  const weeklyVersionOptions = useMemo(
    () => getWeeklyVersionOptionsFromView(workforceHiringView),
    [workforceHiringView],
  );

  const trendDetailWeekOptions = useMemo(
    () => getTrendDetailWeekOptions(trendDetails, trendWeeks),
    [trendDetails, trendWeeks],
  );

  const weekDropdownOptions = useMemo(
    () =>
      weeklyVersionOptions.length > 0
        ? weeklyVersionOptions
        : trendDetailWeekOptions,
    [weeklyVersionOptions, trendDetailWeekOptions],
  );

  const weekStartOption = useMemo(
    () =>
      getTrendRangeEndpointOption({
        type: "start",
        trendDetails,
        trendWeeks,
        trendMeta,
        weeklyOptions: weekDropdownOptions,
      }),
    [trendDetails, trendWeeks, trendMeta, weekDropdownOptions],
  );

  const weekEndOption = useMemo(
    () =>
      getTrendRangeEndpointOption({
        type: "end",
        trendDetails,
        trendWeeks,
        trendMeta,
        weeklyOptions: weekDropdownOptions,
      }),
    [trendDetails, trendWeeks, trendMeta, weekDropdownOptions],
  );

  useEffect(() => {
    if (!open) return;

    setSelectedTrendPreset(6);
    setSelectedWeekStartId(weekStartOption?.id || "");
    setSelectedWeekEndId(weekEndOption?.id || "");
    setModalTrendData(null);
    setModalTrendError("");
    setModalTableData(null);
    setModalTableError("");
  }, [open, weekStartOption?.id, weekEndOption?.id]);

  const selectedWeekStartOption = useMemo(
    () =>
      weekDropdownOptions.find(
        (option) => String(option.id) === String(selectedWeekStartId),
      ) || weekStartOption,
    [weekDropdownOptions, selectedWeekStartId, weekStartOption],
  );

  const selectedWeekEndOption = useMemo(
    () =>
      weekDropdownOptions.find(
        (option) => String(option.id) === String(selectedWeekEndId),
      ) || weekEndOption,
    [weekDropdownOptions, selectedWeekEndId, weekEndOption],
  );

  const activeClusterRequestValue = useMemo(
    () => buildTrendRequestFilterValue(selectedClusters, "All Clusters"),
    [selectedClusters],
  );

  const activeAccountRequestValue = useMemo(
    () => buildTrendRequestFilterValue(selectedAccounts, "All Accounts"),
    [selectedAccounts],
  );

  const selectedRangeStartDate = selectedWeekStartOption?.weekStart || "";
  const selectedRangeEndDate = selectedWeekEndOption?.weekEnd || "";
  const selectedCurrentWeekStartDate = selectedWeekEndOption?.weekStart || "";
  const selectedCurrentWeekEndDate = selectedWeekEndOption?.weekEnd || "";

  const trendPresetOptions = [6, 12, 24, "custom"];

  const selectedTrendWeekCount = useMemo(() => {
    const startIndex = weekDropdownOptions.findIndex(
      (option) => String(option.id) === String(selectedWeekStartOption?.id),
    );

    const endIndex = weekDropdownOptions.findIndex(
      (option) => String(option.id) === String(selectedWeekEndOption?.id),
    );

    if (startIndex < 0 || endIndex < 0 || endIndex < startIndex) {
      return typeof selectedTrendPreset === "number" ? selectedTrendPreset : 0;
    }

    return endIndex - startIndex + 1;
  }, [
    selectedTrendPreset,
    selectedWeekEndOption?.id,
    selectedWeekStartOption?.id,
    weekDropdownOptions,
  ]);

  const matchedPreset = trendPresetOptions
    .filter((option) => typeof option === "number")
    .find((option) => option === selectedTrendWeekCount);

  const activeTrendPreset =
    selectedTrendPreset === "custom"
      ? "custom"
      : matchedPreset || selectedTrendPreset || 6;

  const activePresetIndex = Math.max(
    0,
    trendPresetOptions.indexOf(activeTrendPreset),
  );

  function getPresetStartWeekForEnd(endOption, weekCount) {
    if (
      !Array.isArray(weekDropdownOptions) ||
      weekDropdownOptions.length === 0 ||
      !endOption
    ) {
      return null;
    }

    const cleanWeekCount = Number(weekCount || 6);
    const endWeekStart = endOption?.weekStart || "";
    const endWeekEnd = endOption?.weekEnd || "";

    /*
      Do not depend on the dropdown order.

      Some weekly option lists are newest-first:
      Week 29, Week 28, Week 27...

      Some are oldest-first:
      Week 24, Week 25, Week 26...

      The preset range must always mean:
      selected Week End minus N weeks.
    */
    const sortedOptions = [...weekDropdownOptions]
      .filter((option) => option?.weekStart && option?.weekEnd)
      .sort((a, b) => String(a.weekStart).localeCompare(String(b.weekStart)));

    const endIndex = sortedOptions.findIndex(
      (option) =>
        String(option.id) === String(endOption?.id) ||
        (option.weekStart === endWeekStart && option.weekEnd === endWeekEnd),
    );

    if (endIndex < 0) return null;

    const startIndex = Math.max(0, endIndex - cleanWeekCount + 1);
    const startOption = sortedOptions[startIndex];

    if (!startOption) return null;

    /*
      Return the original dropdown option object so ids stay compatible
      with TrendDisplayDropdown selectedOption lookup.
    */
    return (
      weekDropdownOptions.find(
        (option) =>
          String(option.id) === String(startOption.id) ||
          (option.weekStart === startOption.weekStart &&
            option.weekEnd === startOption.weekEnd),
      ) || startOption
    );
  }

  function applyTrendPreset(weekCount) {
    if (weekCount === "custom") {
      setSelectedTrendPreset("custom");
      setOpenTrendDropdown(null);
      return;
    }

    if (
      !Array.isArray(weekDropdownOptions) ||
      weekDropdownOptions.length === 0
    ) {
      return;
    }

    const cleanWeekCount = Number(weekCount || 6);
    const currentEndIndex = weekDropdownOptions.findIndex(
      (option) => String(option.id) === String(selectedWeekEndOption?.id),
    );

    const endIndex =
      currentEndIndex >= 0 ? currentEndIndex : weekDropdownOptions.length - 1;

    const nextEndWeek = weekDropdownOptions[endIndex];
    const nextStartWeek = getPresetStartWeekForEnd(nextEndWeek, cleanWeekCount);

    if (!nextStartWeek || !nextEndWeek) return;

    setSelectedTrendPreset(cleanWeekCount);
    setSelectedWeekStartId(nextStartWeek.id || "");
    setSelectedWeekEndId(nextEndWeek.id || "");
    setOpenTrendDropdown(null);
  }

  function handleSelectWeekEnd(option) {
    if (!option) return;

    /*
      Manual Week End changes become a custom range.
      If a numeric preset was active before the manual change, keep the helpful
      behavior of moving Week Start to the matching range first.
    */
    const nextStartWeek =
      typeof selectedTrendPreset === "number"
        ? getPresetStartWeekForEnd(option, selectedTrendPreset)
        : null;

    setSelectedTrendPreset("custom");
    setSelectedWeekEndId(option.id || "");

    if (nextStartWeek?.id) {
      setSelectedWeekStartId(nextStartWeek.id);
    }
  }

  function handleSelectWeekStart(option) {
    if (!option) return;

    setSelectedTrendPreset("custom");
    setSelectedWeekStartId(option.id || "");
  }

  useEffect(() => {
    let cancelled = false;

    async function loadModalTrendData() {
      if (!open) return;

      if (
        !selectedRangeStartDate ||
        !selectedRangeEndDate ||
        !selectedCurrentWeekStartDate ||
        !selectedCurrentWeekEndDate
      ) {
        setModalTrendLoading(false);
        return;
      }

      if (String(selectedRangeStartDate) > String(selectedRangeEndDate)) {
        setModalTrendData(null);
        setModalTrendLoading(false);
        setModalTrendError(
          "Week Start must be earlier than or equal to Week End.",
        );
        return;
      }

      setModalTrendLoading(true);
      setModalTrendError("");

      try {
        const response = await getWorkforceHiringPlanAccountTrends({
          cluster: activeClusterRequestValue,
          account: activeAccountRequestValue,
          weekStart: selectedCurrentWeekStartDate,
          weekEnd: selectedCurrentWeekEndDate,
          startDate: selectedCurrentWeekStartDate,
          endDate: selectedCurrentWeekEndDate,
          rangeStartDate: selectedRangeStartDate,
          rangeEndDate: selectedRangeEndDate,
        });

        if (cancelled) return;

        if (response?.success === false) {
          setModalTrendData(null);
          setModalTrendError(response?.message || "Failed to load trend data.");
        } else {
          setModalTrendData(response);
        }
      } catch (error) {
        if (cancelled) return;

        console.error("FETCH MODAL TREND DATA ERROR:", error);
        setModalTrendData(null);
        setModalTrendError(
          error?.response?.data?.message ||
            error?.response?.data?.error ||
            error?.message ||
            "Failed to load trend data.",
        );
      } finally {
        if (!cancelled) {
          setModalTrendLoading(false);
        }
      }
    }

    loadModalTrendData();

    return () => {
      cancelled = true;
    };
  }, [
    open,
    selectedRangeStartDate,
    selectedRangeEndDate,
    selectedCurrentWeekStartDate,
    selectedCurrentWeekEndDate,
    activeClusterRequestValue,
    activeAccountRequestValue,
  ]);

  useEffect(() => {
    let cancelled = false;

    async function loadModalTableData() {
      if (!open) return;

      if (
        !selectedRangeStartDate ||
        !selectedRangeEndDate ||
        !selectedCurrentWeekStartDate ||
        !selectedCurrentWeekEndDate
      ) {
        setModalTableLoading(false);
        return;
      }

      if (String(selectedRangeStartDate) > String(selectedRangeEndDate)) {
        setModalTableData(null);
        setModalTableLoading(false);
        setModalTableError(
          "Week Start must be earlier than or equal to Week End.",
        );
        return;
      }

      setModalTableLoading(true);
      setModalTableError("");

      try {
        const response = await getWorkforceHiringPlanSixWeekTable({
          cluster: activeClusterRequestValue,
          account: activeAccountRequestValue,

          /*
            Current selected week follows the Week End dropdown.
          */
          weekStart: selectedCurrentWeekStartDate,
          weekEnd: selectedCurrentWeekEndDate,
          startDate: selectedCurrentWeekStartDate,
          endDate: selectedCurrentWeekEndDate,

          /*
            Dynamic table range follows Week Start to Week End.
          */
          rangeStartDate: selectedRangeStartDate,
          rangeEndDate: selectedRangeEndDate,
        });

        if (cancelled) return;

        if (response?.success === false) {
          setModalTableData(null);
          setModalTableError(response?.message || "Failed to load table data.");
        } else {
          setModalTableData(response);
        }
      } catch (error) {
        if (cancelled) return;

        console.error("FETCH MODAL TABLE DATA ERROR:", error);
        setModalTableData(null);
        setModalTableError(
          error?.response?.data?.message ||
            error?.response?.data?.error ||
            error?.message ||
            "Failed to load table data.",
        );
      } finally {
        if (!cancelled) {
          setModalTableLoading(false);
        }
      }
    }

    loadModalTableData();

    return () => {
      cancelled = true;
    };
  }, [
    open,
    selectedRangeStartDate,
    selectedRangeEndDate,
    selectedCurrentWeekStartDate,
    selectedCurrentWeekEndDate,
    activeClusterRequestValue,
    activeAccountRequestValue,
  ]);

  const activeSixWeekTableRows =
    Array.isArray(modalTableData?.data) && modalTableData.data.length > 0
      ? modalTableData.data
      : sixWeekDetailRows;

  const activeSixWeekTableLoading = modalTableLoading || sixWeekTableLoading;

  const activeSixWeekTableError = modalTableError || sixWeekTableError || "";

  const activeTrendWeeks =
    Array.isArray(modalTrendData?.labels) && modalTrendData.labels.length > 0
      ? modalTrendData.labels
      : trendWeeks;

  const activeTrends = modalTrendData?.trends || trends;

  const activeTrendSummary =
    modalTrendData?.summary || modalTrendData?.averages || trendSummary || {};

  function toggleTrendDropdown(key) {
    setOpenTrendDropdown((current) => (current === key ? null : key));
  }

  function closeTrendDropdown() {
    setOpenTrendDropdown(null);
  }

  const chartTrends = useMemo(
    () => ({
      absenteeism: activeTrends?.absenteeism || [],
      attrition: activeTrends?.attrition || [],
      buffer: activeTrends?.buffer || [],
    }),
    [activeTrends],
  );

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/40 p-4">
      <div className="flex max-h-[92vh] w-[96vw] max-w-[1680px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-sibs-primary-80 shadow-sm">
                <LineChart className="h-5 w-5" strokeWidth={2.4} />
              </span>

              <div>
                <h2 className="text-lg font-extrabold uppercase tracking-tight text-sibs-primary-90">
                  Expanded Week Trend Details
                </h2>
                <p className="mt-0.5 text-xs font-semibold text-slate-500">
                  Expanded trend view based on the selected weekly version,
                  cluster, and account.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-100 hover:text-sibs-primary-90"
          >
            <X className="h-5 w-5" strokeWidth={2.4} />
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-[370px_minmax(0,1fr)] xl:items-stretch">
            <aside className="flex h-full min-h-[500px] flex-col gap-3">
              <div className="flex flex-1 flex-col rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                <div className="mb-4 flex items-center gap-2 text-sm font-extrabold uppercase text-sibs-primary-90">
                  <CalendarDays className="h-4 w-4" strokeWidth={2.4} />
                  Selected Trend Range
                </div>

                <div className="grid content-start gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-bold text-[#101828]">
                      Trend Range
                    </label>

                    <div className="relative grid h-10 grid-cols-4 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                      <span
                        className="absolute bottom-1 top-1 rounded-lg bg-sibs-primary-1 shadow-sm transition-all duration-300 ease-out"
                        style={{
                          width: "calc((100% - 8px) / 4)",
                          left: `calc(4px + ${activePresetIndex} * ((100% - 8px) / 4))`,
                        }}
                      />

                      {trendPresetOptions.map((weekCount) => {
                        const active = activeTrendPreset === weekCount;
                        const label =
                          weekCount === "custom"
                            ? "Custom"
                            : `${weekCount} Weeks`;

                        return (
                          <button
                            key={weekCount}
                            type="button"
                            onClick={() => applyTrendPreset(weekCount)}
                            className={`relative z-10 rounded-lg px-1.5 py-2 text-[11px] font-extrabold transition-colors duration-300 ${
                              active
                                ? "text-white"
                                : "text-sibs-primary-80 hover:text-sibs-primary-1"
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <TrendDisplayDropdown
                    label="To Week"
                    value={selectedWeekEndOption?.value}
                    selectedOption={selectedWeekEndOption}
                    options={weekDropdownOptions}
                    open={openTrendDropdown === "weekEnd"}
                    onToggle={() => toggleTrendDropdown("weekEnd")}
                    onClose={closeTrendDropdown}
                    onSelect={handleSelectWeekEnd}
                  />

                  <TrendDisplayDropdown
                    label="From Week"
                    value={selectedWeekStartOption?.value}
                    selectedOption={selectedWeekStartOption}
                    options={weekDropdownOptions}
                    open={openTrendDropdown === "weekStart"}
                    onToggle={() => toggleTrendDropdown("weekStart")}
                    onClose={closeTrendDropdown}
                    onSelect={handleSelectWeekStart}
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
                </div>
              </div>

              <div className="flex flex-none flex-col rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wide text-sibs-primary-90">
                    Legend
                  </span>

                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-extrabold uppercase text-slate-500">
                    Trend Lines
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="flex min-w-0 flex-col items-center justify-center rounded-xl border border-blue-100 bg-blue-50/70 px-2 py-2 text-center">
                    <span className="mb-1 h-[3px] w-8 rounded-full bg-blue-600" />
                    <span className="truncate text-[10px] font-extrabold text-sibs-primary-90">
                      Absenteeism
                    </span>
                  </div>

                  <div className="flex min-w-0 flex-col items-center justify-center rounded-xl border border-red-100 bg-red-50/70 px-2 py-2 text-center">
                    <span className="mb-1 h-[3px] w-8 rounded-full bg-red-600" />
                    <span className="truncate text-[10px] font-extrabold text-sibs-primary-90">
                      Attrition
                    </span>
                  </div>

                  <div className="flex min-w-0 flex-col items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50/70 px-2 py-2 text-center">
                    <span className="mb-1 h-[3px] w-8 rounded-full bg-green-600" />
                    <span className="truncate text-[10px] font-extrabold text-sibs-primary-90">
                      Buffer
                    </span>
                  </div>
                </div>
              </div>
            </aside>

            <section className="flex min-h-[500px] min-w-0 flex-col rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
              <div className="mb-4 flex flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:justify-between">
                <div>
                  <h3 className="text-base font-extrabold uppercase text-sibs-primary-90">
                    Expanded Trend Graph
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Select a preset range or use Week Start / Week End to adjust
                    the displayed trend.
                  </p>
                </div>

                <div className="flex flex-col gap-3 xl:items-end">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <div className="min-w-[142px] rounded-xl border border-blue-100 bg-blue-50/60 px-3 py-1.5 text-center">
                      <span className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
                        Absenteeism Avg
                      </span>
                      <strong className="block text-sm font-extrabold text-blue-600">
                        {formatPercent(
                          activeTrendSummary.absenteeismPercentage,
                        )}
                      </strong>
                    </div>

                    <div className="min-w-[142px] rounded-xl border border-red-100 bg-red-50/60 px-3 py-1.5 text-center">
                      <span className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
                        Attrition Avg
                      </span>
                      <strong className="block text-sm font-extrabold text-red-600">
                        {formatPercent(activeTrendSummary.attritionPercentage)}
                      </strong>
                    </div>

                    <div className="min-w-[142px] rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-1.5 text-center">
                      <span className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
                        Buffer Avg
                      </span>
                      <strong className="block text-sm font-extrabold text-green-600">
                        {formatPercent(activeTrendSummary.bufferPercentage)}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {modalTrendError ? (
                <div className="mt-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                  {modalTrendError}
                </div>
              ) : null}

              <div className="mt-0 flex w-full flex-1 items-start justify-center px-0 pt-0 pb-2">
                {modalTrendLoading ? (
                  <div className="flex min-h-[260px] w-full items-center justify-center text-sm font-bold text-slate-500">
                    Loading trend data...
                  </div>
                ) : (
                  <TrendSvg weeks={activeTrendWeeks} trends={chartTrends} />
                )}
              </div>
            </section>
          </div>

          <SixWeekDetailedPerformanceTable
            rows={activeSixWeekTableRows}
            loading={activeSixWeekTableLoading}
            error={activeSixWeekTableError}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
