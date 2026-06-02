import { Gift } from "lucide-react";

export default function OfferHeader() {
  return (
    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div className="min-w-0">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
          <Gift size={14} />
          Offers
        </div>

        <h1 className="mt-3 text-2xl font-extrabold text-sibs-primary-1 sm:text-3xl">
          Offers
        </h1>

        <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
          Displays candidates currently in the Offered stage from Candidate
          Pipeline. This page is for approval review only.
        </p>
      </div>
    </div>
  );
}