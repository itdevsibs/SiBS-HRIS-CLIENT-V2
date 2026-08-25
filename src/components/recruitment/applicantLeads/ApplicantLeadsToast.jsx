import React from "react";
import { Sparkles } from "lucide-react";

import StatusModal from "../../modals/StatusModal";
import { useApplicantLeadsPage } from "../../../hooks/applicantLeads/useApplicantLeadsPage";

export default function ApplicantLeadsToast() {
  const {
    toastMessage,
    statusModal,
    closeStatusModal,
  } = useApplicantLeadsPage();

  return (
    <>
      {toastMessage ? (
        <div className="fixed right-8 top-20 z-[1001] flex items-center gap-3 rounded-xl border border-blue-400 bg-[#042C51] px-5 py-3 text-xs font-extrabold text-white shadow-xl">
          <Sparkles size={16} className="text-[#FF5C28]" />
          {toastMessage}
        </div>
      ) : null}

      <StatusModal
        open={Boolean(statusModal?.open)}
        type={statusModal?.type || "success"}
        title={statusModal?.title}
        message={statusModal?.message}
        variant="center"
        onClose={closeStatusModal}
        lockScroll={false}
      />
    </>
  );
}
