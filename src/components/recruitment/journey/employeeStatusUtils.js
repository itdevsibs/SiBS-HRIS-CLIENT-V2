function getEmphasizedEmployeeStatus(journey) {
  const daysElapsed = journey.daysElapsed || 1;
  const handoff = journey.day30Handoff || journey.day30?.handoff;
  const inFstHandoffWindow = daysElapsed >= 14 && (!handoff || handoff.status !== "Accepted");
  if (inFstHandoffWindow) {
    if (!handoff || handoff.status === "Pending") {
      return {
        label: "\u26A0\uFE0F Post-FST Handoff to TL Pending",
        shortLabel: "Post-FST Handoff Due",
        sublabel: "FST Complete (Days 1\u201314) \u2022 Trainer Endorsement Due before PST (Days 15\u201328)",
        badgeClass: "bg-[#FF5C28] text-white border border-[#FF5C28] shadow-xs animate-pulse font-black",
        pillBg: "bg-[#FF5C28]",
        pillBorder: "border-[#FF5C28]",
        pillText: "text-white",
        isHandoffDue: true,
        handoffStatus: "Pending",
        isUrgent: true,
        category: "handoff"
      };
    }
    if (handoff.status === "Submitted") {
      return {
        label: "\u23F3 Awaiting TL Handoff Acceptance",
        shortLabel: "Awaiting TL Sign-off",
        sublabel: `Endorsed by ${handoff.trainerName || "Trainer"} \u2022 Awaiting Team Leader Custody Sign-off for PST`,
        badgeClass: "bg-[#E67E22] text-white border border-[#E67E22] shadow-xs font-black",
        pillBg: "bg-[#E67E22]",
        pillBorder: "border-[#E67E22]",
        pillText: "text-white",
        isHandoffDue: true,
        handoffStatus: "Submitted",
        isUrgent: false,
        category: "handoff"
      };
    }
    if (handoff.status === "Accepted") {
      return {
        label: "\u2713 FST Handoff Completed",
        shortLabel: "FST Handoff Complete",
        sublabel: `Custody Transferred to TL ${handoff.targetTlName || journey.tl || "Team Leader"} for PST`,
        badgeClass: "bg-emerald-600 text-white border border-emerald-700 shadow-xs font-black",
        pillBg: "bg-emerald-600",
        pillBorder: "border-emerald-700",
        pillText: "text-white",
        isHandoffDue: false,
        handoffStatus: "Accepted",
        isUrgent: false,
        category: "handoff"
      };
    }
  }
  if (journey.finalOutcome === "Completed" || daysElapsed >= 90 && journey.day90?.status === "Completed") {
    return {
      label: "\u2713 Regularized Employee",
      shortLabel: "Regularized",
      sublabel: "Completed 90-day milestone and signed off",
      badgeClass: "bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold",
      pillBg: "bg-emerald-50",
      pillBorder: "border-emerald-300",
      pillText: "text-emerald-800",
      isHandoffDue: false,
      isUrgent: false,
      category: "regularized"
    };
  }
  if (journey.stage === "At Risk" || journey.day30?.status === "At Risk" || journey.day60?.status === "At Risk") {
    return {
      label: "\u26A0\uFE0F Performance At Risk",
      shortLabel: "At Risk",
      sublabel: "Supervisory corrective action active",
      badgeClass: "bg-rose-50 text-rose-800 border border-rose-300 font-bold",
      pillBg: "bg-rose-50",
      pillBorder: "border-rose-300",
      pillText: "text-rose-800",
      isHandoffDue: false,
      isUrgent: true,
      category: "risk"
    };
  }
  if (daysElapsed >= 60) {
    return {
      label: "Days 61\u201389: Performance Consistency",
      shortLabel: "Consistency Phase",
      sublabel: "Production evaluation with Team Leader",
      badgeClass: "bg-purple-50 text-purple-900 border border-purple-200 font-bold",
      pillBg: "bg-purple-50",
      pillBorder: "border-purple-200",
      pillText: "text-purple-900",
      isHandoffDue: false,
      isUrgent: false,
      category: "consistency"
    };
  }
  if (daysElapsed >= 30) {
    return {
      label: "Days 31\u201359: Ramp Operations",
      shortLabel: "Ramp Operations",
      sublabel: "Under Team Leader operational supervision",
      badgeClass: "bg-blue-50 text-[#042C51] border border-blue-200 font-bold",
      pillBg: "bg-blue-50",
      pillBorder: "border-blue-200",
      pillText: "text-[#042C51]",
      isHandoffDue: false,
      isUrgent: false,
      category: "ramp"
    };
  }
  if (daysElapsed >= 15) {
    return {
      label: "Days 15\u201328: Product Skills Training (PST)",
      shortLabel: "PST Training",
      sublabel: "Classroom curriculum & simulations",
      badgeClass: "bg-indigo-50 text-indigo-900 border border-indigo-200 font-bold",
      pillBg: "bg-indigo-50",
      pillBorder: "border-indigo-200",
      pillText: "text-indigo-900",
      isHandoffDue: false,
      isUrgent: false,
      category: "training"
    };
  }
  return {
    label: "Days 1\u201314: Fundamental Skills Training (FST)",
    shortLabel: "FST Training",
    sublabel: "Foundation tools & core competencies",
    badgeClass: "bg-sky-50 text-sky-900 border border-sky-200 font-bold",
    pillBg: "bg-sky-50",
    pillBorder: "border-sky-200",
    pillText: "text-sky-900",
    isHandoffDue: false,
    isUrgent: false,
    category: "training"
  };
}
export {
  getEmphasizedEmployeeStatus
};
