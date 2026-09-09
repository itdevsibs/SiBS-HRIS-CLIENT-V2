import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Header from "../../components/layout/Header";
import StatusModal from "../../components/modals/StatusModal";
import { PageHeaderHero } from "@/components/ui";
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
import useApprovalRuleAccess from "../../hooks/useApprovalRuleAccess";

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
  badgeClassName,
  tone = "navy",
  delay = 0,
}) {
  const MetricIcon = icon;

  return (
    <article
      className="sibs-metric-card flex h-[104px] 2xl:h-[116px] min-h-[96px] 2xl:min-h-[112px] flex-col justify-between overflow-hidden p-3 2xl:p-3.5 font-jakarta"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      <div className="flex h-full items-start justify-between gap-2.5 2xl:gap-3">
        <div className="min-w-0 flex-1 self-stretch flex flex-col justify-between h-full">
          <div>
            <p
              className={`m-0 truncate sibs-kpi-kicker sibs-tone-${tone}-label`}
            >
              {title}
            </p>
            <div className="mt-1.5 2xl:mt-2 flex flex-wrap items-baseline justify-between gap-2">
              <p className={`font-heading text-2xl 2xl:text-3xl font-bold leading-none tabular-nums tracking-tight sibs-tone-${tone}-label`}>
                {value}
              </p>
              {badgeText && (
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 sibs-text-micro font-extrabold ${badgeClassName || `sibs-tone-${tone}-icon`}`}
                >
                  {badgeText}
                </span>
              )}
            </div>
          </div>
          <p className="mt-1 line-clamp-1 truncate sibs-kpi-desc text-sibs-muted">
            {description}
          </p>
        </div>
        <span
          className={`flex h-7.5 w-7.5 2xl:h-9 2xl:w-9 shrink-0 items-center justify-center rounded-full sibs-tone-${tone}-icon`}
        >
          <MetricIcon className="h-4 w-4 2xl:h-4.5 2xl:w-4.5" strokeWidth={2} />
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { canApprove: canApproveJobDescriptions } = useApprovalRuleAccess(
    "jobDescription",
    user,
  );

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
    setIsRefreshing(true);
    try {
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
    } finally {
      setIsRefreshing(false);
    }
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
        className="sibs-dashboard-main-wide min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-7"
      >
        <div className="mx-auto w-full max-w-[1700px] space-y-4 sm:space-y-5">
          <PageHeaderHero
            kicker="Recruitment View"
            title="Job Description"
            description="Manage JD readiness for Existing, For Revision, and New Job Description requirements."
            actions={
              <>
                <button
                  type="button"
                  onClick={loadJobDescriptionRecords}
                  disabled={isRefreshing}
                  className="sibs-btn-icon"
                  title="Refresh Job Descriptions"
                  aria-label="Refresh Job Descriptions"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 2xl:h-4 2xl:w-4 ${
                      isRefreshing ? "animate-spin text-sibs-orange" : ""
                    }`}
                  />
                </button>

                <button
                  type="button"
                  onClick={handleOpenCreateModal}
                  className="sibs-btn-primary"
                >
                  <Plus className="h-3.5 w-3.5 2xl:h-4 2xl:w-4" />
                  New Job Description
                </button>
              </>
            }
          />

          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:gap-4">
            <StatCard
              title="Total JD"
              value={stats.total}
              icon={ClipboardList}
              description="All job descriptions in database"
              tone="navy"
              delay={0}
            />
            <StatCard
              title="Existing"
              value={stats.existing}
              icon={CheckCircle2}
              description="Ready or already available"
              tone="green"
              delay={60}
            />
            <StatCard
              title="For Revision"
              value={stats.revision}
              icon={AlertTriangle}
              description="Needs specification update or remarks"
              tone="amber"
              delay={120}
            />
            <StatCard
              title="New Job Description"
              value={stats.newJd}
              icon={FileText}
              description="New or unlinked JD intake"
              tone="indigo"
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
              canApproveJobDescriptions={canApproveJobDescriptions}
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
