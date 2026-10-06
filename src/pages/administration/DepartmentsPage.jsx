import { useCallback, useEffect, useState } from "react";

import {
  AlertTriangle,
  Building2,
  Loader2,
  Plus,
  RefreshCw,
} from "lucide-react";

import AddDepartmentModal from "@/components/departments/AddDepartmentModal";
import DepartmentApprovalRequests from "@/components/departments/DepartmentApprovalRequests";
import DepartmentCard from "@/components/departments/DepartmentCard";
import DepartmentDetailsModal from "@/components/departments/DepartmentDetailsModal";
import DepartmentFilters from "@/components/departments/DepartmentFilters";
import DepartmentSummaryCards from "@/components/departments/DepartmentSummaryCards";
import Header from "@/components/layout/Header";
import StatusModal from "@/components/modals/StatusModal";
import { PageHeaderHero } from "@/components/ui";
import useDepartments from "@/hooks/departments/useDepartments";
import {
  approveDepartmentRequest,
  createDepartmentRequest,
  getDepartmentApprovalAccess,
  getDepartmentApprovalRequests,
  rejectDepartmentRequest,
} from "@/lib/axios/getDepartments";
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
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [submittingDepartment, setSubmittingDepartment] = useState(false);
  const [approvalRequests, setApprovalRequests] = useState([]);
  const [approvalLoading, setApprovalLoading] = useState(true);
  const [canApproveDepartments, setCanApproveDepartments] = useState(false);
  const [canManageLobs, setCanManageLobs] = useState(false);
  const [processingRequestId, setProcessingRequestId] = useState("");
  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  const showStatus = useCallback((type, title, message) => {
    setStatusModal({ open: true, type, title, message });
  }, []);

  const loadApprovalData = useCallback(async () => {
    setApprovalLoading(true);

    try {
      const [requestsPayload, accessPayload] = await Promise.all([
        getDepartmentApprovalRequests(),
        getDepartmentApprovalAccess(),
      ]);

      setApprovalRequests(
        Array.isArray(requestsPayload?.data)
          ? requestsPayload.data
          : Array.isArray(requestsPayload?.rows)
            ? requestsPayload.rows
            : [],
      );
      setCanApproveDepartments(
        Boolean(accessPayload?.canApprove ?? accessPayload?.data?.canApprove),
      );
      setCanManageLobs(
        Boolean(accessPayload?.canManageLobs ?? accessPayload?.data?.canManageLobs),
      );
    } catch (error) {
      console.error("LOAD DEPARTMENT APPROVAL DATA ERROR:", error);
      setApprovalRequests([]);
      setCanApproveDepartments(false);
      setCanManageLobs(false);
    } finally {
      setApprovalLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApprovalData();
  }, [loadApprovalData]);

  async function handleRefresh() {
    departments.refresh();
    await loadApprovalData();
  }

  async function handleCreateDepartment({ departmentName }) {
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

  return (
    <div className="sibs-dashboard-shell">
      <Header />

      <main className="sibs-dashboard-main-wide">
        <PageHeaderHero
          kicker="Organization View"
          title="Departments, Accounts & Lines of Business"
          description="Manage the organization hierarchy from Department to Account to account-specific Lines of Business."
          className="mb-5"
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="sibs-btn-primary"
                onClick={() => setAddModalOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Add Department
              </button>

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

        <DepartmentSummaryCards summary={departments.summary} />

        <DepartmentApprovalRequests
          requests={approvalRequests}
          loading={approvalLoading}
          canApprove={canApproveDepartments}
          processingId={processingRequestId}
          onApprove={handleApproveDepartment}
          onReject={handleRejectDepartment}
        />

        <section className="mt-5 overflow-hidden rounded-2xl border border-sibs-border bg-white shadow-sm">
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

            <span className="self-start rounded-lg border border-sibs-border bg-sibs-surface px-3 py-1.5 text-[10px] font-extrabold text-sibs-secondary sm:self-auto">
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
            <div className="flex min-h-80 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-sibs-orange" />
            </div>
          ) : departments.error ? (
            <div className="m-5 rounded-xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-700">
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
              {departments.departments.map((department) => (
                <DepartmentCard
                  key={department.id}
                  department={department}
                  onView={setSelectedDepartment}
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

      <AddDepartmentModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSubmit={handleCreateDepartment}
        submitting={submittingDepartment}
      />

      <StatusModal
        open={statusModal.open}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        variant="center"
        onClose={() =>
          setStatusModal((previous) => ({ ...previous, open: false }))
        }
        lockScroll
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
