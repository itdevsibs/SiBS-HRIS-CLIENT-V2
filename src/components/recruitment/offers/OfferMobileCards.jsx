import { formatCurrency } from "../../../lib/utils/offers/offerFormatters";
import { getStatusClass } from "../../../lib/utils/offers/offerHelpers";
import { useOffers } from "../../../services/context/OffersContext";

export default function OfferMobileCards() {
  const { filteredOffers, setSelectedOffer } = useOffers();

  return (
    <div className="space-y-3 lg:hidden">
      {filteredOffers.length > 0 ? (
        filteredOffers.map((offer) => (
          <button
            key={`${offer.offerId}-${offer.candidateApplicationId}`}
            type="button"
            onClick={() => setSelectedOffer(offer)}
            className="w-full rounded-2xl border border-[#E6ECF2] bg-white p-4 text-left shadow-sm transition hover:border-sibs-primary-1/40 hover:bg-[#FAFBFC]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-sibs-primary-1">
                  {offer.offerId}
                </p>

                <h3 className="mt-1 text-sm font-bold text-[#101828]">
                  {offer.candidateName}
                </h3>

                <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                  {offer.roleTitle} / {offer.account}
                </p>
              </div>

              <span
                className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusClass(
                  offer.status,
                )}`}
              >
                {offer.status}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-[#F8FAFC] p-3">
                <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
                  Basic Pay
                </p>
                <p className="mt-1 text-xs font-bold text-[#344054]">
                  {formatCurrency(offer.basicPay)}
                </p>
              </div>

              <div className="rounded-xl bg-[#F8FAFC] p-3">
                <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
                  Deminimis
                </p>
                <p className="mt-1 text-xs font-bold text-[#344054]">
                  {formatCurrency(offer.deminimisDailyRate)}
                </p>
              </div>
            </div>
          </button>
        ))
      ) : (
        <div className="rounded-xl border border-[#E6ECF2] bg-white px-5 py-10 text-center text-sm font-bold text-gray-500">
          No offered candidates found from Candidate Pipeline.
        </div>
      )}
    </div>
  );
}
