import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search } from "lucide-react";

function DropdownPortal({
  open,
  anchorRef,
  children,
  onClose,
  maxHeight = 256,
}) {
  const dropdownRef = useRef(null);
  const [style, setStyle] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return;

    function updatePosition() {
      const rect = anchorRef.current.getBoundingClientRect();

      setStyle({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    }

    updatePosition();

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e) {
      const clickedAnchor = anchorRef.current?.contains(e.target);
      const clickedDropdown = dropdownRef.current?.contains(e.target);

      if (!clickedAnchor && !clickedDropdown) {
        onClose?.();
      }
    }

    function handleEscape(e) {
      if (e.key === "Escape") {
        onClose?.();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, anchorRef, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={dropdownRef}
      className="fixed z-[999999] overflow-hidden rounded-xl border border-[#D7DEE8] bg-white shadow-2xl"
      style={{
        top: `${style.top}px`,
        left: `${style.left}px`,
        width: `${style.width}px`,
      }}
    >
      <div
        className="overflow-y-auto py-2 sibs-scrollbar"
        style={{ maxHeight }}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

function CustomSelect({
  label,
  value,
  options = [],
  onChange,
  allLabel = "",
}) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);

  const displayValue =
    value === "All" && allLabel ? allLabel : value || allLabel || "Select";

  return (
    <div className="relative">
      <label className="mb-1 block text-sm font-bold text-[#101828]">
        {label}
      </label>

      <button
        ref={anchorRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex h-12 w-full items-center justify-between rounded-xl border bg-white px-4 text-left text-sm font-bold text-[#344054] outline-none transition-all duration-200 hover:border-sibs-primary-1/40 hover:bg-[#F8FAFC] focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10 ${
          open
            ? "border-sibs-primary-1 ring-4 ring-sibs-primary-1/10"
            : "border-[#D0D5DD]"
        }`}
      >
        <span className="truncate">{displayValue}</span>

        <ChevronDown
          size={18}
          className={`shrink-0 text-sibs-tertiary-5 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <DropdownPortal
        open={open}
        anchorRef={anchorRef}
        onClose={() => setOpen(false)}
      >
        {options.map((option) => {
          const optionLabel =
            option === "All" && allLabel ? allLabel : option;

          const selected = value === option;

          return (
            <button
              key={option}
              type="button"
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
              className={`block w-full px-4 py-3 text-left text-sm transition ${
                selected
                  ? "bg-[#EAF2FB] font-bold text-sibs-primary-1"
                  : "text-[#344054] hover:bg-[#F8FAFC]"
              }`}
            >
              <span className="block truncate">{optionLabel}</span>
            </button>
          );
        })}
      </DropdownPortal>
    </div>
  );
}

export default function HiringSearchTable({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  siteFilter,
  setSiteFilter,
  reasonFilter,
  setReasonFilter,
  reasonForHiringOptions = [],
}) {
  const hasActiveFilters =
    search ||
    statusFilter !== "All" ||
    siteFilter !== "All" ||
    reasonFilter !== "All";

  const approvalStatusOptions = [
    "All",
    "For Approval",
    "Approved",
    "Not Approved",
  ];

  const siteOptions = ["All", "Davao Site", "Tagum Site", "Mabini Site"];

  const reasonOptions = ["All", ...reasonForHiringOptions];

  function handleClearFilters() {
    setSearch("");
    setStatusFilter("All");
    setSiteFilter("All");
    setReasonFilter("All");
  }

  return (
    <div className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_240px_240px_260px] xl:items-end">
        <div>
          <label className="mb-1 block text-sm font-bold text-[#101828]">
            Search
          </label>

          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search PRF, position, department/account, JD, reason, site, prepared by..."
              className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 pl-11 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
            />
          </div>
        </div>

        <CustomSelect
          label="Approval Status"
          value={statusFilter}
          options={approvalStatusOptions}
          allLabel="All Status"
          onChange={setStatusFilter}
        />

        <CustomSelect
          label="Location / Site"
          value={siteFilter}
          options={siteOptions}
          allLabel="All Sites"
          onChange={setSiteFilter}
        />

        <CustomSelect
          label="Reason for Hiring"
          value={reasonFilter}
          options={reasonOptions}
          allLabel="All Reasons"
          onChange={setReasonFilter}
        />
      </div>

      {hasActiveFilters && (
        <div className="mt-4">
          <button
            type="button"
            onClick={handleClearFilters}
            className="inline-flex rounded-full border border-[#E6ECF2] bg-white px-3 py-1 text-xs font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}