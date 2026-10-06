import { useCallback, useEffect, useRef, useState } from "react";
import {
  BriefcaseBusiness,
  CheckCircle2,
  Edit3,
  Loader2,
  Plus,
  Power,
  RotateCcw,
  Save,
  XCircle,
} from "lucide-react";

import { ModalShell } from "@/components/ui";
import {
  createAccountLob,
  getAccountLobs,
  setAccountLobStatus,
  updateAccountLob,
} from "@/lib/axios/departments";

const EMPTY_FORM = {
  lobName: "",
  lobCode: "",
  description: "",
};

function getErrorMessage(error, fallback) {
  return error?.message || fallback;
}

export default function AccountLobManagementModal({
  account,
  canManage = false,
  onClose,
  onChanged,
}) {
  const [lobs, setLobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusBusyId, setStatusBusyId] = useState("");
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [addResultModal, setAddResultModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });
  const descriptionRef = useRef(null);

  const accountId = String(account?.id ?? "").trim();

  const loadLobs = useCallback(async () => {
    if (!accountId) return [];

    setLoading(true);
    setError("");

    try {
      const result = await getAccountLobs(accountId, { includeInactive: true });
      const nextLobs = Array.isArray(result?.lobs) ? result.lobs : [];
      setLobs(nextLobs);
      onChanged?.(accountId, nextLobs);
      return nextLobs;
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Unable to load Lines of Business for this account.",
        ),
      );
      return [];
    } finally {
      setLoading(false);
    }
  }, [accountId, onChanged]);

  useEffect(() => {
    if (!accountId) return;

    setEditingId("");
    setForm(EMPTY_FORM);
    setNotice("");
    setError("");
    setAddResultModal({ open: false, type: "success", title: "", message: "" });
    loadLobs();
  }, [accountId, loadLobs]);

  useEffect(() => {
    const textarea = descriptionRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.max(textarea.scrollHeight, 42)}px`;
  }, [form.description]);

  if (!account) return null;

  function resetForm() {
    setEditingId("");
    setForm(EMPTY_FORM);
    setError("");
  }

  function closeAddResultModal() {
    setAddResultModal((current) => ({ ...current, open: false }));
  }

  function startEdit(lob) {
    setEditingId(String(lob.id));
    setForm({
      lobName: lob.lobName || "",
      lobCode: lob.lobCode || "",
      description: lob.description || "",
    });
    setError("");
    setNotice("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const payload = {
      lobName: form.lobName.trim().replace(/\s+/g, " "),
      lobCode: form.lobCode.trim().replace(/\s+/g, " "),
      description: form.description.trim(),
    };

    if (!payload.lobName) {
      if (editingId) {
        setError("LOB name is required.");
      } else {
        setAddResultModal({
          open: true,
          type: "error",
          title: "LOB Not Added",
          message: "LOB name is required before this Line of Business can be added.",
        });
      }
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      if (editingId) {
        const result = await updateAccountLob(editingId, payload);
        setNotice(result?.message || "Line of Business updated successfully.");
        setEditingId("");
        setForm(EMPTY_FORM);
        await loadLobs();
      } else {
        const result = await createAccountLob(accountId, payload);
        const addedLobName = payload.lobName;

        setForm(EMPTY_FORM);
        await loadLobs();
        setAddResultModal({
          open: true,
          type: "success",
          title: "LOB Added Successfully",
          message:
            result?.message ||
            `${addedLobName} was added to ${account.name}.`,
        });
      }
    } catch (requestError) {
      const message = getErrorMessage(
        requestError,
        editingId
          ? "Unable to update Line of Business."
          : "Unable to add Line of Business.",
      );

      if (editingId) {
        setError(message);
      } else {
        setAddResultModal({
          open: true,
          type: "error",
          title: "Unable to Add LOB",
          message,
        });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(lob) {
    if (!canManage || !lob?.id) return;

    setStatusBusyId(String(lob.id));
    setError("");
    setNotice("");

    try {
      const result = await setAccountLobStatus(lob.id, !lob.isActive);
      setNotice(
        result?.message ||
          `${lob.lobName} is now ${lob.isActive ? "inactive" : "active"}.`,
      );
      await loadLobs();
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Unable to change Line of Business status.",
        ),
      );
    } finally {
      setStatusBusyId("");
    }
  }

  const activeCount = lobs.filter((lob) => lob.isActive).length;

  return (
    <>
    <ModalShell
      open
      onClose={saving || addResultModal.open ? undefined : onClose}
      title={`${account.name} — Line of Business`}
      subtitle="Manage the account-specific LOB master list used for employee assignments."
      icon={BriefcaseBusiness}
      badge={`${activeCount} active · ${lobs.length} total`}
      maxWidth="max-w-5xl"
      bodyClassName="max-h-[72vh] overflow-y-auto"
      closeOnBackdrop={false}
      closeOnEscape={!saving && !addResultModal.open}
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <p className="text-[10px] font-semibold text-sibs-muted">
            Deactivated LOBs remain in history but cannot be assigned to new employees.
          </p>
          <button type="button" className="sibs-btn-primary" onClick={onClose} disabled={saving}>
            Close LOB Management
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {canManage ? (
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-sibs-border bg-sibs-surface p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-extrabold text-sibs-navy">
                  {editingId ? "Edit Line of Business" : "Add Line of Business"}
                </p>
                <p className="mt-0.5 text-[10px] font-semibold text-sibs-muted">
                  Each LOB is owned by this Account only.
                </p>
              </div>

              {editingId ? (
                <button
                  type="button"
                  className="sibs-btn-secondary"
                  onClick={resetForm}
                  disabled={saving}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Cancel Edit
                </button>
              ) : null}
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[10px] font-extrabold text-sibs-navy">
                  LOB Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.lobName}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, lobName: event.target.value }))
                  }
                  maxLength={150}
                  placeholder="e.g. Scheduling"
                  disabled={saving}
                  className="h-10 w-full rounded-xl border border-sibs-border bg-white px-3 text-xs font-semibold text-sibs-navy outline-none transition focus:border-sibs-orange focus:ring-2 focus:ring-sibs-orange/10"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-extrabold text-sibs-navy">
                  LOB Code
                </label>
                <input
                  type="text"
                  value={form.lobCode}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, lobCode: event.target.value }))
                  }
                  maxLength={50}
                  placeholder="e.g. SCHED"
                  disabled={saving}
                  className="h-10 w-full rounded-xl border border-sibs-border bg-white px-3 text-xs font-semibold text-sibs-navy outline-none transition focus:border-sibs-orange focus:ring-2 focus:ring-sibs-orange/10"
                />
              </div>
            </div>

            <div className="mt-3">
              <label className="mb-1.5 block text-[10px] font-extrabold text-sibs-navy">
                Description
              </label>
              <textarea
                ref={descriptionRef}
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                maxLength={16000}
                rows={1}
                wrap="soft"
                placeholder="Optional description"
                disabled={saving}
                className="min-h-[42px] w-full resize-none overflow-hidden whitespace-pre-wrap break-words rounded-xl border border-sibs-border bg-white px-3 py-2.5 text-xs font-semibold leading-5 text-sibs-navy outline-none transition focus:border-sibs-orange focus:ring-2 focus:ring-sibs-orange/10"
              />
            </div>

            <div className="mt-4 flex justify-end">
              <button type="submit" className="sibs-btn-primary" disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : editingId ? (
                  <Save className="h-4 w-4" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {saving ? "Saving..." : editingId ? "Save Changes" : "Add LOB"}
              </button>
            </div>
          </form>
        ) : (
          <div className="rounded-xl border border-sibs-border bg-sibs-surface px-4 py-3 text-xs font-semibold text-sibs-muted">
            You can view account LOBs. Super Admin access is required to add, edit, activate, or deactivate them.
          </div>
        )}

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
            {error}
          </div>
        ) : null}

        {notice ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700">
            {notice}
          </div>
        ) : null}

        <section className="overflow-hidden rounded-2xl border border-sibs-border bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-sibs-border px-4 py-3">
            <div>
              <h3 className="text-xs font-extrabold text-sibs-navy">Account LOBs</h3>
              <p className="mt-0.5 text-[10px] font-semibold text-sibs-muted">
                Employees in the same Account may be assigned to different LOBs.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-sibs-orange" />
            </div>
          ) : lobs.length ? (
            <div className="divide-y divide-sibs-border">
              {lobs.map((lob) => {
                const statusBusy = statusBusyId === String(lob.id);

                return (
                  <article
                    key={lob.id}
                    className="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-extrabold text-sibs-navy">
                          {lob.lobName}
                        </p>
                        {lob.lobCode ? (
                          <span className="rounded-md border border-sibs-border bg-sibs-surface px-2 py-0.5 font-mono text-[8px] font-bold text-sibs-secondary">
                            {lob.lobCode}
                          </span>
                        ) : null}
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[8px] font-extrabold uppercase ${
                            lob.isActive
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-slate-100 text-slate-600"
                          }`}
                        >
                          {lob.isActive ? (
                            <CheckCircle2 className="h-2.5 w-2.5" />
                          ) : (
                            <XCircle className="h-2.5 w-2.5" />
                          )}
                          {lob.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>

                      <p className="mt-1 whitespace-pre-wrap break-words text-[10px] font-semibold leading-4 text-sibs-muted">
                        {lob.description || "No description"}
                      </p>
                      <p className="mt-1 text-[9px] font-bold text-sibs-secondary">
                        {Number(lob.employeeCount) || 0} active employee assignment{Number(lob.employeeCount) === 1 ? "" : "s"}
                      </p>
                    </div>

                    {canManage ? (
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          className="sibs-btn-secondary"
                          onClick={() => startEdit(lob)}
                          disabled={saving || statusBusy}
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-extrabold transition disabled:opacity-50 ${
                            lob.isActive
                              ? "border-rose-200 bg-white text-rose-600 hover:bg-rose-50"
                              : "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
                          }`}
                          onClick={() => handleStatusChange(lob)}
                          disabled={saving || statusBusy}
                        >
                          {statusBusy ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Power className="h-3.5 w-3.5" />
                          )}
                          {lob.isActive ? "Deactivate" : "Reactivate"}
                        </button>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="px-4 py-10 text-center">
              <BriefcaseBusiness className="mx-auto h-8 w-8 text-sibs-tertiary-8" />
              <p className="mt-2 text-xs font-extrabold text-sibs-navy">
                No Lines of Business yet
              </p>
              <p className="mt-1 text-[10px] font-semibold text-sibs-muted">
                Add the first LOB for this Account using the form above.
              </p>
            </div>
          )}
        </section>
      </div>
    </ModalShell>

    <ModalShell
      open={addResultModal.open}
      onClose={closeAddResultModal}
      title={addResultModal.title}
      subtitle={
        addResultModal.type === "success"
          ? "The Line of Business is ready for employee assignment."
          : "The Line of Business was not created."
      }
      icon={addResultModal.type === "success" ? CheckCircle2 : XCircle}
      maxWidth="max-w-md"
      closeOnBackdrop={false}
      closeOnEscape
      footer={
        <button
          type="button"
          className="sibs-btn-primary"
          onClick={closeAddResultModal}
        >
          {addResultModal.type === "success" ? "Done" : "Try Again"}
        </button>
      }
    >
      <div
        className={`rounded-xl border px-4 py-4 text-xs font-semibold leading-5 ${
          addResultModal.type === "success"
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : "border-rose-200 bg-rose-50 text-rose-700"
        }`}
      >
        <div className="flex items-start gap-3">
          {addResultModal.type === "success" ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          ) : (
            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
          )}
          <p className="min-w-0 break-words">{addResultModal.message}</p>
        </div>
      </div>
    </ModalShell>
    </>
  );
}
