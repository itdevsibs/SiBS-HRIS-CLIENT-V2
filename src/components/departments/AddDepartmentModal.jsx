import { useState } from "react";
import { Building2, Loader2 } from "lucide-react";

import { ModalShell } from "@/components/ui";

export default function AddDepartmentModal({
  open,
  onClose,
  onSubmit,
  submitting = false,
}) {
  const [departmentName, setDepartmentName] = useState("");
  const [error, setError] = useState("");

  function handleClose() {
    if (submitting) return;
    setDepartmentName("");
    setError("");
    onClose?.();
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const cleanDepartmentName = departmentName.trim().replace(/\s+/g, " ");

    if (!cleanDepartmentName) {
      setError("Department name is required.");
      return;
    }

    setError("");

    try {
      await onSubmit?.({ departmentName: cleanDepartmentName });
      setDepartmentName("");
    } catch (submitError) {
      setError(submitError?.message || "Failed to submit department request.");
    }
  }

  return (
    <ModalShell
      open={open}
      onClose={submitting ? undefined : handleClose}
      title="Add Department"
      subtitle="Create a department request. Lines of Business are managed separately under each Account after the department is approved."
      icon={Building2}
      maxWidth="max-w-xl"
      closeOnBackdrop={!submitting}
      closeOnEscape={!submitting}
      footer={
        <>
          <button
            type="button"
            className="sibs-btn-secondary"
            onClick={handleClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-department-form"
            className="sibs-btn-primary"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit for Approval"
            )}
          </button>
        </>
      }
    >
      <form id="add-department-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-2xl border border-sibs-border bg-sibs-surface/60 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-sibs-orange shadow-sm ring-1 ring-sibs-border">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-sibs-navy">
                Department Information
              </p>
              <p className="mt-0.5 text-[11px] font-semibold leading-relaxed text-sibs-muted">
                Enter the official department name. Account-specific Lines of Business are added manually from the Account details.
              </p>
            </div>
          </div>
        </div>

        <div>
          <label
            htmlFor="department-name"
            className="mb-1.5 block text-xs font-extrabold text-sibs-navy"
          >
            Department Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Building2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-sibs-faint" />
            <input
              id="department-name"
              type="text"
              value={departmentName}
              onChange={(event) => {
                setDepartmentName(event.target.value);
                if (error) setError("");
              }}
              placeholder="Enter department name"
              maxLength={255}
              autoFocus
              disabled={submitting}
              className="h-11 w-full rounded-xl border border-sibs-border bg-white pl-10 pr-3.5 text-sm font-semibold text-sibs-navy outline-none transition placeholder:text-sibs-faint focus:border-sibs-orange focus:ring-2 focus:ring-sibs-orange/10"
            />
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
            <p className="text-xs font-bold text-rose-700">{error}</p>
          </div>
        ) : null}

        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-xs font-bold leading-relaxed text-amber-800">
            The department will be saved as Pending and will not be available in
            HRIS department dropdowns until an authorized Department approver
            approves it.
          </p>
        </div>
      </form>
    </ModalShell>
  );
}
