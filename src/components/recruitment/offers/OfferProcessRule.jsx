import { Target } from "lucide-react";

export default function OfferProcessRule() {
  return (
    <section
      className="sibs-profile-tab-panel sibs-page-card-in flex items-start gap-3 rounded-xl border border-blue-100 bg-[#F7FAFE] px-4 py-3.5 font-jakarta"
      style={{ animationDelay: "240ms" }}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sibs-tertiary-10 text-sibs-primary-1">
        <Target size={15} />
      </span>

      <div className="min-w-0">
        <h3 className="text-[13px] font-extrabold text-[#042C51]">
          Offer Process Rule
        </h3>
        <p className="mt-0.5 text-xs font-medium leading-5 text-[#667085]">
          This page displays candidates currently in the Offered stage from
          Candidate Pipeline. Approval updates are synchronized back to the
          pipeline. Contract email delivery and candidate-response actions
          remain in Candidate Pipeline.
        </p>
      </div>
    </section>
  );
}
