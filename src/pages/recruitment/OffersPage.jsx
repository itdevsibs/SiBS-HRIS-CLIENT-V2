import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";

import Header from "../../components/layout/Header";
import { useOffers } from "../../services/context/OffersContext";

import OfferHeader from "../../components/recruitment/offers/OfferHeader";
import OfferSummaryCards from "../../components/recruitment/offers/OfferSummaryCards";
import OfferFilters from "../../components/recruitment/offers/OfferFilters";
import OfferRecordsTable from "../../components/recruitment/offers/OfferRecordsTable";
import OfferMobileCards from "../../components/recruitment/offers/OfferMobileCards";
import OfferProcessRule from "../../components/recruitment/offers/OfferProcessRule";
import OfferDetailsModal from "../../components/modals/offers/OfferDetailsModal";
import StatusModal from "../../components/modals/StatusModal";

function cleanText(value) {
  return String(value ?? "").trim();
}

function normalizeValue(value) {
  return cleanText(value).toLowerCase();
}

function firstText(...values) {
  return values.map(cleanText).find(Boolean) || "";
}

function getRouteCandidate(location) {
  const state = location?.state || {};
  const candidate =
    state.candidate || state.selectedCandidate || state.offerCandidate || {};
  const params = new URLSearchParams(location?.search || "");

  const routeCandidate = {
    candidateApplicationId: firstText(
      candidate.candidateApplicationId,
      candidate.candidate_application_id,
      state.candidateApplicationId,
      state.candidate_application_id,
      params.get("candidateApplicationId"),
      params.get("candidate_application_id"),
    ),
    candidateId: firstText(
      candidate.candidateId,
      candidate.candidate_id,
      state.candidateId,
      state.candidate_id,
      params.get("candidateId"),
      params.get("candidate_id"),
    ),
    candidateEmail: firstText(
      candidate.candidateEmail,
      candidate.email,
      state.candidateEmail,
      state.email,
      params.get("candidateEmail"),
      params.get("email"),
    ),
    candidateName: firstText(
      candidate.candidateName,
      candidate.name,
      state.candidateName,
      state.name,
      params.get("candidateName"),
      params.get("name"),
    ),
    offerId: firstText(
      candidate.offerId,
      candidate.offer_id,
      state.offerId,
      state.offer_id,
      params.get("offerId"),
      params.get("offer_id"),
    ),
  };

  return Object.values(routeCandidate).some(Boolean) ? routeCandidate : null;
}

function offerMatchesRouteCandidate(offer, routeCandidate) {
  if (!routeCandidate) return true;

  const checks = [
    [
      routeCandidate.candidateApplicationId,
      firstText(
        offer?.candidateApplicationId,
        offer?.candidate_application_id,
        offer?.applicationId,
      ),
    ],
    [
      routeCandidate.candidateId,
      firstText(offer?.candidateId, offer?.candidate_id),
    ],
    [
      routeCandidate.candidateEmail,
      firstText(offer?.candidateEmail, offer?.email),
    ],
    [
      routeCandidate.offerId,
      firstText(offer?.offerId, offer?.offer_id),
    ],
  ].filter(([routeValue]) => Boolean(routeValue));

  if (checks.some(([routeValue, offerValue]) => {
    return normalizeValue(routeValue) === normalizeValue(offerValue);
  })) {
    return true;
  }

  if (routeCandidate.candidateName) {
    return (
      normalizeValue(routeCandidate.candidateName) ===
      normalizeValue(firstText(offer?.candidateName, offer?.name))
    );
  }

  return false;
}

function getRouteCandidateLabel(routeCandidate) {
  if (!routeCandidate) return "";

  return firstText(
    routeCandidate.candidateName,
    routeCandidate.candidateEmail,
    routeCandidate.candidateId,
    routeCandidate.candidateApplicationId,
    routeCandidate.offerId,
  );
}

const ROUTE_FILTER_KEYS = [
  "candidateApplicationId",
  "candidate_application_id",
  "candidateId",
  "candidate_id",
  "candidateEmail",
  "email",
  "candidateName",
  "name",
  "offerId",
  "offer_id",
];


function SkeletonBlock({ className = "" }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-xl bg-slate-200/80 ${className}`}
    />
  );
}

function OffersApprovalPageSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-[1600px] space-y-5 sm:space-y-6"
      aria-label="Processing offer approval"
      aria-live="polite"
      aria-busy="true"
    >
      <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            <SkeletonBlock className="h-4 w-32" />
            <SkeletonBlock className="h-8 w-full max-w-md" />
            <SkeletonBlock className="h-4 w-full max-w-2xl" />
          </div>

          <div className="flex shrink-0 gap-3">
            <SkeletonBlock className="h-11 w-36" />
            <SkeletonBlock className="h-11 w-40" />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`offer-summary-skeleton-${index}`}
            className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-3">
                <SkeletonBlock className="h-3 w-24" />
                <SkeletonBlock className="h-8 w-20" />
                <SkeletonBlock className="h-3 w-32" />
              </div>

              <SkeletonBlock className="h-12 w-12 rounded-2xl" />
            </div>
          </div>
        ))}
      </section>

      <section className="sibs-card overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white shadow-sm">
        <div className="border-b border-[#E6ECF2] p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <SkeletonBlock className="h-11 md:col-span-2" />
            <SkeletonBlock className="h-11" />
            <SkeletonBlock className="h-11" />
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="overflow-hidden rounded-xl border border-[#E6ECF2]">
            <div className="grid grid-cols-6 gap-4 border-b border-[#E6ECF2] bg-[#F8FAFC] px-4 py-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <SkeletonBlock
                  key={`offer-header-skeleton-${index}`}
                  className="h-3 w-full"
                />
              ))}
            </div>

            <div className="divide-y divide-[#E6ECF2]">
              {Array.from({ length: 6 }).map((_, rowIndex) => (
                <div
                  key={`offer-row-skeleton-${rowIndex}`}
                  className="grid grid-cols-6 gap-4 px-4 py-5"
                >
                  {Array.from({ length: 6 }).map((__, cellIndex) => (
                    <SkeletonBlock
                      key={`offer-cell-skeleton-${rowIndex}-${cellIndex}`}
                      className={`h-4 ${
                        cellIndex === 0 ? "w-4/5" : "w-full"
                      }`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
        <div className="space-y-3">
          <SkeletonBlock className="h-5 w-48" />
          <SkeletonBlock className="h-4 w-full" />
          <SkeletonBlock className="h-4 w-5/6" />
        </div>
      </section>

      <div className="fixed inset-0 z-[90] cursor-wait bg-white/20" />
    </div>
  );
}

export default function OffersPage() {
  const mainRef = useRef(null);
  const hasShownApprovalWarningRef = useRef(false);
  const location = useLocation();
  const navigate = useNavigate();

  const {
    selectedOffer,
    setSelectedOffer,
    ConfirmationDialog,
    approvalUsers = [],
    approvalUsersLoading = false,
    filteredOffers = [],
    isSubmittingApproval = false,
  } = useOffers();

  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "error",
    title: "",
    message: "",
  });

  const routeCandidate = useMemo(
    () => getRouteCandidate(location),
    [location],
  );

  const routeCandidateLabel = useMemo(
    () => getRouteCandidateLabel(routeCandidate),
    [routeCandidate],
  );

  const routeCandidateKey = useMemo(
    () => JSON.stringify(routeCandidate || {}),
    [routeCandidate],
  );

  const visibleOffers = useMemo(() => {
    const offers = Array.isArray(filteredOffers) ? filteredOffers : [];

    if (!routeCandidate) return offers;

    return offers.filter((offer) =>
      offerMatchesRouteCandidate(offer, routeCandidate),
    );
  }, [filteredOffers, routeCandidate]);

  function closeStatusModal() {
    setStatusModal((previous) => ({
      ...previous,
      open: false,
    }));
  }

  function scrollToTop(behavior = "auto") {
    requestAnimationFrame(() => {
      mainRef.current?.scrollTo({
        top: 0,
        left: 0,
        behavior,
      });

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
  }, [routeCandidateKey]);

  useEffect(() => {
    if (approvalUsersLoading) return;
    if (hasShownApprovalWarningRef.current) return;

    if (!Array.isArray(approvalUsers) || approvalUsers.length === 0) {
      hasShownApprovalWarningRef.current = true;

      const timer = window.setTimeout(() => {
        setStatusModal({
          open: true,
          type: "error",
          title: "No Approval Users Found",
          message:
            "No offer approval users are configured yet. Please add approval users in Recruitment Settings > Approval Rules before approving or rejecting offers.",
        });
      }, 0);

      return () => {
        window.clearTimeout(timer);
      };
    }

    return undefined;
  }, [approvalUsers, approvalUsersLoading]);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    if (isSubmittingApproval) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [isSubmittingApproval]);

  function handleCloseDetailsModal() {
    setSelectedOffer(null);
  }

  function handleClearRouteCandidate() {
    const params = new URLSearchParams(location.search || "");
    ROUTE_FILTER_KEYS.forEach((key) => params.delete(key));

    const nextState = { ...(location.state || {}) };
    ROUTE_FILTER_KEYS.forEach((key) => delete nextState[key]);
    delete nextState.candidate;
    delete nextState.selectedCandidate;
    delete nextState.offerCandidate;

    const nextSearch = params.toString();

    navigate(
      {
        pathname: location.pathname,
        search: nextSearch ? `?${nextSearch}` : "",
      },
      {
        replace: true,
        state: Object.keys(nextState).length > 0 ? nextState : null,
      },
    );
  }

  return (
    <div className="sibs-dashboard-shell">
      <div className="shrink-0">
        <Header />
      </div>

      <main ref={mainRef} className="sibs-dashboard-main-wide">
        {isSubmittingApproval ? (
          <OffersApprovalPageSkeleton />
        ) : (
        <div className="mx-auto w-full max-w-[1600px] space-y-5 sm:space-y-6">
          <OfferHeader
            routeFilterActive={Boolean(routeCandidate)}
            routeCandidateLabel={routeCandidateLabel}
            onClearRouteFilter={handleClearRouteCandidate}
          />

          <OfferSummaryCards />

          <section
            className="sibs-profile-tab-panel sibs-page-card-in sibs-card relative overflow-visible font-jakarta"
            style={{ animationDelay: "120ms" }}
          >
            <OfferFilters />

            <div className="space-y-5 p-4 sm:p-5">
              <OfferRecordsTable
                offersOverride={visibleOffers}
                routeFilterActive={Boolean(routeCandidate)}
                emptyMessage={
                  routeCandidate
                    ? "No offer record was found for the selected candidate."
                    : "No offered candidates found from Candidate Pipeline."
                }
              />

              <OfferMobileCards
                offersOverride={visibleOffers}
                routeFilterActive={Boolean(routeCandidate)}
                emptyMessage={
                  routeCandidate
                    ? "No offer record was found for the selected candidate."
                    : "No offered candidates found from Candidate Pipeline."
                }
              />
            </div>
          </section>

          <OfferProcessRule />
        </div>
        )}
      </main>

      <OfferDetailsModal
        open={Boolean(selectedOffer) && !isSubmittingApproval}
        offer={selectedOffer}
        onClose={handleCloseDetailsModal}
      />

      {!isSubmittingApproval && typeof ConfirmationDialog === "function"
        ? <ConfirmationDialog />
        : null}

      <StatusModal
        open={statusModal.open}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        variant="center"
        onClose={closeStatusModal}
        lockScroll
      />
    </div>
  );
}
