import React from "react";
import { Sparkles } from "lucide-react";

import { useApplicantLeadsPage } from "../../../hooks/applicantLeads/useApplicantLeadsPage";

export default function ApplicantLeadsToast() {
  const { toastMessage } = useApplicantLeadsPage();

  if (!toastMessage) return null;

  return (
    <div className="fixed right-8 top-20 z-[1001] flex items-center gap-3 rounded-xl border border-blue-400 bg-[#042C51] px-5 py-3 text-xs font-extrabold text-white shadow-xl">
      <Sparkles size={16} className="text-[#FF5C28]" />
      {toastMessage}
    </div>
  );
}
