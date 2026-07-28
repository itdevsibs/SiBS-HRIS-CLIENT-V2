import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

import Header from "../../components/layout/Header";
import StatusModal from "../../components/modals/StatusModal";
import ResignationModal from "../../components/modals/resignation/ResignationModal";
import ProfileDropdown from "../../components/layout/profile/ProfileDropdown";
import { useUser } from "../../services/context/UserContext";
import {
  getEmployeeById,
  getEmployeeProfileSections,
  updateEmployeeProfile,
  updateEmployeeProfileSection,
} from "../../lib/axios/getEmployee";
import { buildChangedProfilePayload } from "./employeeProfilePayload";
import {
  buildEmployeeProfileSectionPayload,
  getStructuredProfileSection,
  mergeEmployeeProfileSections,
} from "./employeeProfileSectionsPayload";

import {
  ContextPanel,
  EmployeeProfileHeader,
  ProfileNavigation,
  ProfilePictureViewModal,
  cleanText,
  firstValue,
  getActivePrimaryKey,
  getActiveProfileLabel,
} from "./EmployeeDataComponents";

import {
  ApplicationSection,
  DocumentsSection,
  FamilySection,
  NotesSection,
  PersonalSection,
  SkillsSection,
  TimelineSection,
} from "./EmployeeDataSections";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

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

function normalizeList(value) {
  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [trimmed];
    }
  }

  return [];
}

function getProfileSibsId(employee) {
  const value = firstValue(
    employee?.sibsId,
    employee?.sibs_id,
    employee?.employeeSibsId,
    employee?.employee_sibs_id,
    employee?.gy_emp_code,
    employee?.gy_user_code,
    employee?.username,
    employee?.candidateCode,
    employee?.candidate_code,
  );

  const cleaned = cleanText(value);
  if (!cleaned || cleaned.includes("@")) return "";
  return cleaned;
}

function normalizeEmployeeData(employee) {
  return {
    ...(employee || {}),

    sibsId: getProfileSibsId(employee),

    firstName: firstValue(
      employee?.firstName,
      employee?.first_name,
      employee?.gy_emp_fname,
      employee?.candidateFirstName,
      employee?.candidate_first_name,
    ),

    middleName: firstValue(
      employee?.middleName,
      employee?.middle_name,
      employee?.gy_emp_mname,
      employee?.candidateMiddleName,
      employee?.candidate_middle_name,
    ),

    lastName: firstValue(
      employee?.lastName,
      employee?.last_name,
      employee?.gy_emp_lname,
      employee?.candidateLastName,
      employee?.candidate_last_name,
    ),

    nameExtension: firstValue(
      employee?.nameExtension,
      employee?.name_extension,
      employee?.extensionName,
      employee?.extension_name,
    ),

    preferredName: firstValue(
      employee?.preferredName,
      employee?.preferred_name,
      employee?.nickname,
    ),

    birthdate: firstValue(
      employee?.birthdate,
      employee?.birthDate,
      employee?.dateOfBirth,
      employee?.date_of_birth,
      employee?.gy_emp_dob,
    ),

    placeOfBirth: firstValue(
      employee?.placeOfBirth,
      employee?.place_of_birth,
      employee?.birthPlace,
      employee?.birth_place,
    ),

    gender: firstValue(employee?.gender, employee?.sex, employee?.gy_emp_gender),

    civilStatus: firstValue(
      employee?.civilStatus,
      employee?.civil_status,
      employee?.maritalStatus,
      employee?.marital_status,
      employee?.gy_emp_civil_status,
    ),

    citizenship: firstValue(
      employee?.citizenship,
      employee?.nationality,
      employee?.country,
    ),

    email: firstValue(
      employee?.email,
      employee?.emailAddress,
      employee?.email_address,
      employee?.gy_email,
      employee?.gy_user_email,
    ),

    contact: firstValue(
      employee?.contact,
      employee?.contactNum,
      employee?.contactNumber,
      employee?.mobileNumber,
      employee?.mobile_number,
      employee?.gy_contact_num,
    ),

    telephone: firstValue(
      employee?.telephone,
      employee?.telephoneNumber,
      employee?.telephone_number,
    ),

    residentialAddress: firstValue(
      employee?.residentialAddress,
      employee?.residential_address,
      employee?.homeAddress,
      employee?.address,
      employee?.location,
    ),

    permanentAddress: firstValue(
      employee?.permanentAddress,
      employee?.permanent_address,
      employee?.homeAddress,
      employee?.address,
      employee?.location,
    ),

    location: firstValue(
      employee?.location,
      employee?.assignedLocation,
      employee?.assigned_location,
      employee?.site,
      employee?.gy_assignedloc,
    ),

    height: firstValue(employee?.height),
    weight: firstValue(employee?.weight),
    bloodType: firstValue(employee?.bloodType, employee?.blood_type),

    gsis: firstValue(employee?.gsis, employee?.gsisNo, employee?.gsis_no),
    sss: firstValue(employee?.sss, employee?.sssNo, employee?.sss_no),
    phic: firstValue(
      employee?.phic,
      employee?.philhealth,
      employee?.philhealthNo,
      employee?.philhealth_no,
    ),
    hdmf: firstValue(
      employee?.hdmf,
      employee?.pagibig,
      employee?.pagibigNo,
      employee?.pagibig_no,
    ),
    tin: firstValue(employee?.tin, employee?.tinNo, employee?.tin_no),

    department: firstValue(
      employee?.department,
      employee?.departmentName,
      employee?.department_name,
      employee?.gy_department,
    ),
    account: firstValue(
      employee?.account,
      employee?.accountName,
      employee?.account_name,
      employee?.gy_account,
    ),

    position: firstValue(
      employee?.position,
      employee?.positionName,
      employee?.position_name,
      employee?.positionTitle,
      employee?.position_title,
      employee?.jobTitle,
      employee?.job_title,
      employee?.jobPosition,
      employee?.job_position,
      employee?.roleTitle,
      employee?.role_title,
      employee?.designation,
      employee?.employeePosition,
      employee?.employee_position,
      employee?.gy_emp_position,
      employee?.appliedPosition,
      employee?.applied_position,
    ),

    hireDate: firstValue(
      employee?.hireDate,
      employee?.hire_date,
      employee?.dateHired,
      employee?.date_hired,
      employee?.gy_emp_hiredate,
    ),

    employmentStatus: firstValue(
      employee?.employmentStatus,
      employee?.employment_status,
      employee?.gy_emp_status,
      employee?.status,
      "Active",
    ),

    status: firstValue(
      employee?.candidateStatus,
      employee?.candidate_status,
      employee?.applicationStatus,
      employee?.application_status,
      employee?.status,
      "Active",
    ),

    workSetup: firstValue(
      employee?.workSetup,
      employee?.work_setup,
      employee?.workArrangement,
      employee?.work_arrangement,
      employee?.setup,
      "On-site",
    ),

    manager: firstValue(
      employee?.manager,
      employee?.supervisor,
      employee?.accountManager,
      employee?.recruiter,
    ),

    spouseSurname: firstValue(employee?.spouseSurname, employee?.spouse_surname),
    spouseFirstName: firstValue(
      employee?.spouseFirstName,
      employee?.spouse_first_name,
    ),
    spouseMiddleName: firstValue(
      employee?.spouseMiddleName,
      employee?.spouse_middle_name,
    ),
    spouseOccupation: firstValue(
      employee?.spouseOccupation,
      employee?.spouse_occupation,
    ),
    spouseEmployer: firstValue(
      employee?.spouseEmployer,
      employee?.spouse_employer,
      employee?.spouseEmployerBusiness,
    ),
    spouseBusinessAddress: firstValue(
      employee?.spouseBusinessAddress,
      employee?.spouse_business_address,
    ),
    spouseTelephone: firstValue(
      employee?.spouseTelephone,
      employee?.spouse_telephone,
    ),

    fatherSurname: firstValue(employee?.fatherSurname, employee?.father_surname),
    fatherFirstName: firstValue(
      employee?.fatherFirstName,
      employee?.father_first_name,
    ),
    fatherMiddleName: firstValue(
      employee?.fatherMiddleName,
      employee?.father_middle_name,
    ),

    motherMaidenSurname: firstValue(
      employee?.motherMaidenSurname,
      employee?.mother_maiden_surname,
      employee?.motherSurname,
      employee?.mother_surname,
    ),
    motherFirstName: firstValue(
      employee?.motherFirstName,
      employee?.mother_first_name,
    ),
    motherMiddleName: firstValue(
      employee?.motherMiddleName,
      employee?.mother_middle_name,
    ),

    children: normalizeList(employee?.children),

    emergencyName: firstValue(
      employee?.emergencyName,
      employee?.emergencyContactName,
      employee?.emergency_contact_name,
    ),
    emergencyRelationship: firstValue(
      employee?.emergencyRelationship,
      employee?.emergencyContactRelationship,
      employee?.emergency_contact_relationship,
    ),
    emergencyPhone: firstValue(
      employee?.emergencyPhone,
      employee?.emergencyContactNumber,
      employee?.emergency_contact_number,
    ),
    emergencyEmail: firstValue(
      employee?.emergencyEmail,
      employee?.emergency_contact_email,
    ),

    education: normalizeList(employee?.education),
    eligibility: normalizeList(
      employee?.eligibility || employee?.civilServiceEligibility,
    ),
    experience: normalizeList(employee?.experience || employee?.workExperience),
    trainings: normalizeList(employee?.trainings || employee?.training),
    skills: normalizeList(employee?.skills),
    recognitions: normalizeList(employee?.recognitions || employee?.awards),
    organizations: normalizeList(employee?.organizations),
    references: normalizeList(employee?.references),

    appliedPosition: firstValue(
      employee?.appliedPosition,
      employee?.applied_position,
      employee?.position,
      employee?.jobTitle,
    ),
    preferredAccount: firstValue(
      employee?.preferredAccount,
      employee?.preferred_account,
      employee?.account,
      employee?.accountName,
    ),
    source: firstValue(employee?.source, employee?.candidateSource),
    pipelineStage: firstValue(
      employee?.pipelineStage,
      employee?.currentPipelineStage,
      employee?.currentStage,
      employee?.stage,
    ),
    prfMatchStatus: firstValue(
      employee?.prfMatchStatus,
      employee?.prf_match_status,
      employee?.matchStatus,
    ),
    expectedSalary: firstValue(
      employee?.expectedSalary,
      employee?.expected_salary,
    ),
    availability: firstValue(employee?.availability, employee?.availableDate),
    recruiter: firstValue(employee?.recruiter, employee?.recruiterName),
    assessmentStatus: firstValue(
      employee?.assessmentStatus,
      employee?.assessment_status,
    ),
    assessmentScore: firstValue(employee?.assessmentScore, employee?.score),
    assessmentRemarks: firstValue(
      employee?.assessmentRemarks,
      employee?.assessment_remarks,
      employee?.evaluationRemarks,
    ),
    remarks: firstValue(employee?.remarks, employee?.recruitmentRemarks),
    statusHistory: normalizeList(
      employee?.statusHistory || employee?.status_history,
    ),

    documents: normalizeList(
      employee?.documents || employee?.attachments || employee?.uploadedDocuments,
    ),
    notes: firstValue(employee?.notes, employee?.privateNotes),
    notesHistory: normalizeList(employee?.notesHistory || employee?.notes_history),

    updatedAt: firstValue(
      employee?.updatedAt,
      employee?.updated_at,
      employee?.modifiedAt,
    ),
    updatedBy: firstValue(employee?.updatedBy, employee?.updated_by),
  };
}

function buildEditableEmployee(employee) {
  return normalizeEmployeeData(employee);
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
  const showContextPanel = true;
  const activeProfileLabel = getActiveProfileLabel(activeTab);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const sibsId =
          sessionStorage.getItem("selectedEmployeeId") ||
          sessionStorage.getItem("selectedCandidateId");

        if (!sibsId) {
          navigate("/employee", { replace: true });
          return;
        }

        const [employeeResult, sectionsResult] = await Promise.all([
          getEmployeeById(sibsId),
          getEmployeeProfileSections(sibsId),
        ]);

        if (!employeeResult?.success || !employeeResult?.data) {
          navigate("/employee", { replace: true });
          return;
        }

        const baseEmployee = buildEditableEmployee(employeeResult.data);
        const mergedEmployee = sectionsResult?.success && sectionsResult?.data
          ? mergeEmployeeProfileSections(baseEmployee, sectionsResult.data)
          : baseEmployee;

        setEmployee(buildEditableEmployee(mergedEmployee));

        if (!sectionsResult?.success) {
          setStatusModal({
            open: true,
            type: "error",
            title: "Structured Profile Not Loaded",
            message:
              sectionsResult?.message ||
              "The employee record loaded, but the structured HRIS sections could not be loaded.",
          });
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        navigate("/employee", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [navigate]);

  function showFeedback(message, type = "success", title) {
    setStatusModal({
      open: true,
      type,
      title: title || (type === "error" ? "Action Failed" : "Action Complete"),
      message,
    });
  }

  function openResignationModal() {
    setOpenProfileDropdown(false);
    setOpenAddResignation(true);
  }

  function startEditing() {
    if (!employee || isSaving) return;

    setOpenProfileDropdown(false);
    setDraftEmployee(buildEditableEmployee(employee));
    setIsEditing(true);
  }

  function cancelEditing() {
    if (isSaving) return;

    setDraftEmployee(null);
    setIsEditing(false);
  }

  function saveLocalChanges() {
    if (!draftEmployee || isSaving) return;

    setEmployee(buildEditableEmployee(draftEmployee));
    setDraftEmployee(null);
    setIsEditing(false);

    showFeedback(
      "This section is not included in the structured profile backend.",
      "success",
      "Section Updated Locally",
    );
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

    return saveLocalChanges();
  }

  function handleTabChange(nextTab) {
    if (isSaving || nextTab === activeTab) return;

    if (isEditing) {
      setStatusModal({
        open: true,
        type: "error",
        title: "Unsaved Changes",
        message:
          "Save or cancel your changes before opening another profile section.",
      });
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

  function renderActiveSection() {
    const commonEditProps = {
      employee: displayEmployee,
      isEditing,
      isSaving,
      onEdit: canEditDetails ? startEditing : undefined,
      onSave: saveChanges,
      onCancel: cancelEditing,
    };

    if (activePrimary === "personal") {
      return (
        <PersonalSection
          {...commonEditProps}
          selectedSubTab={activeSubTab || "basic"}
          onChange={updateDraftField}
        />
      );
    }

    if (activePrimary === "family") {
      return (
        <FamilySection
          {...commonEditProps}
          selectedSubTab={activeSubTab || "spouse"}
          onChange={updateDraftField}
          onListChange={updateDraftList}
        />
      );
    }

    if (
      ["education", "eligibility", "experience", "training", "references"].includes(
        activePrimary,
      )
    ) {
      return (
        <TimelineSection
          {...commonEditProps}
          activeSection={activePrimary}
          onListChange={updateDraftList}
        />
      );
    }

    if (activePrimary === "skills") {
      return (
        <SkillsSection
          {...commonEditProps}
          selectedSubTab={activeSubTab || "skills"}
          onListChange={updateDraftList}
        />
      );
    }

    if (activePrimary === "application") {
      return (
        <ApplicationSection
          {...commonEditProps}
          selectedSubTab={activeSubTab || "overview"}
          onChange={updateDraftField}
          onListChange={updateDraftList}
        />
      );
    }

    if (activePrimary === "documents") {
      return (
        <DocumentsSection
          employee={employee}
          onDocumentsChange={(nextDocuments) =>
            updateEmployeeListImmediately("documents", nextDocuments)
          }
          onFeedback={showFeedback}
        />
      );
    }

    if (activePrimary === "notes") {
      return (
        <NotesSection
          employee={employee}
          onCommitNote={(notes, notesHistory) =>
            setEmployee((previous) => ({
              ...previous,
              notes,
              notesHistory,
            }))
          }
          onFeedback={showFeedback}
        />
      );
    }

    return null;
  }

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
              <ChevronLeft size={15} className="text-[#FF5C28] hover:scale-110 hover:text-[#FF3C00]" />
              <span className="text-sm font-bold text-[#042C51] hover:text-[#FF5C28]">Back to Employees</span>
            </button>

            <div className="hidden min-w-0 items-center gap-1.5 text-[10px] font-semibold text-[#667085] sm:flex">
              <span>SiBS HRIS Portal</span>
              <span>/</span>
              <span>Employee Directory</span>
              <span>/</span>
              <span className="max-w-[260px] truncate font-black text-[#042C51]">
                {displayEmployee
                  ? `${displayEmployee.lastName || ""}, ${displayEmployee.firstName || ""}`.toUpperCase()
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
                canEdit={canEditDetails}
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

              <ProfileNavigation
                activeTab={activeTab}
                onTabChange={handleTabChange}
              />

              <div
                className={`sibs-page-card-in grid grid-cols-1 items-start gap-6 ${
                  showContextPanel
                    ? "xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]"
                    : ""
                }`}
              >
                <section
                  key={activeTab}
                  className="sibs-profile-tab-panel min-w-0 rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm"
                >
                  <div className="mb-5 flex flex-col gap-3 border-b border-[#F1F5F9] pb-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-sm font-black uppercase tracking-wider text-[#042C51]">
                        {activeProfileLabel.primary}
                        {activeProfileLabel.secondary
                          ? ` > ${activeProfileLabel.secondary}`
                          : ""}
                      </h2>
                      <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
                        {isEditing
                          ? "Editable input mode. Save the profile to lock the current updates."
                          : "Official record values are shown from the existing employee data source."}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          isEditing
                            ? "animate-pulse bg-amber-400"
                            : "bg-[#042C51]"
                        }`}
                      />
                      <span className="text-[10px] font-bold uppercase text-slate-500">
                        {isEditing ? "Modified Draft" : "Official Profile Record"}
                      </span>
                    </div>
                  </div>

                  {renderActiveSection()}
                </section>

                {showContextPanel && (
                  <ContextPanel
                    employee={employee}
                    onNavigate={handleTabChange}
                    onAction={handleContextAction}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <ProfilePictureViewModal
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
        onClose={() =>
          setStatusModal({
            open: false,
            type: "success",
            title: "",
            message: "",
          })
        }
      />
    </div>
  );
}
