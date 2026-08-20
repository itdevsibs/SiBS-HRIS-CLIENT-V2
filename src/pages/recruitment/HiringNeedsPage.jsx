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
import { relinkHiringNeedJobDescription } from "../../lib/axios/getHiringNeeds";

function cleanText(value) {
  return String(value ?? "").trim();
}

function normalizeSibsId(value) {
  return cleanText(value).replace(/^SIBS[-_ ]?/i, "");
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
      user?.username,
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
  const {
    fetchList,
    fetchJobDescriptions,
    jobDescriptions,
    jobDescriptionLoading,
  } = useHiringNeeds();

  const [selectedItem, setSelectedItem] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [approvalAccessLoading, setApprovalAccessLoading] =
    useState(true);
  const [canApproveHiringNeeds, setCanApproveHiringNeeds] =
    useState(false);
  const [approvalUsers, setApprovalUsers] = useState([]);

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
          setApprovalUsers(rows);
          setCanApproveHiringNeeds(allowed);
        }
      } catch (error) {
        console.error(
          "CHECK HIRING NEEDS MODAL APPROVAL ACCESS ERROR:",
          error,
        );

        if (!cancelled) {
          setApprovalUsers([]);
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

  const handleRelinkJobDescription = useCallback(
    async ({ item, jobDescriptionId }) => {
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
        const result = await relinkHiringNeedJobDescription(
          requestId,
          jobDescriptionId,
        );

        if (!result?.success) {
          throw new Error(
            result?.message || "Failed to relink the personnel requisition.",
          );
        }

        await Promise.all([fetchList(), fetchJobDescriptions()]);
        setSelectedItem(null);

        showStatusModal({
          type: "success",
          title: "Job Description Relinked",
          message:
            result?.message ||
            "The personnel requisition was relinked successfully.",
        });

        return true;
      } catch (error) {
        showStatusModal({
          type: "error",
          title: "Relink Failed",
          message:
            error?.response?.data?.message ||
            error?.message ||
            "Something went wrong while relinking the Job Description.",
        });

        return false;
      }
    },
    [fetchJobDescriptions, fetchList, showStatusModal],
  );

  return (
    <div className="sibs-dashboard-shell">
      <div className="shrink-0">
        <Header />
      </div>

      <main
        ref={mainRef}
        className="sibs-dashboard-main-wide min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-7"
      >
        <div className="mx-auto w-full max-w-[1700px] space-y-4 sm:space-y-5">
          <section
            className="sibs-page-header-in sibs-page-card-in relative overflow-visible rounded-2xl border border-[#E6ECF2] bg-white p-4 font-jakarta shadow-sm 2xl:p-6"
            style={{ animationDelay: "0ms", animationFillMode: "both" }}
          >
            <span
              className="sibs-top-accent pointer-events-none absolute left-[1px] right-[1px] top-[1px] h-1 overflow-hidden rounded-t-[15px]"
              aria-hidden="true"
            >
              <span className="block h-full w-full bg-gradient-to-r from-[#042C51] via-[#FF5C28] to-[#042C51]" />
            </span>

            <div className="mt-0.5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded border border-blue-100 bg-[#E9F0FC] px-2 py-0.5 2xl:px-2.5 2xl:py-1 sibs-text-micro font-extrabold uppercase tracking-normal text-[#042C51]">
                    <span className="h-1.5 w-1.5 animate-sibs-pulse rounded-full bg-[#FF5C28]" />
                    <ClipboardList className="h-3 w-3 2xl:h-3.5 2xl:w-3.5" strokeWidth={2.2} />
                    Recruitment View
                  </span>
                </div>

                <h1 className="break-words text-lg 2xl:text-2xl font-extrabold tracking-tight text-[#042C51]">
                  Hiring Needs Intake
                </h1>

                <p className="max-w-3xl sibs-text-sm font-semibold leading-relaxed text-[#667085]">
                  Create, review, approve, and manage Personnel Requisition Forms across SIBS operational hubs.
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2 self-end md:self-auto">
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  aria-label="Refresh Hiring Needs"
                  className="inline-flex h-8.5 2xl:h-10 w-8.5 2xl:w-10 items-center justify-center rounded-lg border border-[#D6DEE8] bg-white text-[#042C51] shadow-sm transition hover:border-[#FF5C28]/40 hover:bg-[#FFF8F5] hover:text-[#FF5C28] disabled:cursor-not-allowed disabled:opacity-60"
                  title="Refresh Hiring Needs"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 2xl:h-4 2xl:w-4 ${
                      refreshing ? "animate-spin text-[#FF5C28]" : ""
                    }`}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-2 rounded-lg bg-[#FF5C28] px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-white shadow-sm transition hover:bg-[#E94F1F] focus:outline-none focus:ring-4 focus:ring-[#FF5C28]/20"
                >
                  <Plus className="h-3.5 w-3.5 2xl:h-4 2xl:w-4" />
                  New Personnel Requisition
                </button>
              </div>
            </div>
          </section>

          <HiringNeedsStats />

          <section
            className="sibs-profile-tab-panel sibs-page-card-in overflow-visible rounded-2xl border border-[#E6ECF2] bg-white font-jakarta shadow-sm"
            style={{ animationDelay: "180ms", animationFillMode: "both" }}
          >
            <HiringNeedsFilters />
            <HiringNeedsTable
              canApproveHiringNeeds={canApproveHiringNeeds}
              onView={setSelectedItem}
            />
          </section>

          <section
            className="sibs-profile-tab-panel sibs-process-note"
            style={{ animationDelay: "240ms", animationFillMode: "both" }}
          >
            <div className="flex items-start gap-2.5 sm:gap-3">
              <span className="sibs-process-note__icon">
                <ClipboardList className="h-3.5 w-3.5 2xl:h-4 2xl:w-4" />
              </span>

              <div className="min-w-0">
                <h3 className="sibs-process-note__title">
                  Hiring Needs Process Note
                </h3>

                <p className="sibs-process-note__body">
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
        approvalUsers={approvalUsers}
        onDecision={handleApprovalDecision}
        jobDescriptions={jobDescriptions}
        jobDescriptionLoading={jobDescriptionLoading}
        onRelink={handleRelinkJobDescription}
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
