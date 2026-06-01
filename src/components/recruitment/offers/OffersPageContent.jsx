import Header from "../../layout/Header";
import { useOffers } from "../../../services/context/OffersContext";
import DeclineResponseModal from "./modals/DeclineResponseModal";
import OfferDetailsModal from "./modals/OfferDetailsModal";
import OfferFilters from "./OfferFilters";
import OfferHeader from "./OfferHeader";
import OfferMobileCards from "./OfferMobileCards";
import OfferProcessRule from "./OfferProcessRule";
import OfferRecordsTable from "./OfferRecordsTable";
import OfferSummaryCards from "./OfferSummaryCards";

export default function OffersPageContent() {
  const {
    selectedOffer,
    setSelectedOffer,
    declineOffer,
    declineForm,
    setDeclineForm,
    closeDeclineModal,
    handleCandidateDecline,
    ConfirmationDialog,
  } = useOffers();

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

      <DeclineResponseModal
        open={!!declineOffer}
        offer={declineOffer}
        form={declineForm}
        setForm={setDeclineForm}
        onClose={closeDeclineModal}
        onSubmit={handleCandidateDecline}
      />

      <ConfirmationDialog />
    </div>
  );
}
