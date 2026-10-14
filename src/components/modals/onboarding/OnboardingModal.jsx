import React, { useMemo } from "react";
import {
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Info,
  MapPin,
  Plus,
  RotateCcw,
  UserCheck,
} from "lucide-react";
import { DatePicker, ModalShell, SelectDropdown } from "@/components/ui";

const locationOptions = [
  { label: "Davao", value: "Davao" },
  { label: "Tagum", value: "Tagum" },
  { label: "Hybrid", value: "Hybrid" },
  { label: "Remote", value: "Remote" },
];

const emptyOnboardingForm = {
  offerId: "",
  candidateApplicationId: "",
  candidateId: "",
  candidateName: "",
  candidateEmail: "",
  roleTitle: "",
  account: "",
  roleAccount: "",
  acceptedOfferDate: "",
  expectedStartDate: "",
  owner: "",
  location: "Davao",
  remarks: "",
};

function cleanText(value) {
  return String(value ?? "").trim();
}

function formatDateDisplay(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return cleanText(value) || "—";

  return date.toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getAcceptedOfferOption(offer) {
  const offerId = offer.offerId || offer.offer_id;
  const candidateName = offer.candidateName || offer.candidate_name || "Candidate";
  const roleTitle = offer.roleTitle || offer.role_title || "Role";
  const account = offer.account || "No account";
  const acceptedDate = offer.acceptedOfferDate || offer.accepted_offer_date || "";
  return {
    value: offerId,
    label: `${candidateName} — ${roleTitle} (${account}${acceptedDate ? ` • ${formatDateDisplay(acceptedDate)}` : ""})`,
  };
}

function ReadOnlyField({ label, value }) {
  return (
    <div>
      <label className="sibs-modal-field-label">{label}</label>
      <div className="flex min-h-10 w-full items-center rounded-[10px] border border-sibs-border bg-sibs-surface px-3 sibs-text-xs font-bold text-sibs-muted">
        <span className="truncate">{value || "—"}</span>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, tone = "text-sibs-muted" }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-sibs-border py-2.5 last:border-b-0">
      <span className="text-[9px] font-extrabold uppercase tracking-wide text-sibs-faint">
        {label}
      </span>
      <span className={`max-w-[62%] break-words text-right text-[10px] font-extrabold ${tone}`}>
        {value || "—"}
      </span>
    </div>
  );
}

export function CreateOnboardingModal({
  open,
  form,
  setForm,
  onReset,
  onClose,
  onboardingList = [],
  acceptedOfferList = [],
  onSubmit,
  isSubmitting = false,
}) {
  const availableAcceptedOffers = useMemo(() => {
    const assignedOfferIds = new Set(
      (Array.isArray(onboardingList) ? onboardingList : [])
        .map((record) => cleanText(record.offerId || record.offer_id))
        .filter(Boolean),
    );

    return (Array.isArray(acceptedOfferList) ? acceptedOfferList : []).filter(
      (offer) => {
        const offerId = cleanText(offer.offerId || offer.offer_id);
        return offerId && !assignedOfferIds.has(offerId);
      },
    );
  }, [onboardingList, acceptedOfferList]);

  const offerOptions = useMemo(() => {
    return availableAcceptedOffers.map(getAcceptedOfferOption);
  }, [availableAcceptedOffers]);

  if (!open) return null;

  function handleOfferChange(selectedOfferId) {
    const selectedOffer = availableAcceptedOffers.find(
      (offer) =>
        String(offer.offerId || offer.offer_id) === String(selectedOfferId),
    );

    if (!selectedOffer) {
      setForm((previous) => ({
        ...previous,
        offerId: "",
        candidateApplicationId: "",
        candidateId: "",
        candidateName: "",
        candidateEmail: "",
        roleTitle: "",
        account: "",
        roleAccount: "",
        acceptedOfferDate: "",
        owner: "",
      }));
      return;
    }

    setForm((previous) => ({
      ...previous,
      offerId: selectedOffer.offerId || selectedOffer.offer_id || "",
      candidateApplicationId:
        selectedOffer.candidateApplicationId ||
        selectedOffer.candidate_application_id ||
        "",
      candidateId: selectedOffer.candidateId || selectedOffer.candidate_id || "",
      candidateName:
        selectedOffer.candidateName || selectedOffer.candidate_name || "",
      candidateEmail:
        selectedOffer.candidateEmail || selectedOffer.candidate_email || "",
      roleTitle: selectedOffer.roleTitle || selectedOffer.role_title || "",
      account: selectedOffer.account || "",
      roleAccount:
        selectedOffer.roleAccount || selectedOffer.role_account || "",
      acceptedOfferDate:
        selectedOffer.acceptedOfferDate ||
        selectedOffer.accepted_offer_date ||
        "",
      owner: selectedOffer.owner || "",
    }));
  }

  function handleResetClick() {
    if (onReset) {
      onReset();
      return;
    }
    setForm(emptyOnboardingForm);
  }

  const saveDisabled = isSubmitting || !form.offerId || !form.expectedStartDate;

  return (
    <ModalShell
      open={open}
      onClose={isSubmitting ? undefined : onClose}
      variant="navy"
      maxWidth="max-w-5xl"
      icon={UserCheck}
      badge="Pending Start"
      title="Add Onboarding Record"
      subtitle="Convert an accepted offer into an active onboarding tracking record."
      bodyClassName="bg-sibs-surface p-4 sm:p-5 font-jakarta"
      footer={
        <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={handleResetClick}
            disabled={isSubmitting}
            className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-2 rounded-[10px] border border-sibs-border bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-sibs-muted transition hover:border-sibs-orange/35 hover:bg-sibs-cream-light hover:text-sibs-orange disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw size={14} />
            Reset
          </button>

          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex h-8.5 2xl:h-10 items-center justify-center rounded-[10px] border border-sibs-border bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-sibs-muted transition hover:border-sibs-orange/35 hover:bg-sibs-cream-light hover:text-sibs-orange disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="create-onboarding-form"
              disabled={saveDisabled}
              className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-2 rounded-[10px] bg-sibs-orange px-3.5 2xl:px-5 font-jakarta sibs-text-xs font-extrabold text-white shadow-sm transition hover:bg-sibs-orange/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={14} />
              {isSubmitting ? "Saving..." : "Save Onboarding Record"}
            </button>
          </div>
        </div>
      }
    >
      <form
        id="create-onboarding-form"
        onSubmit={onSubmit}
        className="font-jakarta"
      >
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_330px]">
          <div className="min-w-0 space-y-4">
            <section className="rounded-[14px] border border-sibs-border bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex items-start justify-between gap-3 border-b border-sibs-border/60 pb-3">
                <div className="min-w-0">
                  <p className="sibs-kicker">Step 1</p>
                  <h3 className="sibs-modal-section-title mt-0.5 text-sibs-navy">
                    Select Accepted Offer
                  </h3>
                  <p className="sibs-modal-section-subtitle mt-0.5 text-sibs-muted">
                    Only accepted offers that are not yet assigned to onboarding are listed.
                  </p>
                </div>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-blue-100 bg-blue-50 text-sibs-navy">
                  <BriefcaseBusiness size={16} />
                </span>
              </div>

              <div>
                <label className="sibs-modal-field-label">
                  Accepted Offer <span className="text-red-500">*</span>
                </label>
                <SelectDropdown
                  value={form.offerId}
                  options={offerOptions}
                  onChange={(val) => handleOfferChange(val)}
                  placeholder="Select accepted offer candidate"
                  disabled={isSubmitting}
                  searchable={true}
                  className="w-full"
                />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ReadOnlyField label="Candidate Name" value={form.candidateName} />
                <ReadOnlyField label="Email Address" value={form.candidateEmail} />
                <ReadOnlyField label="Role" value={form.roleTitle} />
                <ReadOnlyField label="Account" value={form.account} />
                <ReadOnlyField
                  label="Accepted Offer Date"
                  value={formatDateDisplay(form.acceptedOfferDate)}
                />
                <ReadOnlyField label="TA Owner" value={form.owner} />
              </div>
            </section>

            <section className="rounded-[14px] border border-sibs-border bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex items-start justify-between gap-3 border-b border-sibs-border/60 pb-3">
                <div>
                  <p className="sibs-kicker">Step 2</p>
                  <h3 className="sibs-modal-section-title mt-0.5 text-sibs-navy">
                    Start Details
                  </h3>
                  <p className="sibs-modal-section-subtitle mt-0.5 text-sibs-muted">
                    Set the expected start date and site before activating the record.
                  </p>
                </div>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-orange-100 bg-orange-50 text-sibs-orange">
                  <CalendarDays size={16} />
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="sibs-modal-field-label">
                    Expected Start Date <span className="text-red-500">*</span>
                  </label>
                  <DatePicker
                    value={form.expectedStartDate}
                    onChange={(date) =>
                      setForm((previous) => ({ ...previous, expectedStartDate: date }))
                    }
                    disabled={isSubmitting}
                    placeholder="Select start date"
                  />
                </div>

                <div>
                  <label className="sibs-modal-field-label">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <SelectDropdown
                    value={form.location || "Davao"}
                    options={locationOptions}
                    onChange={(loc) =>
                      setForm((previous) => ({ ...previous, location: loc }))
                    }
                    disabled={isSubmitting}
                    searchable={false}
                    className="w-full"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="sibs-modal-field-label">Remarks</label>
                  <textarea
                    rows={3}
                    value={form.remarks}
                    onChange={(event) =>
                      setForm((previous) => ({ ...previous, remarks: event.target.value }))
                    }
                    placeholder="Optional pre-start notes or coordination details..."
                    className="sibs-modal-textarea"
                  />
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-4 xl:sticky xl:top-0 xl:self-start">
            <section className="rounded-[14px] border border-sibs-navy bg-sibs-navy p-4 text-white shadow-sm">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-sibs-orange/30 bg-sibs-orange/15 text-sibs-orange">
                  <Info size={16} />
                </span>
                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-wide text-sibs-orange/80">
                    System Relationship
                  </p>
                  <h3 className="sibs-modal-section-title mt-1 text-white">
                    Accepted Offer → Onboarding
                  </h3>
                  <p className="mt-2 text-[10px] font-semibold leading-5 text-slate-200">
                    Accepted offers are synchronized from the Offers module. Creating this record initializes pre-start tracking.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[14px] border border-sibs-border bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-600" />
                <h3 className="sibs-modal-section-title text-sibs-navy">
                  Default Initial Status
                </h3>
              </div>
              <div className="mt-3">
                <SummaryRow label="Show Status" value="Pending" tone="text-amber-700" />
                <SummaryRow label="Final Outcome" value="Pending Start" tone="text-amber-700" />
                <SummaryRow label="Actual Start" value="Not yet started" />
                <SummaryRow label="Placement Count" value="Not counted yet" />
              </div>
            </section>

            <section className="rounded-[14px] border border-amber-100 bg-amber-50 p-4">
              <p className="text-[9px] font-extrabold uppercase tracking-wide text-amber-700">
                Automation Note
              </p>
              <p className="mt-1 text-[10px] font-semibold leading-5 text-amber-800">
                Candidate Pipeline synchronization may create or refresh Pending Start records automatically. Duplicate accepted offers are excluded from this form.
              </p>
            </section>
          </aside>
        </div>
      </form>
    </ModalShell>
  );
}
export default CreateOnboardingModal;
