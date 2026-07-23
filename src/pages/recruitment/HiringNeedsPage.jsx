import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ClipboardList, Plus, RefreshCw } from "lucide-react";

import Header from "../../components/layout/Header";
import HiringNeedsStats from "../../components/recruitment/HiringNeeds/HiringNeedsStats";
import HiringNeedsFilters from "../../components/recruitment/HiringNeeds/HiringNeedsFilters";
import HiringNeedsTable from "../../components/recruitment/HiringNeeds/HiringNeedsTable";
import ViewHiringNeedsModal from "../../components/modals/hiringNeeds/ViewHiringNeedsModal";
import AddHiringNeedsModal from "../../components/modals/hiringNeeds/AddHiringNeedsModal";
import StatusModal from "../../components/modals/StatusModal";

import { useHiringNeeds } from "../../services/context/HiringNeedsContext";
import { useUser } from "../../services/context/UserContext";
import { getHiringNeedsApprovalUsers } from "../../lib/axios/getHiringNeedsApprovalSettings";
import {
  approveRequestByModule,
  rejectRequestByModule,
} from "../../lib/axios/getApprovalRequest";

function cleanText(value) {
  return String(value ?? "").trim();
}

function normalizeSibsId(value) {
  return cleanText(value).replace(/^SIBS[-_ ]?/i, "");
}

function getLocalStorageValue(keys = []) {
  if (typeof window === "undefined") return "";

  for (const key of keys) {
    const value = window.localStorage.getItem(key);

    if (cleanText(value)) {
      return value;
    }
  }

  return "";
}

function getCurrentUserSibsId(user = {}) {
  return normalizeSibsId(
    user?.sibsId ||
    user?.sibs_id ||
    user?.employeeSibsId ||
    user?.employee_sibs_id ||
    user?.gy_emp_code ||
    user?.gy_user_code ||
    user?.userCode ||
    user?.user_code ||
    user?.employeeCode ||
    user?.employee_code ||
    user?.username ||
    getLocalStorageValue([
      "sibsId",
      "sibs_id",
      "employeeSibsId",
      "employee_sibs_id",
      "gy_emp_code",
      "gy_user_code",
      "userCode",
      "user_code",
      "employeeCode",
      "employee_code",
      "username",
    ]),
  );
}

function getApprovalSettingsRows(responseData) {
  const rows =
    responseData?.data?.users ||
    responseData?.data?.rows ||
    responseData?.data ||
    responseData?.users ||
    responseData?.rows ||
    responseData ||
    [];

  return Array.isArray(rows) ? rows : [];
}

function getApprovalSettingsSibsId(row = {}) {
  return normalizeSibsId(
    row?.sibsId ||
    row?.sibs_id ||
    row?.employeeSibsId ||
    row?.employee_sibs_id ||
    row?.gy_emp_code ||
    row?.gy_user_code ||
    row?.userCode ||
    row?.user_code ||
    row?.username,
  );
}

function getHiringNeedsRequestId(item = {}) {
  const value =
    item?.rawId ||
    item?.raw_id ||
    item?.hiringNeedsId ||
    item?.hiring_needs_id ||
    item?.hiringNeedId ||
    item?.hiring_need_id ||
    item?.id ||
    "";

  return cleanText(value).replace(
    /^HN-|^PRF-|^HIRING-NEEDS-/i,
    "",
  );
}

export default function HiringNeedsPage() {
  const mainRef = useRef(null);
  const { user } = useUser();
  const { fetchList, fetchJobDescriptions } = useHiringNeeds();

  const [selectedItem, setSelectedItem] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [approvalAccessLoading, setApprovalAccessLoading] =
    useState(true);
  const [canApproveHiringNeeds, setCanApproveHiringNeeds] =
    useState(false);

  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  const currentUserSibsId = useMemo(
    () => getCurrentUserSibsId(user),
    [user],
  );

  const showStatusModal = useCallback((payload) => {
    setStatusModal({
      open: true,
      type: payload?.type || "success",
      title: payload?.title || "",
      message: payload?.message || "",
    });
  }, []);

  useEffect(() => {
    fetchList();
    fetchJobDescriptions();
  }, [fetchList, fetchJobDescriptions]);

  useEffect(() => {
    let cancelled = false;

    async function checkApprovalAccess() {
      const cleanUserSibsId = normalizeSibsId(currentUserSibsId);

      if (!cleanUserSibsId) {
        if (!cancelled) {
          setCanApproveHiringNeeds(false);
          setApprovalAccessLoading(false);
        }

        return;
      }

      try {
        setApprovalAccessLoading(true);

        const result = await getHiringNeedsApprovalUsers();
        const rows = getApprovalSettingsRows(result);

        const allowed = rows.some((row) => {
          return (
            getApprovalSettingsSibsId(row).toLowerCase() ===
            cleanUserSibsId.toLowerCase()
          );
        });

        if (!cancelled) {
          setCanApproveHiringNeeds(allowed);
        }
      } catch (error) {
        console.error(
          "CHECK HIRING NEEDS MODAL APPROVAL ACCESS ERROR:",
          error,
        );

        if (!cancelled) {
          setCanApproveHiringNeeds(false);

          showStatusModal({
            type: "error",
            title: "Approval Access Check Failed",
            message:
              error?.response?.data?.message ||
              error?.response?.data?.error ||
              error?.message ||
              "Unable to verify your Hiring Needs approval access.",
          });
        }
      } finally {
        if (!cancelled) {
          setApprovalAccessLoading(false);
        }
      }
    }

    checkApprovalAccess();

    return () => {
      cancelled = true;
    };
  }, [currentUserSibsId, showStatusModal]);

  const handleApprovalDecision = useCallback(
    async ({ action, item, remarks }) => {
      if (!canApproveHiringNeeds) {
        showStatusModal({
          type: "error",
          title: "Not Allowed",
          message:
            "Only users added in Recruitment Settings > Approval Rules > Hiring Needs can approve or reject this request.",
        });

        return false;
      }

      const requestId = getHiringNeedsRequestId(item);

      if (!requestId) {
        showStatusModal({
          type: "error",
          title: "Invalid Request",
          message: "The Hiring Needs request ID is missing.",
        });

        return false;
      }

      try {
        const payload = {
          remarks: cleanText(remarks),
        };

        const result =
          action === "approve"
            ? await approveRequestByModule(
              "Hiring Needs",
              requestId,
              payload,
            )
            : await rejectRequestByModule(
              "Hiring Needs",
              requestId,
              payload,
            );

        if (!result?.success) {
          throw new Error(
            result?.message ||
            `Failed to ${action === "approve" ? "approve" : "reject"
            } the request.`,
          );
        }

        await fetchList();

        setSelectedItem(null);

        showStatusModal({
          type: "success",
          title:
            action === "approve"
              ? "Request Approved"
              : "Request Rejected",
          message:
            result?.message ||
            `The Hiring Needs request was ${action === "approve" ? "approved" : "rejected"
            } successfully.`,
        });

        return true;
      } catch (error) {
        console.error("HIRING NEEDS MODAL APPROVAL ERROR:", error);

        showStatusModal({
          type: "error",
          title: "Approval Update Failed",
          message:
            error?.response?.data?.message ||
            error?.response?.data?.error ||
            error?.message ||
            "Something went wrong while updating the request.",
        });

        return false;
      }
    },
    [
      canApproveHiringNeeds,
      fetchList,
      showStatusModal,
    ],
  );


  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);

      await Promise.all([
        fetchList(),
        fetchJobDescriptions(),
      ]);
    } catch (error) {
      showStatusModal({
        type: "error",
        title: "Refresh Failed",
        message:
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Unable to refresh Hiring Needs records.",
      });
    } finally {
      setRefreshing(false);
    }
  }, [
    fetchJobDescriptions,
    fetchList,
    showStatusModal,
  ]);

  return (
    <div className="sibs-dashboard-shell">
      <div className="shrink-0">
        <Header />
      </div>

      <main
        ref={mainRef}
        className="sibs-dashboard-main-wide"
      >
        <div className="mx-auto w-full max-w-[1600px] space-y-5 sm:space-y-6">
          <section className="sibs-page-header-in sibs-page-card-in sibs-card relative overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white p-5 font-jakarta shadow-sm sm:p-6">
            <span className="sibs-top-accent" aria-hidden="true" />

            <div className="mt-1 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0 space-y-1.5">
                <span className="inline-flex items-center gap-1.5 rounded border border-blue-100 bg-[#E9F0FC] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-normal text-[#042C51]">
                  <span className="h-1.5 w-1.5 animate-sibs-pulse rounded-full bg-[#FF5C28]" />
                  Recruitment View
                </span>

                <h1 className="break-words text-xl font-extrabold text-[#042C51] sm:text-2xl">
                  Hiring Needs Intake
                </h1>

                <p className="max-w-3xl text-xs font-semibold leading-relaxed text-[#667085] sm:text-sm">
                  Create, review, approve, and manage Personnel Requisition Forms across SIBS operational hubs.
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2 self-end md:self-auto">
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  aria-label="Refresh Hiring Needs"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#D6DEE8] bg-white text-[#042C51] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF8F5] hover:text-[#FF5C28] disabled:cursor-not-allowed disabled:opacity-50"
                  title="Refresh Hiring Needs"
                >
                  <RefreshCw
                    size={15}
                    className={refreshing ? "animate-spin" : ""}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#FF5C28] px-4 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#E94F1F] focus:outline-none focus:ring-4 focus:ring-[#FF5C28]/20"
                >
                  <Plus size={15} />
                  New Personnel Requisition
                </button>
              </div>
            </div>
          </section>

          <HiringNeedsStats />

          <section
            className="sibs-profile-tab-panel sibs-page-card-in overflow-visible rounded-2xl border border-[#E6ECF2] bg-white font-jakarta shadow-sm"
            style={{ animationDelay: "180ms" }}
          >
            <HiringNeedsFilters />
            <HiringNeedsTable onView={setSelectedItem} />
          </section>

          <section
            className="sibs-profile-tab-panel rounded-xl border border-blue-100 bg-blue-50 p-4"
            style={{ animationDelay: "480ms" }}
          >
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-white text-[#042C51] shadow-sm">
                <ClipboardList size={15} />
              </span>

              <div>
                <h3 className="text-xs font-extrabold text-[#042C51]">
                  Hiring Needs Process Note
                </h3>

                <p className="mt-1 text-xs font-semibold leading-5 text-[#042C51]/75">
                  Submitted Personnel Requisition Forms are routed
                  for approval. Once approved, the PRF becomes an
                  active hiring need that can be linked to Job
                  Descriptions, Workforce Hiring Planning, and
                  Candidates.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <AddHiringNeedsModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onStatus={showStatusModal}
      />

      <ViewHiringNeedsModal
        open={Boolean(selectedItem)}
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onStatus={showStatusModal}
        canApprove={canApproveHiringNeeds}
        approvalAccessLoading={approvalAccessLoading}
        onDecision={handleApprovalDecision}
      />

      <StatusModal
        open={statusModal.open}
        type={statusModal.type}
        onClose={() =>
          setStatusModal((previous) => ({
            ...previous,
            open: false,
          }))
        }
        title={statusModal.title}
        message={statusModal.message}
      />
    </div>
  );
}
