import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, HeartPulse } from "lucide-react";

import Header from "../../components/layout/Header";
import ProfileDropdown from "../../components/layout/profile/ProfileDropdown";
import StatusModal from "../../components/modals/StatusModal";
import ResignationModal from "../../components/modals/resignation/ResignationModal";
import EmployeeProfileContent from "../../components/employee/profile/components/EmployeeProfileContent.jsx";
import EmployeeProfileContextPanel from "../../components/employee/profile/components/EmployeeProfileContextPanel.jsx";
import EmployeeProfileHeader from "../../components/employee/profile/components/EmployeeProfileHeader.jsx";
import EmployeeProfileNavigation from "../../components/employee/profile/components/EmployeeProfileNavigation.jsx";
import EmployeeProfilePictureModal from "../../components/employee/profile/components/EmployeeProfilePictureModal.jsx";
import ChwcpCoverageSection from "../../components/employee/profile/components/ChwcpCoverageSection.jsx";

import { useUser } from "../../services/context/UserContext";
import {
  getEmployeeById,
  getEmployeeProfileSections,
  updateEmployeeProfile,
  updateEmployeeProfileSection,
} from "../../lib/axios/getEmployee";
import { buildChangedProfilePayload } from "../../lib/utils/employees/employeeProfilePayload.js";
import {
  buildEmployeeProfileSectionPayload,
  getStructuredProfileSection,
  mergeEmployeeProfileSections,
} from "../../lib/utils/employees/employeeProfileSectionsPayload.js";
import {
  getActivePrimaryKey,
  getActiveProfileLabel,
  getProfileSibsId,
} from "../../lib/utils/employees/employeeProfileHelpers.js";
import { buildEditableEmployee } from "../../lib/utils/employees/employeeProfileNormalizer.js";
import { PROFILE_TABS } from "../../lib/utils/employees/employeeProfileSchemas.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

const CHWCP_PROFILE_TAB = {
  key: "chwcp",
  label: "CHWCP",
  icon: HeartPulse,
};

const EMPLOYEE_PROFILE_TABS = PROFILE_TABS.flatMap((tab) =>
  tab.key === "documents" ? [tab, CHWCP_PROFILE_TAB] : [tab],
);

function normalizeRole(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function canEditProfileDetails(user) {
  const access = Number(
    user?.admin_access ??
      user?.adminAccess ??
      user?.access ??
      user?.gy_user_access ??
      user?.gyUserAccess ??
      0,
  );

  const roles = [
    user?.role,
    user?.tokenType,
    user?.userRole,
    user?.accountType,
    user?.user_type,
    user?.gy_user_type,
  ].map(normalizeRole);

  return (
    (access >= 1 && access <= 7) ||
    roles.some((role) =>
      [
        "admin",
        "hr",
        "hr_admin",
        "hradmin",
        "super_admin",
        "superadmin",
        "super_administrator",
      ].includes(role),
    )
  );
}

export default function EmployeeDataPage() {
  const navigate = useNavigate();
  const { user: currentUser } = useUser();

  const [employee, setEmployee] = useState(null);
  const [draftEmployee, setDraftEmployee] = useState(null);
  const [activeTab, setActiveTab] = useState("personal.basic");
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [openProfilePictureModal, setOpenProfilePictureModal] = useState(false);
  const [openProfileDropdown, setOpenProfileDropdown] = useState(false);
  const [openAddResignation, setOpenAddResignation] = useState(false);
  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  const displayEmployee = isEditing ? draftEmployee || employee : employee;
  const canEditDetails = canEditProfileDetails(currentUser);
  const activePrimary = getActivePrimaryKey(activeTab);
  const activeSubTab = String(activeTab).includes(".")
    ? String(activeTab).split(".")[1]
    : "";
  const activeProfileLabel =
    activePrimary === "chwcp"
      ? { primary: "CHWCP", secondary: "Coverage" }
      : getActiveProfileLabel(activeTab);
  const activeSectionSupportsSave =
    activePrimary === "personal" ||
    Boolean(getStructuredProfileSection(activePrimary));
  const visibleTabs = useMemo(() => EMPLOYEE_PROFILE_TABS, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchEmployee() {
      const sibsId =
        sessionStorage.getItem("selectedEmployeeId") ||
        sessionStorage.getItem("selectedCandidateId");

      if (!sibsId) {
        navigate("/employee", { replace: true });
        return;
      }

      setLoading(true);

      try {
        const [employeeResult, sectionsResult] = await Promise.allSettled([
          getEmployeeById(sibsId),
          getEmployeeProfileSections(sibsId),
        ]);

        if (cancelled) return;

        const employeeResponse =
          employeeResult.status === "fulfilled" ? employeeResult.value : null;
        const sectionsResponse =
          sectionsResult.status === "fulfilled" ? sectionsResult.value : null;

        if (!employeeResponse?.success || !employeeResponse?.data) {
          navigate("/employee", { replace: true });
          return;
        }

        const baseEmployee = buildEditableEmployee(employeeResponse.data);
        const mergedEmployee =
          sectionsResponse?.success && sectionsResponse?.data
            ? mergeEmployeeProfileSections(baseEmployee, sectionsResponse.data)
            : baseEmployee;

        setEmployee(buildEditableEmployee(mergedEmployee));

        if (!sectionsResponse?.success) {
          setStatusModal({
            open: true,
            type: "error",
            title: "Structured Profile Not Loaded",
            message:
              sectionsResponse?.message ||
              "The employee record loaded, but some structured profile sections could not be loaded.",
          });
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        if (!cancelled) navigate("/employee", { replace: true });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchEmployee();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  function showFeedback(message, type = "success", title) {
    setStatusModal({
      open: true,
      type,
      title: title || (type === "error" ? "Action Failed" : "Action Complete"),
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

  function openResignationModal() {
    setOpenProfileDropdown(false);
    setOpenAddResignation(true);
  }

  function startEditing() {
    if (
      !employee ||
      isSaving ||
      !canEditDetails ||
      activePrimary === "chwcp" ||
      !activeSectionSupportsSave
    ) {
      return;
    }

    setOpenProfileDropdown(false);
    setDraftEmployee(buildEditableEmployee(employee));
    setIsEditing(true);
  }

  function cancelEditing() {
    if (isSaving) return;

    setDraftEmployee(null);
    setIsEditing(false);
  }

  async function saveProfileChanges() {
    if (!draftEmployee || !employee || isSaving) return;

    const sibsId = getProfileSibsId(employee);

    if (!sibsId) {
      showFeedback(
        "The employee SIBS ID is missing. The profile could not be saved.",
        "error",
        "Profile Update Failed",
      );
      return;
    }

    const payload = buildChangedProfilePayload(draftEmployee, employee);

    if (Object.keys(payload).length === 0) {
      setDraftEmployee(null);
      setIsEditing(false);
      showFeedback(
        "No changes were detected in the employee profile.",
        "success",
        "No Changes",
      );
      return;
    }

    setIsSaving(true);

    try {
      const result = await updateEmployeeProfile(sibsId, payload);

      if (!result?.success || !result?.data) {
        showFeedback(
          result?.message || "Failed to update the employee profile.",
          "error",
          "Profile Update Failed",
        );
        return;
      }

      const updatedEmployee = buildEditableEmployee(
        mergeEmployeeProfileSections(result.data, employee),
      );

      setEmployee(updatedEmployee);
      setDraftEmployee(null);
      setIsEditing(false);

      showFeedback(
        result.message || "Employee profile updated successfully.",
        "success",
        "Profile Updated",
      );
    } catch (error) {
      console.error("Failed to update employee profile:", error);
      showFeedback(
        error?.message || "Failed to update the employee profile.",
        "error",
        "Profile Update Failed",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function saveStructuredProfileChanges(section) {
    if (!draftEmployee || !employee || isSaving) return;

    const sibsId = getProfileSibsId(employee);

    if (!sibsId) {
      showFeedback(
        "The employee SIBS ID is missing. The section could not be saved.",
        "error",
        "Section Update Failed",
      );
      return;
    }

    const payload = buildEmployeeProfileSectionPayload(section, draftEmployee);

    if (!payload) {
      showFeedback(
        "The selected profile section is not supported by this endpoint.",
        "error",
        "Section Update Failed",
      );
      return;
    }

    setIsSaving(true);

    try {
      const result = await updateEmployeeProfileSection(
        sibsId,
        section,
        payload,
      );

      if (!result?.success || !result?.data) {
        showFeedback(
          result?.message || "Failed to update the employee section.",
          "error",
          "Section Update Failed",
        );
        return;
      }

      const updatedEmployee = buildEditableEmployee(
        mergeEmployeeProfileSections(employee, result.data),
      );

      setEmployee(updatedEmployee);
      setDraftEmployee(null);
      setIsEditing(false);

      showFeedback(
        result.message || "Employee section saved successfully.",
        "success",
        "Section Updated",
      );
    } catch (error) {
      console.error("Failed to update employee profile section:", error);
      showFeedback(
        error?.message || "Failed to update the employee section.",
        "error",
        "Section Update Failed",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function saveChanges() {
    if (activePrimary === "personal") {
      return saveProfileChanges();
    }

    const structuredSection = getStructuredProfileSection(activePrimary);

    if (structuredSection) {
      return saveStructuredProfileChanges(structuredSection);
    }

    return undefined;
  }

  function handleTabChange(nextTab) {
    if (isSaving || nextTab === activeTab) return;

    if (
      !visibleTabs.some((tab) => {
        if (tab.key === nextTab) return true;
        return tab.children?.some((child) => child.key === nextTab);
      })
    ) {
      return;
    }

    if (isEditing) {
      showFeedback(
        "Save or cancel your changes before opening another profile section.",
        "error",
        "Unsaved Changes",
      );
      return;
    }

    setActiveTab(nextTab);
  }

  function updateDraftField(field, value) {
    setDraftEmployee((previous) => ({
      ...(previous || buildEditableEmployee(employee)),
      [field]: value,
    }));
  }

  function updateDraftList(listKey, nextList) {
    setDraftEmployee((previous) => ({
      ...(previous || buildEditableEmployee(employee)),
      [listKey]: nextList,
    }));
  }

  function updateEmployeeListImmediately(listKey, nextList) {
    setEmployee((previous) => ({ ...previous, [listKey]: nextList }));
  }

  function handleContextAction(action) {
    if (action === "print") {
      window.print();
      return;
    }

    if (action === "sync") {
      showFeedback(
        "The current employee state is ready for synchronization. Connect this action to your employee refresh endpoint.",
        "success",
        "Sync Ready",
      );
    }
  }

  const sectionProps = {
    employee,
    displayEmployee,
    isEditing,
    isSaving,
    onEdit:
      canEditDetails &&
      activeSectionSupportsSave &&
      activePrimary !== "chwcp"
        ? startEditing
        : undefined,
    onSave: saveChanges,
    onCancel: cancelEditing,
    onChange: updateDraftField,
    onListChange: updateDraftList,
    onDocumentsChange: (nextDocuments) =>
      updateEmployeeListImmediately("documents", nextDocuments),
    onCommitNote: (notes, notesHistory) =>
      setEmployee((previous) => ({
        ...previous,
        notes,
        notesHistory,
      })),
    onFeedback: showFeedback,
  };

  return (
    <div
      onClick={() => setOpenProfileDropdown(false)}
      className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#E8EDF3] font-jakarta"
    >
      <Header />

      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-[#E8EDF3] px-3 py-4 sm:p-6">
        <div className="mx-auto w-full max-w-[1600px]">
          <div className="mb-4 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => navigate("/employee")}
              className="inline-flex items-center gap-1.5"
            >
              <ChevronLeft
                size={15}
                className="text-[#FF5C28] hover:scale-110 hover:text-[#FF3C00]"
              />
              <span className="text-sm font-bold text-[#042C51] hover:text-[#FF5C28]">
                Back to Employees
              </span>
            </button>

            <div className="hidden min-w-0 items-center gap-1.5 text-[10px] font-semibold text-[#667085] sm:flex">
              <span>SiBS HRIS Portal</span>
              <span>/</span>
              <span>Employee Directory</span>
              <span>/</span>
              <span className="max-w-[260px] truncate font-black text-[#042C51]">
                {displayEmployee
                  ? `${displayEmployee.lastName || ""}, ${
                      displayEmployee.firstName || ""
                    }`.toUpperCase()
                  : "EMPLOYEE"}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-[#D6E0EA] bg-white p-6 text-sm font-semibold text-[#667085] shadow-sm">
              Loading employee profile...
            </div>
          ) : !displayEmployee ? (
            <div className="rounded-2xl border border-[#D6E0EA] bg-white p-6 text-sm font-semibold text-[#667085] shadow-sm">
              Profile not found.
            </div>
          ) : (
            <div className="sibs-page-header-in space-y-4 sm:space-y-5">
              <EmployeeProfileHeader
                employee={displayEmployee}
                apiUrl={API_URL}
                canEdit={
                  canEditDetails &&
                  activeSectionSupportsSave &&
                  activePrimary !== "chwcp"
                }
                isEditing={isEditing}
                isSaving={isSaving}
                onEdit={startEditing}
                onCancel={cancelEditing}
                onSave={saveChanges}
                onRequestChange={openResignationModal}
                onToggleMore={(event) => {
                  event?.stopPropagation?.();
                  setOpenProfileDropdown((previous) => !previous);
                }}
                moreOpen={openProfileDropdown}
                onAvatarClick={(event) => {
                  event?.stopPropagation?.();
                  setOpenProfilePictureModal(true);
                }}
                morePanel={
                  <div
                    className="sibs-profile-dropdown-panel absolute right-0 top-full z-[70] mt-2"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <ProfileDropdown
                      openModal={openResignationModal}
                      openDropdown={setOpenProfileDropdown}
                    />
                  </div>
                }
              />

              <EmployeeProfileNavigation
                activeTab={activeTab}
                onTabChange={handleTabChange}
                tabs={visibleTabs}
              />

              <div className="sibs-page-card-in grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
                <section
                  key={activeTab}
                  className="sibs-profile-tab-panel min-w-0 rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm"
                >
                  <div className="mb-5 flex min-w-0 flex-col gap-3 border-b border-[#F1F5F9] pb-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <h2 className="break-words text-sm font-black uppercase tracking-wider text-[#042C51]">
                        {activeProfileLabel.primary}
                        {activeProfileLabel.secondary
                          ? ` - ${activeProfileLabel.secondary}`
                          : ""}
                      </h2>
                      <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
                        {activePrimary === "chwcp"
                          ? "Read-only CHWCP shared and personal coverage for the selected employee."
                          : isEditing
                            ? "Editable input mode. Save the profile to lock the current updates."
                            : "Official record values are shown from the existing employee data source."}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5 whitespace-nowrap sm:self-start">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          isEditing
                            ? "animate-pulse bg-amber-400"
                            : "bg-[#042C51]"
                        }`}
                      />
                      <span className="text-[10px] font-bold uppercase text-slate-500">
                        {activePrimary === "chwcp"
                          ? "View Only"
                          : isEditing
                            ? "Modified Draft"
                            : "Official Profile Record"}
                      </span>
                    </div>
                  </div>

                  {activePrimary === "chwcp" ? (
                    <ChwcpCoverageSection
                      sibsId={getProfileSibsId(employee)}
                    />
                  ) : (
                    <EmployeeProfileContent
                      activePrimary={activePrimary}
                      activeSubTab={activeSubTab}
                      sectionProps={sectionProps}
                    />
                  )}
                </section>

                <EmployeeProfileContextPanel
                  employee={employee}
                  onNavigate={handleTabChange}
                  onAction={handleContextAction}
                />
              </div>
            </div>
          )}
        </div>
      </main>

      <EmployeeProfilePictureModal
        open={openProfilePictureModal}
        employee={displayEmployee}
        apiUrl={API_URL}
        onClose={() => setOpenProfilePictureModal(false)}
      />

      <ResignationModal
        open={Boolean(openAddResignation)}
        onClose={() => setOpenAddResignation(false)}
        onSuccess={() => setOpenAddResignation(false)}
        setStatusModal={setStatusModal}
      />

      <StatusModal
        open={statusModal.open}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        variant="center"
        lockScroll
        onClose={closeStatusModal}
      />
    </div>
  );
}
