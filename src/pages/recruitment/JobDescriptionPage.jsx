import React, { useEffect, useMemo, useState } from "react";
import Header from "../../components/layout/Header";
import StatusModal from "../../components/modals/StatusModal";
import {
  getJobDescriptionDropdowns,
  getJobDescriptions,
  saveJobDescriptionRevision,
} from "../../lib/axios/jobDescription";
import { useUser } from "../../services/context/UserContext";
import { useJobDescription } from "../../services/context/JobDescriptionContext";
import {
  FileText,
  Plus,
  CheckCircle2,
  AlertTriangle,
  ClipboardList,
} from "lucide-react";
import JobDescriptionTable from "../../components/tables/jobDescription/JobDescriptionTable";
import AddDescriptionModal from "../../components/modals/jobDescription/AddJobDescription";
import ViewJobDescriptionModal from "../../components/modals/jobDescription/ViewJobDescriptionDetailsModal";
import ReviseJobDescriptionModal from "../../components/modals/jobDescription/ReviseJobDescriptionModal";

const emptyRevisionForm = {
  revisedBySibsId: "",
  revisedBy: "",
  revisionRemarks: "",
  description: "",
  responsibilities: "",
  qualifications: "",
};

function normalizeJdStatus(status) {
  if (status === "New JD") return "New Job Description";
  return status || "New Job Description";
}

function formatLoggedInOwner(user) {
  const sibsId = String(
    user?.username ||
      user?.sibs_id ||
      user?.gy_user_code ||
      user?.gy_emp_code ||
      user?.sibsId ||
      "",
  ).trim();

  const lastName = String(
    user?.gy_emp_lname || user?.lastName || user?.last_name || "",
  ).trim();

  const firstName = String(
    user?.gy_emp_fname || user?.firstName || user?.first_name || "",
  ).trim();

  const middleName = String(
    user?.gy_emp_mname || user?.middleName || user?.middle_name || "",
  ).trim();

  const fallbackName = String(
    user?.full_name ||
      user?.fullName ||
      user?.employee_name ||
      user?.name ||
      "",
  ).trim();

  const formattedName =
    lastName || firstName || middleName
      ? `${lastName}, ${firstName} ${middleName}`.replace(/\s+/g, " ").trim()
      : fallbackName;

  return {
    ownerSibsId: sibsId,
    owner: `${sibsId}${formattedName ? ` - ${formattedName}` : ""}`
      .trim()
      .toUpperCase(),
  };
}

function StatCard({ title, value, icon: Icon, description }) {
  const cardTheme = {
    "Total JD": {
      iconBg: "bg-[#F3F7FB]",
      iconText: "text-sibs-primary-1",
      valueText: "text-sibs-primary-1",
      descriptionText: "text-sibs-primary-1",
    },
    Existing: {
      iconBg: "bg-emerald-50",
      iconText: "text-emerald-600",
      valueText: "text-emerald-600",
      descriptionText: "text-emerald-600",
    },
    "For Revision": {
      iconBg: "bg-amber-50",
      iconText: "text-amber-500",
      valueText: "text-amber-600",
      descriptionText: "text-amber-600",
    },
    "New Job Description": {
      iconBg: "bg-[#F3F7FB]",
      iconText: "text-sibs-primary-1",
      valueText: "text-sibs-primary-1",
      descriptionText: "text-sibs-primary-1",
    },
  };

  const theme = cardTheme[title] || {
    iconBg: "bg-[#F3F7FB]",
    iconText: "text-sibs-primary-1",
    valueText: "text-sibs-primary-1",
    descriptionText: "text-sibs-primary-1",
  };

  return (
    <div className="flex min-w-0 items-center gap-4 rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${theme.iconBg} ${theme.iconText}`}
      >
        <Icon size={20} />
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-[#101828]">{title}</p>

        <h2
          className={`mt-1 text-3xl font-extrabold tracking-[0.18em] ${theme.valueText}`}
        >
          {value}
        </h2>

        {description && (
          <p
            className={`mt-1 truncate text-xs font-medium ${theme.descriptionText}`}
          >
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

export default function JobDescriptionPage() {
  const { user } = useUser();

  const {
    setAccounts,
    setDepartments,
    setRequestedByUsers,
    setDropdownLoading,
    setDropdownError,
  } = useJobDescription();

  const [jobDescriptionList, setJobDescriptionList] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [revisionItem, setRevisionItem] = useState(null);
  const [revisionForm, setRevisionForm] = useState(emptyRevisionForm);

  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  function showStatus({ type = "success", title, message }) {
    setStatusModal({
      open: true,
      type,
      title,
      message,
    });
  }

  function normalizeJobDescriptionItem(item) {
    return {
      ...item,
      jdStatus: normalizeJdStatus(item?.jdStatus),
      revisionHistory: Array.isArray(item?.revisionHistory)
        ? item.revisionHistory
        : [],
    };
  }

  async function loadJobDescriptionRecords() {
    const result = await getJobDescriptions({
      page: 1,
      limit: 100,
    });

    if (!result.success) {
      showStatus({
        type: "error",
        title: "Load Failed",
        message: result.message || "Failed to load job descriptions.",
      });
      return;
    }

    setJobDescriptionList((result.data || []).map(normalizeJobDescriptionItem));
  }

  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      setDropdownLoading(true);
      setDropdownError("");

      const [dropdownResult, listResult] = await Promise.all([
        getJobDescriptionDropdowns(),
        getJobDescriptions({
          page: 1,
          limit: 100,
        }),
      ]);

      if (!isMounted) return;

      if (dropdownResult.success) {
        setAccounts(dropdownResult.accounts || []);
        setDepartments(dropdownResult.departments || []);
        setRequestedByUsers(dropdownResult.requestedByUsers || []);
      } else {
        setAccounts([]);
        setDepartments([]);
        setRequestedByUsers([]);
        setDropdownError(dropdownResult.message || "Failed to load dropdowns.");

        showStatus({
          type: "error",
          title: "Dropdown Load Failed",
          message: dropdownResult.message || "Failed to load dropdowns.",
        });
      }

      if (listResult.success) {
        setJobDescriptionList(
          (listResult.data || []).map(normalizeJobDescriptionItem),
        );
      } else {
        setJobDescriptionList([]);

        showStatus({
          type: "error",
          title: "Load Failed",
          message: listResult.message || "Failed to load job descriptions.",
        });
      }

      setDropdownLoading(false);
    }

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  function getLoggedInOwner() {
    return formatLoggedInOwner(user);
  }

  function handleOpenCreateModal() {
    setShowCreateModal(true);
  }

  function handleCloseCreateModal() {
    setShowCreateModal(false);
  }

  function handleCreatedJobDescription(newItem) {
    setJobDescriptionList((prev) => [
      newItem,
      ...prev.filter((item) => item.id !== newItem.id),
    ]);

    setSelectedItem(newItem);
    setShowCreateModal(false);
  }

  function handleOpenRevision(item) {
    const loggedInOwner = getLoggedInOwner();

    setRevisionItem(item);
    setRevisionForm({
      revisedBySibsId: loggedInOwner.ownerSibsId,
      revisedBy: loggedInOwner.owner,
      revisionRemarks: "",
      description: item.description || "",
      responsibilities: item.responsibilities || "",
      qualifications: item.qualifications || "",
    });
  }

  function handleCloseRevision() {
    setRevisionItem(null);
    setRevisionForm(emptyRevisionForm);
  }

  async function handleSubmitRevision(e) {
    e.preventDefault();

    if (!revisionItem) return;

    if (!revisionForm.revisedBySibsId || !revisionForm.revisedBy.trim()) {
      showStatus({
        type: "error",
        title: "Missing Revised By",
        message: "Revised By is required.",
      });
      return;
    }

    if (!revisionForm.revisionRemarks.trim()) {
      showStatus({
        type: "error",
        title: "Missing Revision Remarks",
        message: "Revision remarks are required.",
      });
      return;
    }

    if (!revisionForm.description.trim()) {
      showStatus({
        type: "error",
        title: "Missing Updated Description",
        message: "Updated job description is required.",
      });
      return;
    }

    if (!revisionForm.responsibilities.trim()) {
      showStatus({
        type: "error",
        title: "Missing Updated Responsibilities",
        message: "Updated responsibilities are required.",
      });
      return;
    }

    if (!revisionForm.qualifications.trim()) {
      showStatus({
        type: "error",
        title: "Missing Updated Qualifications",
        message: "Updated qualifications are required.",
      });
      return;
    }

    const payload = {
      revisedBySibsId: revisionForm.revisedBySibsId,
      revisedBy: revisionForm.revisedBy,
      revisionRemarks: revisionForm.revisionRemarks.trim(),
      description: revisionForm.description.trim(),
      responsibilities: revisionForm.responsibilities.trim(),
      qualifications: revisionForm.qualifications.trim(),
    };

    const result = await saveJobDescriptionRevision(revisionItem.id, payload);

    if (!result.success) {
      showStatus({
        type: "error",
        title: "Revision Failed",
        message: result.message || "Failed to save job description revision.",
      });
      return;
    }

    const updatedItem = normalizeJobDescriptionItem(result.data);

    setJobDescriptionList((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item)),
    );

    setSelectedItem(updatedItem);
    handleCloseRevision();

    showStatus({
      type: "success",
      title: "Revision Saved",
      message:
        result.message || "Job description revision was saved successfully.",
    });
  }

  const stats = useMemo(() => {
    const total = jobDescriptionList.length;

    const existing = jobDescriptionList.filter(
      (item) => normalizeJdStatus(item.jdStatus) === "Existing",
    ).length;

    const revision = jobDescriptionList.filter(
      (item) => normalizeJdStatus(item.jdStatus) === "For Revision",
    ).length;

    const newJd = jobDescriptionList.filter(
      (item) => normalizeJdStatus(item.jdStatus) === "New Job Description",
    ).length;

    return {
      total,
      existing,
      revision,
      newJd,
    };
  }, [jobDescriptionList]);

  return (
    <div className="flex h-screen flex-1 flex-col bg-sibs-tertiary-10">
      <Header />

      <main className="min-w-0 flex-1 overflow-y-scroll overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">
        <div className="min-w-0 mb-6 flex items-end justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
              <ClipboardList size={14} />
              Recruitment
            </div>

            <h1 className="mt-3 text-2xl font-extrabold text-sibs-primary-1 sm:text-3xl">
              Job Description
            </h1>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Manage JD readiness for Existing, For Revision, and New Job
              Description requirements
            </p>
          </div>

          <div className="mb-4 flex justify-end">
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-6 text-sm font-extrabold text-white shadow-sm transition hover:opacity-90"
            >
              <Plus size={18} />
              Add Job Description
            </button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total JD"
            value={stats.total}
            icon={ClipboardList}
            description="All job descriptions"
          />

          <StatCard
            title="Existing"
            value={stats.existing}
            icon={CheckCircle2}
            description="Ready or already available"
          />

          <StatCard
            title="For Revision"
            value={stats.revision}
            icon={AlertTriangle}
            description="Needs update"
          />

          <StatCard
            title="New Job Description"
            value={stats.newJd}
            icon={FileText}
            description="New or unlinked JD"
          />
        </div>

        <JobDescriptionTable
          jobDescriptionList={jobDescriptionList}
          onView={setSelectedItem}
        />
      </main>

      <AddDescriptionModal
        open={showCreateModal}
        onClose={handleCloseCreateModal}
        onCreated={handleCreatedJobDescription}
        onStatus={showStatus}
      />

      <ViewJobDescriptionModal
        open={!!selectedItem}
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onOpenRevision={handleOpenRevision}
      />

      <ReviseJobDescriptionModal
        open={!!revisionItem}
        item={revisionItem}
        form={revisionForm}
        setForm={setRevisionForm}
        onClose={handleCloseRevision}
        onSubmit={handleSubmitRevision}
      />

      <StatusModal
        open={statusModal.open}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        onClose={() =>
          setStatusModal((prev) => ({
            ...prev,
            open: false,
          }))
        }
      />
    </div>
  );
}
