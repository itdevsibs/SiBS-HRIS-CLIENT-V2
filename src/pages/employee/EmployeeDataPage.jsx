import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Briefcase,
  MapPin,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  X,
  Image as ImageIcon,
  FileText,
  WalletCards,
  Dumbbell,
  StickyNote,
  ShieldAlert,
  UserRoundPen,
  GraduationCap,
  Sparkles,
  BadgeCheck,
  Edit3,
  Save,
  RotateCcw,
  Plus,
  Trash2,
} from "lucide-react";

import Header from "../../components/layout/Header";
import StatusModal from "../../components/modals/StatusModal";
import ResignationModal from "../../components/modals/resignation/ResignationModal";
import ProfileDropdown from "../../components/layout/profile/ProfileDropdown";
import { useUser } from "../../services/context/UserContext";
import { getEmployeeById } from "../../lib/axios/getEmployee";
import { formatDate as formatDateValue } from "../../components/layout/FormatDateTime";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

const PROFILE_TABS = [
  {
    key: "personal",
    label: "Personal",
    icon: User,
    children: [
      { key: "personal.basic", label: "Basic Info" },
      { key: "personal.contact", label: "Contact" },
      { key: "personal.address", label: "Address" },
      { key: "personal.ids", label: "Government IDs" },
    ],
  },
  {
    key: "family",
    label: "Family",
    icon: UserRoundPen,
    children: [
      { key: "family.spouse", label: "Spouse" },
      { key: "family.parents", label: "Parents" },
      { key: "family.children", label: "Children" },
      { key: "family.emergency", label: "Emergency Contact" },
    ],
  },
  {
    key: "education",
    label: "Education",
    icon: GraduationCap,
  },
  {
    key: "eligibility",
    label: "Eligibility",
    icon: BadgeCheck,
  },
  {
    key: "experience",
    label: "Experience",
    icon: Briefcase,
  },
  {
    key: "training",
    label: "Training",
    icon: Dumbbell,
  },
  {
    key: "skills",
    label: "Skills",
    icon: Sparkles,
    children: [
      { key: "skills.skills", label: "Skills" },
      { key: "skills.recognitions", label: "Recognition" },
      { key: "skills.organizations", label: "Organizations" },
    ],
  },
  {
    key: "references",
    label: "References",
    icon: User,
  },
  {
    key: "application",
    label: "Application",
    icon: FileText,
    children: [
      { key: "application.overview", label: "Overview" },
      { key: "application.pipeline", label: "Pipeline" },
      { key: "application.assessment", label: "Assessment" },
      { key: "application.history", label: "Status History" },
    ],
  },
  {
    key: "documents",
    label: "Documents",
    icon: FileText,
  },
  {
    key: "notes",
    label: "Notes",
    icon: StickyNote,
  },
];

function cleanText(value) {
  return String(value ?? "").trim();
}

function firstValue(...values) {
  return values.find((value) => cleanText(value)) || "";
}

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

function getFullName(employee) {
  return [
    employee?.firstName,
    employee?.middleName,
    employee?.lastName,
    employee?.nameExtension,
  ]
    .filter(Boolean)
    .join(" ");
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

function toInputDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10);
  }

  return date.toISOString().slice(0, 10);
}

function displayDate(value) {
  if (!value) return "N/A";

  const formatted = formatDateValue(value);

  return formatted || "N/A";
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

    department: firstValue(employee?.department, employee?.departmentName),
    account: firstValue(employee?.account, employee?.accountName),

    position: firstValue(
      employee?.position,
      employee?.jobTitle,
      employee?.roleTitle,
      employee?.appliedPosition,
      employee?.applied_position,
    ),

    hireDate: firstValue(employee?.hireDate, employee?.gy_emp_hiredate),

    status: firstValue(
      employee?.status,
      employee?.employmentStatus,
      employee?.candidateStatus,
      employee?.candidate_status,
      "Active",
    ),

    workSetup: firstValue(employee?.workSetup, employee?.work_setup, "On-site"),

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

    remarks: firstValue(employee?.remarks, employee?.notes),

    statusHistory: normalizeList(
      employee?.statusHistory || employee?.status_history,
    ),

    notes: firstValue(employee?.notes, employee?.remarks),
  };
}

function buildEditableEmployee(employee) {
  return normalizeEmployeeData(employee);
}

function getProfileImageUrl(employee) {
  const directUrl =
    employee?.profilePictureUrl ||
    employee?.profile_picture_url ||
    employee?.profileUrl ||
    employee?.profile_url ||
    "";

  if (directUrl) return directUrl;

  const filename =
    employee?.profileFilename ||
    employee?.profile_filename ||
    employee?.profilePicture ||
    employee?.profile_picture ||
    "";

  if (!filename) return "";

  if (String(filename).startsWith("http")) return filename;

  return `${API_URL}/api/employee-profile/file/${encodeURIComponent(filename)}`;
}

export default function EmployeeDataPage() {
  const navigate = useNavigate();
  const { user: currentUser } = useUser();

  const [employee, setEmployee] = useState(null);
  const [draftEmployee, setDraftEmployee] = useState(null);
  const [activeTab, setActiveTab] = useState("personal.basic");
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
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

        const result = await getEmployeeById(sibsId);

        if (!result?.success || !result?.data) {
          navigate("/employee", { replace: true });
          return;
        }

        setEmployee(buildEditableEmployee(result.data));
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        navigate("/employee", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [navigate]);

  const fullName = getFullName(displayEmployee);
  const profileImageUrl = getProfileImageUrl(displayEmployee);

  function openResignationModal() {
    setOpenProfileDropdown(false);
    setOpenAddResignation(true);
  }

  function startEditing() {
    setOpenProfileDropdown(false);
    setDraftEmployee(buildEditableEmployee(displayEmployee));
    setIsEditing(true);
  }

  function cancelEditing() {
    setDraftEmployee(null);
    setIsEditing(false);
  }

  function saveLocalChanges() {
    if (!draftEmployee) return;

    setEmployee(draftEmployee);
    setDraftEmployee(null);
    setIsEditing(false);

    setStatusModal({
      open: true,
      type: "success",
      title: "Profile Updated",
      message:
        "Profile changes were updated locally. Backend saving is not connected yet.",
    });
  }

  function updateDraftField(field, value) {
    setDraftEmployee((prev) => ({
      ...(prev || buildEditableEmployee(displayEmployee)),
      [field]: value,
    }));
  }

  function updateDraftList(listKey, nextList) {
    setDraftEmployee((prev) => ({
      ...(prev || buildEditableEmployee(displayEmployee)),
      [listKey]: nextList,
    }));
  }

  function renderActiveTabContent() {
    if (activeTab.startsWith("personal.")) {
      return (
        <PersonalPdsTab
          activeSubTab={activeTab.replace("personal.", "")}
          employee={displayEmployee}
          isEditing={isEditing}
          onChange={updateDraftField}
        />
      );
    }

    if (activeTab.startsWith("family.")) {
      return (
        <FamilyPdsTab
          activeSubTab={activeTab.replace("family.", "")}
          employee={displayEmployee}
          isEditing={isEditing}
          onChange={updateDraftField}
          onChildrenChange={(nextList) => updateDraftList("children", nextList)}
        />
      );
    }

    if (activeTab === "education") {
      return (
        <EducationPdsTab
          education={displayEmployee?.education || []}
          isEditing={isEditing}
          onChange={(nextList) => updateDraftList("education", nextList)}
        />
      );
    }

    if (activeTab === "eligibility") {
      return (
        <EligibilityPdsTab
          eligibility={displayEmployee?.eligibility || []}
          isEditing={isEditing}
          onChange={(nextList) => updateDraftList("eligibility", nextList)}
        />
      );
    }

    if (activeTab === "experience") {
      return (
        <ExperiencePdsTab
          experience={displayEmployee?.experience || []}
          isEditing={isEditing}
          onChange={(nextList) => updateDraftList("experience", nextList)}
        />
      );
    }

    if (activeTab === "training") {
      return (
        <TrainingPdsTab
          trainings={displayEmployee?.trainings || []}
          isEditing={isEditing}
          onChange={(nextList) => updateDraftList("trainings", nextList)}
        />
      );
    }

    if (activeTab.startsWith("skills.")) {
      return (
        <SkillsPdsTab
          activeSubTab={activeTab.replace("skills.", "")}
          skills={displayEmployee?.skills || []}
          recognitions={displayEmployee?.recognitions || []}
          organizations={displayEmployee?.organizations || []}
          isEditing={isEditing}
          onSkillsChange={(nextList) => updateDraftList("skills", nextList)}
          onRecognitionsChange={(nextList) =>
            updateDraftList("recognitions", nextList)
          }
          onOrganizationsChange={(nextList) =>
            updateDraftList("organizations", nextList)
          }
        />
      );
    }

    if (activeTab === "references") {
      return (
        <ReferencesPdsTab
          references={displayEmployee?.references || []}
          isEditing={isEditing}
          onChange={(nextList) => updateDraftList("references", nextList)}
        />
      );
    }

    if (activeTab.startsWith("application.")) {
      return (
        <ApplicationPdsTab
          activeSubTab={activeTab.replace("application.", "")}
          employee={displayEmployee}
          isEditing={isEditing}
          onChange={updateDraftField}
          onStatusHistoryChange={(nextList) =>
            updateDraftList("statusHistory", nextList)
          }
        />
      );
    }

    if (activeTab === "documents") {
      return (
        <PlaceholderProfileTab
          title="Documents"
          message="Resume, requirements, and uploaded attachments can be added here."
          icon={FileText}
        />
      );
    }

    if (activeTab === "notes") {
      return (
        <NotesProfileTab
          employee={displayEmployee}
          isEditing={isEditing}
          onChange={updateDraftField}
        />
      );
    }

    return null;
  }

  return (
    <div
      onClick={() => setOpenProfileDropdown(false)}
      className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta"
    >
      <Header />

      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-sibs-tertiary-10 px-3 py-4 sm:p-6">
        <button
          type="button"
          onClick={() => navigate("/employee")}
          className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-sibs-primary-1 transition hover:underline"
        >
          <ChevronLeft size={16} />
          Back to Employees
        </button>

        {loading ? (
          <div className="rounded-2xl bg-white p-5 text-sm font-medium text-sibs-tertiary-5 shadow-sm sm:p-6">
            Loading...
          </div>
        ) : !displayEmployee ? (
          <div className="rounded-2xl bg-white p-5 text-sm font-medium text-sibs-tertiary-5 shadow-sm sm:p-6">
            Profile not found
          </div>
        ) : (
          <div className="sibs-page-header-in w-full space-y-4 sm:space-y-5">
            <section className="overflow-visible rounded-[18px] bg-sibs-primary-1 shadow-sm ring-1 ring-[#D9E2EC] sm:rounded-[22px]">
              <div className="relative z-10 overflow-visible rounded-[18px] bg-sibs-primary-1 px-4 py-5 text-white sm:rounded-[22px] sm:px-5">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
                    <EmployeeProfileAvatar
                      employee={displayEmployee}
                      onClick={(e) => {
                        e?.stopPropagation?.();
                        setOpenProfilePictureModal(true);
                      }}
                    />

                    <div className="min-w-0 pt-1">
                      <h1 className="break-words text-xl font-extrabold uppercase leading-tight text-white sm:text-3xl lg:text-4xl">
                        {fullName || "Candidate Name"}
                      </h1>

                      <p className="mt-1 break-words text-sm font-bold text-white/85">
                        {displayEmployee?.appliedPosition ||
                          displayEmployee?.account ||
                          "Talent Pool Profile"}
                      </p>

                      <p className="mt-2 break-words text-xs font-extrabold uppercase tracking-wide text-white/70">
                        SIBS ID: {getProfileSibsId(displayEmployee) || "N/A"}
                      </p>
                    </div>
                  </div>

                  <div
                    className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center lg:justify-end"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {canEditDetails ? (
                      isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={cancelEditing}
                            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 text-sm font-bold text-white transition hover:bg-white/20 sm:w-auto"
                          >
                            <RotateCcw size={16} />
                            Cancel
                          </button>

                          <button
                            type="button"
                            onClick={saveLocalChanges}
                            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-sibs-primary-1 shadow-sm transition hover:opacity-90 sm:w-auto"
                          >
                            <Save size={16} />
                            Save Changes
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={startEditing}
                          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-sibs-primary-1 shadow-sm transition hover:opacity-90 sm:w-auto"
                        >
                          <Edit3 size={16} />
                          Edit Profile
                        </button>
                      )
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenProfileDropdown((prev) => !prev);
                        }}
                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-sibs-primary-1 shadow-sm transition hover:opacity-90 sm:w-auto"
                      >
                        <UserRoundPen size={16} />
                        Request a Change
                      </button>
                    )}

                    <div className="relative z-[60] w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenProfileDropdown((prev) => !prev);
                        }}
                        className="flex h-10 w-full items-center justify-center rounded-full bg-white text-sibs-primary-1 transition hover:opacity-90 sm:w-10"
                        aria-label="More profile actions"
                      >
                        <MoreHorizontal size={18} />
                      </button>

                      {openProfileDropdown && (
                        <div
                          className="sibs-profile-dropdown-panel absolute right-0 top-full z-[70] mt-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ProfileDropdown
                            openModal={openResignationModal}
                            openDropdown={setOpenProfileDropdown}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div className="sibs-page-card-in grid grid-cols-1 items-start gap-4 sm:gap-5 xl:grid-cols-[240px_minmax(0,1fr)]">
              <ProfileSideNav
                tabs={PROFILE_TABS}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />

              <section className="min-w-0">
                <AnimatedTabPanel activeKey={activeTab}>
                  {renderActiveTabContent()}
                </AnimatedTabPanel>
              </section>
            </div>
          </div>
        )}
      </main>

      <ProfilePictureViewModal
        open={openProfilePictureModal}
        employee={displayEmployee}
        imageUrl={profileImageUrl}
        onClose={() => setOpenProfilePictureModal(false)}
      />

      <ResignationModal
        open={Boolean(openAddResignation)}
        onClose={() => setOpenAddResignation(false)}
        onSuccess={() => {
          setOpenAddResignation(false);
        }}
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

function AnimatedTabPanel({ activeKey, children }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(false);

    const frame = requestAnimationFrame(() => {
      setShow(true);
    });

    return () => cancelAnimationFrame(frame);
  }, [activeKey]);

  return (
    <div
      key={activeKey}
      className={`transform-gpu transition-all duration-300 ease-out ${
        show
          ? "translate-y-0 scale-100 opacity-100"
          : "translate-y-3 scale-[0.995] opacity-0"
      }`}
    >
      {children}
    </div>
  );
}

function ProfileSideNav({ tabs, activeTab, onTabChange }) {
  const activeParent = String(activeTab || "").split(".")[0];
  const [openParent, setOpenParent] = useState(activeParent);

  useEffect(() => {
    if (!activeParent) return;
    setOpenParent(activeParent);
  }, [activeParent]);

  function isParentActive(tab) {
    return (
      activeTab === tab.key ||
      String(activeTab || "").startsWith(`${tab.key}.`)
    );
  }

  function getActiveParentTab() {
    return tabs.find((tab) => isParentActive(tab));
  }

  function handleMobileParentClick(tab) {
    const hasChildren = Array.isArray(tab.children) && tab.children.length > 0;

    if (!hasChildren) {
      setOpenParent("");
      onTabChange(tab.key);
      return;
    }

    setOpenParent(tab.key);

    if (!isParentActive(tab)) {
      onTabChange(tab.children[0].key);
    }
  }

  function handleDesktopParentClick(tab) {
    const hasChildren = Array.isArray(tab.children) && tab.children.length > 0;

    if (!hasChildren) {
      setOpenParent("");
      onTabChange(tab.key);
      return;
    }

    const nextOpenParent = openParent === tab.key ? "" : tab.key;

    setOpenParent(nextOpenParent);

    if (!isParentActive(tab)) {
      onTabChange(tab.children[0].key);
    }
  }

  const activeParentTab = getActiveParentTab();
  const activeChildren = Array.isArray(activeParentTab?.children)
    ? activeParentTab.children
    : [];

  return (
    <>
      {/* Mobile / Tablet */}
      <aside className="block w-full rounded-[18px] border border-[#E6ECF2] bg-white p-2 shadow-sm xl:hidden">
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon || FileText;
            const hasChildren =
              Array.isArray(tab.children) && tab.children.length > 0;
            const parentActive = isParentActive(tab);

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleMobileParentClick(tab)}
                aria-current={parentActive ? "page" : undefined}
                aria-expanded={hasChildren ? parentActive : undefined}
                className={`group inline-flex h-10 min-w-max items-center justify-center gap-2 rounded-xl px-3 text-center text-xs font-extrabold transition-all duration-300 ease-out active:scale-[0.98] ${
                  parentActive
                    ? "bg-sibs-primary-1 text-white shadow-sm"
                    : "bg-white text-sibs-primary-1 hover:bg-[#F8FAFC]"
                }`}
              >
                {hasChildren && (
                  <ChevronRight
                    size={14}
                    className={`shrink-0 transition-transform duration-300 ${
                      parentActive ? "rotate-90" : "rotate-0"
                    }`}
                  />
                )}

                <Icon
                  size={16}
                  className={`shrink-0 transition-transform duration-300 ${
                    parentActive ? "scale-110" : "group-hover:scale-110"
                  }`}
                />

                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeChildren.length > 0 && (
          <div className="mt-2 rounded-2xl bg-[#F8FAFC] p-2">
            <div className="flex flex-wrap gap-2">
              {activeChildren.map((child) => {
                const childActive = activeTab === child.key;

                return (
                  <button
                    key={child.key}
                    type="button"
                    onClick={() => onTabChange(child.key)}
                    aria-current={childActive ? "page" : undefined}
                    className={`group/sub inline-flex h-9 min-w-0 items-center justify-center gap-2 rounded-full px-3 text-center text-xs font-bold transition-all duration-300 active:scale-[0.98] ${
                      childActive
                        ? "bg-[#BDD0EE] text-sibs-primary-1 shadow-sm"
                        : "bg-white text-sibs-primary-1/80 hover:bg-[#EEF5FB]"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full transition-all duration-300 ${
                        childActive
                          ? "scale-125 bg-sibs-primary-1"
                          : "bg-sibs-primary-1/40 group-hover/sub:bg-sibs-primary-1"
                      }`}
                    />

                    <span className="truncate">{child.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </aside>

      {/* Desktop */}
      <aside className="hidden w-full self-start rounded-[18px] border border-[#E6ECF2] bg-white p-3 shadow-sm xl:sticky xl:top-4 xl:block xl:max-h-[calc(100vh-120px)] xl:min-h-[600px] xl:overflow-y-auto xl:pb-8">
        <div className="flex flex-col gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon || FileText;
            const hasChildren =
              Array.isArray(tab.children) && tab.children.length > 0;
            const parentActive = isParentActive(tab);
            const isOpen = openParent === tab.key;

            return (
              <div key={tab.key} className="min-w-0">
                <button
                  type="button"
                  onClick={() => handleDesktopParentClick(tab)}
                  aria-expanded={hasChildren ? isOpen : undefined}
                  aria-current={parentActive ? "page" : undefined}
                  className={`group flex h-11 w-full min-w-0 items-center gap-2 rounded-xl px-4 text-left text-sm font-extrabold transition-all duration-300 ease-out active:scale-[0.98] ${
                    parentActive
                      ? "bg-sibs-primary-1 text-white shadow-sm hover:bg-sibs-primary-1/95 hover:shadow-md"
                      : "bg-white text-sibs-primary-1 hover:translate-x-1 hover:bg-[#F8FAFC]"
                  }`}
                >
                  {hasChildren ? (
                    <ChevronRight
                      size={14}
                      className={`shrink-0 transition-transform duration-300 ${
                        isOpen ? "rotate-90" : "rotate-0"
                      }`}
                    />
                  ) : (
                    <span className="w-[14px] shrink-0" />
                  )}

                  <Icon
                    size={16}
                    className={`shrink-0 transition-transform duration-300 ${
                      parentActive ? "scale-110" : "group-hover:scale-110"
                    }`}
                  />

                  <span className="truncate">{tab.label}</span>
                </button>

                {hasChildren && (
                  <div
                    className={`grid transition-all duration-300 ease-out ${
                      isOpen
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div
                        className={`mt-1 space-y-1 pl-8 pr-1 transition-all duration-300 ease-out ${
                          isOpen
                            ? "translate-y-0 opacity-100"
                            : "-translate-y-2 opacity-0"
                        }`}
                      >
                        {tab.children.map((child) => {
                          const childActive = activeTab === child.key;

                          return (
                            <button
                              key={child.key}
                              type="button"
                              onClick={() => onTabChange(child.key)}
                              aria-current={childActive ? "page" : undefined}
                              className={`group/sub flex h-9 w-full min-w-0 items-center gap-2 rounded-full px-3 text-left text-xs font-bold transition-all duration-300 ${
                                childActive
                                  ? "bg-[#BDD0EE] text-sibs-primary-1 shadow-sm"
                                  : "text-sibs-primary-1/80 hover:translate-x-1 hover:bg-[#F8FAFC]"
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 shrink-0 rounded-full transition-all duration-300 ${
                                  childActive
                                    ? "scale-125 bg-sibs-primary-1"
                                    : "bg-sibs-primary-1/40 group-hover/sub:bg-sibs-primary-1"
                                }`}
                              />

                              <span className="truncate">{child.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>
    </>
  );
}

function ProfileCard({ title, subtitle, icon: Icon, children, className = "" }) {
  return (
    <section
      className={`rounded-[18px] border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5 ${className}`}
    >
      <div className="mb-4 flex items-start justify-between gap-3 sm:mb-5 sm:gap-4">
        <div className="flex min-w-0 items-start gap-3">
          {Icon && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EAF2FB] text-sibs-primary-1 sm:h-10 sm:w-10">
              <Icon size={18} className="h-[18px] w-[18px] sm:h-5 sm:w-5" />
            </div>
          )}

          <div className="min-w-0">
            <h2 className="break-words text-sm font-extrabold text-[#101828] sm:text-base">
              {title}
            </h2>

            {subtitle && (
              <p className="mt-1 break-words text-xs font-medium leading-5 text-sibs-tertiary-5 sm:text-sm">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      {children}
    </section>
  );
}

function ProfileGrid({ children, cols = "md:grid-cols-2" }) {
  return (
    <div className={`grid min-w-0 grid-cols-1 gap-3 ${cols}`}>
      {children}
    </div>
  );
}

function ProfileDetail({
  label,
  value,
  editable = false,
  onChange,
  type = "text",
}) {
  const isLongText = [
    "email",
    "address",
    "residential address",
    "permanent address",
  ].includes(String(label || "").toLowerCase());

  return (
    <div className="flex min-h-[76px] min-w-0 flex-col justify-center rounded-[10px] bg-[#F8FAFC] px-3 py-2.5 sm:min-h-[84px] sm:px-4">
      <p className="mb-1.5 break-words text-[10px] font-extrabold uppercase leading-4 tracking-wide text-sibs-primary-1/70 sm:text-[11px]">
        {label}
      </p>

      {editable ? (
        <input
          type={type}
          value={value || ""}
          onChange={(e) => onChange?.(e.target.value)}
          className="h-9 w-full min-w-0 rounded-[10px] border border-[#D0D5DD] bg-white px-3 text-sm font-bold text-[#344054] outline-none transition placeholder:text-slate-400 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
        />
      ) : (
        <p
          className={`flex min-h-9 min-w-0 items-center text-sm font-extrabold leading-[18px] text-[#344054] ${
            isLongText ? "break-all" : "break-words"
          }`}
        >
          {value || "—"}
        </p>
      )}
    </div>
  );
}

function ProfileTextarea({ label, value, editable = false, onChange }) {
  return (
    <div className="min-w-0 rounded-[10px] bg-[#F8FAFC] px-3 py-3 sm:px-4">
      <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wide text-sibs-primary-1/70 sm:text-[11px]">
        {label}
      </p>

      {editable ? (
        <textarea
          value={value || ""}
          onChange={(e) => onChange?.(e.target.value)}
          rows={6}
          className="w-full min-w-0 resize-none rounded-[10px] border border-[#D0D5DD] bg-white px-3 py-3 text-sm font-bold text-[#344054] outline-none transition placeholder:text-slate-400 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
        />
      ) : (
        <p className="whitespace-pre-wrap break-words text-sm font-extrabold leading-6 text-[#344054]">
          {value || "—"}
        </p>
      )}
    </div>
  );
}

function EmptyProfileState({ message }) {
  return (
    <div className="rounded-xl border border-dashed border-[#D9E2EC] bg-[#F8FAFC] px-4 py-8 text-center text-sm font-bold text-sibs-tertiary-5 sm:px-5">
      {message}
    </div>
  );
}

function PlaceholderProfileTab({ title, message, icon }) {
  return (
    <ProfileCard title={title} subtitle={message} icon={icon}>
      <EmptyProfileState message={message} />
    </ProfileCard>
  );
}

function PersonalPdsTab({
  activeSubTab = "basic",
  employee,
  isEditing,
  onChange,
}) {
  return (
    <div className="space-y-4 sm:space-y-5">
      {activeSubTab === "basic" && (
        <ProfileCard
          title="Personal Information"
          subtitle="Basic identity and personal details."
          icon={User}
        >
          <div className="space-y-3">
            <ProfileGrid cols="md:grid-cols-2">
              <ProfileDetail label="SIBS ID" value={getProfileSibsId(employee)} />

              <ProfileDetail
                label="Status"
                value={employee?.status || "Active"}
                editable={isEditing}
                onChange={(value) => onChange("status", value)}
              />
            </ProfileGrid>

            <ProfileGrid cols="sm:grid-cols-2 xl:grid-cols-4">
              <ProfileDetail
                label="First Name"
                value={employee?.firstName}
                editable={isEditing}
                onChange={(value) => onChange("firstName", value)}
              />

              <ProfileDetail
                label="Middle Name"
                value={employee?.middleName}
                editable={isEditing}
                onChange={(value) => onChange("middleName", value)}
              />

              <ProfileDetail
                label="Last Name"
                value={employee?.lastName}
                editable={isEditing}
                onChange={(value) => onChange("lastName", value)}
              />

              <ProfileDetail
                label="Name Extension"
                value={employee?.nameExtension}
                editable={isEditing}
                onChange={(value) => onChange("nameExtension", value)}
              />
            </ProfileGrid>

            <ProfileGrid cols="sm:grid-cols-2 xl:grid-cols-4">
              <ProfileDetail
                label="Preferred Name"
                value={employee?.preferredName}
                editable={isEditing}
                onChange={(value) => onChange("preferredName", value)}
              />

              <ProfileDetail
                label="Birth Date"
                value={
                  isEditing
                    ? toInputDate(employee?.birthdate)
                    : displayDate(employee?.birthdate)
                }
                editable={isEditing}
                type="date"
                onChange={(value) => onChange("birthdate", value)}
              />

              <ProfileDetail
                label="Place of Birth"
                value={employee?.placeOfBirth}
                editable={isEditing}
                onChange={(value) => onChange("placeOfBirth", value)}
              />

              <ProfileDetail
                label="Gender"
                value={employee?.gender}
                editable={isEditing}
                onChange={(value) => onChange("gender", value)}
              />
            </ProfileGrid>

            <ProfileGrid cols="sm:grid-cols-2 xl:grid-cols-3">
              <ProfileDetail
                label="Civil Status"
                value={employee?.civilStatus}
                editable={isEditing}
                onChange={(value) => onChange("civilStatus", value)}
              />

              <ProfileDetail
                label="Citizenship"
                value={employee?.citizenship}
                editable={isEditing}
                onChange={(value) => onChange("citizenship", value)}
              />

              <ProfileDetail
                label="Blood Type"
                value={employee?.bloodType}
                editable={isEditing}
                onChange={(value) => onChange("bloodType", value)}
              />
            </ProfileGrid>
          </div>
        </ProfileCard>
      )}

      {activeSubTab === "contact" && (
        <ProfileCard
          title="Contact Information"
          subtitle="Email, mobile number, and telephone details."
          icon={Mail}
        >
          <ProfileGrid cols="sm:grid-cols-2 xl:grid-cols-3">
            <ProfileDetail
              label="Email"
              value={employee?.email}
              editable={isEditing}
              onChange={(value) => onChange("email", value)}
            />

            <ProfileDetail
              label="Mobile Number"
              value={employee?.contact}
              editable={isEditing}
              onChange={(value) => onChange("contact", value)}
            />

            <ProfileDetail
              label="Telephone"
              value={employee?.telephone}
              editable={isEditing}
              onChange={(value) => onChange("telephone", value)}
            />
          </ProfileGrid>
        </ProfileCard>
      )}

      {activeSubTab === "address" && (
        <ProfileCard
          title="Address Information"
          subtitle="Residential and permanent address."
          icon={MapPin}
        >
          <ProfileGrid cols="xl:grid-cols-2">
            <ProfileTextarea
              label="Residential Address"
              value={employee?.residentialAddress}
              editable={isEditing}
              onChange={(value) => onChange("residentialAddress", value)}
            />

            <ProfileTextarea
              label="Permanent Address"
              value={employee?.permanentAddress}
              editable={isEditing}
              onChange={(value) => onChange("permanentAddress", value)}
            />
          </ProfileGrid>
        </ProfileCard>
      )}

      {activeSubTab === "ids" && (
        <ProfileCard
          title="Government and Physical Details"
          subtitle="Government IDs and PDS physical information."
          icon={WalletCards}
        >
          <ProfileGrid cols="sm:grid-cols-2 xl:grid-cols-4">
            <ProfileDetail
              label="GSIS"
              value={employee?.gsis}
              editable={isEditing}
              onChange={(value) => onChange("gsis", value)}
            />

            <ProfileDetail
              label="SSS"
              value={employee?.sss}
              editable={isEditing}
              onChange={(value) => onChange("sss", value)}
            />

            <ProfileDetail
              label="PhilHealth"
              value={employee?.phic}
              editable={isEditing}
              onChange={(value) => onChange("phic", value)}
            />

            <ProfileDetail
              label="PAG-IBIG / HDMF"
              value={employee?.hdmf}
              editable={isEditing}
              onChange={(value) => onChange("hdmf", value)}
            />

            <ProfileDetail
              label="TIN"
              value={employee?.tin}
              editable={isEditing}
              onChange={(value) => onChange("tin", value)}
            />

            <ProfileDetail
              label="Height"
              value={employee?.height}
              editable={isEditing}
              onChange={(value) => onChange("height", value)}
            />

            <ProfileDetail
              label="Weight"
              value={employee?.weight}
              editable={isEditing}
              onChange={(value) => onChange("weight", value)}
            />

            <ProfileDetail
              label="Work Setup"
              value={employee?.workSetup}
              editable={isEditing}
              onChange={(value) => onChange("workSetup", value)}
            />
          </ProfileGrid>
        </ProfileCard>
      )}
    </div>
  );
}

function FamilyPdsTab({
  activeSubTab = "spouse",
  employee,
  isEditing,
  onChange,
  onChildrenChange,
}) {
  return (
    <div className="space-y-4 sm:space-y-5">
      {activeSubTab === "spouse" && (
        <ProfileCard
          title="Spouse Information"
          subtitle="Family background spouse details."
          icon={UserRoundPen}
        >
          <ProfileGrid cols="sm:grid-cols-2 xl:grid-cols-3">
            <ProfileDetail
              label="Surname"
              value={employee?.spouseSurname}
              editable={isEditing}
              onChange={(value) => onChange("spouseSurname", value)}
            />

            <ProfileDetail
              label="First Name"
              value={employee?.spouseFirstName}
              editable={isEditing}
              onChange={(value) => onChange("spouseFirstName", value)}
            />

            <ProfileDetail
              label="Middle Name"
              value={employee?.spouseMiddleName}
              editable={isEditing}
              onChange={(value) => onChange("spouseMiddleName", value)}
            />

            <ProfileDetail
              label="Occupation"
              value={employee?.spouseOccupation}
              editable={isEditing}
              onChange={(value) => onChange("spouseOccupation", value)}
            />

            <ProfileDetail
              label="Employer / Business"
              value={employee?.spouseEmployer}
              editable={isEditing}
              onChange={(value) => onChange("spouseEmployer", value)}
            />

            <ProfileDetail
              label="Telephone"
              value={employee?.spouseTelephone}
              editable={isEditing}
              onChange={(value) => onChange("spouseTelephone", value)}
            />
          </ProfileGrid>

          <div className="mt-3">
            <ProfileTextarea
              label="Business Address"
              value={employee?.spouseBusinessAddress}
              editable={isEditing}
              onChange={(value) => onChange("spouseBusinessAddress", value)}
            />
          </div>
        </ProfileCard>
      )}

      {activeSubTab === "parents" && (
        <ProfileCard
          title="Parents Information"
          subtitle="Father and mother details."
          icon={User}
        >
          <div className="space-y-4">
            <div>
              <p className="mb-3 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                Father
              </p>

              <ProfileGrid cols="sm:grid-cols-2 xl:grid-cols-3">
                <ProfileDetail
                  label="Surname"
                  value={employee?.fatherSurname}
                  editable={isEditing}
                  onChange={(value) => onChange("fatherSurname", value)}
                />

                <ProfileDetail
                  label="First Name"
                  value={employee?.fatherFirstName}
                  editable={isEditing}
                  onChange={(value) => onChange("fatherFirstName", value)}
                />

                <ProfileDetail
                  label="Middle Name"
                  value={employee?.fatherMiddleName}
                  editable={isEditing}
                  onChange={(value) => onChange("fatherMiddleName", value)}
                />
              </ProfileGrid>
            </div>

            <div>
              <p className="mb-3 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                Mother
              </p>

              <ProfileGrid cols="sm:grid-cols-2 xl:grid-cols-3">
                <ProfileDetail
                  label="Maiden Surname"
                  value={employee?.motherMaidenSurname}
                  editable={isEditing}
                  onChange={(value) => onChange("motherMaidenSurname", value)}
                />

                <ProfileDetail
                  label="First Name"
                  value={employee?.motherFirstName}
                  editable={isEditing}
                  onChange={(value) => onChange("motherFirstName", value)}
                />

                <ProfileDetail
                  label="Middle Name"
                  value={employee?.motherMiddleName}
                  editable={isEditing}
                  onChange={(value) => onChange("motherMiddleName", value)}
                />
              </ProfileGrid>
            </div>
          </div>
        </ProfileCard>
      )}

      {activeSubTab === "children" && (
        <EditableRecordList
          title="Children"
          subtitle="Name and birth date of children."
          icon={User}
          records={employee?.children || []}
          isEditing={isEditing}
          emptyMessage="No children records added yet."
          addLabel="Add Child"
          newRecord={{ name: "", birthDate: "" }}
          fields={[
            { key: "name", label: "Full Name" },
            { key: "birthDate", label: "Birth Date", type: "date" },
          ]}
          primaryField="name"
          metaFields={["birthDate"]}
          onChange={onChildrenChange}
        />
      )}

      {activeSubTab === "emergency" && (
        <ProfileCard
          title="Emergency Contact"
          subtitle="Emergency contact details."
          icon={ShieldAlert}
        >
          <ProfileGrid cols="sm:grid-cols-2">
            <ProfileDetail
              label="Name"
              value={employee?.emergencyName}
              editable={isEditing}
              onChange={(value) => onChange("emergencyName", value)}
            />

            <ProfileDetail
              label="Relationship"
              value={employee?.emergencyRelationship}
              editable={isEditing}
              onChange={(value) => onChange("emergencyRelationship", value)}
            />

            <ProfileDetail
              label="Phone Number"
              value={employee?.emergencyPhone}
              editable={isEditing}
              onChange={(value) => onChange("emergencyPhone", value)}
            />

            <ProfileDetail
              label="Email"
              value={employee?.emergencyEmail}
              editable={isEditing}
              onChange={(value) => onChange("emergencyEmail", value)}
            />
          </ProfileGrid>
        </ProfileCard>
      )}
    </div>
  );
}

function EducationPdsTab({ education = [], isEditing, onChange }) {
  return (
    <EditableRecordList
      title="Educational Background"
      subtitle="Academic background following the PDS structure."
      icon={GraduationCap}
      records={education}
      isEditing={isEditing}
      emptyMessage="No education records added yet."
      addLabel="Add Education"
      newRecord={{
        level: "",
        school: "",
        degree: "",
        from: "",
        to: "",
        highestLevel: "",
        yearGraduated: "",
        honors: "",
      }}
      fields={[
        { key: "level", label: "Level" },
        { key: "school", label: "Name of School" },
        { key: "degree", label: "Degree / Course" },
        { key: "from", label: "From" },
        { key: "to", label: "To" },
        { key: "highestLevel", label: "Highest Level / Units Earned" },
        { key: "yearGraduated", label: "Year Graduated" },
        { key: "honors", label: "Honors Received" },
      ]}
      primaryField="degree"
      secondaryField="school"
      metaFields={["level", "from", "to", "yearGraduated"]}
      onChange={onChange}
    />
  );
}

function EligibilityPdsTab({ eligibility = [], isEditing, onChange }) {
  return (
    <EditableRecordList
      title="Civil Service Eligibility"
      subtitle="Licenses, certifications, and eligibility records."
      icon={BadgeCheck}
      records={eligibility}
      isEditing={isEditing}
      emptyMessage="No eligibility records added yet."
      addLabel="Add Eligibility"
      newRecord={{
        title: "",
        rating: "",
        examDate: "",
        examPlace: "",
        licenseNumber: "",
        validityDate: "",
      }}
      fields={[
        { key: "title", label: "Eligibility / License" },
        { key: "rating", label: "Rating" },
        { key: "examDate", label: "Date of Exam / Conferment", type: "date" },
        { key: "examPlace", label: "Place of Exam / Conferment" },
        { key: "licenseNumber", label: "License Number" },
        { key: "validityDate", label: "Validity Date", type: "date" },
      ]}
      primaryField="title"
      secondaryField="licenseNumber"
      metaFields={["rating", "examDate", "validityDate"]}
      onChange={onChange}
    />
  );
}

function ExperiencePdsTab({ experience = [], isEditing, onChange }) {
  return (
    <EditableRecordList
      title="Work Experience"
      subtitle="Previous and current work experience."
      icon={Briefcase}
      records={experience}
      isEditing={isEditing}
      emptyMessage="No work experience records added yet."
      addLabel="Add Experience"
      newRecord={{
        from: "",
        to: "",
        position: "",
        company: "",
        salary: "",
        salaryGrade: "",
        appointmentStatus: "",
        governmentService: "",
        duties: "",
      }}
      fields={[
        { key: "from", label: "From", type: "date" },
        { key: "to", label: "To", type: "date" },
        { key: "position", label: "Position Title" },
        { key: "company", label: "Company / Office" },
        { key: "salary", label: "Monthly Salary" },
        { key: "salaryGrade", label: "Salary / Job Grade" },
        { key: "appointmentStatus", label: "Status of Appointment" },
        { key: "governmentService", label: "Government Service Y/N" },
        { key: "duties", label: "Duties" },
      ]}
      primaryField="position"
      secondaryField="company"
      metaFields={["from", "to", "appointmentStatus"]}
      onChange={onChange}
    />
  );
}

function TrainingPdsTab({ trainings = [], isEditing, onChange }) {
  return (
    <EditableRecordList
      title="Learning and Development"
      subtitle="Training programs, seminars, and interventions attended."
      icon={Dumbbell}
      records={trainings}
      isEditing={isEditing}
      emptyMessage="No training records added yet."
      addLabel="Add Training"
      newRecord={{
        title: "",
        from: "",
        to: "",
        hours: "",
        type: "",
        conductedBy: "",
      }}
      fields={[
        { key: "title", label: "Training Title" },
        { key: "from", label: "From", type: "date" },
        { key: "to", label: "To", type: "date" },
        { key: "hours", label: "Number of Hours" },
        { key: "type", label: "Type of LD" },
        { key: "conductedBy", label: "Conducted / Sponsored By" },
      ]}
      primaryField="title"
      secondaryField="conductedBy"
      metaFields={["from", "to", "hours", "type"]}
      onChange={onChange}
    />
  );
}

function SkillsPdsTab({
  activeSubTab = "skills",
  skills = [],
  recognitions = [],
  organizations = [],
  isEditing,
  onSkillsChange,
  onRecognitionsChange,
  onOrganizationsChange,
}) {
  return (
    <div className="space-y-4 sm:space-y-5">
      {activeSubTab === "skills" && (
        <SkillsProfileSection
          skills={skills}
          isEditing={isEditing}
          onChange={onSkillsChange}
        />
      )}

      {activeSubTab === "recognitions" && (
        <EditableTextList
          title="Non-Academic Distinctions / Recognition"
          subtitle="Awards, distinctions, and recognition received."
          icon={BadgeCheck}
          items={recognitions}
          isEditing={isEditing}
          emptyMessage="No recognition records added yet."
          addLabel="Add Recognition"
          onChange={onRecognitionsChange}
        />
      )}

      {activeSubTab === "organizations" && (
        <EditableTextList
          title="Membership in Associations / Organizations"
          subtitle="Organizations, clubs, and associations."
          icon={UserRoundPen}
          items={organizations}
          isEditing={isEditing}
          emptyMessage="No organization records added yet."
          addLabel="Add Organization"
          onChange={onOrganizationsChange}
        />
      )}
    </div>
  );
}

function ReferencesPdsTab({ references = [], isEditing, onChange }) {
  return (
    <EditableRecordList
      title="References"
      subtitle="Persons not related by consanguinity or affinity."
      icon={User}
      records={references}
      isEditing={isEditing}
      emptyMessage="No references added yet."
      addLabel="Add Reference"
      newRecord={{ name: "", address: "", telephone: "" }}
      fields={[
        { key: "name", label: "Name" },
        { key: "address", label: "Address" },
        { key: "telephone", label: "Telephone Number" },
      ]}
      primaryField="name"
      secondaryField="address"
      metaFields={["telephone"]}
      onChange={onChange}
    />
  );
}

function ApplicationPdsTab({
  activeSubTab = "overview",
  employee,
  isEditing,
  onChange,
  onStatusHistoryChange,
}) {
  return (
    <div className="space-y-4 sm:space-y-5">
      {activeSubTab === "overview" && (
        <ProfileCard
          title="Application Overview"
          subtitle="Talent Pool recruitment details."
          icon={FileText}
        >
          <ProfileGrid cols="sm:grid-cols-2 xl:grid-cols-3">
            <ProfileDetail
              label="Applied Position"
              value={employee?.appliedPosition}
              editable={isEditing}
              onChange={(value) => onChange("appliedPosition", value)}
            />

            <ProfileDetail
              label="Preferred Account"
              value={employee?.preferredAccount}
              editable={isEditing}
              onChange={(value) => onChange("preferredAccount", value)}
            />

            <ProfileDetail
              label="Source"
              value={employee?.source}
              editable={isEditing}
              onChange={(value) => onChange("source", value)}
            />

            <ProfileDetail
              label="Expected Salary"
              value={employee?.expectedSalary}
              editable={isEditing}
              onChange={(value) => onChange("expectedSalary", value)}
            />

            <ProfileDetail
              label="Availability"
              value={employee?.availability}
              editable={isEditing}
              onChange={(value) => onChange("availability", value)}
            />

            <ProfileDetail
              label="Recruiter"
              value={employee?.recruiter}
              editable={isEditing}
              onChange={(value) => onChange("recruiter", value)}
            />
          </ProfileGrid>
        </ProfileCard>
      )}

      {activeSubTab === "pipeline" && (
        <ProfileCard
          title="Pipeline Information"
          subtitle="Current recruitment status and movement."
          icon={Briefcase}
        >
          <ProfileGrid cols="sm:grid-cols-2 xl:grid-cols-3">
            <ProfileDetail
              label="Candidate Status"
              value={employee?.status}
              editable={isEditing}
              onChange={(value) => onChange("status", value)}
            />

            <ProfileDetail
              label="Pipeline Stage"
              value={employee?.pipelineStage}
              editable={isEditing}
              onChange={(value) => onChange("pipelineStage", value)}
            />

            <ProfileDetail
              label="PRF Match Status"
              value={employee?.prfMatchStatus}
              editable={isEditing}
              onChange={(value) => onChange("prfMatchStatus", value)}
            />
          </ProfileGrid>

          <div className="mt-3">
            <ProfileTextarea
              label="Recruitment Remarks"
              value={employee?.remarks}
              editable={isEditing}
              onChange={(value) => onChange("remarks", value)}
            />
          </div>
        </ProfileCard>
      )}

      {activeSubTab === "assessment" && (
        <ProfileCard
          title="Assessment"
          subtitle="Assessment status and score."
          icon={BadgeCheck}
        >
          <ProfileGrid cols="sm:grid-cols-2 xl:grid-cols-3">
            <ProfileDetail
              label="Assessment Status"
              value={employee?.assessmentStatus}
              editable={isEditing}
              onChange={(value) => onChange("assessmentStatus", value)}
            />

            <ProfileDetail
              label="Assessment Score"
              value={employee?.assessmentScore}
              editable={isEditing}
              onChange={(value) => onChange("assessmentScore", value)}
            />
          </ProfileGrid>
        </ProfileCard>
      )}

      {activeSubTab === "history" && (
        <EditableRecordList
          title="Status History"
          subtitle="Candidate status movement history."
          icon={FileText}
          records={employee?.statusHistory || []}
          isEditing={isEditing}
          emptyMessage="No status history added yet."
          addLabel="Add Status History"
          newRecord={{
            date: "",
            status: "",
            stage: "",
            remarks: "",
          }}
          fields={[
            { key: "date", label: "Date", type: "date" },
            { key: "status", label: "Status" },
            { key: "stage", label: "Stage" },
            { key: "remarks", label: "Remarks" },
          ]}
          primaryField="status"
          secondaryField="stage"
          metaFields={["date", "remarks"]}
          onChange={onStatusHistoryChange}
        />
      )}
    </div>
  );
}

function NotesProfileTab({ employee, isEditing, onChange }) {
  return (
    <ProfileCard title="Notes" subtitle="Private profile notes." icon={StickyNote}>
      <ProfileTextarea
        label="Notes"
        value={employee?.notes}
        editable={isEditing}
        onChange={(value) => onChange("notes", value)}
      />
    </ProfileCard>
  );
}

function SkillsProfileSection({ skills = [], isEditing, onChange }) {
  function addSkill() {
    onChange([...skills, ""]);
  }

  function updateSkill(index, value) {
    onChange(
      skills.map((item, itemIndex) => (itemIndex === index ? value : item)),
    );
  }

  function removeSkill(index) {
    onChange(skills.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <ProfileCard
      title="Special Skills and Hobbies"
      subtitle="Skills, competencies, and hobbies."
      icon={Sparkles}
    >
      {skills.length === 0 ? (
        <EmptyProfileState message="No skills added yet." />
      ) : (
        <div className="flex flex-wrap gap-2">
          {skills.map((skill, index) => (
            <div
              key={index}
              className="inline-flex max-w-full items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-sm font-bold text-sibs-primary-1"
            >
              {isEditing ? (
                <input
                  value={typeof skill === "string" ? skill : skill?.name || ""}
                  onChange={(e) => updateSkill(index, e.target.value)}
                  className="h-7 w-32 min-w-0 bg-transparent text-sm font-bold outline-none sm:w-40"
                  placeholder="Skill"
                />
              ) : (
                <>
                  <BadgeCheck size={14} className="shrink-0" />
                  <span className="break-words">
                    {typeof skill === "string"
                      ? skill
                      : skill?.name || skill?.skillName || "Skill"}
                  </span>
                </>
              )}

              {isEditing && (
                <button
                  type="button"
                  onClick={() => removeSkill(index)}
                  className="shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {isEditing && (
        <button
          type="button"
          onClick={addSkill}
          className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC] sm:w-auto"
        >
          <Plus size={16} />
          Add Skill
        </button>
      )}
    </ProfileCard>
  );
}

function EditableTextList({
  title,
  subtitle,
  icon,
  items = [],
  isEditing,
  emptyMessage,
  addLabel,
  onChange,
}) {
  function addItem() {
    onChange([...(items || []), ""]);
  }

  function updateItem(index, value) {
    onChange(
      items.map((item, itemIndex) => (itemIndex === index ? value : item)),
    );
  }

  function removeItem(index) {
    onChange(items.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <ProfileCard title={title} subtitle={subtitle} icon={icon}>
      {items.length === 0 ? (
        <EmptyProfileState message={emptyMessage} />
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-3 sm:p-4"
            >
              {isEditing ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                    value={typeof item === "string" ? item : item?.name || ""}
                    onChange={(e) => updateItem(index, e.target.value)}
                    className="h-10 flex-1 rounded-xl border border-[#D0D5DD] bg-white px-3 text-sm font-bold text-[#344054] outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                  />

                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 text-xs font-bold text-red-600 transition hover:bg-red-100"
                  >
                    <Trash2 size={14} />
                    Remove
                  </button>
                </div>
              ) : (
                <p className="break-words text-sm font-extrabold text-[#344054]">
                  {typeof item === "string" ? item : item?.name || "—"}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {isEditing && (
        <button
          type="button"
          onClick={addItem}
          className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC] sm:w-auto"
        >
          <Plus size={16} />
          {addLabel}
        </button>
      )}
    </ProfileCard>
  );
}

function EditableRecordList({
  title,
  subtitle,
  icon,
  records = [],
  isEditing,
  emptyMessage,
  addLabel,
  newRecord,
  fields = [],
  primaryField,
  secondaryField,
  metaFields = [],
  onChange,
}) {
  const normalizedRecords = useMemo(() => {
    return Array.isArray(records) ? records : [];
  }, [records]);

  function addRecord() {
    onChange([...(normalizedRecords || []), { ...newRecord }]);
  }

  function updateRecord(index, field, value) {
    const nextList = normalizedRecords.map((item, itemIndex) =>
      itemIndex === index ? { ...normalizeRecord(item), [field]: value } : item,
    );

    onChange(nextList);
  }

  function removeRecord(index) {
    onChange(normalizedRecords.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <ProfileCard title={title} subtitle={subtitle} icon={icon}>
      {normalizedRecords.length === 0 ? (
        <EmptyProfileState message={emptyMessage} />
      ) : (
        <div className="space-y-4">
          {normalizedRecords.map((record, index) => {
            const item = normalizeRecord(record);

            if (isEditing) {
              return (
                <div
                  key={index}
                  className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-3 sm:p-4"
                >
                  <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {fields.map((field) => (
                      <ProfileDetail
                        key={field.key}
                        label={field.label}
                        value={
                          field.type === "date"
                            ? toInputDate(item?.[field.key])
                            : item?.[field.key]
                        }
                        editable
                        type={field.type || "text"}
                        onChange={(value) =>
                          updateRecord(index, field.key, value)
                        }
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeRecord(index)}
                    className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 text-xs font-bold text-red-600 transition hover:bg-red-100 sm:w-auto"
                  >
                    <Trash2 size={14} />
                    Remove
                  </button>
                </div>
              );
            }

            return (
              <div
                key={index}
                className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-3 sm:p-4"
              >
                <p className="break-words text-sm font-extrabold text-[#101828]">
                  {primaryField
                    ? item?.[primaryField] || "N/A"
                    : getRecordTitle(item)}
                </p>

                {secondaryField && (
                  <p className="mt-1 break-words text-sm font-bold text-sibs-primary-1">
                    {item?.[secondaryField] || "N/A"}
                  </p>
                )}

                {metaFields.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {metaFields.map((fieldKey) => (
                      <span
                        key={fieldKey}
                        className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-sibs-primary-1"
                      >
                        {item?.[fieldKey] || "—"}
                      </span>
                    ))}
                  </div>
                )}

                {fields
                  .filter(
                    (field) =>
                      ![primaryField, secondaryField, ...metaFields].includes(
                        field.key,
                      ),
                  )
                  .some((field) => cleanText(item?.[field.key])) && (
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {fields
                      .filter(
                        (field) =>
                          ![
                            primaryField,
                            secondaryField,
                            ...metaFields,
                          ].includes(field.key),
                      )
                      .map((field) => (
                        <ProfileDetail
                          key={field.key}
                          label={field.label}
                          value={item?.[field.key]}
                        />
                      ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {isEditing && (
        <button
          type="button"
          onClick={addRecord}
          className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC] sm:w-auto"
        >
          <Plus size={16} />
          {addLabel}
        </button>
      )}
    </ProfileCard>
  );
}

function normalizeRecord(record) {
  if (record && typeof record === "object") return record;

  return {
    name: String(record || ""),
    title: String(record || ""),
  };
}

function getRecordTitle(record) {
  return (
    record?.title ||
    record?.name ||
    record?.degree ||
    record?.position ||
    record?.school ||
    "N/A"
  );
}

function EmployeeProfileAvatar({ employee, onClick }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = getProfileImageUrl(employee);

  const shouldShowImage = imageUrl && !imageFailed;

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex h-[88px] w-[88px] shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-white/15 text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/20 hover:shadow-lg active:scale-[0.98] sm:h-[110px] sm:w-[110px]"
      title="View profile picture"
    >
      {shouldShowImage ? (
        <img
          src={imageUrl}
          alt="Profile"
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <User
          size={34}
          className="text-white transition-transform duration-300 group-hover:scale-110 sm:size-9"
        />
      )}

      <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-200 group-hover:bg-black/35 group-hover:opacity-100">
        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-sibs-primary-1 shadow-sm">
          View
        </span>
      </div>
    </button>
  );
}

function ProfilePictureViewModal({ open, employee, imageUrl, onClose }) {
  useEffect(() => {
    if (!open) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  if (!open) return null;

  const fullName = getFullName(employee);

  return (
    <div
      className="fixed inset-0 z-[99999] flex h-dvh items-center justify-center bg-black/45 px-3 py-4 backdrop-blur-sm sm:px-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-[#E6ECF2] bg-gradient-to-r from-[#F8FAFC] via-white to-white px-4 py-5 sm:px-6">
          <div className="flex items-start justify-between gap-3 sm:gap-4">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-sibs-primary-1 sm:text-xs">
                <ImageIcon size={14} />
                Profile Picture
              </div>

              <h2 className="mt-3 break-words text-xl font-extrabold text-sibs-primary-1 sm:text-2xl">
                {fullName || "Profile"}
              </h2>

              <p className="mt-1 break-words text-xs font-medium text-sibs-tertiary-5 sm:text-sm">
                SIBS ID: {getProfileSibsId(employee) || "N/A"}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 active:scale-[0.98]"
              aria-label="Close profile picture modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-4 sm:p-6">
          <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-[#D0D5DD] bg-white p-3 sm:min-h-[420px] sm:p-4">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Profile"
                className="max-h-[520px] w-full max-w-[620px] rounded-2xl object-contain shadow-sm sm:max-h-[620px]"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-sibs-primary-1/10 bg-sibs-primary-1/10 sm:h-28 sm:w-28">
                  <User size={40} className="text-sibs-primary-1 sm:size-11" />
                </div>

                <h3 className="mt-4 text-base font-extrabold text-sibs-primary-1">
                  No Profile Picture
                </h3>

                <p className="mt-1 max-w-sm text-sm font-medium leading-6 text-sibs-tertiary-5">
                  This profile has no uploaded picture yet.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-[#E6ECF2] bg-white px-4 py-4 sm:px-6">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:opacity-90 hover:shadow-md active:scale-[0.98] sm:w-auto"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}