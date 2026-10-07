import React from "react";
import { Target } from "lucide-react";

export default function OfferProcessRule() {
  return (
    <section
      className="sibs-profile-tab-panel sibs-page-card-in flex items-start gap-3 rounded-[10px] border border-blue-100 bg-sky-50/50 px-3.5 py-3 font-jakarta"
      style={{ animationDelay: "240ms", animationFillMode: "both" }}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-sibs-tertiary-10 text-sibs-primary-1">
        <Target size={15} />
      </span>

      <div className="min-w-0">
        <h3 className="text-[13px] font-extrabold text-sibs-navy">
          Offer Process Rule
        </h3>
        <p className="mt-0.5 text-xs font-medium leading-5 text-sibs-muted">
          This page displays candidates currently in the Offered stage from
          Candidate Pipeline. Approval updates are synchronized back to the
          pipeline. Contract email delivery and candidate-response actions
          remain in Candidate Pipeline.
        </p>
      </div>
    </section>
  );
}
