import { useEffect, useMemo, useState } from "react";
import { HeartPulse } from "lucide-react";

import Header from "../../components/layout/Header";
import ProfileDropdown from "../../components/layout/profile/ProfileDropdown";
import StatusModal from "../../components/modals/StatusModal";
import ResignationModal from "../../components/modals/resignation/ResignationModal";
import EmployeeProfileContent from "../../components/employee/profile/components/EmployeeProfileContent.jsx";
import EmployeeProfileContextPanel from "../../components/employee/profile/components/EmployeeProfileContextPanel.jsx";
import MyEmployeeProfileHeader from "../../components/employee/profile/components/EmployeeProfileHeader.jsx";
import EmployeeProfileNavigation from "../../components/employee/profile/components/EmployeeProfileNavigation.jsx";
import MyEmployeeProfilePictureModal from "../../components/employee/profile/components/EmployeeProfilePictureModal.jsx";
import ChwcpCoverageSection from "../../components/employee/profile/components/ChwcpCoverageSection.jsx";

import { useUser } from "../../services/context/UserContext";
import { useResignationList } from "../../services/context/ResignationListContext";
import {
  getEmployeeById,
  getEmployeeProfileSections,
  updateEmployeeProfile,
  updateEmployeeProfileSection,
} from "../../lib/axios/getEmployee";
import {
  getMyEmployeeProfilePicture,
  uploadMyEmployeeProfilePicture,
} from "../../lib/axios/employeeProfile";
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

const HEADER_PROFILE_PICTURE_UPDATED_EVENT = "sibs:profile-picture-updated";

const CHWCP_PROFILE_TAB = {
  key: "chwcp",
  label: "CHWCP",
  icon: HeartPulse,
};

const EMPLOYEE_PROFILE_TABS = PROFILE_TABS
  .filter((tab) => tab.key !== "notes")
  .flatMap((tab) =>
    tab.key === "documents" ? [tab, CHWCP_PROFILE_TAB] : [tab],
  );

const MY_PROFILE_QUICK_ACTIONS = [
  { label: "Request Profile Change", action: "request-change" },
  { label: "Export My Profile", action: "print" },
  { label: "Review My Documents", target: "documents" },
  { label: "Submit Resignation", action: "resignation" },
];

function mergeProfilePicture(employee, profilePictureUrl) {
  if (!employee || !profilePictureUrl) return employee;

  return {
    ...employee,
    profilePictureUrl,
    profile_picture_url: profilePictureUrl,
  };
}

export default function UserProfilePage() {
  const {
    user: currentUser,
    loading: userLoading,
    refetchUser,
  } = useUser();
  const { openEditResignationModal } = useResignationList();

  const [employee, setEmployee] = useState(null);
  const [draftEmployee, setDraftEmployee] = useState(null);
  const [activeTab, setActiveTab] = useState("personal.basic");
  const [profileLoading, setProfileLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profilePicture, setProfilePicture] = useState("");
  const [profilePictureLoading, setProfilePictureLoading] = useState(false);
  const [openProfilePictureModal, setOpenProfilePictureModal] = useState(false);
  const [openProfileDropdown, setOpenProfileDropdown] = useState(false);
  const [openAddResignation, setOpenAddResignation] = useState(false);
  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  const currentSibsId = getProfileSibsId(currentUser);
  const displayEmployee = isEditing ? draftEmployee || employee : employee;
  // Employee-mode My Profile is read-only for every account, including
  // HR/admin users who switched to the employee portal.
  const canEditDetails = false;
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
    if (!openEditResignationModal) return;
    setOpenAddResignation(true);
  }, [openEditResignationModal]);

  useEffect(() => {
    if (userLoading) return undefined;

    let cancelled = false;

    async function loadMyProfile() {
      if (!currentUser) {
        setEmployee(null);
        setProfileLoading(false);
        return;
      }

      const fallbackEmployee = buildEditableEmployee(currentUser);
      setEmployee(fallbackEmployee);

      if (!currentSibsId) {
        setProfileLoading(false);
        setStatusModal({
          open: true,
          type: "error",
          title: "Employee Profile Not Linked",
          message:
            "Your authenticated account does not contain an employee SIBS ID.",
        });
        return;
      }

      setProfileLoading(true);

      const [employeeResult, sectionsResult, pictureResult] =
        await Promise.allSettled([
          getEmployeeById(currentSibsId),
          getEmployeeProfileSections(currentSibsId),
          getMyEmployeeProfilePicture(),
        ]);

      if (cancelled) return;

      const employeeResponse =
        employeeResult.status === "fulfilled" ? employeeResult.value : null;
      const sectionsResponse =
        sectionsResult.status === "fulfilled" ? sectionsResult.value : null;
      const pictureResponse =
        pictureResult.status === "fulfilled" ? pictureResult.value : null;

      const baseEmployee =
        employeeResponse?.success && employeeResponse?.data
          ? buildEditableEmployee({
              ...currentUser,
              ...employeeResponse.data,
            })
          : fallbackEmployee;

      const mergedEmployee =
        sectionsResponse?.success && sectionsResponse?.data
          ? mergeEmployeeProfileSections(baseEmployee, sectionsResponse.data)
          : baseEmployee;

      const pictureUrl = pictureResponse?.success
        ? pictureResponse?.data?.profilePictureUrl || ""
        : "";

      setProfilePicture(pictureUrl ? `${pictureUrl}?v=${Date.now()}` : "");
      setEmployee(
        buildEditableEmployee(
          mergeProfilePicture(
            mergedEmployee,
            pictureUrl ? `${pictureUrl}?v=${Date.now()}` : "",
          ),
        ),
      );

      if (!employeeResponse?.success) {
        setStatusModal({
          open: true,
          type: "error",
          title: "Profile Record Not Fully Loaded",
          message:
            employeeResponse?.message ||
            "The page is showing the authenticated user data because the complete employee record could not be loaded.",
        });
      } else if (!sectionsResponse?.success) {
        setStatusModal({
          open: true,
          type: "error",
          title: "Structured Profile Not Loaded",
          message:
            sectionsResponse?.message ||
            "The employee record loaded, but some structured profile sections could not be loaded.",
        });
      }

      setProfileLoading(false);
    }

    void loadMyProfile();

    return () => {
      cancelled = true;
    };
  }, [currentSibsId, currentUser, userLoading]);

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

  function requestProfileChange() {
    setOpenProfileDropdown(false);
    showFeedback(
      "Please coordinate profile corrections with HR. Your current official values remain read-only until an authorized update is completed.",
      "success",
      "Request Profile Change",
    );
  }

  function startEditing() {
    if (!employee || isSaving || !canEditDetails) return;

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
        mergeProfilePicture(
          mergeEmployeeProfileSections(result.data, employee),
          profilePicture,
        ),
      );

      setEmployee(updatedEmployee);
      setDraftEmployee(null);
      setIsEditing(false);

      const identityFields = ["firstName", "middleName", "lastName", "email"];
      const identityChanged = identityFields.some((field) => field in payload);

      if (identityChanged && typeof refetchUser === "function") {
        await refetchUser({ background: true });
      }

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
      const result = await updateEmployeeProfileSection(sibsId, section, payload);

      if (!result?.success || !result?.data) {
        showFeedback(
          result?.message || "Failed to update the employee section.",
          "error",
          "Section Update Failed",
        );
        return;
      }

      const updatedEmployee = buildEditableEmployee(
        mergeProfilePicture(
          mergeEmployeeProfileSections(employee, result.data),
          profilePicture,
        ),
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

    showFeedback(
      "This profile section is read-only because no persistent save endpoint is configured.",
      "error",
      "Section Is Read-Only",
    );

    setDraftEmployee(null);
    setIsEditing(false);
    return undefined;
  }

  function handleTabChange(nextTab) {
    if (isSaving || nextTab === activeTab) return;

    if (!visibleTabs.some((tab) => {
      if (tab.key === nextTab) return true;
      return tab.children?.some((child) => child.key === nextTab);
    })) {
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

    if (action === "request-change") {
      requestProfileChange();
      return;
    }

    if (action === "resignation") {
      openResignationModal();
    }
  }

  async function handleUploadProfilePicture(file, modalStatus) {
    if (modalStatus?.type === "error") {
      showFeedback(
        modalStatus.message || "Unable to upload the profile picture.",
        "error",
        modalStatus.title || "Upload Failed",
      );
      return;
    }

    if (!file || profilePictureLoading) return;

    setProfilePictureLoading(true);

    try {
      const result = await uploadMyEmployeeProfilePicture(file);

      if (!result?.success) {
        showFeedback(
          result?.message || "Failed to upload the profile picture.",
          "error",
          "Upload Failed",
        );
        return;
      }

      const nextUrl = result?.data?.profilePictureUrl
        ? `${result.data.profilePictureUrl}?v=${Date.now()}`
        : "";

      setProfilePicture(nextUrl);
      setEmployee((previous) =>
        buildEditableEmployee(mergeProfilePicture(previous, nextUrl)),
      );
      setDraftEmployee((previous) =>
        previous
          ? buildEditableEmployee(mergeProfilePicture(previous, nextUrl))
          : previous,
      );

      window.dispatchEvent(
        new CustomEvent(HEADER_PROFILE_PICTURE_UPDATED_EVENT, {
          detail: { profilePictureUrl: nextUrl },
        }),
      );

      setOpenProfilePictureModal(false);

      showFeedback(
        result?.message || "Your profile picture has been updated.",
        "success",
        "Profile Picture Updated",
      );
    } catch (error) {
      console.error("UPLOAD PROFILE PICTURE ERROR:", error);
      showFeedback(
        error?.message || "Failed to upload the profile picture.",
        "error",
        "Upload Failed",
      );
    } finally {
      setProfilePictureLoading(false);
    }
  }

  const sectionProps = {
    employee,
    displayEmployee,
    isEditing,
    isSaving,
    onEdit:
      canEditDetails && activeSectionSupportsSave ? startEditing : undefined,
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
      className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#EEF2F6] font-jakarta"
    >
      <div className="shrink-0">
        <Header />
      </div>

      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden sibs-scrollbar bg-[#EEF2F6] px-3 py-4 sm:p-6">
        <div className="mx-auto w-full max-w-[1600px] space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-sm font-black text-[#042C51]">My Profile</h1>
              <p className="mt-0.5 text-[10px] font-semibold text-[#667085]">
                Employee self-service profile and official HRIS records
              </p>
            </div>

            <div className="hidden min-w-0 items-center gap-1.5 text-[10px] font-semibold text-[#667085] sm:flex">
              <span>SiBS HRIS Portal</span>
              <span>/</span>
              <span>Employee Self-Service</span>
              <span>/</span>
              <span className="font-black text-[#042C51]">My Profile</span>
            </div>
          </div>

          {userLoading || profileLoading ? (
            <div className="sibs-card p-6 text-sm font-semibold text-[#667085]">
              Loading your employee profile...
            </div>
          ) : !displayEmployee ? (
            <div className="sibs-card p-6 text-sm font-semibold text-[#667085]">
              Your employee profile could not be found.
            </div>
          ) : (
            <div className="sibs-page-header-in space-y-4 sm:space-y-5">
              <MyEmployeeProfileHeader
                employee={displayEmployee}
                apiUrl={API_URL}
                canEdit={canEditDetails && activeSectionSupportsSave}
                isEditing={isEditing}
                isSaving={isSaving}
                onEdit={startEditing}
                onCancel={cancelEditing}
                onSave={saveChanges}
                onRequestChange={requestProfileChange}
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

              <div className="sibs-page-card-in grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,2fr)_360px]">
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
                          ? "Read-only CHWCP shared and personal coverage from the existing CHWCP data source."
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
                    <ChwcpCoverageSection />
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
                  showAuditTrail={false}
                  quickActions={MY_PROFILE_QUICK_ACTIONS}
                />
              </div>
            </div>
          )}
        </div>
      </main>

      <MyEmployeeProfilePictureModal
        open={openProfilePictureModal}
        employee={displayEmployee}
        apiUrl={API_URL}
        currentImage={profilePicture}
        onUploadImage={handleUploadProfilePicture}
        uploading={profilePictureLoading}
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
        onClose={closeStatusModal}
      />
    </div>
  );
}