function text(value) {
  return String(value ?? "").trim();
}

function money(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function getCurrentOfferCompensation(candidate = {}, latestVersion = null) {
  if (latestVersion) {
    const basicDailyRate = money(latestVersion.basicDailyRate);
    const dailyDeMinimis = money(latestVersion.dailyDeMinimis);
    return { basicDailyRate, dailyDeMinimis, total: basicDailyRate + dailyDeMinimis };
  }
  const offer = candidate.offerDetails || candidate.offer_details || {};
  const basicDailyRate = money(offer.basicDailyRate ?? offer.basicPay ?? candidate.basicDailyRate);
  const dailyDeMinimis = money(offer.dailyDeMinimis ?? offer.deminimisDailyRate ?? candidate.dailyDeMinimis);
  return { basicDailyRate, dailyDeMinimis, total: basicDailyRate + dailyDeMinimis };
}

export function getCandidateOfferResponseState(candidate = {}, latestVersion = null) {
  const decision = text(latestVersion?.candidateResponse || candidate.offerDecision || candidate.offer_decision).toLowerCase();
  const displayStatus = latestVersion?.displayStatus;
  if (displayStatus === "revised_offer_pending_approval") return { isNegotiating: false, statusKey: displayStatus, displayStatus: "Revised Offer Pending Approval" };
  if (displayStatus === "approved_pending_send") return { isNegotiating: false, statusKey: displayStatus, displayStatus: "Approved — Waiting to Send" };
  if (displayStatus === "revised_offer_rejected") return { isNegotiating: true, statusKey: displayStatus, displayStatus: "Revised Offer Rejected" };
  if (displayStatus === "revised_offer_sent") return { isNegotiating: false, statusKey: displayStatus, displayStatus: "Revised Offer Sent" };
  if (decision === "negotiate") return { isNegotiating: true, statusKey: "negotiation_requested", displayStatus: "Negotiation Requested" };
  if (decision === "accepted") return { isNegotiating: false, statusKey: "accepted", displayStatus: "Offer Accepted" };
  if (decision === "rejected") return { isNegotiating: false, statusKey: "rejected", displayStatus: "Offer Rejected" };
  return { isNegotiating: false, statusKey: "pending", displayStatus: "Pending Candidate Response" };
}

export function validateRevisedOfferForm(form = {}, current = {}) {
  if (text(form.basicDailyRate) === "") return { valid: false, message: "Enter the new Basic Daily Rate." };
  if (text(form.dailyDeMinimis) === "") return { valid: false, message: "Enter the new Daily De Minimis." };
  const basicDailyRate = Number(form.basicDailyRate);
  const dailyDeMinimis = Number(form.dailyDeMinimis);
  if (!Number.isFinite(basicDailyRate) || !Number.isFinite(dailyDeMinimis)) return { valid: false, message: "Enter valid compensation values." };
  if (basicDailyRate < 0 || dailyDeMinimis < 0) return { valid: false, message: "Compensation values cannot be negative." };
  if (basicDailyRate === Number(current.basicDailyRate) && dailyDeMinimis === Number(current.dailyDeMinimis)) return { valid: false, message: "The revised compensation must be different from the current offer." };
  return { valid: true, values: { basicDailyRate, dailyDeMinimis, remarks: text(form.remarks) } };
}
