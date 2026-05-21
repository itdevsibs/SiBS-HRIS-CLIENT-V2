import React, { useEffect, useMemo, useState } from "react";

import Header from "../../components/layout/Header";
import StatusModal from "@/components/modals/StatusModal";
import AddHiringNeedsModal from "@/components/modals/hiringNeeds/AddHiringNeedsModal";
import ViewHiringNeedsModal from "@/components/modals/hiringNeeds/ViewHiringNeedsModal";
import {
  createHiringNeed,
  getHiringNeedJobDescriptions,
  getHiringNeeds,
} from "@/lib/axios/getHiringNeeds";
import HiringSearchTable from "@/components/tables/HiringNeeds/HiringSearchTable";
import PRSummaryTable from "@/components/tables/HiringNeeds/PRSummaryTable";
import ReasonForHiringTable from "@/components/tables/HiringNeeds/ReasonForHiringTable";
import HiringNeedsDataTable from "@/components/tables/HiringNeeds/HiringNeedsDataTable";

import { useUser } from "@/services/context/UserContext";

import { FileText, Plus } from "lucide-react";

function getTodayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatPersonName(value) {
  const rawValue = String(value || "").trim();

  if (!rawValue) return "";

  if (rawValue.includes("@")) {
    const localPart = rawValue.split("@")[0] || "";

    return localPart
      .replace(/[._-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
  }

  return rawValue;
}

function getUserDisplayName(user) {
  const possibleName =
    user?.fullName ||
    user?.fullname ||
    user?.name ||
    user?.employeeName ||
    user?.gy_emp_fullname ||
    user?.displayName ||
    user?.username ||
    user?.email ||
    user?.userEmail ||
    user?.workEmail ||
    "Alena Batacan";

  return formatPersonName(possibleName) || "Alena Batacan";
}

const reasonForHiringOptions = [
  "New Position",
  "Ramp-up",
  "Forecasted Growth",
];

const initialForm = {
  jobDescriptionDbId: "",
  positionTitle: "",
  departmentAccount: "",
  accountId: "",
  departmentId: "",
  jobDescriptionId: "",
  jobDescriptionCode: "",
  jobDescriptionTitle: "",
  headcount: "",
  reasonForHiring: "",
  assignment: "Probationary",
  assignmentOther: "",
  locationSite: "Davao Site",
  dateNeeded: "",
  preparedBy: "",
  preparedById: "",
  approvalStatus: "For Approval",
};

const fallbackPersonnelRequisitions = [
  {
    id: "PRF-2026-001",
    positionTitle: "Customer Service Representative",
    departmentAccount: "Operations / Customer Support",
    jobDescriptionId: "",
    jobDescriptionTitle: "Customer Service Representative",
    headcount: 10,
    reasonForHiring: "Ramp-up",
    assignment: "Probationary",
    assignmentOther: "",
    locationSite: "Davao Site",
    dateNeeded: getTodayISO(),
    preparedBy: "System User",
    approvalStatus: "For Approval",
    approvalDate: "",
    createdAt: getTodayISO(),
  },
];

function normalizeStatus(status) {
  if (!status) return "For Approval";

  if (status === "Pending") return "For Approval";
  if (status === "For Validation") return "For Approval";
  if (status === "Under Review") return "For Approval";
  if (status === "Approved") return "Approved";
  if (status === "Rejected") return "Not Approved";
  if (status === "Not Approved") return "Not Approved";

  return status;
}

function normalizeItem(item) {
  const jd = item.jobDescription;

  const jobDescriptionTitle =
    item.jobDescriptionTitle ||
    item.job_description_title ||
    item.jdRoleTitle ||
    item.jd_role_title ||
    item.jdTitle ||
    item.jd_title ||
    item.jobDescriptionName ||
    item.job_description_name ||
    (jd && typeof jd === "object"
      ? jd.roleTitle || jd.role_title || jd.title || jd.jd_title
      : "") ||
    "";

  const jobDescriptionText =
    typeof jd === "string"
      ? jd
      : item.jdCode && jobDescriptionTitle
      ? `${item.jdCode} — ${jobDescriptionTitle}`
      : jobDescriptionTitle;

  return {
    ...item,
    id: item.id || item.prfId || item.prf_id || item.requisitionId || "—",

    positionTitle:
      item.positionTitle ||
      item.position_title ||
      item.roleTitle ||
      item.role_title ||
      "",

    departmentAccount:
      item.departmentAccount ||
      item.department_account ||
      (item.department && item.account
        ? `${item.department} / ${item.account}`
        : item.department || item.account || "") ||
      "",

    accountId: item.accountId || item.account_id || "",
    departmentId: item.departmentId || item.department_id || "",

    jobDescriptionId:
      item.jobDescriptionId ||
      item.job_description_id ||
      item.jdId ||
      item.jd_id ||
      "",

    jobDescriptionTitle,
    jobDescriptionText,

    headcount:
      item.headcount ||
      item.approvedRequirement ||
      item.approved_requirement ||
      item.requiredHeadcount ||
      item.required_headcount ||
      "",

    reasonForHiring:
      item.reasonForHiring ||
      item.reason_for_hiring ||
      item.reason ||
      item.hiringReason ||
      item.hiring_reason ||
      "",

    assignment:
      item.assignment ||
      item.employmentType ||
      item.employment_type ||
      "Probationary",

    assignmentOther:
      item.assignmentOther ||
      item.assignment_other ||
      item.otherAssignment ||
      item.other_assignment ||
      "",

    locationSite:
      item.locationSite || item.location_site || item.site || item.location || "",

    dateNeeded:
      item.dateNeeded ||
      item.date_needed ||
      item.dueDate ||
      item.due_date ||
      item.requestedStartDate ||
      item.requested_start_date ||
      "",

    preparedBy: formatPersonName(
      item.preparedBy ||
        item.prepared_by ||
        item.hiringManager ||
        item.hiring_manager ||
        ""
    ),

    approvalStatus:
      item.approvalStatus ||
      item.approval_status ||
      item.status ||
      "For Approval",

    approvalDate:
      item.approvalDate ||
      item.approval_date ||
      item.approvedAt ||
      item.approved_at ||
      "",

    createdAt: item.createdAt || item.created_at || "",
  };
}

function isAdditionalRequest(item) {
  const text = [
    item?.intakeType,
    item?.type,
    item?.hiringType,
    item?.requestType,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return text.includes("additional request");
}

export default function HiringNeedsPage() {
  const { user } = useUser();
  const preparedByName = getUserDisplayName(user);

  const [list, setList] = useState([]);
  const [jobDescriptions, setJobDescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [jobDescriptionLoading, setJobDescriptionLoading] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [siteFilter, setSiteFilter] = useState("All");
  const [reasonFilter, setReasonFilter] = useState("All");

  const [form, setForm] = useState({
    ...initialForm,
    preparedBy: preparedByName,
    preparedById: user?.id || user?.userId || user?.gy_user_id || "",
  });

  useEffect(() => {
    fetchList();
    fetchJobDescriptions();
  }, []);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      preparedBy: preparedByName,
      preparedById: user?.id || user?.userId || user?.gy_user_id || "",
    }));
  }, [preparedByName, user]);

  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  async function fetchList() {
    setLoading(true);

    try {
      const res = await getHiringNeeds();

      if (res?.success && Array.isArray(res.data)) {
        setList(res.data);
      } else if (Array.isArray(res)) {
        setList(res);
      } else {
        setList(fallbackPersonnelRequisitions);
      }
    } catch (err) {
      console.error("GET PERSONNEL REQUISITIONS ERROR:", err);
      setList(fallbackPersonnelRequisitions);
    } finally {
      setLoading(false);
    }
  }

  async function fetchJobDescriptions() {
    setJobDescriptionLoading(true);

    try {
      const res = await getHiringNeedJobDescriptions();

      if (res?.success && Array.isArray(res.data)) {
        setJobDescriptions(res.data);
      } else if (Array.isArray(res)) {
        setJobDescriptions(res);
      } else {
        setJobDescriptions([]);
      }
    } catch (err) {
      console.error("GET JOB DESCRIPTIONS ERROR:", err);
      setJobDescriptions([]);
    } finally {
      setJobDescriptionLoading(false);
    }
  }

  function resetForm() {
    setForm({
      ...initialForm,
      preparedBy: preparedByName,
      preparedById: user?.id || user?.userId || user?.gy_user_id || "",
    });
  }

  function handleOpenCreateModal() {
    setForm({
      ...initialForm,
      preparedBy: preparedByName,
      preparedById: user?.id || user?.userId || user?.gy_user_id || "",
    });
    setShowCreateModal(true);
  }

  function handleCloseCreateModal() {
    setShowCreateModal(false);
    resetForm();
  }

  function showStatusModal(type, title, message) {
  setStatusModal({
    open: true,
    type,
    title,
    message,
  });
}

function closeStatusModal() {
  setStatusModal((prev) => ({
    ...prev,
    open: false,
  }));
}

  async function handleCreate(e) {
    e.preventDefault();

    if (!form.jobDescriptionDbId) {
      showStatusModal(
        "error",
        "Position Title Required",
        "Please select a Position Title from Job Description."
      );
      return;
    }

    if (!form.positionTitle.trim()) {
      showStatusModal(
        "error",
        "Position Title Required",
        "Position Title is required."
      );
      return;
    }

    if (!form.departmentAccount.trim()) {
      showStatusModal(
        "error",
        "Department / Account Required",
        "Department / Account is required."
      );
      return;
    }

    if (!form.headcount || Number(form.headcount) <= 0) {
      showStatusModal(
        "error",
        "Invalid Headcount",
        "Headcount must be greater than 0."
      );
      return;
    }

    if (!form.reasonForHiring) {
      showStatusModal(
        "error",
        "Reason Required",
        "Reason for Hiring is required."
      );
      return;
    }

    if (!reasonForHiringOptions.includes(form.reasonForHiring)) {
      showStatusModal(
        "error",
        "Invalid Reason",
        "Invalid Reason for Hiring selected."
      );
      return;
    }

    if (!form.assignment) {
      showStatusModal(
        "error",
        "Assignment Required",
        "Assignment is required."
      );
      return;
    }

    if (form.assignment === "Other" && !form.assignmentOther.trim()) {
      showStatusModal(
        "error",
        "Other Assignment Required",
        "Please enter Other assignment information."
      );
      return;
    }

    if (!form.locationSite) {
      showStatusModal(
        "error",
        "Location Required",
        "Location / Site is required."
      );
      return;
    }

    if (!form.dateNeeded) {
      showStatusModal(
        "error",
        "Date Needed Required",
        "Date Needed is required."
      );
      return;
    }

    try {
      const selectedJd = jobDescriptions.find((jd) => {
        return String(jd.id) === String(form.jobDescriptionDbId);
      });

      const payload = {
        jobDescriptionDbId: form.jobDescriptionDbId || null,
        job_description_db_id: form.jobDescriptionDbId || null,

        jobDescriptionId: form.jobDescriptionDbId || null,
        job_description_id: form.jobDescriptionDbId || null,

        jdCode: form.jobDescriptionCode || selectedJd?.jdCode || "",
        jd_code: form.jobDescriptionCode || selectedJd?.jdCode || "",

        positionTitle: form.positionTitle,
        position_title: form.positionTitle,
        roleTitle: form.positionTitle,
        role_title: form.positionTitle,

        departmentAccount: form.departmentAccount,
        department_account: form.departmentAccount,

        accountId: form.accountId || selectedJd?.accountId || null,
        account_id: form.accountId || selectedJd?.accountId || null,
        account: form.accountId || selectedJd?.accountId || null,

        departmentId: form.departmentId || selectedJd?.departmentId || null,
        department_id: form.departmentId || selectedJd?.departmentId || null,
        department: form.departmentId || selectedJd?.departmentId || null,

        jobDescriptionTitle:
          form.jobDescriptionTitle || selectedJd?.roleTitle || "",
        job_description_title:
          form.jobDescriptionTitle || selectedJd?.roleTitle || "",

        headcount: Number(form.headcount),
        approvedRequirement: Number(form.headcount),
        approved_requirement: Number(form.headcount),

        reasonForHiring: form.reasonForHiring,
        reason_for_hiring: form.reasonForHiring,
        reason: form.reasonForHiring,

        assignment: form.assignment,
        assignmentOther: form.assignment === "Other" ? form.assignmentOther : "",
        assignment_other: form.assignment === "Other" ? form.assignmentOther : "",

        locationSite: form.locationSite,
        location_site: form.locationSite,

        dateNeeded: form.dateNeeded,
        date_needed: form.dateNeeded,
        requestedStartDate: form.dateNeeded,
        requested_start_date: form.dateNeeded,
        dueDate: form.dateNeeded,
        due_date: form.dateNeeded,

        preparedBy: form.preparedBy,
        prepared_by: form.preparedBy,
        preparedById: form.preparedById,
        prepared_by_id: form.preparedById,
        hiringManager: form.preparedBy,
        hiring_manager: form.preparedBy,

        priority: "Medium",

        approvalStatus: "Pending",
        approval_status: "Pending",
      };

      const res = await createHiringNeed(payload);

      if (res?.success || res?.data || res?.id) {
        resetForm();
        setShowCreateModal(false);
        fetchList();

        showStatusModal(
          "success",
          "Personnel Requisition Created",
          "The hiring need was submitted successfully and is now for approval."
        );
      } else {
        showStatusModal(
          "error",
          "Submission Failed",
          res?.message || "Failed to create personnel requisition."
        );
      }
    } catch (err) {
      console.error("CREATE PERSONNEL REQUISITION ERROR:", err);

      showStatusModal(
        "error",
        "Submission Failed",
        err?.response?.data?.message || "Failed to create personnel requisition."
      );
    }
  }

  const normalizedList = useMemo(() => {
    return list
      .filter((item) => !isAdditionalRequest(item))
      .map((item) => normalizeItem(item));
  }, [list]);

  const filteredList = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return normalizedList.filter((item) => {
      const status = normalizeStatus(item.approvalStatus);

      const matchesSearch =
        !keyword ||
        String(item.id || "").toLowerCase().includes(keyword) ||
        String(item.positionTitle || "").toLowerCase().includes(keyword) ||
        String(item.departmentAccount || "").toLowerCase().includes(keyword) ||
        String(item.jobDescriptionTitle || "").toLowerCase().includes(keyword) ||
        String(item.jobDescriptionText || "").toLowerCase().includes(keyword) ||
        String(item.reasonForHiring || "").toLowerCase().includes(keyword) ||
        String(item.locationSite || "").toLowerCase().includes(keyword) ||
        String(item.preparedBy || "").toLowerCase().includes(keyword);

      const matchesStatus = statusFilter === "All" || status === statusFilter;
      const matchesSite =
        siteFilter === "All" || item.locationSite === siteFilter;
      const matchesReason =
        reasonFilter === "All" || item.reasonForHiring === reasonFilter;

      return matchesSearch && matchesStatus && matchesSite && matchesReason;
    });
  }, [normalizedList, search, statusFilter, siteFilter, reasonFilter]);

  const stats = useMemo(() => {
    const total = normalizedList.length;

    const forApproval = normalizedList.filter(
      (item) => normalizeStatus(item.approvalStatus) === "For Approval"
    ).length;

    const approved = normalizedList.filter(
      (item) => normalizeStatus(item.approvalStatus) === "Approved"
    ).length;

    const notApproved = normalizedList.filter(
      (item) => normalizeStatus(item.approvalStatus) === "Not Approved"
    ).length;

    const totalHeadcount = normalizedList.reduce(
      (sum, item) => sum + Number(item.headcount || 0),
      0
    );

    return {
      total,
      forApproval,
      approved,
      notApproved,
      totalHeadcount,
    };
  }, [normalizedList]);

  const requisitionByReason = useMemo(() => {
    const reasonMap = new Map();

    normalizedList.forEach((item) => {
      const reason = item.reasonForHiring || "Unspecified";
      reasonMap.set(reason, (reasonMap.get(reason) || 0) + 1);
    });

    const colors = ["#2563EB", "#06B6D4", "#22C55E", "#F97316", "#EF4444"];

    return Array.from(reasonMap.keys()).map((reason, index) => ({
      label: reason,
      value: reasonMap.get(reason),
      color: colors[index % colors.length],
    }));
  }, [normalizedList]);

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta">
      <Header />

      <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
        <div className="mx-auto max-w-[1600px] space-y-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                <FileText size={14} />
                Recruitment
              </div>

              <h1 className="mt-3 text-2xl font-extrabold text-sibs-primary-1 sm:text-3xl">
                Hiring Needs Intake
              </h1>

              <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                Create, review, and track personnel requisitions subject for
                approval.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--sibs-primary-1)] px-5 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
            >
              <Plus size={18} />
              New Personnel Requisition
            </button>
          </div>

          <HiringSearchTable
            search={search}
            setSearch={setSearch}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            siteFilter={siteFilter}
            setSiteFilter={setSiteFilter}
            reasonFilter={reasonFilter}
            setReasonFilter={setReasonFilter}
            reasonForHiringOptions={reasonForHiringOptions}
          />

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.9fr_1fr]">  
            <PRSummaryTable stats={stats} />

            <ReasonForHiringTable data={requisitionByReason} />
          </div>

          <HiringNeedsDataTable
            loading={loading}
            filteredList={filteredList}
            normalizedList={normalizedList}
            onView={setSelectedItem}
          />
        </div>
      </main>

      <AddHiringNeedsModal
        open={showCreateModal}
        form={form}
        setForm={setForm}
        jobDescriptions={jobDescriptions}
        jobDescriptionLoading={jobDescriptionLoading}
        reasonForHiringOptions={reasonForHiringOptions}
        onClose={handleCloseCreateModal}
        onSubmit={handleCreate}
        onReset={resetForm}
      />

      <ViewHiringNeedsModal
        open={!!selectedItem}
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
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