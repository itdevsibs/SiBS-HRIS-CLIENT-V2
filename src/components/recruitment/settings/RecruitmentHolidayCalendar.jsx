import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";

import {
  createRecruitmentHoliday,
  deleteRecruitmentHoliday,
  getRecruitmentHolidays,
  updateRecruitmentHoliday,
} from "../../../lib/axios/getRecruitmentSettings";
import StatusModal from "../../modals/StatusModal";
import { Skeleton } from "@/components/ui";

const EMPTY_FORM = {
  id: "",
  holidayDate: "",
  holidayName: "",
  isActive: true,
};

function getApiMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

function formatHolidayDate(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (!match) return value || "—";

  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );

  return date.toLocaleDateString("en-PH", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function normalizeHoliday(item = {}) {
  return {
    id: item.id,
    holidayDate: item.holidayDate || item.holiday_date || "",
    holidayName: item.holidayName || item.holiday_name || "",
    isActive: Boolean(item.isActive ?? item.is_active ?? true),
    updatedAt: item.updatedAt || item.updated_at || null,
  };
}

export default function RecruitmentHolidayCalendar() {
  const [holidays, setHolidays] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  const isEditing = Boolean(form.id);

  const sortedHolidays = useMemo(
    () =>
      [...holidays].sort((left, right) =>
        String(left.holidayDate).localeCompare(String(right.holidayDate)),
      ),
    [holidays],
  );

  const loadHolidays = useCallback(async () => {
    setLoading(true);

    try {
      const response = await getRecruitmentHolidays({
        includeInactive: true,
      });
      const rows = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.holidays)
          ? response.holidays
          : [];

      setHolidays(rows.map(normalizeHoliday));
    } catch (error) {
      setStatusModal({
        open: true,
        type: "error",
        title: "Holiday Calendar Unavailable",
        message: getApiMessage(
          error,
          "Failed to load the Philippine holiday calendar.",
        ),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHolidays();
  }, [loadHolidays]);

  function resetForm() {
    setForm(EMPTY_FORM);
  }

  function handleEdit(holiday) {
    setForm({
      id: holiday.id,
      holidayDate: holiday.holidayDate,
      holidayName: holiday.holidayName,
      isActive: holiday.isActive,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.holidayDate || !form.holidayName.trim()) {
      setStatusModal({
        open: true,
        type: "error",
        title: "Incomplete Holiday",
        message: "Holiday date and holiday name are required.",
      });
      return;
    }

    setSaving(true);

    try {
      const payload = {
        holidayDate: form.holidayDate,
        holidayName: form.holidayName.trim(),
        isActive: form.isActive,
      };

      if (isEditing) {
        await updateRecruitmentHoliday(form.id, payload);
      } else {
        await createRecruitmentHoliday(payload);
      }

      await loadHolidays();
      resetForm();
      setStatusModal({
        open: true,
        type: "success",
        title: isEditing ? "Holiday Updated" : "Holiday Added",
        message: isEditing
          ? "The holiday calendar entry was updated successfully."
          : "The holiday was added to the working-day calendar.",
      });
    } catch (error) {
      setStatusModal({
        open: true,
        type: "error",
        title: "Holiday Save Failed",
        message: getApiMessage(error, "Failed to save the holiday."),
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(holiday) {
    const confirmed = window.confirm(
      `Remove ${holiday.holidayName} from the holiday calendar?`,
    );

    if (!confirmed) return;

    setDeletingId(String(holiday.id));

    try {
      await deleteRecruitmentHoliday(holiday.id);
      setHolidays((previous) =>
        previous.filter((item) => String(item.id) !== String(holiday.id)),
      );

      if (String(form.id) === String(holiday.id)) resetForm();

      setStatusModal({
        open: true,
        type: "success",
        title: "Holiday Removed",
        message: "The holiday was removed from the working-day calendar.",
      });
    } catch (error) {
      setStatusModal({
        open: true,
        type: "error",
        title: "Holiday Removal Failed",
        message: getApiMessage(error, "Failed to remove the holiday."),
      });
    } finally {
      setDeletingId("");
    }
  }

  return (
    <div className="space-y-5 font-jakarta">
      <section className="sibs-card p-4 sm:p-5 2xl:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h3 className="font-heading text-sm sm:text-base 2xl:text-lg font-bold text-sibs-navy tracking-tight">
              Interview Follow-up Holidays
            </h3>
            <p className="mt-1 sibs-text-xs 2xl:text-sm font-semibold text-sibs-muted">
              Active dates are excluded when calculating candidate interview
              response deadlines and the automatic Day 3, 6, 9, and 12
              follow-up workflow.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadHolidays()}
            disabled={loading}
            className="sibs-btn-secondary inline-flex h-9 sm:h-10 items-center justify-center gap-2 px-3 sm:px-4 text-xs sm:text-sm font-semibold disabled:opacity-60"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            Refresh
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-5 grid grid-cols-1 gap-4 rounded-xl border border-sibs-border bg-sibs-surface p-4 lg:grid-cols-[220px_1fr_160px_auto]"
        >
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-sibs-navy">
              Holiday Date
            </label>
            <input
              type="date"
              required
              value={form.holidayDate}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  holidayDate: event.target.value,
                }))
              }
              className="sibs-dashboard-input mt-1.5 h-10 w-full text-xs sm:text-sm text-sibs-navy"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-sibs-navy">
              Holiday Name
            </label>
            <input
              type="text"
              required
              value={form.holidayName}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  holidayName: event.target.value,
                }))
              }
              placeholder="Example: Ninoy Aquino Day"
              className="sibs-dashboard-input mt-1.5 h-10 w-full text-xs sm:text-sm text-sibs-navy placeholder:text-sibs-grey-3"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-sibs-navy">
              Status
            </label>
            <select
              value={form.isActive ? "Active" : "Inactive"}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  isActive: event.target.value === "Active",
                }))
              }
              className="sibs-dashboard-input mt-1.5 h-10 w-full text-xs sm:text-sm font-semibold text-sibs-navy bg-white cursor-pointer"
            >
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              disabled={saving}
              className="sibs-btn-primary inline-flex h-10 flex-1 items-center justify-center gap-2 px-4 text-xs sm:text-sm font-semibold disabled:opacity-60"
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : isEditing ? (
                <CheckCircle2 size={16} />
              ) : (
                <Plus size={16} />
              )}
              {saving ? "Saving..." : isEditing ? "Update" : "Add"}
            </button>

            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="sibs-btn-secondary inline-flex h-10 w-10 items-center justify-center text-sibs-grey-4"
                title="Cancel editing"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="sibs-card overflow-hidden">
        <div className="border-b border-sibs-border px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-heading text-sm sm:text-base font-bold text-sibs-navy tracking-tight">
              Configured Holidays
            </h3>
            <p className="mt-0.5 text-xs text-sibs-grey-4">
              Philippine holidays excluded from response timelines
            </p>
          </div>
          <span className="inline-flex items-center rounded-full border border-sibs-border bg-sibs-surface px-2.5 py-0.5 text-xs font-semibold text-sibs-grey-4">
            {sortedHolidays.length} calendar entr{sortedHolidays.length === 1 ? "y" : "ies"}
          </span>
        </div>

        {loading ? (
          <div className="divide-y divide-sibs-border" data-testid="holidays-skeleton">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={`holiday-skeleton-${index}`}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-3.5 w-28" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : sortedHolidays.length ? (
          <div className="divide-y divide-sibs-border">
            {sortedHolidays.map((holiday) => (
              <div
                key={holiday.id}
                className="flex flex-col gap-3 px-5 py-3.5 transition hover:bg-sibs-surface/60 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-xs sm:text-sm text-sibs-navy">
                      {holiday.holidayName}
                    </p>
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${
                        holiday.isActive
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-sibs-border bg-sibs-surface text-sibs-grey-4"
                      }`}
                    >
                      {holiday.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-sibs-grey-4">
                    {formatHolidayDate(holiday.holidayDate)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(holiday)}
                    className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition"
                  >
                    <Pencil size={13} />
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={deletingId === String(holiday.id)}
                    onClick={() => void handleDelete(holiday)}
                    className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition disabled:opacity-60"
                  >
                    {deletingId === String(holiday.id) ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Trash2 size={13} />
                    )}
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex min-h-48 flex-col items-center justify-center px-5 text-center">
            <CalendarDays size={28} className="text-sibs-grey-3" />
            <p className="mt-3 text-sm font-bold text-sibs-navy">
              No holidays configured
            </p>
            <p className="mt-1 text-xs text-sibs-grey-4">
              Add Philippine holidays to exclude them from working-day
              calculations.
            </p>
          </div>
        )}
      </section>

      <StatusModal
        open={statusModal.open}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        variant="center"
        onClose={() =>
          setStatusModal((previous) => ({ ...previous, open: false }))
        }
      />
    </div>
  );
}
