import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ClipboardList, Plus } from "lucide-react";

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
              `Failed to ${
                action === "approve" ? "approve" : "reject"
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
            `The Hiring Needs request was ${
              action === "approve" ? "approved" : "rejected"
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

  return (
    <div className="flex h-dvh min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta">
      <div className="shrink-0">
        <Header />
      </div>

      <main
        ref={mainRef}
        className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-sibs-tertiary-10 p-4 sm:p-6"
      >
        <div className="mx-auto max-w-[1600px] space-y-5">
          <div className="sibs-page-header-in flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
                <ClipboardList size={14} />
                Recruitment
              </div>

              <h1 className="mt-3 text-2xl font-extrabold text-sibs-primary-1 sm:text-3xl">
                Hiring Needs Intake
              </h1>

              <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                Create, review, approve, and manage Personnel
                Requisition Forms.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5"
            >
              <Plus size={18} />
              New Personnel Requisition
            </button>
          </div>

          <HiringNeedsStats />

          <section
            className="sibs-profile-tab-panel overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white shadow-sm"
            style={{ animationDelay: "180ms" }}
          >
            <HiringNeedsFilters />
            <HiringNeedsTable onView={setSelectedItem} />
          </section>

          <section
            className="sibs-profile-tab-panel rounded-xl border border-blue-100 bg-blue-50 p-5"
            style={{ animationDelay: "480ms" }}
          >
            <h3 className="text-sm font-bold text-sibs-primary-1">
              Hiring Needs Process Note
            </h3>

            <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
              This module tracks Personnel Requisition Forms. Once a PRF
              is approved by HR Admin, it becomes an active hiring need
              that can be linked to Job Descriptions, Workforce Hiring
              Planning, and Candidates.
            </p>
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
