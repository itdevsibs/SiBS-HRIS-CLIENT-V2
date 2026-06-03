import Header from "../../components/layout/Header";
import { useOffers } from "../../services/context/OffersContext";
import OfferHeader from "../../components/recruitment/offers/OfferHeader";
import OfferSummaryCards from "../../components/recruitment/offers/OfferSummaryCards";
import OfferFilters from "../../components/recruitment/offers/OfferFilters";
import OfferRecordsTable from "../../components/recruitment/offers/OfferRecordsTable";
import OfferMobileCards from "../../components/recruitment/offers/OfferMobileCards";
import OfferProcessRule from "../../components/recruitment/offers/OfferProcessRule";
import OfferDetailsModal from "../../components/modals/offers/OfferDetailsModal";
import DeclineResponseModal from "../../components/modals/offers/DeclineResponseModel";

export default function OffersPageContent() {
const { selectedOffer, setSelectedOffer, ConfirmationDialog } = useOffers();

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta">
      <Header />

      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-sibs-tertiary-10 p-4 sm:p-6">
        <div className="mx-auto max-w-[1600px] space-y-5">
          <OfferHeader />
          <OfferSummaryCards />

          <section className="overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white shadow-sm">
            <OfferFilters />

            <div className="p-4 sm:p-6">
              <OfferRecordsTable />
              <OfferMobileCards />
            </div>
          </section>

          <OfferProcessRule />
        </div>
      </main>

      <OfferDetailsModal
        open={!!selectedOffer}
        offer={selectedOffer}
        onClose={() => setSelectedOffer(null)}
      />

      <ConfirmationDialog />
    </div>
  );
}
