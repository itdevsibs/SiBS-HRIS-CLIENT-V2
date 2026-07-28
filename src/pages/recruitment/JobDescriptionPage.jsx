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
} from "../../lib/axios/getJobDescription";
import { useUser } from "../../services/context/UserContext";
import { useJobDescription } from "../../services/context/JobDescriptionContext";
import {
  FileText,
  Plus,
  CheckCircle2,
  AlertTriangle,
  ClipboardList,
  RefreshCw,
} from "lucide-react";
import JobDescriptionTable from "../../components/tables/jobDescription/JobDescriptionTable";
import AddDescriptionModal from "../../components/modals/jobDescription/AddJobDescription";
import ViewJobDescriptionModal from "../../components/modals/jobDescription/ViewJobDescriptionDetailsModal";
import ReviseJobDescriptionModal from "../../components/modals/jobDescription/ReviseJobDescriptionModal";

const emptyRevisionForm = {
  revisedBySibsId: "",
  revisedBy: "",
  revisionRemarks: "",

  existingJdId: "",
  existing_jd_id: "",
  linkedHiringRequirement: "",
  linked_hiring_requirement: "",

  documentTitle: "",
  document_title: "",

  roleTitle: "",
  role_title: "",

  accountId: "",
  account_id: "",
  account: "",
  preparedFor: "",
  prepared_for: "",
  preparedForId: "",

  departmentId: "",
  department_id: "",
  department: "",

  dateRequested: "",
  date_requested: "",

  createdBy: "",
  created_by: "",

  jdCode: "",
  jd_code: "",

  currentVersion: "",
  current_version: "",
  revisionNo: "",
  revision_no: "",

  effectiveDate: "",
  effective_date: "",

  lastUpdated: "",
  last_updated: "",

  reportsTo: "",
  reports_to: "",

  supervisory: "No",

  description: "",
  responsibilities: "",
  qualifications: "",

  personalityType: "",
  personality_type: "",
  personalityTypes: [],

  remarks: "",

  competencies: [],
  desiredCompetencies: [],
  desired_competencies: [],
  competenciesText: "",
};

function normalizeJdStatus(status) {
  const value = String(status || "").trim();

  if (value === "New JD") return "New Job Description";
  if (value === "Archived JD") return "Archived";

  return value || "New Job Description";
}

function getJobDescriptionStatus(item = {}) {
  return normalizeJdStatus(
    item.jdStatus ||
      item.jd_status ||
      item.raw?.jdStatus ||
      item.raw?.jd_status ||
      item.status ||
      item.raw?.status,
  );
}

function splitPersonalityTypes(value = "") {
  return String(value || "")
    .split(/[,;\n|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getCompetencyLevel(competency = {}) {
  if (competency.level) return String(competency.level);

  if (Number(competency.average) === 1 || competency.average === true) {
    return "Average";
  }

  if (Number(competency.proficient) === 1 || competency.proficient === true) {
    return "Proficient";
  }

  if (Number(competency.excellent) === 1 || competency.excellent === true) {
    return "Excellent";
  }

  return "";
}

function serializeCompetenciesForDisplay(competencies = []) {
  if (!Array.isArray(competencies)) return "";

  return competencies
    .map((competency, index) => {
      const title = competency.title || "";
      const description = competency.description || "";
      const level = getCompetencyLevel(competency);

      return [
        `${index + 1}. ${title || "Untitled Competency"}`,
        description,
        level ? `Level: ${level}` : "",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
}

function getJobDescriptionCompetencies(item = {}) {
  if (Array.isArray(item.competencies)) return item.competencies;
  if (Array.isArray(item.desiredCompetencies)) return item.desiredCompetencies;
  if (Array.isArray(item.desired_competencies)) {
    return item.desired_competencies;
  }

  if (Array.isArray(item.raw?.competencies)) return item.raw.competencies;
  if (Array.isArray(item.raw?.desiredCompetencies)) {
    return item.raw.desiredCompetencies;
  }
  if (Array.isArray(item.raw?.desired_competencies)) {
    return item.raw.desired_competencies;
  }

  return [];
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
  icon,
  description,
  badgeText,
  badgeClassName = "bg-slate-100 text-slate-600",
  labelClassName = "text-[#667085]",
  valueClassName = "text-[#042C51]",
  iconClassName = "bg-blue-50 text-[#042C51]",
  delay = 0,
}) {
  const MetricIcon = icon;

  return (
    <article
      className="sibs-metric-card font-jakarta"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p
            className={`truncate text-[10px] font-extrabold uppercase tracking-normal ${labelClassName}`}
          >
            {title}
          </p>
          <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
            <p className={`text-3xl font-extrabold leading-none ${valueClassName}`}>
              {value}
            </p>
            {badgeText && (
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-extrabold ${badgeClassName}`}
              >
                {badgeText}
              </span>
            )}
          </div>
          <p className="mt-2 text-xs font-bold leading-4 text-[#667085]">
            {description}
          </p>
        </div>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${iconClassName}`}
        >
          <MetricIcon size={17} />
        </span>
      </div>
    </article>
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

    selectedJobDescription,
    openJobDescriptionDetails,
    closeJobDescriptionDetails,
    updateSelectedJobDescription,
    normalizeJobDescriptionViewItem,
  } = useJobDescription();

  const [jobDescriptionList, setJobDescriptionList] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

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
    if (
      typeof window !== "undefined" &&
      "scrollRestoration" in window.history
    ) {
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
    const normalized =
      typeof normalizeJobDescriptionViewItem === "function"
        ? normalizeJobDescriptionViewItem(item || {})
        : item || {};

    return {
      ...normalized,
      jdStatus: normalizeJdStatus(normalized?.jdStatus),
      jd_status: normalizeJdStatus(
        normalized?.jd_status || normalized?.jdStatus,
      ),
      revisionHistory: Array.isArray(normalized?.revisionHistory)
        ? normalized.revisionHistory
        : Array.isArray(normalized?.revision_history)
          ? normalized.revision_history
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
      ...prev.filter((item) => Number(item.id) !== Number(normalizedItem.id)),
    ]);

    openJobDescriptionDetails(normalizedItem);
    setShowCreateModal(false);
    forceScrollToTop();
  }

  function handleViewJobDescription(item) {
    const normalizedItem = normalizeJobDescriptionItem(item);

    openJobDescriptionDetails(normalizedItem);
  }

  function handleCloseViewJobDescription() {
    closeJobDescriptionDetails();
  }

  function handleUpdatedJobDescription(updatedItem) {
    if (!updatedItem) return;

    const normalizedItem = normalizeJobDescriptionItem(updatedItem);

    setJobDescriptionList((prev) =>
      prev.map((item) =>
        Number(item.id) === Number(normalizedItem.id) ? normalizedItem : item,
      ),
    );

    updateSelectedJobDescription(normalizedItem);
  }

  function handleOpenRevision(item) {
    const targetItem = item || selectedJobDescription;

    if (!targetItem) return;

    const normalizedItem = normalizeJobDescriptionItem(targetItem);
    const loggedInOwner = getLoggedInOwner();

    const personalityType =
      normalizedItem.personalityType ||
      normalizedItem.personality_type ||
      normalizedItem.preferredPersonalityType ||
      normalizedItem.preferred_personality_type ||
      "";

    const competencies = getJobDescriptionCompetencies(normalizedItem);

    const existingJdId =
      normalizedItem.existingJdId ||
      normalizedItem.existing_jd_id ||
      normalizedItem.linkedHiringRequirement ||
      normalizedItem.linked_hiring_requirement ||
      "";

    const accountId =
      normalizedItem.accountId || normalizedItem.account_id || "";

    const account =
      normalizedItem.account ||
      normalizedItem.preparedFor ||
      normalizedItem.prepared_for ||
      "";

    const departmentId =
      normalizedItem.departmentId || normalizedItem.department_id || "";

    const department = normalizedItem.department || "";

    const documentTitle =
      normalizedItem.documentTitle || normalizedItem.document_title || "";

    const roleTitle =
      normalizedItem.roleTitle ||
      normalizedItem.role_title ||
      normalizedItem.title ||
      "";

    setRevisionItem(normalizedItem);

    setRevisionForm({
      revisedBySibsId: loggedInOwner.ownerSibsId,
      revisedBy: loggedInOwner.owner,
      revisionRemarks: "",

      existingJdId,
      existing_jd_id: existingJdId,
      linkedHiringRequirement: existingJdId,
      linked_hiring_requirement: existingJdId,

      documentTitle,
      document_title: documentTitle,

      roleTitle,
      role_title: roleTitle,

      accountId,
      account_id: accountId,
      account,
      preparedFor: account,
      prepared_for: account,
      preparedForId: accountId,

      departmentId,
      department_id: departmentId,
      department,

      dateRequested:
        normalizedItem.dateRequested || normalizedItem.date_requested || "",
      date_requested:
        normalizedItem.date_requested || normalizedItem.dateRequested || "",

      createdBy:
        normalizedItem.createdBy ||
        normalizedItem.created_by ||
        normalizedItem.requestedBy ||
        normalizedItem.requested_by ||
        "",

      created_by:
        normalizedItem.created_by ||
        normalizedItem.createdBy ||
        normalizedItem.requested_by ||
        normalizedItem.requestedBy ||
        "",

      jdCode: normalizedItem.jdCode || normalizedItem.jd_code || "",
      jd_code: normalizedItem.jd_code || normalizedItem.jdCode || "",

      currentVersion:
        normalizedItem.currentVersion ||
        normalizedItem.current_version ||
        normalizedItem.revisionNo ||
        normalizedItem.revision_no ||
        "1",

      current_version:
        normalizedItem.current_version ||
        normalizedItem.currentVersion ||
        normalizedItem.revision_no ||
        normalizedItem.revisionNo ||
        "1",

      revisionNo:
        normalizedItem.revisionNo ||
        normalizedItem.revision_no ||
        normalizedItem.currentVersion ||
        normalizedItem.current_version ||
        "1",

      revision_no:
        normalizedItem.revision_no ||
        normalizedItem.revisionNo ||
        normalizedItem.current_version ||
        normalizedItem.currentVersion ||
        "1",

      effectiveDate:
        normalizedItem.effectiveDate || normalizedItem.effective_date || "",
      effective_date:
        normalizedItem.effective_date || normalizedItem.effectiveDate || "",

      lastUpdated:
        normalizedItem.lastUpdated ||
        normalizedItem.last_updated ||
        normalizedItem.lastReviewed ||
        normalizedItem.last_reviewed ||
        "",

      last_updated:
        normalizedItem.last_updated ||
        normalizedItem.lastUpdated ||
        normalizedItem.last_reviewed ||
        normalizedItem.lastReviewed ||
        "",

      reportsTo: normalizedItem.reportsTo || normalizedItem.reports_to || "",
      reports_to: normalizedItem.reports_to || normalizedItem.reportsTo || "",

      supervisory: normalizedItem.supervisory || "No",

      description: normalizedItem.description || "",
      responsibilities: normalizedItem.responsibilities || "",
      qualifications: normalizedItem.qualifications || "",

      personalityType,
      personality_type: personalityType,
      personalityTypes: Array.isArray(normalizedItem.personalityTypes)
        ? normalizedItem.personalityTypes
        : splitPersonalityTypes(personalityType),

      remarks:
        normalizedItem.remarks ||
        normalizedItem.jdRemarks ||
        normalizedItem.jd_remarks ||
        "",

      competencies,
      desiredCompetencies: competencies,
      desired_competencies: competencies,
      competenciesText: serializeCompetenciesForDisplay(competencies),
    });
  }

  function handleCloseRevision() {
    setRevisionItem(null);
    setRevisionForm(emptyRevisionForm);
  }

  function handleTableClickCapture(event) {
    const button = event.target?.closest?.("button");

    if (!button || button.disabled) return;

    const buttonText = String(button.textContent || "")
      .trim()
      .toLowerCase();

    const ariaLabel = String(
      button.getAttribute("aria-label") || "",
    ).toLowerCase();

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

  async function handleSubmitRevision(result) {
    if (!result?.success) {
      showStatus({
        type: "error",
        title: "Revision Failed",
        message: result?.message || "Failed to save job description revision.",
      });
      return;
    }

    const updatedItem = normalizeJobDescriptionItem(
      result.data || revisionItem,
    );

    setJobDescriptionList((prev) =>
      prev.map((item) =>
        String(item.id) === String(updatedItem.id) ? updatedItem : item,
      ),
    );

    updateSelectedJobDescription(updatedItem);

    setRevisionItem(null);
    setRevisionForm(emptyRevisionForm);

    showStatus({
      type: "success",
      title: "Revision Saved",
      message:
        result.message || "Job description revision was saved successfully.",
    });

    await loadJobDescriptionRecords();
    forceScrollToTop();
  }

  const stats = useMemo(() => {
    const statuses = jobDescriptionList.map(getJobDescriptionStatus);

    return {
      total: jobDescriptionList.length,
      existing: statuses.filter((status) =>
        ["Existing", "Active", "Approved"].includes(status),
      ).length,
      revision: statuses.filter((status) =>
        ["For Revision", "Returned for Revision"].includes(status),
      ).length,
      newJd: statuses.filter((status) =>
        ["New Job Description", "Draft", "For Approval"].includes(status),
      ).length,
    };
  }, [jobDescriptionList]);

  return (
    <div className="sibs-dashboard-shell">
      <Header />

      <main
        ref={mainRef}
        className="sibs-dashboard-main-wide"
      >
        <div className="mx-auto w-full max-w-[1600px] space-y-5 sm:space-y-6">
          <section
            className="sibs-page-header-in sibs-page-card-in sibs-card relative overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white p-5 font-jakarta shadow-sm sm:p-6"
            style={{ animationDelay: "0ms", animationFillMode: "both" }}
          >
            <span className="sibs-top-accent" aria-hidden="true" />

            <div className="mt-1 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded border border-blue-100 bg-[#E9F0FC] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-normal text-[#042C51]">
                    <span className="h-1.5 w-1.5 animate-sibs-pulse rounded-full bg-[#FF5C28]" />
                    Recruitment View
                  </span>
                </div>

                <h1 className="break-words text-xl font-extrabold text-[#042C51] sm:text-2xl">
                  Job Description
                </h1>

                <p className="text-xs font-semibold leading-relaxed text-[#667085] sm:text-sm">
                  Manage JD readiness for Existing, For Revision, and New Job Description requirements.
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2 self-end md:self-auto">
                <button
                  type="button"
                  onClick={loadJobDescriptionRecords}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#D6DEE8] bg-white text-[#042C51] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF8F5] hover:text-[#FF5C28] active:scale-95"
                  title="Refresh Job Descriptions"
                  aria-label="Refresh Job Descriptions"
                >
                  <RefreshCw size={16} />
                </button>

                <button
                  type="button"
                  onClick={handleOpenCreateModal}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#FF5C28] px-4 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#E94F1F] focus:outline-none focus:ring-4 focus:ring-[#FF5C28]/20"
                >
                  <Plus size={15} />
                  New Job Description
                </button>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total JD"
              value={stats.total}
              icon={ClipboardList}
              description="All job descriptions in database"
              labelClassName="text-[#667085]"
              iconClassName="bg-[#EAF2FB] text-[#042C51]"
              delay={0}
            />
            <StatCard
              title="Existing"
              value={stats.existing}
              icon={CheckCircle2}
              description="Ready or already available"
              labelClassName="text-emerald-600"
              valueClassName="text-emerald-700"
              iconClassName="bg-emerald-50 text-emerald-700"
              delay={60}
            />
            <StatCard
              title="For Revision"
              value={stats.revision}
              icon={AlertTriangle}
              description="Needs specification update or remarks"
              labelClassName="text-amber-600"
              valueClassName="text-amber-700"
              iconClassName="bg-amber-50 text-amber-700"
              delay={120}
            />
            <StatCard
              title="New Job Description"
              value={stats.newJd}
              icon={FileText}
              description="New or unlinked JD intake"
              labelClassName="text-indigo-600"
              valueClassName="text-indigo-700"
              iconClassName="bg-indigo-50 text-indigo-700"
              delay={180}
            />
          </section>

          <div
            key={jobDescriptionList.length}
            className="sibs-profile-tab-panel"
            style={{ animationDelay: "120ms" }}
            onClickCapture={handleTableClickCapture}
          >
            <JobDescriptionTable
              jobDescriptionList={jobDescriptionList}
              onView={handleViewJobDescription}
              onRevise={handleOpenRevision}
              onPageChange={forceScrollToTop}
              scrollToTop={forceScrollToTop}
              onRefresh={loadJobDescriptionRecords}
            />
          </div>
        </div>
      </main>

      <AddDescriptionModal
        open={showCreateModal}
        onClose={handleCloseCreateModal}
        onCreated={handleCreatedJobDescription}
        onStatus={showStatus}
      />

      <ViewJobDescriptionModal
        open={!!selectedJobDescription}
        onClose={handleCloseViewJobDescription}
        onOpenRevision={handleOpenRevision}
        onUpdated={handleUpdatedJobDescription}
        onRefresh={loadJobDescriptionRecords}
        onStatus={showStatus}
        approvalPage={false}
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
