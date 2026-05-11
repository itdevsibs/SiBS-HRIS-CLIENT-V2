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
import SlidingTabs from "../../lib/utils/react-utils/SlidingTabs";

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
  return (
    <div className="flex min-w-0 items-center gap-4 rounded-xl bg-white p-4 shadow-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--sibs-primary-1)] text-white">
        <Icon size={18} />
      </div>

      <div className="min-w-0">
        <p className="truncate text-xs text-sibs-tertiary-5">{title}</p>
        <h2 className="text-lg font-bold text-sibs-primary-1">{value}</h2>
        {description && (
          <p className="truncate text-xs text-sibs-tertiary-5">{description}</p>
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
  const [activeJdTab, setActiveJdTab] = useState("All JD");

  const jdTabs = [
    { label: "All JD", value: "All JD" },
    { label: "Active JD", value: "Active JD" },
    { label: "Archived JD", value: "Archived JD" },
  ];

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

      <main className="min-w-0 flex-1 overflow-y-scroll overflow-x-hidden p-4 sm:p-6">
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <ClipboardList size={28} className="shrink-0 text-sibs-primary-1" />

            <h1 className="min-w-0 break-words text-2xl font-bold text-sibs-primary-1 sm:text-4xl">
              Job Description
            </h1>
          </div>

          <p className="mt-1 text-sm text-sibs-tertiary-5">
            Manage JD readiness for Existing, For Revision, and New Job
            Description requirements
          </p>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

        <div className="mb-2 grid grid-cols-1 gap-4 rounded-xl py-2 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex flex-col items-start justify-center">
            <div className="lg:col-span-2">
              <SlidingTabs
                tabs={jdTabs}
                activeTab={activeJdTab}
                onChange={setActiveJdTab}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white shadow-2xs transition hover:opacity-90"
          >
            <Plus size={18} />
            Add Job Description
          </button>
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
