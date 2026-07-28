import { ArrowUpRight } from "lucide-react";
import { formatCurrency } from "../../../lib/utils/offers/offerFormatters";
import { getStatusClass } from "../../../lib/utils/offers/offerHelpers";
import { useOffers } from "../../../services/context/OffersContext";

export default function OfferMobileCards({
  offersOverride,
  routeFilterActive = false,
  emptyMessage = "No offered candidates found from Candidate Pipeline.",
}) {
  const {
    filteredOffers = [],
    setSelectedOffer,
    getOfferApprovalStatus,
  } = useOffers();

  const offers = Array.isArray(offersOverride)
    ? offersOverride
    : Array.isArray(filteredOffers)
      ? filteredOffers
      : [];

  return (
    <div className="space-y-3 font-jakarta lg:hidden">
      {offers.length > 0 ? (
        offers.map((offer) => {
          const approvalStatus = getOfferApprovalStatus
            ? getOfferApprovalStatus(offer)
            : offer.offerApprovalStatus || offer.status || "For Review";

          return (
            <button
              key={`${offer.offerId}-${offer.candidateApplicationId}`}
              type="button"
              onClick={() => setSelectedOffer(offer)}
              className="group w-full rounded-xl border border-[#E6ECF2] bg-white p-4 text-left shadow-sm outline-none transition hover:border-[#FF5C28]/40 hover:bg-[#FFF9F6] hover:shadow-md focus-visible:ring-2 focus-visible:ring-[#FF5C28]/20 active:scale-[0.995]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="sibs-kicker truncate text-[#FF5C28]">
                    {offer.offerId || "Offer"}
                  </p>
                  <h3 className="mt-1 truncate text-[13px] font-extrabold text-[#042C51]">
                    {offer.candidateName || "—"}
                  </h3>
                  <p className="mt-0.5 truncate text-[11px] font-semibold text-[#667085]">
                    {offer.roleTitle || "—"} / {offer.account || "—"}
                  </p>
                </div>

                <span
                  className={`inline-flex max-w-[145px] shrink-0 items-center justify-center rounded-lg border px-2 py-1 text-center text-[10px] font-extrabold leading-4 ${getStatusClass(
                    approvalStatus,
                  )}`}
                >
                  <span className="line-clamp-2 break-words">
                    {approvalStatus}
                  </span>
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="sibs-info-tile min-w-0">
                  <p className="sibs-kicker text-[#667085]">Basic Pay</p>
                  <p className="mt-1 truncate text-xs font-extrabold text-[#344054]">
                    {formatCurrency(offer.basicPay)}
                  </p>
                </div>

                <div className="sibs-info-tile min-w-0">
                  <p className="sibs-kicker text-[#667085]">De Minimis</p>
                  <p className="mt-1 truncate text-xs font-extrabold text-[#344054]">
                    {formatCurrency(
                      offer.deminimisDailyRate ?? offer.deMinimis ?? offer.deminimis,
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#F1F5F9] pt-3">
                <p className="min-w-0 truncate text-[10px] font-semibold text-[#667085]">
                  Owner: <span className="font-extrabold text-[#042C51]">{offer.owner || "—"}</span>
                </p>

                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E9F0FC] text-[#042C51] transition group-hover:bg-[#FF5C28] group-hover:text-white">
                  <ArrowUpRight size={15} />
                </span>
              </div>
            </button>
          );
        })
      ) : (
        <div className="sibs-empty-panel">
          {emptyMessage}
          {routeFilterActive ? (
            <span className="mt-1 block font-semibold">
              Clear the selected candidate to return to all offers.
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}
