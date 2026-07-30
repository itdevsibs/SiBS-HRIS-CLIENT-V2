import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
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
    <div className="space-y-5 bg-[#F5F7FA] p-4 sm:p-5">
      <section className="rounded-2xl border border-[#D9E2EC] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
              <CalendarDays size={14} />
              Philippine Working-Day Calendar
            </div>
            <h2 className="mt-3 text-xl font-extrabold text-sibs-primary-1">
              Interview Follow-up Holidays
            </h2>
            <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-[#667085]">
              Active dates are excluded when calculating candidate interview
              response deadlines and the automatic Day 3, 6, 9, and 12
              follow-up workflow.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadHolidays()}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#D9E2EC] bg-white px-4 text-sm font-extrabold text-sibs-primary-1 transition hover:bg-[#F8FAFC] disabled:opacity-60"
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
          className="mt-6 grid grid-cols-1 gap-4 rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 lg:grid-cols-[220px_1fr_160px_auto]"
        >
          <div>
            <label className="text-xs font-extrabold uppercase tracking-wide text-[#667085]">
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
              className="mt-2 h-11 w-full rounded-xl border border-[#D0D5DD] bg-white px-3 text-sm font-bold text-sibs-primary-1 outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
            />
          </div>

          <div>
            <label className="text-xs font-extrabold uppercase tracking-wide text-[#667085]">
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
              className="mt-2 h-11 w-full rounded-xl border border-[#D0D5DD] bg-white px-3 text-sm font-bold text-sibs-primary-1 outline-none transition placeholder:text-[#98A2B3] focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
            />
          </div>

          <div>
            <label className="text-xs font-extrabold uppercase tracking-wide text-[#667085]">
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
              className="mt-2 h-11 w-full rounded-xl border border-[#D0D5DD] bg-white px-3 text-sm font-bold text-sibs-primary-1 outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
            >
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-4 text-sm font-extrabold text-white transition hover:opacity-90 disabled:opacity-60"
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
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#D9E2EC] bg-white text-[#667085] transition hover:bg-[#F8FAFC]"
                title="Cancel editing"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white shadow-sm">
        <div className="border-b border-[#E6ECF2] px-5 py-4">
          <h3 className="text-base font-extrabold text-sibs-primary-1">
            Configured Holidays
          </h3>
          <p className="mt-1 text-xs font-semibold text-[#667085]">
            {sortedHolidays.length} calendar entr{sortedHolidays.length === 1 ? "y" : "ies"}
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-48 items-center justify-center gap-2 text-sm font-bold text-[#667085]">
            <Loader2 size={18} className="animate-spin" />
            Loading holidays...
          </div>
        ) : sortedHolidays.length ? (
          <div className="divide-y divide-[#EEF2F6]">
            {sortedHolidays.map((holiday) => (
              <div
                key={holiday.id}
                className="flex flex-col gap-3 px-5 py-4 transition hover:bg-[#F8FAFC] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-extrabold text-[#101828]">
                      {holiday.holidayName}
                    </p>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${
                        holiday.isActive
                          ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-slate-50 text-slate-500"
                      }`}
                    >
                      {holiday.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-[#667085]">
                    {formatHolidayDate(holiday.holidayDate)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(holiday)}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 text-xs font-extrabold text-blue-700 transition hover:bg-blue-100"
                  >
                    <Pencil size={14} />
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={deletingId === String(holiday.id)}
                    onClick={() => void handleDelete(holiday)}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 text-xs font-extrabold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                  >
                    {deletingId === String(holiday.id) ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex min-h-48 flex-col items-center justify-center px-5 text-center">
            <CalendarDays size={28} className="text-[#98A2B3]" />
            <p className="mt-3 text-sm font-extrabold text-sibs-primary-1">
              No holidays configured
            </p>
            <p className="mt-1 text-xs font-semibold text-[#667085]">
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
