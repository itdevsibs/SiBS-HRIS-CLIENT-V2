import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock3,
  Eye,
  FileCheck2,
  FileText,
  ListChecks,
  Loader2,
  MessageSquareText,
  RefreshCcw,
  Search,
  UserRoundCheck,
  X,
  XCircle,
} from "lucide-react";

import Header from "../../components/layout/Header";
import StatusModal from "../../components/modals/StatusModal";

import {
  getApprovalRequestsByModule,
  approveRequestByModule,
  rejectRequestByModule,
} from "../../lib/axios/getApprovalRequest";

const REQUEST_MODULES = [
  "Attrition",
  "Weekly Hiring Plan",
  "Job Description",
  "Hiring Needs",
];

const STATUS_OPTIONS = ["All", "Pending", "For Review", "Approved", "Rejected"];

const TYPE_OPTIONS_BY_MODULE = {
  Attrition: ["All", "Resignation", "Attrition"],
  "Weekly Hiring Plan": ["All", "Headcount Update", "Weekly Hiring Plan"],
  "Job Description": ["All", "Job Description"],
  "Hiring Needs": ["All", "Hiring Needs"],
};

const moduleIconMap = {
  Attrition: UserRoundCheck,
  "Weekly Hiring Plan": ClipboardList,
  "Job Description": FileText,
  "Hiring Needs": BriefcaseBusiness,
};

const API_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000";

const DEFAULT_COUNTS = {
  total: 0,
  pending: 0,
  forReview: 0,
  approved: 0,
  rejected: 0,
};

function getFileUrl(url) {
  const value = String(url || "").trim();

  if (!value || value === "#") return "#";

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  if (value.startsWith("/")) {
    return `${API_URL}${value}`;
  }

  return `${API_URL}/${value}`;
}

function DropdownPortal({
  open,
  anchorRef,
  children,
  onClose,
  maxHeight = 256,
}) {
  const dropdownRef = useRef(null);
  const [style, setStyle] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return undefined;

    function updatePosition() {
      const rect = anchorRef.current.getBoundingClientRect();

      setStyle({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    }

    updatePosition();

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return undefined;

    function handleClickOutside(e) {
      const clickedAnchor = anchorRef.current?.contains(e.target);
      const clickedDropdown = dropdownRef.current?.contains(e.target);

      if (!clickedAnchor && !clickedDropdown) {
        onClose?.();
      }
    }

    function handleEscape(e) {
      if (e.key === "Escape") {
        onClose?.();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, anchorRef, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={dropdownRef}
      className="fixed z-[999999] overflow-hidden rounded-xl border border-[#D7DEE8] bg-white shadow-2xl"
      style={{
        top: `${style.top}px`,
        left: `${style.left}px`,
        width: `${style.width}px`,
      }}
    >
      <div
        className="overflow-y-auto py-2 sibs-scrollbar"
        style={{ maxHeight }}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

function CustomSelect({
  label,
  value,
  options = [],
  onChange,
  allLabel = "",
}) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);

  const displayValue =
    value === "All" && allLabel ? allLabel : value || allLabel || "Select";

  return (
    <div className="relative">
      <label className="mb-1 block text-sm font-bold text-[#101828]">
        {label}
      </label>

      <button
        ref={anchorRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex h-12 w-full items-center justify-between rounded-xl border bg-white px-4 text-left text-sm font-bold text-[#344054] outline-none transition-all duration-200 hover:border-sibs-primary-1/40 hover:bg-[#F8FAFC] focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${
          open
            ? "border-sibs-primary-1 ring-4 ring-sibs-primary-1/10"
            : "border-[#D0D5DD]"
        }`}
      >
        <span className="truncate">{displayValue}</span>

        <ChevronDown
          size={18}
          className={`shrink-0 text-sibs-tertiary-5 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <DropdownPortal
        open={open}
        anchorRef={anchorRef}
        onClose={() => setOpen(false)}
      >
        {options.map((option) => {
          const optionLabel = option === "All" && allLabel ? allLabel : option;
          const selected = value === option;

          return (
            <button
              key={option}
              type="button"
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
              className={`block w-full px-4 py-3 text-left text-sm transition ${
                selected
                  ? "bg-[#EAF2FB] font-bold text-sibs-primary-1"
                  : "text-[#344054] hover:bg-[#F8FAFC]"
              }`}
            >
              <span className="block truncate">{optionLabel}</span>
            </button>
          );
        })}
      </DropdownPortal>
    </div>
  );
}

function getStatusClass(status) {
  switch (status) {
    case "Approved":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Rejected":
      return "border-red-200 bg-red-50 text-red-700";
    case "For Review":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "Pending":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

function getPriorityClass(priority) {
  switch (priority) {
    case "High":
      return "border-red-200 bg-red-50 text-red-700";
    case "Low":
      return "border-slate-200 bg-slate-50 text-slate-700";
    default:
      return "border-blue-200 bg-blue-50 text-blue-700";
  }
}

function getStatusIcon(status) {
  switch (status) {
    case "Approved":
      return CheckCircle2;
    case "Rejected":
      return XCircle;
    case "For Review":
      return AlertCircle;
    default:
      return Clock3;
  }
}

function formatDate(dateValue) {
  if (!dateValue) return "--";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return String(dateValue);
  }

  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(date);
}

function normalizeStatus(status) {
  const cleanStatus = String(status || "").trim();

  if (cleanStatus === "Declined") return "Rejected";
  if (cleanStatus === "Retained") return "Rejected";
  if (cleanStatus === "Rejected") return "Rejected";
  if (cleanStatus === "Approved") return "Approved";
  if (cleanStatus === "For Review") return "For Review";
  if (cleanStatus === "Pending") return "Pending";

  return "Pending";
}

function safeText(value, fallback = "--") {
  const text = String(value || "").trim();
  return text || fallback;
}

function getRawRequestId(request) {
  return (
    request?.attritionId ||
    request?.raw?.id ||
    request?.rawId ||
    String(request?.id || "").replace(/^RES-ATT-|^RES-|^ATT-/, "")
  );
}

function buildApprovalPayload(request, action, remarks = "", extra = {}) {
  const raw = request?.raw || {};
  const meta = request?.meta || {};

  return {
    module: request?.module || "",
    type: request?.type || "",
    requestType: request?.type || "",
    source: request?.source || "",
    remarks: remarks || "",
    action,

    personallySpoken: extra.personallySpoken || "",
    employeeRetained: extra.employeeRetained || "",
    actionTaken: extra.actionTaken || "",

    employeeSibsId:
      request?.employeeSibsId ||
      raw?.sibsId ||
      raw?.sibs_id ||
      raw?.employeeSibsId ||
      "",

    tlIsApproved: Number(meta.tlIsApproved || raw.tlIsApproved || 0),
    tlIsDeclined: Number(meta.tlIsDeclined || raw.tlIsDeclined || 0),
    tlRemarks: meta.tlRemarks || raw.tlRemarks || "",

    omIsApproved: Number(meta.omIsApproved || raw.omIsApproved || 0),
    omIsDeclined: Number(meta.omIsDeclined || raw.omIsDeclined || 0),
    omRemarks: meta.omRemarks || raw.omRemarks || "",

    somIsApproved: Number(meta.somIsApproved || raw.somIsApproved || 0),
    somIsDeclined: Number(meta.somIsDeclined || raw.somIsDeclined || 0),
    somRemarks: meta.somRemarks || raw.somRemarks || "",
  };
}

function getApprovalSteps(request) {
  const meta = request?.meta || {};

  return [
    {
      key: "tl",
      label: "TL / Manager",
      hidden: !!meta.hideTl,
      name: meta.tlFullName || meta.tlSibsId || "--",
      sibsId: meta.tlSibsId || "",
      approved: Number(meta.tlIsApproved || 0) === 1,
      declined: Number(meta.tlIsDeclined || 0) === 1,
      remarks: meta.tlRemarks || "",
      personallySpoken: meta.tlPersonallySpoken || "",
      employeeRetained: meta.tlEmployeeRetained || "",
      actionTaken: meta.tlActionTaken || "",
    },
    {
      key: "om",
      label: "OM",
      hidden: false,
      name: meta.omFullName || meta.omSibsId || "--",
      sibsId: meta.omSibsId || "",
      approved: Number(meta.omIsApproved || 0) === 1,
      declined: Number(meta.omIsDeclined || 0) === 1,
      remarks: meta.omRemarks || "",
      personallySpoken: meta.omPersonallySpoken || "",
      employeeRetained: meta.omEmployeeRetained || "",
      actionTaken: meta.omActionTaken || "",
    },
    {
      key: "som",
      label: "SOM",
      hidden: false,
      name: meta.somFullName || meta.somSibsId || "--",
      sibsId: meta.somSibsId || "",
      approved: Number(meta.somIsApproved || 0) === 1,
      declined: Number(meta.somIsDeclined || 0) === 1,
      remarks: meta.somRemarks || "",
      personallySpoken: meta.somPersonallySpoken || "",
      employeeRetained: meta.somEmployeeRetained || "",
      actionTaken: meta.somActionTaken || "",
    },
  ].filter((step) => !step.hidden);
}

function getStepStatus(step) {
  if (step.declined) return "Rejected";
  if (step.approved) return "Approved";
  return "Pending";
}

function getActiveApprovalStepKey(request) {
  const steps = getApprovalSteps(request);
  const activeStep = steps.find((step) => !step.approved && !step.declined);
  return activeStep?.key || "";
}

function isResignationRequest(request) {
  return (
    String(request?.type || "").toLowerCase() === "resignation" ||
    String(request?.source || "").toLowerCase().includes("resignation") ||
    String(request?.id || "").startsWith("RES")
  );
}

export default function ApprovalRequest() {
  const [activeModule, setActiveModule] = useState("Attrition");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Default to Resignation so supervisor-filed resignations are immediately visible here.
  const [typeFilter, setTypeFilter] = useState("Resignation");

  const [requests, setRequests] = useState([]);
  const [counts, setCounts] = useState(DEFAULT_COUNTS);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 200,
  });

  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const [decisionModal, setDecisionModal] = useState({
    open: false,
    action: "",
    request: null,
    remarks: "",
    personallySpoken: "",
    employeeRetained: "No",
    actionTaken: "",
    loading: false,
  });

  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  const typeOptions = TYPE_OPTIONS_BY_MODULE[activeModule] || ["All"];

  const hasActiveFilters =
    search || statusFilter !== "All" || typeFilter !== "All";

  const loadApprovalRequests = useCallback(
    async ({ showError = false } = {}) => {
      try {
        setLoading(true);

        const result = await getApprovalRequestsByModule(activeModule, {
          page: 1,
          search,
          status: statusFilter === "All" ? "" : statusFilter,
          type: typeFilter === "All" ? "" : typeFilter,
          limit: 200,
        });

        if (!result?.success) {
          setRequests([]);
          setCounts(DEFAULT_COUNTS);
          setPagination({
            total: 0,
            totalPages: 1,
            currentPage: 1,
            limit: 200,
          });

          if (showError) {
            setStatusModal({
              open: true,
              type: "error",
              title: "Load Failed",
              message:
                result?.message || "Failed to load approval request records.",
            });
          }

          return;
        }

        const data = Array.isArray(result.data) ? result.data : [];

        setRequests(data);
        setCounts(result.counts || DEFAULT_COUNTS);
        setPagination(
          result.pagination || {
            total: data.length,
            totalPages: 1,
            currentPage: 1,
            limit: 200,
          },
        );
      } catch (error) {
        console.error("LOAD APPROVAL REQUESTS ERROR:", error);

        setRequests([]);
        setCounts(DEFAULT_COUNTS);
        setPagination({
          total: 0,
          totalPages: 1,
          currentPage: 1,
          limit: 200,
        });

        if (showError) {
          setStatusModal({
            open: true,
            type: "error",
            title: "Load Failed",
            message:
              error?.response?.data?.message ||
              error?.response?.data?.error ||
              error?.message ||
              "Something went wrong while loading approval requests.",
          });
        }
      } finally {
        setLoading(false);
      }
    },
    [activeModule, search, statusFilter, typeFilter],
  );

  useEffect(() => {
    loadApprovalRequests();
  }, [loadApprovalRequests]);

  function handleClearFilters() {
    setSearch("");
    setStatusFilter("All");
    setTypeFilter(activeModule === "Attrition" ? "Resignation" : "All");
  }

  function handleChangeModule(moduleName) {
    setActiveModule(moduleName);
    setSearch("");
    setStatusFilter("All");
    setTypeFilter(moduleName === "Attrition" ? "Resignation" : "All");
    setSelectedRequest(null);
  }

  function handleRefresh() {
    loadApprovalRequests({ showError: true });
  }

  function openStatus({ type = "success", title = "", message = "" }) {
    setStatusModal({
      open: true,
      type,
      title,
      message,
    });
  }

  function closeStatusModal() {
    setStatusModal({
      open: false,
      type: "success",
      title: "",
      message: "",
    });
  }

  function openDecisionModal(request, action) {
    setSelectedRequest(null);

    setDecisionModal({
      open: true,
      action,
      request,
      remarks: "",
      personallySpoken: "",
      employeeRetained: "No",
      actionTaken: "",
      loading: false,
    });
  }

  function closeDecisionModal() {
    if (decisionModal.loading) return;

    setDecisionModal({
      open: false,
      action: "",
      request: null,
      remarks: "",
      personallySpoken: "",
      employeeRetained: "No",
      actionTaken: "",
      loading: false,
    });
  }

  async function handleSubmitDecision(e) {
    e.preventDefault();

    const action = decisionModal.action;
    const request = decisionModal.request;

    if (!request) return;

    if (action === "reject" && !String(decisionModal.remarks || "").trim()) {
      openStatus({
        type: "error",
        title: "Remarks Required",
        message: "Please enter remarks before rejecting this approval request.",
      });

      return;
    }

    if (isResignationRequest(request)) {
      if (!decisionModal.personallySpoken) {
        openStatus({
          type: "error",
          title: "Required Field",
          message:
            "Please select if you have personally spoken to the resigning employee.",
        });

        return;
      }

      if (!decisionModal.employeeRetained) {
        openStatus({
          type: "error",
          title: "Required Field",
          message: "Please select if the employee was retained.",
        });

        return;
      }

      if (
        decisionModal.personallySpoken === "Yes" &&
        !String(decisionModal.actionTaken || "").trim()
      ) {
        openStatus({
          type: "error",
          title: "Required Field",
          message: "Please enter what you have done.",
        });

        return;
      }
    }

    const requestId = getRawRequestId(request);

    if (!requestId) {
      openStatus({
        type: "error",
        title: "Invalid Request",
        message: "Approval request ID is missing.",
      });

      return;
    }

    try {
      setDecisionModal((prev) => ({
        ...prev,
        loading: true,
      }));

      const payload = buildApprovalPayload(request, action, decisionModal.remarks, {
        personallySpoken: decisionModal.personallySpoken,
        employeeRetained: decisionModal.employeeRetained,
        actionTaken: decisionModal.actionTaken,
      });

      const result =
        action === "approve"
          ? await approveRequestByModule(activeModule, requestId, payload)
          : await rejectRequestByModule(activeModule, requestId, payload);

      if (!result?.success) {
        throw new Error(
          result?.message ||
            `Failed to ${action === "approve" ? "approve" : "reject"} request.`,
        );
      }

      setDecisionModal({
        open: false,
        action: "",
        request: null,
        remarks: "",
        personallySpoken: "",
        employeeRetained: "No",
        actionTaken: "",
        loading: false,
      });

      await loadApprovalRequests();

      openStatus({
        type: "success",
        title: action === "approve" ? "Request Approved" : "Request Rejected",
        message:
          result?.message ||
          `Approval request has been ${
            action === "approve" ? "approved" : "rejected"
          } successfully.`,
      });
    } catch (error) {
      console.error("SUBMIT APPROVAL DECISION ERROR:", error);

      setDecisionModal((prev) => ({
        ...prev,
        loading: false,
      }));

      openStatus({
        type: "error",
        title: "Update Failed",
        message:
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong while updating the approval request.",
      });
    }
  }

  const frontendFilteredRequests = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return requests.filter((request) => {
      const status = normalizeStatus(request.status);

      const searchableText = [
        request.id,
        request.rawId,
        request.module,
        request.title,
        request.requester,
        request.employeeName,
        request.employeeSibsId,
        request.department,
        request.type,
        request.priority,
        status,
        request.approver,
        request.reason,
        request.remarks,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !keyword || searchableText.includes(keyword);
      const matchesStatus = statusFilter === "All" || status === statusFilter;
      const matchesType = typeFilter === "All" || request.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [requests, search, statusFilter, typeFilter]);

  return (
    <div className="flex h-screen flex-1 flex-col bg-sibs-tertiary-10 font-jakarta">
      <Header />

      <main className="min-w-0 flex-1 overflow-y-scroll overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">
        <div className="sibs-page-header-in mb-6 flex min-w-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
              <MessageSquareText size={14} />
              Communication
            </div>

            <h1 className="mt-3 text-2xl font-extrabold text-sibs-primary-1 sm:text-3xl">
              Approval Request
            </h1>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Review resignation approvals filed by direct supervisors and
              manage other HRIS module approvals.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:opacity-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <RefreshCcw size={17} />
            )}
            Refresh
          </button>
        </div>

        <div className="space-y-6">
          <div className="relative z-[20] sibs-profile-tab-panel">
            <ApprovalSummaryCards
              stats={counts}
              activeModule={activeModule}
              loading={loading}
            />
          </div>

          <div className="relative z-[10] sibs-profile-tab-panel">
            <ApprovalSearchTable
              search={search}
              setSearch={setSearch}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              typeFilter={typeFilter}
              setTypeFilter={setTypeFilter}
              typeOptions={typeOptions}
              hasActiveFilters={hasActiveFilters}
              onClearFilters={handleClearFilters}
            />
          </div>

          <div className="relative z-[0] sibs-profile-tab-panel">
            <ApprovalRequestTable
              activeModule={activeModule}
              requests={frontendFilteredRequests}
              totalRecords={pagination?.total || requests.length}
              moduleCounts={counts}
              loading={loading}
              onView={setSelectedRequest}
              onChangeModule={handleChangeModule}
            />
          </div>
        </div>
      </main>

      <ViewApprovalRequestModal
        open={!!selectedRequest}
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
        onApprove={() => openDecisionModal(selectedRequest, "approve")}
        onReject={() => openDecisionModal(selectedRequest, "reject")}
      />

      <DecisionModal
        open={decisionModal.open}
        action={decisionModal.action}
        request={decisionModal.request}
        remarks={decisionModal.remarks}
        personallySpoken={decisionModal.personallySpoken}
        employeeRetained={decisionModal.employeeRetained}
        actionTaken={decisionModal.actionTaken}
        loading={decisionModal.loading}
        onChangeRemarks={(value) =>
          setDecisionModal((prev) => ({
            ...prev,
            remarks: value,
          }))
        }
        onChangePersonallySpoken={(value) =>
          setDecisionModal((prev) => ({
            ...prev,
            personallySpoken: value,
            actionTaken: value === "Yes" ? prev.actionTaken : "",
          }))
        }
        onChangeEmployeeRetained={(value) =>
          setDecisionModal((prev) => ({
            ...prev,
            employeeRetained: value,
          }))
        }
        onChangeActionTaken={(value) =>
          setDecisionModal((prev) => ({
            ...prev,
            actionTaken: value,
          }))
        }
        onClose={closeDecisionModal}
        onSubmit={handleSubmitDecision}
      />

      <StatusModal
        open={statusModal.open}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        onClose={closeStatusModal}
      />
    </div>
  );
}

function ApprovalSearchTable({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter,
  typeOptions,
  hasActiveFilters,
  onClearFilters,
}) {
  return (
    <div className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_240px_240px] xl:items-end">
        <div>
          <label className="mb-1 block text-sm font-bold text-[#101828]">
            Search
          </label>

          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search request, requester, department, type, status, approver..."
              className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 pl-11 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
            />
          </div>
        </div>

        <CustomSelect
          label="Approval Status"
          value={statusFilter}
          options={STATUS_OPTIONS}
          allLabel="All Status"
          onChange={setStatusFilter}
        />

        <CustomSelect
          label="Request Type"
          value={typeFilter}
          options={typeOptions}
          allLabel="All Types"
          onChange={setTypeFilter}
        />
      </div>

      {hasActiveFilters && (
        <div className="mt-4">
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex rounded-full border border-[#E6ECF2] bg-white px-3 py-1 text-xs font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}

function ApprovalSummaryCards({ stats, activeModule, loading }) {
  const normalizedStats = {
    ...DEFAULT_COUNTS,
    ...(stats || {}),
  };

  const cards = [
    {
      title: "Total Requests",
      value: normalizedStats.total,
      icon: FileCheck2,
      className: "bg-blue-50 text-sibs-primary-1",
    },
    {
      title: "Pending",
      value: normalizedStats.pending,
      icon: Clock3,
      className: "bg-amber-50 text-amber-700",
    },
    {
      title: "For Review",
      value: normalizedStats.forReview,
      icon: AlertCircle,
      className: "bg-cyan-50 text-cyan-700",
    },
    {
      title: "Approved",
      value: normalizedStats.approved,
      icon: CheckCircle2,
      className: "bg-emerald-50 text-emerald-700",
    },
    {
      title: "Rejected",
      value: normalizedStats.rejected,
      icon: XCircle,
      className: "bg-red-50 text-red-700",
    },
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white shadow-sm">
      <div className="border-b border-[#E6ECF2] p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
              <FileCheck2 size={14} />
              Approval Overview
            </div>

            <h2 className="mt-3 text-lg font-extrabold text-sibs-primary-1">
              {activeModule} Summary
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Quick overview of pending, reviewed, approved, and rejected
              approval requests for the selected module.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 py-3 text-sm font-bold text-[#344054]">
            {loading && <Loader2 size={15} className="animate-spin" />}
            Records: {normalizedStats.total}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-5">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm transition hover:bg-[#FAFBFC] hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
                    {card.title}
                  </p>

                  <p className="mt-2 text-2xl font-extrabold text-sibs-primary-1">
                    {loading ? "..." : card.value}
                  </p>
                </div>

                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${card.className}`}
                >
                  <Icon size={21} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ApprovalModuleTabs({ activeModule, onChangeModule, moduleCounts }) {
  return (
    <div className="border-t border-[#E6ECF2] bg-white px-4 sm:px-5">
      <div className="flex min-w-0 gap-8 overflow-x-auto">
        {REQUEST_MODULES.map((moduleName) => {
          const isActive = activeModule === moduleName;
          const ModuleIcon = moduleIconMap[moduleName] || FileCheck2;
          const count = isActive ? moduleCounts?.total || 0 : "";

          return (
            <button
              key={moduleName}
              type="button"
              onClick={() => onChangeModule(moduleName)}
              className={`relative inline-flex h-14 shrink-0 items-center justify-center gap-2 border-b-2 px-1 text-sm font-extrabold transition ${
                isActive
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-[#344054] hover:border-[#D0D5DD] hover:text-sibs-primary-1"
              }`}
            >
              <ModuleIcon
                size={16}
                strokeWidth={2.4}
                className={isActive ? "text-blue-600" : "text-sibs-tertiary-5"}
              />

              <span>{moduleName}</span>

              {isActive && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-100 px-1.5 text-[10px] font-extrabold text-blue-700">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ApprovalRequestTable({
  activeModule,
  requests,
  totalRecords,
  moduleCounts,
  loading,
  onView,
  onChangeModule,
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white shadow-sm">
      <div className="border-b border-[#E6ECF2] p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
              <ListChecks size={14} />
              Request List
            </div>

            <h2 className="mt-3 text-lg font-extrabold text-sibs-primary-1">
              Approval Requests
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Review submitted approval requests and check their current
              approval status.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 py-3 text-sm font-bold text-[#344054]">
            {loading && <Loader2 size={15} className="animate-spin" />}
            Showing: {requests.length} / {totalRecords}
          </div>
        </div>
      </div>

      <ApprovalModuleTabs
        activeModule={activeModule}
        onChangeModule={onChangeModule}
        moduleCounts={moduleCounts}
      />

      <div className="p-4 sm:p-5">
        <div className="hidden lg:block">
          <div className="max-h-[670px] overflow-auto sibs-scrollbar">
            <table className="w-full min-w-[1300px] border-separate border-spacing-0 overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white text-left">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#F5F7FA] text-xs font-bold uppercase tracking-wide text-[#174A7C]">
                  <th className="px-5 py-4 text-left align-top first:rounded-tl-2xl">
                    Request
                  </th>
                  <th className="px-5 py-4 text-left align-top">Requester</th>
                  <th className="px-5 py-4 text-center align-top">Type</th>
                  <th className="px-5 py-4 text-center align-top">
                    Date Requested
                  </th>
                  <th className="px-5 py-4 text-center align-top">Priority</th>
                  <th className="px-5 py-4 text-center align-top">Status</th>
                  <th className="px-5 py-4 text-left align-top">Approver</th>
                  <th className="px-5 py-4 text-right align-top last:rounded-tr-2xl">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      className="px-5 py-12 text-center text-sm font-bold text-gray-500"
                      colSpan={8}
                    >
                      <Loader2
                        size={28}
                        className="mx-auto mb-3 animate-spin text-sibs-primary-1"
                      />
                      Loading approval requests...
                    </td>
                  </tr>
                ) : requests.length === 0 ? (
                  <tr>
                    <td
                      className="px-5 py-12 text-center text-sm font-bold text-gray-500"
                      colSpan={8}
                    >
                      No approval requests found for {activeModule}.
                    </td>
                  </tr>
                ) : (
                  requests.map((request) => (
                    <ApprovalRequestRow
                      key={`${request.source || "request"}-${request.id}`}
                      request={request}
                      onView={() => onView(request)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="block lg:hidden">
          {loading ? (
            <div className="rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] px-5 py-10 text-center text-sm font-bold text-gray-500">
              <Loader2
                size={28}
                className="mx-auto mb-3 animate-spin text-sibs-primary-1"
              />
              Loading approval requests...
            </div>
          ) : requests.length === 0 ? (
            <div className="rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] px-5 py-10 text-center text-sm font-bold text-gray-500">
              No approval requests found for {activeModule}.
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <ApprovalRequestMobileCard
                  key={`${request.source || "request"}-${request.id}`}
                  request={request}
                  onView={() => onView(request)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ApprovalRequestRow({ request, onView }) {
  const status = normalizeStatus(request.status);
  const StatusIcon = getStatusIcon(status);

  return (
    <tr className="transition hover:bg-[#FAFBFC]">
      <td className="border-b border-[#E6ECF2] px-5 py-5">
        <p className="max-w-[260px] truncate text-sm font-extrabold text-[#101828]">
          {request.title || "--"}
        </p>

        <p className="mt-1 max-w-[260px] truncate text-xs font-semibold text-sibs-tertiary-5">
          {request.id || "--"}
        </p>
      </td>

      <td className="border-b border-[#E6ECF2] px-5 py-5">
        <p className="max-w-[220px] truncate text-sm font-bold text-[#344054]">
          {request.requester || request.employeeName || "--"}
        </p>

        <p className="mt-1 max-w-[220px] truncate text-xs font-semibold text-sibs-tertiary-5">
          {request.employeeSibsId || "--"} · {request.department || "--"}
        </p>
      </td>

      <td className="border-b border-[#E6ECF2] px-5 py-5 text-center">
        <span className="inline-flex rounded-full border border-[#E6ECF2] bg-[#F8FAFC] px-3 py-1 text-xs font-bold text-[#344054]">
          {request.type || "--"}
        </span>
      </td>

      <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-bold text-[#344054]">
        {formatDate(request.dateRequested || request.requestDate)}
      </td>

      <td className="border-b border-[#E6ECF2] px-5 py-5 text-center">
        <span
          className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getPriorityClass(
            request.priority,
          )}`}
        >
          {request.priority || "Normal"}
        </span>
      </td>

      <td className="border-b border-[#E6ECF2] px-5 py-5 text-center">
        <span
          className={`inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
            status,
          )}`}
        >
          <StatusIcon size={14} />
          {status || "--"}
        </span>
      </td>

      <td className="border-b border-[#E6ECF2] px-5 py-5">
        <p className="max-w-[220px] truncate text-sm font-bold text-[#344054]">
          {request.approver || "--"}
        </p>
      </td>

      <td className="border-b border-[#E6ECF2] px-5 py-5 text-right">
        <button
          type="button"
          onClick={onView}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 py-2 text-sm font-bold text-sibs-primary-1 transition hover:border-sibs-primary-1/30 hover:bg-[#F8FAFC] hover:shadow-sm active:scale-[0.98]"
        >
          <Eye size={16} />
          View
        </button>
      </td>
    </tr>
  );
}

function ApprovalRequestMobileCard({ request, onView }) {
  const status = normalizeStatus(request.status);
  const StatusIcon = getStatusIcon(status);

  return (
    <button
      type="button"
      onClick={onView}
      className="w-full rounded-2xl border border-[#E6ECF2] bg-white p-4 text-left shadow-sm transition hover:border-sibs-primary-1/40 hover:bg-[#F8FAFC] hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-extrabold leading-tight text-[#101828]">
            {request.title || "--"}
          </h3>

          <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
            {request.id || "--"}
          </p>
        </div>

        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusClass(
            status,
          )}`}
        >
          <StatusIcon size={12} />
          {status || "--"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <MobileMetric
          label="Requester"
          value={request.requester || request.employeeName}
        />
        <MobileMetric label="SIBS ID" value={request.employeeSibsId} />
        <MobileMetric label="Department" value={request.department} />
        <MobileMetric label="Module" value={request.module} />
        <MobileMetric label="Type" value={request.type} />
        <MobileMetric label="Priority" value={request.priority || "Normal"} />
        <MobileMetric
          label="Date Requested"
          value={formatDate(request.dateRequested || request.requestDate)}
        />
        <MobileMetric label="Approver" value={request.approver} />
      </div>

      <div className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 text-sm font-bold text-sibs-primary-1">
        <Eye size={16} />
        View Details
      </div>
    </button>
  );
}

function MobileMetric({ label, value }) {
  return (
    <div className="rounded-xl bg-[#F8FAFC] p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-extrabold text-sibs-primary-1">
        {value || "--"}
      </p>
    </div>
  );
}

function ViewApprovalRequestModal({
  open,
  request,
  onClose,
  onApprove,
  onReject,
}) {
  if (!open || !request) return null;

  const status = normalizeStatus(request.status);
  const canReview = request.canReview === true || request.raw?.canEdit === true;
  const isResignation = isResignationRequest(request);

  return createPortal(
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/45 p-4">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="shrink-0 border-b border-[#E6ECF2] bg-white px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#DDE5EF] text-sibs-primary-1">
                <FileText size={22} />
              </div>

              <div className="min-w-0">
                <h2 className="truncate text-xl font-extrabold text-sibs-primary-1">
                  {isResignation ? "View Resignation Approval" : request.title}
                </h2>

                <p className="mt-1 text-sm font-medium text-[#2F6CA5]">
                  {isResignation
                    ? "Resignation approval request details"
                    : `${request.title || "Approval Request"} details`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sibs-primary-1 transition hover:bg-[#F2F6FA] active:scale-[0.98]"
              aria-label="Close"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 sibs-scrollbar">
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormLikeBox
                label={isResignation ? "Resignation Date" : "Notice Date"}
                value={formatDate(request.dateRequested || request.requestDate)}
              />

              <FormLikeBox
                label="Last Working Date"
                value={formatDate(request.lastWorkingDate)}
              />
            </div>

            <ApprovalProcessCards
              request={request}
              canReview={canReview}
              onApprove={onApprove}
              onReject={onReject}
            />

            <FormLikeBox label="Reason" value={request.reason || "--"} large />

            {request.uploadedFileUrl && (
              <div>
                <p className="mb-2 text-sm font-bold text-sibs-primary-1">
                  Uploaded File
                </p>

                <a
                  href={getFileUrl(request.uploadedFileUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-[74px] items-center gap-3 rounded-xl border border-[#D6DEE8] bg-white px-4 py-3 text-sm font-semibold text-[#2F6CA5] transition hover:bg-[#F8FAFC]"
                >
                  <FileTypeMini filename={request.uploadedFile} />

                  <span className="min-w-0 truncate">
                    {request.uploadedFile || "Open Attachment"}
                  </span>
                </a>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FormLikeBox label="Status" value={status} />
              <FormLikeBox label="Source" value={request.source || "--"} />
              <FormLikeBox label="Raw ID" value={request.rawId || "--"} />
            </div>

            {request.remarks && (
              <FormLikeBox
                label="Request Remarks"
                value={request.remarks || "--"}
                large
              />
            )}
          </div>
        </div>

        <div className="shrink-0 border-t border-[#E6ECF2] bg-white px-6 py-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC] active:scale-[0.98]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function ApprovalProcessCards({ request, canReview, onApprove, onReject }) {
  const steps = getApprovalSteps(request);
  const activeStepKey = getActiveApprovalStepKey(request);

  if (!steps.length) return null;

  const gridColumnClass =
    steps.length === 1
      ? "md:grid-cols-1"
      : steps.length === 2
        ? "md:grid-cols-2"
        : "md:grid-cols-3";

  return (
    <div className={`grid grid-cols-1 gap-4 ${gridColumnClass}`}>
      {steps.map((step) => {
        const status = getStepStatus(step);
        const isActive = canReview && activeStepKey === step.key;
        const disabled = !isActive || status !== "Pending";

        return (
          <div
            key={step.key}
            className="rounded-xl bg-[#E8EDF3] p-4 text-sibs-primary-1"
          >
            <div className="mb-3 flex items-center gap-2">
              <UserRoundCheck size={17} />
              <p className="text-sm font-extrabold">{step.label}</p>
            </div>

            <p className="min-h-[44px] text-sm font-semibold leading-5 text-[#2F6CA5]">
              {step.name || "--"}
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onApprove}
                disabled={disabled}
                className={`inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-bold transition active:scale-[0.98] ${
                  isActive
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    : "cursor-not-allowed border-[#D6DEE8] bg-white text-[#667085] opacity-70"
                }`}
              >
                Approve
              </button>

              <button
                type="button"
                onClick={onReject}
                disabled={disabled}
                className={`inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-bold transition active:scale-[0.98] ${
                  isActive
                    ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                    : "cursor-not-allowed border-[#D6DEE8] bg-white text-[#667085] opacity-70"
                }`}
              >
                Decline
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2">
              <MiniInfo
                label="Personally Spoken"
                value={step.personallySpoken}
              />

              <MiniInfo
                label="Employee Retained"
                value={step.employeeRetained}
              />

              {step.personallySpoken === "Yes" && (
                <MiniInfo label="What Have You Done" value={step.actionTaken} />
              )}
            </div>

            <div className="mt-4">
              <p className="mb-2 text-sm font-bold text-sibs-primary-1">
                Remarks
              </p>

              <div className="min-h-[104px] rounded-xl bg-white px-4 py-3 text-sm font-medium leading-5 text-[#344054]">
                {step.remarks || (
                  <span className="text-[#98A2B3]">Enter remarks</span>
                )}
              </div>
            </div>

            <div className="mt-4">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-extrabold ${getStatusClass(
                  status,
                )}`}
              >
                {React.createElement(getStatusIcon(status), { size: 14 })}
                {status}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MiniInfo({ label, value }) {
  return (
    <div className="rounded-lg bg-white/80 px-3 py-2">
      <p className="text-[10px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
        {label}
      </p>

      <p className="mt-1 whitespace-pre-line text-xs font-bold text-sibs-primary-1">
        {safeText(value)}
      </p>
    </div>
  );
}

function FormLikeBox({ label, value, large = false }) {
  return (
    <div>
      <p className="mb-2 text-sm font-bold text-sibs-primary-1">{label}</p>

      <div
        className={`rounded-xl border border-[#D6DEE8] bg-white px-4 py-3 text-sm font-medium text-[#344054] ${
          large ? "min-h-[46px]" : "min-h-[43px]"
        }`}
      >
        {safeText(value)}
      </div>
    </div>
  );
}

function FileTypeMini({ filename }) {
  const ext = String(filename || "").split(".").pop()?.toLowerCase();

  const isImage = ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext);
  const isPdf = ext === "pdf";
  const isExcel = ["xls", "xlsx", "csv"].includes(ext);
  const isWord = ["doc", "docx"].includes(ext);

  const label = isImage
    ? "IMG"
    : isPdf
      ? "PDF"
      : isExcel
        ? "XLS"
        : isWord
          ? "DOC"
          : "FILE";

  const badgeClass = isImage
    ? "bg-purple-600"
    : isPdf
      ? "bg-red-600"
      : isExcel
        ? "bg-green-600"
        : isWord
          ? "bg-blue-600"
          : "bg-gray-600";

  return (
    <div className="relative h-12 w-10 shrink-0">
      <div className="absolute inset-0 rounded-md border-2 border-gray-300 bg-white" />
      <div className="absolute right-0 top-0 h-3 w-3 border-b-2 border-l-2 border-gray-300 bg-gray-100" />
      <div className="absolute left-1 top-1/2 h-0.5 w-6 -translate-y-1/2 bg-gray-300" />
      <div className="absolute left-1 top-[60%] h-0.5 w-5 bg-gray-300" />

      <div
        className={`absolute bottom-1 left-[-8px] rounded-md px-2 py-1 text-[10px] font-bold leading-none text-white shadow-sm ${badgeClass}`}
      >
        {label}
      </div>
    </div>
  );
}

function DecisionModal({
  open,
  action,
  request,
  remarks,
  personallySpoken,
  employeeRetained,
  actionTaken,
  loading,
  onChangeRemarks,
  onChangePersonallySpoken,
  onChangeEmployeeRetained,
  onChangeActionTaken,
  onClose,
  onSubmit,
}) {
  if (!open || !request) return null;

  const isApprove = action === "approve";
  const requestStatus = normalizeStatus(request.status);
  const isResignation = isResignationRequest(request);

  return createPortal(
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={onSubmit}
        className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white shadow-2xl"
      >
        <div className="shrink-0 border-b border-[#E6ECF2] bg-white px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="truncate text-2xl font-extrabold uppercase tracking-tight text-sibs-primary-1">
                {isApprove ? "Approve Request" : "Reject Request"}
              </h2>

              <p className="mt-1 truncate text-sm font-semibold text-[#2F6CA5]">
                {request.id || "--"} / {request.title || request.type || "--"}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sibs-tertiary-5 transition hover:bg-[#F2F6FA] hover:text-sibs-primary-1 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Close"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 sibs-scrollbar">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">
            <div className="space-y-5">
              <div className="rounded-2xl border border-[#D9E2EC] bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#174A7C]">
                      Request
                    </p>

                    <h3 className="mt-2 truncate text-xl font-extrabold text-[#101828]">
                      {request.title || "Approval Request"}
                    </h3>

                    <p className="mt-2 text-sm font-bold text-[#2F6CA5]">
                      {request.requester || request.employeeName || "--"}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                          requestStatus,
                        )}`}
                      >
                        {React.createElement(getStatusIcon(requestStatus), {
                          size: 14,
                        })}
                        {requestStatus}
                      </span>

                      <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-[#174A7C]">
                        {request.type || "--"}
                      </span>
                    </div>
                  </div>

                  <div className="flex h-24 w-32 shrink-0 flex-col items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-center">
                    <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#174A7C]">
                      Action
                    </p>

                    <p
                      className={`mt-2 text-2xl font-extrabold ${
                        isApprove ? "text-emerald-700" : "text-red-700"
                      }`}
                    >
                      {isApprove ? "✓" : "×"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <DecisionInfoBox label="Request ID" value={request.id || "--"} />
                <DecisionInfoBox label="Request Type" value={request.type || "--"} />
                <DecisionInfoBox
                  label="Requester"
                  value={request.requester || request.employeeName || "--"}
                />
                <DecisionInfoBox
                  label="SIBS ID"
                  value={request.employeeSibsId || "--"}
                />
                <DecisionInfoBox
                  label="Date Requested"
                  value={formatDate(request.dateRequested || request.requestDate)}
                />
                <DecisionInfoBox
                  label="Last Working Date"
                  value={formatDate(request.lastWorkingDate)}
                />
                <DecisionInfoBox
                  label="Current Approver"
                  value={request.approver || "--"}
                />
                <DecisionInfoBox
                  label="Priority"
                  value={request.priority || "Normal"}
                />
                <DecisionInfoBox label="Source" value={request.source || "--"} />
              </div>

              {isResignation && (
                <div className="rounded-2xl border border-[#D9E2EC] bg-white p-5 shadow-sm">
                  <h3 className="text-base font-extrabold text-sibs-primary-1">
                    Resignation Approval Questions
                  </h3>

                  <p className="mt-2 text-sm font-medium text-sibs-tertiary-5">
                    Complete the required decision details before submitting.
                  </p>

                  <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2 md:items-start">
                    <div className="flex h-full flex-col">
                      <label className="mb-3 min-h-[40px] text-xs font-extrabold uppercase leading-5 tracking-wide text-sibs-primary-1">
                        Have you personally spoken to the resigning employee?{" "}
                        <span className="text-red-500">*</span>
                      </label>

                      <select
                        value={personallySpoken}
                        onChange={(e) =>
                          onChangePersonallySpoken(e.target.value)
                        }
                        className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-bold text-sibs-primary-1 outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                        required
                      >
                        <option value="">Select answer</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>

                    <div className="flex h-full flex-col">
                      <label className="mb-3 min-h-[40px] text-xs font-extrabold uppercase leading-5 tracking-wide text-sibs-primary-1">
                        Was the employee retained (Y/N)?{" "}
                        <span className="text-red-500">*</span>
                      </label>

                      <select
                        value={employeeRetained}
                        onChange={(e) =>
                          onChangeEmployeeRetained(e.target.value)
                        }
                        className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-bold text-sibs-primary-1 outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                        required
                      >
                        <option value="">Select answer</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                  </div>

                  {personallySpoken === "Yes" && (
                    <div className="mt-6">
                      <label className="mb-3 block text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                        What have you done?{" "}
                        <span className="text-red-500">*</span>
                      </label>

                      <textarea
                        value={actionTaken}
                        onChange={(e) => onChangeActionTaken(e.target.value)}
                        rows={4}
                        placeholder="Enter action taken..."
                        className="w-full resize-none rounded-xl border border-[#D0D5DD] bg-white px-4 py-3 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                        required
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="rounded-2xl border border-[#D9E2EC] bg-white p-5 shadow-sm">
                <label className="mb-3 block text-sm font-extrabold text-[#101828]">
                  Remarks {isApprove ? "(optional)" : "(required)"}
                </label>

                <textarea
                  value={remarks}
                  onChange={(e) => onChangeRemarks(e.target.value)}
                  rows={5}
                  placeholder={
                    isApprove
                      ? "Add approval remarks..."
                      : "Enter reason for rejecting..."
                  }
                  className="w-full resize-none rounded-xl border border-[#D0D5DD] bg-white px-4 py-3 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                />
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl border border-[#D9E2EC] bg-white p-5 shadow-sm">
                <h3 className="text-base font-extrabold text-sibs-primary-1">
                  Approval Checklist
                </h3>

                <div className="mt-4 space-y-3">
                  <DecisionChecklistItem
                    done
                    title="Request selected"
                    subtitle={request.id || "--"}
                  />

                  {isResignation && (
                    <>
                      <DecisionChecklistItem
                        done={!!personallySpoken}
                        title="Personally spoken answer"
                        subtitle={personallySpoken || "Waiting for answer"}
                      />

                      <DecisionChecklistItem
                        done={!!employeeRetained}
                        title="Employee retained answer"
                        subtitle={employeeRetained || "Waiting for answer"}
                      />

                      <DecisionChecklistItem
                        done={
                          personallySpoken !== "Yes" ||
                          !!String(actionTaken || "").trim()
                        }
                        title="Action taken details"
                        subtitle={
                          personallySpoken === "Yes"
                            ? actionTaken || "Required"
                            : "Not required"
                        }
                      />
                    </>
                  )}

                  <DecisionChecklistItem
                    done={isApprove || !!String(remarks || "").trim()}
                    title="Decision remarks"
                    subtitle={
                      isApprove
                        ? remarks || "Optional"
                        : remarks || "Required for rejection"
                    }
                  />
                </div>
              </div>

              <div
                className={`rounded-2xl border p-5 ${
                  isApprove
                    ? "border-emerald-100 bg-emerald-50"
                    : "border-red-100 bg-red-50"
                }`}
              >
                <h3
                  className={`text-base font-extrabold ${
                    isApprove ? "text-emerald-800" : "text-red-800"
                  }`}
                >
                  Approval Rule
                </h3>

                <p
                  className={`mt-3 text-sm font-medium leading-6 ${
                    isApprove ? "text-emerald-800/80" : "text-red-800/80"
                  }`}
                >
                  This approval decision will be recorded under your assigned
                  approval level. The request will move to the next approver
                  after approval, or stop the workflow if rejected.
                </p>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                <h3 className="text-base font-extrabold text-sibs-primary-1">
                  Request Reason
                </h3>

                <p className="mt-3 whitespace-pre-line text-sm font-medium leading-6 text-[#344054]">
                  {request.reason || "--"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-[#E6ECF2] bg-white px-6 py-5">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white px-6 text-sm font-extrabold text-sibs-primary-1 transition hover:bg-[#F8FAFC] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-6 text-sm font-extrabold text-white transition hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${
                isApprove
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {loading ? (
                <Loader2 size={17} className="animate-spin" />
              ) : isApprove ? (
                <CheckCircle2 size={17} />
              ) : (
                <XCircle size={17} />
              )}

              {isApprove ? "Approve" : "Reject"}
            </button>
          </div>
        </div>
      </form>
    </div>,
    document.body,
  );
}

function DecisionInfoBox({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#E6ECF2] bg-white p-4">
      <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#174A7C]">
        {label}
      </p>

      <p className="mt-2 whitespace-pre-line text-sm font-extrabold leading-6 text-[#344054]">
        {value || "--"}
      </p>
    </div>
  );
}

function DecisionChecklistItem({ done = false, title, subtitle }) {
  return (
    <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
            done
              ? "border-emerald-500 bg-emerald-50 text-emerald-600"
              : "border-amber-500 bg-amber-50 text-amber-600"
          }`}
        >
          {done ? <CheckCircle2 size={14} /> : <Clock3 size={14} />}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-extrabold text-[#101828]">{title}</p>

          <p className="mt-1 line-clamp-2 text-xs font-bold text-[#2F6CA5]">
            {subtitle || "—"}
          </p>
        </div>
      </div>
    </div>
  );
}