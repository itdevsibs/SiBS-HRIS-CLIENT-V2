import { Clock3, SquarePen } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

import { getMyResignationStatus } from "../../../lib/axios/getMyResignationStatus.js";

const TERMINAL_RESIGNATION_STATUSES = new Set([
  "completed",
  "declined",
  "rejected",
  "cancelled",
]);

function getResignationStatus(item = {}) {
  return String(
    item?.status ||
      item?.resignationStatus ||
      item?.resignation_status ||
      "",
  ).trim();
}

function isActiveResignation(item = {}) {
  if (!item || typeof item !== "object") return false;

  const status = getResignationStatus(item).toLowerCase();

  if (!status) return true;

  return !TERMINAL_RESIGNATION_STATUSES.has(status);
}

function getResignationStatusLabel(item = {}) {
  const status = getResignationStatus(item);
  const normalized = status.toLowerCase();

  if (!status) return "Resignation request in progress";
  if (normalized === "pending" || normalized === "for approval") {
    return "For Approval";
  }

  return status
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

const ProfileDropdown = ({ openModal, openDropdown, onViewResignation }) => {
  const [resignationState, setResignationState] = useState({
    loading: true,
    item: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadResignationStatus() {
      try {
        const result = await getMyResignationStatus();

        if (cancelled) return;

        const latest =
          result?.latest ||
          (Array.isArray(result?.data) ? result.data[0] : null) ||
          null;

        setResignationState({
          loading: false,
          item: isActiveResignation(latest) ? latest : null,
        });
      } catch (error) {
        if (cancelled) return;

        console.error("Failed to load resignation status:", error);
        setResignationState({ loading: false, item: null });
      }
    }

    void loadResignationStatus();

    return () => {
      cancelled = true;
    };
  }, []);

  const activeResignation = resignationState.item;
  const resignationStatusLabel = useMemo(
    () => getResignationStatusLabel(activeResignation),
    [activeResignation],
  );

  function closeDropdown() {
    openDropdown(false);
  }

  function openResignationStatus() {
    onViewResignation?.(activeResignation);
  }

  function submitResignation() {
    openModal(true);
    closeDropdown();
  }

  return (
    <div
        className="w-[260px] max-w-[calc(100vw-32px)] overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white p-2 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
      <div className="px-3 pb-2 pt-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sibs-tertiary-5">
          Additional Actions
        </p>
      </div>

      {resignationState.loading ? (
        <div className="flex w-full items-start gap-3 rounded-xl px-4 py-3 text-left text-sibs-tertiary-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sibs-tertiary-10">
            <Clock3 size={18} />
          </div>

          <div className="min-w-0 flex-1 leading-tight">
            <span className="block text-sm font-bold">
              Checking Resignation Status
            </span>
            <span className="mt-1 block text-[11px] font-medium">
              Please wait...
            </span>
          </div>
        </div>
      ) : activeResignation ? (
        <button
          type="button"
          onClick={openResignationStatus}
          className="group flex w-full items-start gap-3 rounded-xl px-4 py-3 text-left transition hover:bg-amber-50"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 transition group-hover:bg-white">
            <Clock3 size={18} />
          </div>

          <div className="min-w-0 flex-1 leading-tight">
            <span className="block text-sm font-bold text-sibs-primary-1">
              Resignation Status
            </span>

            <span className="mt-1 block text-[11px] font-semibold text-amber-700">
              {resignationStatusLabel}
            </span>
          </div>
        </button>
      ) : (
        <button
          type="button"
          onClick={submitResignation}
          className="group flex w-full items-start gap-3 rounded-xl px-4 py-3 text-left transition hover:bg-sibs-tertiary-10"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sibs-tertiary-10 text-sibs-primary-1 transition group-hover:bg-white">
            <SquarePen size={18} />
          </div>

          <div className="min-w-0 flex-1 leading-tight">
            <span className="block text-sm font-bold text-sibs-primary-1">
              Submit Resignation
            </span>

            <span className="mt-1 block text-[11px] font-medium text-sibs-tertiary-5">
              Employee resignation request
            </span>
          </div>
        </button>
      )}
    </div>
  );
};

export default ProfileDropdown;
