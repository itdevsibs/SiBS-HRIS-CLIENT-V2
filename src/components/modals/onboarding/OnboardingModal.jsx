import React from "react";
import { X, Plus, RotateCcw } from "lucide-react";

const locationOptions = ["Davao", "Tagum", "Hybrid", "Remote"];

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

function inputClass(extra = "") {
  return `h-11 w-full rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-semibold outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${extra}`;
}

function textareaClass(extra = "") {
  return `w-full resize-none rounded-xl border border-[#E6ECF2] bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${extra}`;
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-3 last:border-b-0">
      <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
        {label}
      </p>

      <div className="max-w-[60%] break-words text-right text-sm font-bold text-[#344054]">
        {value || "—"}
      </div>
    </div>
  );
}

export function CreateOnboardingModal({
  open,
  form,
  setForm,
  onClose,
  onSubmit,
  onReset,
  onboardingList,
  acceptedOfferList,
}) {
  if (!open) return null;

  const usedOfferIds = onboardingList.map((record) => record.offerId);
  const usedCandidateEmails = onboardingList.map(
    (record) => record.candidateEmail
  );

  const availableAcceptedOffers = acceptedOfferList.filter(
    (offer) =>
      !usedOfferIds.includes(offer.offerId) &&
      !usedCandidateEmails.includes(offer.candidateEmail)
  );

  function handleOfferChange(offerId) {
    const selectedOffer = acceptedOfferList.find(
      (offer) => offer.offerId === offerId
    );

    if (!selectedOffer) {
      setForm(emptyOnboardingForm);
      return;
    }

    setForm({
      ...form,
      offerId: selectedOffer.offerId,
      candidateApplicationId: selectedOffer.candidateApplicationId || "",
      candidateId: selectedOffer.candidateId || "",
      candidateName: selectedOffer.candidateName || "",
      candidateEmail: selectedOffer.candidateEmail || "",
      roleTitle: selectedOffer.roleTitle || "",
      account: selectedOffer.account || "",
      roleAccount: selectedOffer.roleAccount || "",
      acceptedOfferDate: selectedOffer.acceptedOfferDate || "",
      owner: selectedOffer.owner || "",
    });
  }

  return (
    <div
      className="fixed inset-0 z-[10000] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-sibs-primary-1 sm:text-xl">
              Add Onboarding Record
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Create onboarding from an accepted offer.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">
            <div className="space-y-5">
              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-bold text-[#101828]">
                  Accepted Offer
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Select Accepted Offer{" "}
                      <span className="text-red-500">*</span>
                    </label>

                    <select
                      required
                      value={form.offerId}
                      onChange={(e) => handleOfferChange(e.target.value)}
                      className={inputClass()}
                    >
                      <option value="">Select accepted offer</option>

                      {availableAcceptedOffers.map((offer) => (
                        <option key={offer.offerId} value={offer.offerId}>
                          {offer.candidateName} — {offer.roleTitle} /{" "}
                          {offer.account}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Candidate Name
                    </label>

                    <input
                      readOnly
                      value={form.candidateName}
                      className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 text-sm font-bold text-gray-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Candidate Email
                    </label>

                    <input
                      readOnly
                      value={form.candidateEmail}
                      className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 text-sm font-bold text-gray-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Role
                    </label>

                    <input
                      readOnly
                      value={form.roleTitle}
                      className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 text-sm font-bold text-gray-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Account
                    </label>

                    <input
                      readOnly
                      value={form.account}
                      className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 text-sm font-bold text-gray-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Accepted Offer Date
                    </label>

                    <input
                      readOnly
                      value={form.acceptedOfferDate}
                      className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 text-sm font-bold text-gray-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      TA Owner
                    </label>

                    <input
                      readOnly
                      value={form.owner}
                      className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 text-sm font-bold text-gray-600 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-bold text-[#101828]">
                  Start Details
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Expected Start Date{" "}
                      <span className="text-red-500">*</span>
                    </label>

                    <input
                      required
                      type="date"
                      value={form.expectedStartDate}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          expectedStartDate: e.target.value,
                        })
                      }
                      className={inputClass()}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Location <span className="text-red-500">*</span>
                    </label>

                    <select
                      required
                      value={form.location}
                      onChange={(e) =>
                        setForm({ ...form, location: e.target.value })
                      }
                      className={inputClass()}
                    >
                      {locationOptions.map((location) => (
                        <option key={location} value={location}>
                          {location}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Remarks
                    </label>

                    <textarea
                      value={form.remarks}
                      onChange={(e) =>
                        setForm({ ...form, remarks: e.target.value })
                      }
                      rows={4}
                      placeholder="Example: Candidate is waiting for start date confirmation."
                      className={textareaClass()}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                <h3 className="text-sm font-bold text-sibs-primary-1">
                  System Relationship
                </h3>

                <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
                  Onboarding should normally be created when an offer is
                  accepted. This page reads accepted offers from the Offers
                  module.
                </p>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-5">
                <h3 className="text-sm font-bold text-[#101828]">
                  Default Onboarding Status
                </h3>

                <div className="mt-4">
                  <DetailRow label="Show Status" value="Pending" />
                  <DetailRow label="Final Outcome" value="Pending Start" />
                  <DetailRow label="Pre-start Withdrawal" value="No" />
                  <DetailRow
                    label="Actual Start Date"
                    value="Not yet started"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-amber-100 bg-amber-50 p-5">
                <h3 className="text-sm font-bold text-amber-700">
                  Backend Later
                </h3>

                <p className="mt-2 text-sm leading-6 text-amber-700/90">
                  Later, the accepted offer endpoint should automatically insert
                  a Pending Start onboarding record.
                </p>
              </div>
            </div>
          </div>
        </form>

        <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex flex-col justify-end gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:border-sibs-primary-1 hover:bg-sibs-primary-1/5"
            >
              <RotateCcw size={17} />
              Reset
            </button>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              onClick={onSubmit}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:opacity-90"
            >
              <Plus size={17} />
              Save Onboarding
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}