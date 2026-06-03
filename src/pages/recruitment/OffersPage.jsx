import React, { useLayoutEffect, useRef } from "react";
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
  const mainRef = useRef(null);

  const { selectedOffer, setSelectedOffer, ConfirmationDialog } = useOffers();

  function scrollToTop(behavior = "auto") {
    requestAnimationFrame(() => {
      if (mainRef.current) {
        mainRef.current.scrollTo({
          top: 0,
          left: 0,
          behavior,
        });
      }

      if (typeof window !== "undefined") {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior,
        });
      }

      if (typeof document !== "undefined") {
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }
    });
  }

  useLayoutEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    scrollToTop("auto");

    const timer = window.setTimeout(() => {
      scrollToTop("auto");
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  function handleCloseDetailsModal() {
    setSelectedOffer(null);
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta">
      <Header />

      <main
        ref={mainRef}
        className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-sibs-tertiary-10 p-4 sm:p-6"
      >
        <div className="mx-auto max-w-[1600px] space-y-5">
          <div className="sibs-page-header-in">
            <OfferHeader />
          </div>

          <section
            className="sibs-profile-tab-panel"
            style={{ animationDelay: "60ms" }}
          >
            <OfferSummaryCards />
          </section>

          <section
            className="sibs-profile-tab-panel overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white shadow-sm transition-all duration-200 hover:border-sibs-primary-1/20 hover:shadow-md"
            style={{ animationDelay: "120ms" }}
          >
            <div className="border-b border-[#E6ECF2]">
              <OfferFilters />
            </div>

            <div className="p-4 sm:p-6">
              <div
                className="sibs-page-card-in hidden lg:block"
                style={{ animationDelay: "180ms" }}
              >
                <OfferRecordsTable />
              </div>

              <div
                className="sibs-page-card-in lg:hidden"
                style={{ animationDelay: "180ms" }}
              >
                <OfferMobileCards />
              </div>
            </div>
          </section>

          <section
            className="sibs-profile-tab-panel"
            style={{ animationDelay: "240ms" }}
          >
            <OfferProcessRule />
          </section>
        </div>
      </main>

      <OfferDetailsModal
        open={!!selectedOffer}
        offer={selectedOffer}
        onClose={handleCloseDetailsModal}
      />

      <ConfirmationDialog />
    </div>
  );
}