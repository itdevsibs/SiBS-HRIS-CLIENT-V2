import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Loader2,
  Plus,
  RefreshCw,
} from "lucide-react";

import AddDepartmentModal from "@/components/departments/AddDepartmentModal";
import AddAccountModal from "@/components/departments/AddAccountModal";
import DepartmentApprovalRequests from "@/components/departments/DepartmentApprovalRequests";
import AccountApprovalRequests from "@/components/departments/AccountApprovalRequests";
import DepartmentCard, {
  DepartmentCardSkeleton,
} from "@/components/departments/DepartmentCard";
import DepartmentDetailsModal from "@/components/departments/DepartmentDetailsModal";
import DepartmentFilters from "@/components/departments/DepartmentFilters";
import DepartmentSummaryCards from "@/components/departments/DepartmentSummaryCards";
import Header from "@/components/layout/Header";
import { ConfirmModal, PageHeaderHero } from "@/components/ui";
import useDepartments from "@/hooks/departments/useDepartments";
import {
  approveDepartmentRequest,
  approveAccountRequest,
  getAccountApprovalRequests,
  rejectAccountRequest,
  createDepartmentRequest,
  createDepartmentAccount,
  getDepartmentApprovalAccess,
  getDepartmentApprovalRequests,
  getDepartmentDetails,
  rejectDepartmentRequest,
} from "@/lib/axios/getDepartments";
import { normalizeDepartmentDetailsResponse } from "@/lib/utils/departments/departmentDirectory";
import { DepartmentsProvider } from "@/services/context/DepartmentsContext";

function errorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

function DepartmentsPageContent() {
  const departments = useDepartments();
  const [searchParams, setSearchParams] = useSearchParams();
  const linkedAccountRequestId = searchParams.get("accountApprovalRequestId") || "";
  const linkedDepartmentRequestId = searchParams.get("departmentApprovalRequestId") || "";
  const clearDepartmentApprovalLink = useCallback(() => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete("departmentApprovalRequestId");
      return next;
    }, { replace: true });
  }, [setSearchParams]);
  const clearAccountApprovalLink = useCallback(() => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete("accountApprovalRequestId");
      return next;
    }, { replace: true });
  }, [setSearchParams]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [loadingDepartmentId, setLoadingDepartmentId] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addAccountModalOpen, setAddAccountModalOpen] = useState(false);
  const [submittingAccount, setSubmittingAccount] = useState(false);
  const [submittingDepartment, setSubmittingDepartment] = useState(false);
  const [approvalRequests, setApprovalRequests] = useState([]);
  const [accountApprovalRequests, setAccountApprovalRequests] = useState([]);
  const [approvalLoading, setApprovalLoading] = useState(true);
  const [canApproveDepartments, setCanApproveDepartments] = useState(false);
  const [canApproveAccounts, setCanApproveAccounts] = useState(false);
  const [canManageDepartments, setCanManageDepartments] = useState(false);
  const [canManageLobs, setCanManageLobs] = useState(false);
  const [approvalAccessError, setApprovalAccessError] = useState("");
  const [approvalRequestsError, setApprovalRequestsError] = useState("");
  const [accountApprovalRequestsError, setAccountApprovalRequestsError] = useState("");
  const [processingRequestId, setProcessingRequestId] = useState("");
  const [processingAccountRequestId, setProcessingAccountRequestId] = useState("");
  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  const showStatus = useCallback((type, title, message) => {
    setStatusModal({ open: true, type, title, message });
  }, []);

  const handleAccountLinkUnavailable = useCallback(() => {
    clearAccountApprovalLink();
    showStatus(
      "error",
      "Account Request Unavailable",
      "This account request is no longer pending or is not accessible to your account.",
    );
  }, [clearAccountApprovalLink, showStatus]);

  const handleDepartmentLinkUnavailable = useCallback(() => {
    clearDepartmentApprovalLink();
    showStatus(
      "error",
      "Department Request Unavailable",
      "This department request is no longer pending or could not be found.",
    );
  }, [clearDepartmentApprovalLink, showStatus]);

  const loadApprovalData = useCallback(async () => {
    setApprovalLoading(true);
    setApprovalAccessError("");
    setApprovalRequestsError("");
    setAccountApprovalRequestsError("");

    let canManage = false;
    try {
      // Authorization and approval-list retrieval are independent. An error
      // loading pending requests must NEVER downgrade a Super Admin/HR Admin
      // to read-only or hide Add Department / LOB management controls.
      const accessPayload = await getDepartmentApprovalAccess();
      canManage = Boolean(
        accessPayload?.canManageDepartments ??
          accessPayload?.data?.canManageDepartments,
      );
      setCanManageDepartments(canManage);
      setCanApproveDepartments(
        Boolean(accessPayload?.canApprove ?? accessPayload?.data?.canApprove),
      );
      setCanApproveAccounts(
        Boolean(accessPayload?.canApproveAccounts ?? accessPayload?.data?.canApproveAccounts),
      );
      setCanManageLobs(
        Boolean(accessPayload?.canManageLobs ?? accessPayload?.data?.canManageLobs),
      );
    } catch (error) {
      console.error("LOAD DEPARTMENT APPROVAL ACCESS ERROR:", error);
      setApprovalAccessError(errorMessage(error, "Unable to verify Department permissions."));
      setCanManageDepartments(false);
      setCanApproveDepartments(false);
      setCanApproveAccounts(false);
      setCanManageLobs(false);
      setApprovalRequests([]);
      setAccountApprovalRequests([]);
      setApprovalLoading(false);
      return;
    }

    if (!canManage) {
      setApprovalRequests([]);
      setAccountApprovalRequests([]);
      setApprovalLoading(false);
      return;
    }

    // Independent queues: a failure loading one does not hide management
    // buttons or suppress requests from the other module.
    const [departmentResult, accountResult] = await Promise.allSettled([
      getDepartmentApprovalRequests(),
      getAccountApprovalRequests(),
    ]);

    if (departmentResult.status === "fulfilled") {
      const payload = departmentResult.value;
      setApprovalRequests(Array.isArray(payload?.data) ? payload.data : Array.isArray(payload?.rows) ? payload.rows : []);
    } else {
      setApprovalRequests([]);
      setApprovalRequestsError(errorMessage(departmentResult.reason, "Unable to load pending Department approvals."));
    }

    if (accountResult.status === "fulfilled") {
      const payload = accountResult.value;
      setAccountApprovalRequests(Array.isArray(payload?.data) ? payload.data : Array.isArray(payload?.rows) ? payload.rows : []);
    } else {
      setAccountApprovalRequests([]);
      setAccountApprovalRequestsError(errorMessage(accountResult.reason, "Unable to load pending Account approvals."));
    }
    setApprovalLoading(false);
  }, []);

  useEffect(() => {
    loadApprovalData();
  }, [loadApprovalData]);

  async function handleViewDepartment(department) {
    const departmentId = String(department?.id ?? "").trim();
    if (!departmentId || loadingDepartmentId) return;

    setLoadingDepartmentId(departmentId);

    try {
      const payload = await getDepartmentDetails(departmentId);
      setSelectedDepartment(
        normalizeDepartmentDetailsResponse(payload),
      );
    } catch (error) {
      console.error("LOAD DEPARTMENT DETAILS ERROR:", error);

      showStatus(
        "error",
        "Department Details Unavailable",
        errorMessage(
          error,
          "Failed to load the selected department details.",
        ),
      );
    } finally {
      setLoadingDepartmentId("");
    }
  }

  async function handleRefresh() {
    departments.refresh();
    await loadApprovalData();
  }

  async function handleCreateDepartment({ departmentName }) {
    if (!canManageDepartments) return;

    setSubmittingDepartment(true);

    try {
      const result = await createDepartmentRequest(departmentName);
      setAddModalOpen(false);
      await loadApprovalData();

      showStatus(
        "success",
        "Department Submitted",
        result?.message ||
          `${departmentName} was submitted and is waiting for Department approval.`,
      );
    } catch (error) {
      throw new Error(
        errorMessage(error, "Failed to submit department for approval."),
      );
    } finally {
      setSubmittingDepartment(false);
    }
  }

  async function handleCreateAccount({ departmentId, accountName, ghlName }) {
    if (!canManageDepartments) throw new Error("Account management access is required.");

    setSubmittingAccount(true);
    try {
      const result = await createDepartmentAccount({ departmentId, accountName, ghlName });
      setAddAccountModalOpen(false);
      await loadApprovalData();
      showStatus("success", "Account Submitted", result?.message || `${accountName} was submitted for Account Approval.`);
    } catch (error) {
      throw new Error(errorMessage(error, "Unable to create the account."));
    } finally {
      setSubmittingAccount(false);
    }
  }

  async function handleApproveDepartment(request) {
    if (!request?.id) return;

    setProcessingRequestId(String(request.id));

    try {
      const result = await approveDepartmentRequest(request.id);
      departments.refresh();
      await loadApprovalData();

      showStatus(
        "success",
        "Department Approved",
        result?.message ||
          `${request.departmentName || request.department_name} is now available across HRIS.`,
      );
    } catch (error) {
      showStatus(
        "error",
        "Approval Failed",
        errorMessage(error, "Failed to approve department request."),
      );
    } finally {
      setProcessingRequestId("");
    }
  }

  async function handleRejectDepartment(request) {
    if (!request?.id) return;

    setProcessingRequestId(String(request.id));

    try {
      const result = await rejectDepartmentRequest(request.id, "");
      await loadApprovalData();

      showStatus(
        "success",
        "Department Rejected",
        result?.message ||
          `${request.departmentName || request.department_name} was rejected.`,
      );
    } catch (error) {
      showStatus(
        "error",
        "Rejection Failed",
        errorMessage(error, "Failed to reject department request."),
      );
    } finally {
      setProcessingRequestId("");
    }
  }

  async function handleApproveAccount(request) {
    if (!request?.id) return;
    setProcessingAccountRequestId(String(request.id));
    try {
      const result = await approveAccountRequest(request.id);
      departments.refresh();
      await loadApprovalData();
      showStatus("success", "Account Approved", result?.message || "Account approved and added to the directory.");
    } catch (error) {
      showStatus("error", "Account Approval Failed", errorMessage(error, "Unable to approve Account request."));
    } finally {
      setProcessingAccountRequestId("");
    }
  }

  async function handleRejectAccount(request) {
    if (!request?.id) return;
    setProcessingAccountRequestId(String(request.id));
    try {
      const result = await rejectAccountRequest(request.id);
      await loadApprovalData();
      showStatus("success", "Account Rejected", result?.message || "Account request rejected.");
    } catch (error) {
      showStatus("error", "Account Rejection Failed", errorMessage(error, "Unable to reject Account request."));
    } finally {
      setProcessingAccountRequestId("");
    }
  }

  return (
    <div className="sibs-dashboard-shell">
      <Header />

      <main className="sibs-dashboard-main-wide">
        <PageHeaderHero
          kicker="Organization View"
          title="Departments, Accounts & Lines of Business"
          description={
            canManageDepartments
              ? "Manage the organization hierarchy from Department to Account to account-specific Lines of Business."
              : "View the organization hierarchy from Department to Account to account-specific Lines of Business."
          }
          className="mb-5"
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {canManageDepartments ? (
                <button
                  type="button"
                  className="sibs-btn-secondary"
                  onClick={() => setAddAccountModalOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Add Account
                </button>
              ) : null}

              {canManageDepartments ? (
                <button
                  type="button"
                  className="sibs-btn-primary"
                  onClick={() => setAddModalOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Add Department
                </button>
              ) : null}

              <button
                type="button"
                className="sibs-btn-icon"
                title="Refresh departments"
                onClick={handleRefresh}
                disabled={departments.refreshing || approvalLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    departments.refreshing || approvalLoading
                      ? "animate-spin text-sibs-orange"
                      : ""
                  }`}
                />
              </button>
            </div>
          }
        />

        <DepartmentSummaryCards
          summary={departments.summary}
          loading={departments.loading}
        />

        {approvalAccessError ? (
          <div role="alert" className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
            <span>Department permissions could not be verified: {approvalAccessError}</span>
            <button type="button" className="underline underline-offset-2" onClick={loadApprovalData}>Retry</button>
          </div>
        ) : null}

        {canManageDepartments && approvalRequestsError ? (
          <div role="alert" className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
            <span>Pending Department approvals could not be loaded: {approvalRequestsError}</span>
            <button type="button" className="underline underline-offset-2" onClick={loadApprovalData}>Retry</button>
          </div>
        ) : null}

        {canManageDepartments && accountApprovalRequestsError ? (
          <div role="alert" className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
            <span>Pending Account approvals could not be loaded: {accountApprovalRequestsError}</span>
            <button type="button" className="underline underline-offset-2" onClick={loadApprovalData}>Retry</button>
          </div>
        ) : null}

        {canManageDepartments ? (
          <AccountApprovalRequests
            requests={accountApprovalRequests}
            loading={approvalLoading}
            linkedRequestId={accountApprovalRequestsError ? "" : linkedAccountRequestId}
            onLinkOpened={clearAccountApprovalLink}
            onLinkUnavailable={handleAccountLinkUnavailable}
            canApprove={canApproveAccounts}
            processingId={processingAccountRequestId}
            onApprove={handleApproveAccount}
            onReject={handleRejectAccount}
          />
        ) : null}

        {canManageDepartments ? (
          <DepartmentApprovalRequests
            requests={approvalRequests}
            loading={approvalLoading}
            linkedRequestId={approvalRequestsError ? "" : linkedDepartmentRequestId}
            onLinkOpened={clearDepartmentApprovalLink}
            onLinkUnavailable={handleDepartmentLinkUnavailable}
            canApprove={canApproveDepartments}
            processingId={processingRequestId}
            onApprove={handleApproveDepartment}
            onReject={handleRejectDepartment}
          />
        ) : null}

        <section
          className="sibs-page-card-in sibs-card mt-5 overflow-hidden rounded-[14px] border border-sibs-border bg-white font-jakarta shadow-xs"
          style={{ animationDelay: "240ms", animationFillMode: "both" }}
        >
          <div className="flex flex-col gap-3 border-b border-sibs-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <h2 className="sibs-card-title">
                Department Directory & Status Reports
              </h2>
              <p className="sibs-card-subtitle">
                Select a department to review its Accounts, Lines of Business,
                Operations Managers, Team Leaders, and employee assignments.
              </p>
            </div>

            <span className="self-start rounded-[10px] border border-sibs-border bg-sibs-surface px-3 py-1.5 text-[10px] font-extrabold text-sibs-secondary sm:self-auto">
              {departments.pagination.total || departments.departments.length}{" "}
              departments found
            </span>
          </div>

          <DepartmentFilters
            search={departments.search}
            status={departments.status}
            onSearch={departments.setSearch}
            onStatus={departments.setStatus}
            onClear={departments.clearFilters}
            canClear={departments.hasActiveFilters}
          />

          {departments.loading ? (
            <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3 sm:p-5">
              {Array.from({ length: 6 }).map((_, idx) => (
                <DepartmentCardSkeleton key={idx} index={idx} />
              ))}
            </div>
          ) : departments.error ? (
            <div className="m-5 rounded-[10px] border border-rose-200 bg-rose-50 p-8 text-center text-rose-700">
              <AlertTriangle className="mx-auto h-8 w-8" />
              <h3 className="mt-3 text-sm font-extrabold">
                Department report unavailable
              </h3>
              <p className="mt-1 text-xs font-semibold">{departments.error}</p>
              <button
                type="button"
                className="sibs-btn-secondary mt-4"
                onClick={handleRefresh}
              >
                Try Again
              </button>
            </div>
          ) : departments.departments.length ? (
            <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3 sm:p-5">
              {departments.departments.map((department, index) => (
                <DepartmentCard
                  key={department.id}
                  department={department}
                  onView={handleViewDepartment}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="px-5 py-14 text-center">
              <Building2 className="mx-auto h-10 w-10 text-sibs-tertiary-8" />
              <h3 className="mt-3 text-sm font-extrabold text-sibs-navy">
                No departments found
              </h3>
              <p className="mt-1 text-xs font-semibold text-sibs-muted">
                Adjust or clear the current filters.
              </p>
            </div>
          )}
        </section>
      </main>

      <DepartmentDetailsModal
        department={selectedDepartment}
        canManageLobs={canManageLobs}
        onClose={() => setSelectedDepartment(null)}
      />

      {canManageDepartments ? (
        <AddDepartmentModal
          open={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          onSubmit={handleCreateDepartment}
          submitting={submittingDepartment}
        />
      ) : null}

      {canManageDepartments ? (
        <AddAccountModal
          open={addAccountModalOpen}
          onClose={() => setAddAccountModalOpen(false)}
          onSubmit={handleCreateAccount}
          submitting={submittingAccount}
        />
      ) : null}

      <ConfirmModal
        open={Boolean(statusModal.open)}
        variant={statusModal.type === "error" ? "danger" : "primary"}
        title={statusModal.title}
        description={statusModal.message}
        confirmLabel="Acknowledge"
        onConfirm={() =>
          setStatusModal((previous) => ({ ...previous, open: false }))
        }
        onClose={() =>
          setStatusModal((previous) => ({ ...previous, open: false }))
        }
        icon={statusModal.type === "error" ? AlertTriangle : CheckCircle2}
      />
    </div>
  );
}

export default function DepartmentsPage() {
  return (
    <DepartmentsProvider>
      <DepartmentsPageContent />
    </DepartmentsProvider>
  );
}
