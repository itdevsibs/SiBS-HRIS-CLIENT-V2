import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  valueClassName,
  iconClassName,
  delay = 0,
}) {
  return (
    <div
      className="sibs-page-card-in rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-sibs-primary-1/20 hover:shadow-md"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-xs font-bold uppercase tracking-wide text-[#174A7C]">
            {title}
          </p>

          <p
            className={`mt-3 truncate text-3xl font-extrabold leading-none ${
              valueClassName || "text-sibs-primary-1"
            }`}
          >
            {value}
          </p>

          {description && (
            <p className="mt-2 truncate text-xs font-semibold text-sibs-primary-1">
              {description}
            </p>
          )}
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
            iconClassName || "bg-[#F2F6FA] text-sibs-primary-1"
          }`}
        >
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

export default function JobDescriptionPage() {
  const mainRef = useRef(null);

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

  function scrollToTop(behavior = "auto") {
    requestAnimationFrame(() => {
      if (mainRef.current) {
        mainRef.current.scrollTo({
          top: 0,
          left: 0,
          behavior,
        });
      }

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

  function forceScrollToTop() {
    scrollToTop("auto");

    window.setTimeout(() => {
      scrollToTop("auto");
    }, 0);
  }

  useLayoutEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    forceScrollToTop();
  }, []);

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
      forceScrollToTop();
      return;
    }

    setJobDescriptionList((result.data || []).map(normalizeJobDescriptionItem));
    forceScrollToTop();
  }

  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      setDropdownLoading(true);
      setDropdownError("");

      forceScrollToTop();

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
      forceScrollToTop();
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
    const normalizedItem = normalizeJobDescriptionItem(newItem);

    setJobDescriptionList((prev) => [
      normalizedItem,
      ...prev.filter((item) => item.id !== normalizedItem.id),
    ]);

    setSelectedItem(normalizedItem);
    setShowCreateModal(false);
    forceScrollToTop();
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

  function handleTableClickCapture(event) {
    const button = event.target?.closest?.("button");

    if (!button || button.disabled) return;

    const buttonText = String(button.textContent || "").trim().toLowerCase();
    const ariaLabel = String(button.getAttribute("aria-label") || "").toLowerCase();
    const title = String(button.getAttribute("title") || "").toLowerCase();

    const isPaginationClick =
      buttonText === "previous" ||
      buttonText === "next" ||
      buttonText === "prev" ||
      /^\d+$/.test(buttonText) ||
      ariaLabel.includes("page") ||
      ariaLabel.includes("next") ||
      ariaLabel.includes("previous") ||
      title.includes("page") ||
      title.includes("next") ||
      title.includes("previous");

    if (!isPaginationClick) return;

    window.setTimeout(() => {
      forceScrollToTop();
    }, 0);
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

    forceScrollToTop();
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
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta">
      <Header />

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
                Job Description
              </h1>

              <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                Manage JD readiness for Existing, For Revision, and New Job
                Description requirements.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--sibs-primary-1)] px-5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:opacity-90 hover:shadow-md active:scale-[0.98]"
            >
              <Plus size={18} />
              Add Job Description
            </button>
          </div>

          <section
            className="sibs-profile-tab-panel rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5"
            style={{ animationDelay: "60ms" }}
          >
            <h2 className="text-base font-bold text-[#101828]">
              Job Description Summary
            </h2>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Total JD"
                value={stats.total}
                icon={ClipboardList}
                description="All job descriptions"
                delay={0}
              />

              <StatCard
                title="Existing"
                value={stats.existing}
                icon={CheckCircle2}
                description="Ready or already available"
                valueClassName="text-emerald-600"
                iconClassName="bg-emerald-50 text-emerald-600"
                delay={60}
              />

              <StatCard
                title="For Revision"
                value={stats.revision}
                icon={AlertTriangle}
                description="Needs update"
                valueClassName="text-amber-600"
                iconClassName="bg-amber-50 text-amber-500"
                delay={120}
              />

              <StatCard
                title="New Job Description"
                value={stats.newJd}
                icon={FileText}
                description="New or unlinked JD"
                valueClassName="text-sibs-primary-1"
                iconClassName="bg-[#F2F6FA] text-sibs-primary-1"
                delay={180}
              />
            </div>
          </section>

          <section
            key={jobDescriptionList.length}
            className="sibs-profile-tab-panel overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white shadow-sm"
            style={{ animationDelay: "120ms" }}
            onClickCapture={handleTableClickCapture}
          >
            <JobDescriptionTable
              jobDescriptionList={jobDescriptionList}
              onView={setSelectedItem}
              onPageChange={forceScrollToTop}
              scrollToTop={forceScrollToTop}
              onRefresh={loadJobDescriptionRecords}
            />
          </section>
        </div>
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