import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Briefcase,
  MapPin,
  ChevronLeft,
  MoreHorizontal,
  X,
  Image as ImageIcon,
  FileText,
  Clock3,
  WalletCards,
  LineChart,
  Dumbbell,
  Laptop,
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

const tabs = [
  "Personal",
  "Job",
  "Time Off",
  "Documents",
  "Benefits",
  "Performance",
  "Training",
  "Assets",
  "Notes",
  "Emergency",
];

const tabIcons = {
  Personal: User,
  Job: Briefcase,
  "Time Off": Clock3,
  Documents: FileText,
  Benefits: WalletCards,
  Performance: LineChart,
  Training: Dumbbell,
  Assets: Laptop,
  Notes: StickyNote,
  Emergency: ShieldAlert,
};

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

function getFullName(employee) {
  return [employee?.firstName, employee?.middleName, employee?.lastName]
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
    ),

    middleName: firstValue(
      employee?.middleName,
      employee?.middle_name,
      employee?.gy_emp_mname,
    ),

    lastName: firstValue(
      employee?.lastName,
      employee?.last_name,
      employee?.gy_emp_lname,
    ),

    preferredName: firstValue(
      employee?.preferredName,
      employee?.preferred_name,
    ),

    email: firstValue(
      employee?.email,
      employee?.gy_email,
      employee?.gy_user_email,
    ),

    contact: firstValue(
      employee?.contact,
      employee?.contactNum,
      employee?.contactNumber,
      employee?.gy_contact_num,
    ),

    department: firstValue(employee?.department, employee?.departmentName),

    account: firstValue(employee?.account, employee?.accountName),

    position: firstValue(
      employee?.position,
      employee?.jobTitle,
      employee?.roleTitle,
    ),

    location: firstValue(
      employee?.location,
      employee?.site,
      employee?.homeAddress,
      employee?.gy_assignedloc,
    ),

    homeAddress: firstValue(
      employee?.homeAddress,
      employee?.address,
      employee?.location,
    ),

    hireDate: firstValue(employee?.hireDate, employee?.gy_emp_hiredate),

    birthdate: firstValue(
      employee?.birthdate,
      employee?.birthDate,
      employee?.gy_emp_dob,
    ),

    gender: firstValue(employee?.gender, employee?.gy_emp_gender),

    civilStatus: firstValue(
      employee?.civilStatus,
      employee?.maritalStatus,
      employee?.gy_emp_civil_status,
    ),

    status: firstValue(employee?.status, "Active"),

    workSetup: firstValue(employee?.workSetup, "On-site"),

    sss: firstValue(employee?.sss),
    phic: firstValue(employee?.phic),
    hdmf: firstValue(employee?.hdmf),
    tin: firstValue(employee?.tin),

    education: Array.isArray(employee?.education) ? employee.education : [],
    experience: Array.isArray(employee?.experience) ? employee.experience : [],
    skills: Array.isArray(employee?.skills) ? employee.skills : [],

    emergencyName: firstValue(
      employee?.emergencyName,
      employee?.emergencyContactName,
    ),

    emergencyRelationship: firstValue(
      employee?.emergencyRelationship,
      employee?.emergencyContactRelationship,
    ),

    emergencyPhone: firstValue(
      employee?.emergencyPhone,
      employee?.emergencyContactNumber,
    ),

    emergencyEmail: firstValue(employee?.emergencyEmail),

    notes: firstValue(employee?.notes),
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
                {fullName || "Employee Profile"}
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
                alt="Employee profile"
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
                  This employee has no uploaded profile picture yet.
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
          alt="Employee profile"
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

export default function EmployeeDataPage() {
  const navigate = useNavigate();
  const { user: currentUser } = useUser();

  const [employee, setEmployee] = useState(null);
  const [draftEmployee, setDraftEmployee] = useState(null);
  const [activeTab, setActiveTab] = useState("Personal");
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
        const sibsId = sessionStorage.getItem("selectedEmployeeId");

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
        console.error("Failed to fetch employee:", error);
        navigate("/employee", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [navigate]);

  const fullName = getFullName(displayEmployee);
  const profileImageUrl = getProfileImageUrl(displayEmployee);

  const education = Array.isArray(displayEmployee?.education)
    ? displayEmployee.education
    : [];

  const experience = Array.isArray(displayEmployee?.experience)
    ? displayEmployee.experience
    : [];

  const skills = Array.isArray(displayEmployee?.skills)
    ? displayEmployee.skills
    : [];

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
        "Employee profile changes were updated locally. Backend saving is not connected yet.",
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
    if (activeTab === "Personal") {
      return (
        <PersonalProfileTab
          employee={displayEmployee}
          isEditing={isEditing}
          onChange={updateDraftField}
        />
      );
    }

    if (activeTab === "Job") {
      return (
        <JobProfileTab
          employee={displayEmployee}
          experience={experience}
          isEditing={isEditing}
          onChange={updateDraftField}
          onExperienceChange={(nextList) =>
            updateDraftList("experience", nextList)
          }
        />
      );
    }

    if (activeTab === "Training") {
      return (
        <TrainingProfileTab
          education={education}
          skills={skills}
          isEditing={isEditing}
          onEducationChange={(nextList) =>
            updateDraftList("education", nextList)
          }
          onSkillsChange={(nextList) => updateDraftList("skills", nextList)}
        />
      );
    }

    if (activeTab === "Benefits") {
      return (
        <BenefitsProfileTab
          employee={displayEmployee}
          isEditing={isEditing}
          onChange={updateDraftField}
        />
      );
    }

    if (activeTab === "Emergency") {
      return (
        <EmergencyProfileTab
          employee={displayEmployee}
          isEditing={isEditing}
          onChange={updateDraftField}
        />
      );
    }

    if (activeTab === "Notes") {
      return (
        <NotesProfileTab
          employee={displayEmployee}
          isEditing={isEditing}
          onChange={updateDraftField}
        />
      );
    }

    if (activeTab === "Time Off") {
      return (
        <PlaceholderProfileTab
          title="Time Off"
          message="Time off records can be added here."
          icon={Clock3}
        />
      );
    }

    if (activeTab === "Documents") {
      return (
        <PlaceholderProfileTab
          title="Documents"
          message="Employee documents can be added here."
          icon={FileText}
        />
      );
    }

    if (activeTab === "Performance") {
      return (
        <PlaceholderProfileTab
          title="Performance"
          message="Performance records can be added here."
          icon={LineChart}
        />
      );
    }

    if (activeTab === "Assets") {
      return (
        <PlaceholderProfileTab
          title="Assets"
          message="Assigned assets can be added here."
          icon={Laptop}
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

      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-sibs-tertiary-10 p-3 sm:p-6">
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
            Employee not found
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
                      <h1 className="break-words text-xl font-extrabold leading-tight text-white sm:text-3xl lg:text-4xl">
                        {fullName || "Employee Name"}
                      </h1>

                      <p className="mt-1 break-words text-sm font-bold text-white/85">
                        {displayEmployee?.account || "Employee"}
                      </p>

                      {getProfileSibsId(displayEmployee) && (
                        <p className="mt-2 break-words text-xs font-extrabold uppercase tracking-wide text-white/70">
                          SIBS ID: {getProfileSibsId(displayEmployee)}
                        </p>
                      )}
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
                        aria-label="More employee actions"
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

            <div className="sibs-page-card-in grid grid-cols-1 items-start gap-4 sm:gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
              <ProfileSideNav
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />

              <section className="min-w-0">
                <div key={activeTab} className="sibs-profile-tab-panel">
                  {renderActiveTabContent()}
                </div>
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

function ProfileSideNav({ tabs, activeTab, onTabChange }) {
  return (
    <aside className="self-start w-full rounded-[18px] border border-[#E6ECF2] bg-white p-2 shadow-sm sm:p-3 xl:min-h-[600px] xl:pb-8">
      <div className="flex gap-2 overflow-x-auto no-scrollbar xl:flex-col xl:overflow-visible">
        {tabs.map((tab) => {
          const Icon = tabIcons[tab] || FileText;
          const isActive = activeTab === tab;

          return (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange(tab)}
              className={`flex h-10 min-w-max items-center gap-2 rounded-xl px-3 text-left text-xs font-extrabold transition sm:h-11 sm:gap-3 sm:px-4 sm:text-sm xl:min-w-0 ${
                isActive
                  ? "bg-sibs-primary-1 text-white shadow-sm"
                  : "text-sibs-primary-1 hover:bg-[#F8FAFC]"
              }`}
            >
              <Icon
                size={16}
                className="h-4 w-4 shrink-0 sm:h-[17px] sm:w-[17px]"
              />
              <span className="truncate">{tab}</span>
            </button>
          );
        })}
      </div>
    </aside>
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
  const isLongText = ["email", "address"].includes(
    String(label || "").toLowerCase(),
  );

  return (
    <div className="flex min-h-[84px] min-w-0 flex-col justify-center rounded-[10px] bg-[#F8FAFC] px-3 py-2.5 sm:px-4">
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

function PersonalProfileTab({ employee, isEditing, onChange }) {
  return (
    <div className="space-y-4 sm:space-y-5">
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
              label="Preferred Name"
              value={employee?.preferredName}
              editable={isEditing}
              onChange={(value) => onChange("preferredName", value)}
            />
          </ProfileGrid>

          <ProfileGrid cols="sm:grid-cols-2 lg:grid-cols-3">
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
              label="Gender"
              value={employee?.gender}
              editable={isEditing}
              onChange={(value) => onChange("gender", value)}
            />

            <ProfileDetail
              label="Marital Status"
              value={employee?.civilStatus}
              editable={isEditing}
              onChange={(value) => onChange("civilStatus", value)}
            />
          </ProfileGrid>
        </div>
      </ProfileCard>

      <div className="grid grid-cols-1 items-stretch gap-4 sm:gap-5 xl:grid-cols-2">
        <ProfileCard
          title="Contact Information"
          subtitle="Email and phone details."
          icon={Mail}
          className="h-full"
        >
          <ProfileGrid cols="lg:grid-cols-[minmax(0,1.6fr)_minmax(180px,0.8fr)]">
            <ProfileDetail
              label="Email"
              value={employee?.email}
              editable={isEditing}
              onChange={(value) => onChange("email", value)}
            />

            <ProfileDetail
              label="Phone Number"
              value={employee?.contact}
              editable={isEditing}
              onChange={(value) => onChange("contact", value)}
            />
          </ProfileGrid>
        </ProfileCard>

        <ProfileCard
          title="Location"
          subtitle="Address and work setup."
          icon={MapPin}
          className="h-full"
        >
          <ProfileGrid cols="lg:grid-cols-[minmax(0,1.3fr)_minmax(180px,0.8fr)]">
            <ProfileDetail
              label="Address"
              value={employee?.homeAddress || employee?.location}
              editable={isEditing}
              onChange={(value) => onChange("homeAddress", value)}
            />

            <ProfileDetail
              label="Work Setup"
              value={employee?.workSetup || "On-site"}
              editable={isEditing}
              onChange={(value) => onChange("workSetup", value)}
            />
          </ProfileGrid>
        </ProfileCard>
      </div>
    </div>
  );
}

function JobProfileTab({
  employee,
  experience = [],
  isEditing,
  onChange,
  onExperienceChange,
}) {
  return (
    <div className="space-y-4 sm:space-y-5">
      <ProfileCard
        title="Job Information"
        subtitle="Employment assignment and work details."
        icon={Briefcase}
      >
        <ProfileGrid cols="sm:grid-cols-2 xl:grid-cols-3">
          <ProfileDetail
            label="Department"
            value={employee?.department}
            editable={isEditing}
            onChange={(value) => onChange("department", value)}
          />

          <ProfileDetail
            label="Account"
            value={employee?.account}
            editable={isEditing}
            onChange={(value) => onChange("account", value)}
          />

          <ProfileDetail
            label="Position / Role"
            value={employee?.position || employee?.jobTitle}
            editable={isEditing}
            onChange={(value) => onChange("position", value)}
          />

          <ProfileDetail
            label="Hire Date"
            value={
              isEditing
                ? toInputDate(employee?.hireDate)
                : displayDate(employee?.hireDate)
            }
            editable={isEditing}
            type="date"
            onChange={(value) => onChange("hireDate", value)}
          />

          <ProfileDetail
            label="Employment Status"
            value={employee?.status || "Active"}
            editable={isEditing}
            onChange={(value) => onChange("status", value)}
          />

          <ProfileDetail
            label="Manager / Supervisor"
            value={
              employee?.manager ||
              employee?.supervisor ||
              employee?.accountManager
            }
            editable={isEditing}
            onChange={(value) => onChange("manager", value)}
          />
        </ProfileGrid>
      </ProfileCard>

      <ExperienceProfileSection
        experience={experience}
        isEditing={isEditing}
        onChange={onExperienceChange}
      />
    </div>
  );
}

function TrainingProfileTab({
  education = [],
  skills = [],
  isEditing,
  onEducationChange,
  onSkillsChange,
}) {
  return (
    <div className="space-y-4 sm:space-y-5">
      <EducationProfileSection
        education={education}
        isEditing={isEditing}
        onChange={onEducationChange}
      />

      <SkillsProfileSection
        skills={skills}
        isEditing={isEditing}
        onChange={onSkillsChange}
      />
    </div>
  );
}

function BenefitsProfileTab({ employee, isEditing, onChange }) {
  return (
    <ProfileCard
      title="Benefits"
      subtitle="Government and statutory benefit information."
      icon={WalletCards}
    >
      <ProfileGrid cols="sm:grid-cols-2 xl:grid-cols-4">
        <ProfileDetail
          label="SSS"
          value={employee?.sss}
          editable={isEditing}
          onChange={(value) => onChange("sss", value)}
        />

        <ProfileDetail
          label="PHIC"
          value={employee?.phic}
          editable={isEditing}
          onChange={(value) => onChange("phic", value)}
        />

        <ProfileDetail
          label="HDMF"
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
      </ProfileGrid>
    </ProfileCard>
  );
}

function EmergencyProfileTab({ employee, isEditing, onChange }) {
  return (
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
  );
}

function NotesProfileTab({ employee, isEditing, onChange }) {
  return (
    <ProfileCard
      title="Notes"
      subtitle="Private employee profile notes."
      icon={StickyNote}
    >
      <ProfileTextarea
        label="Notes"
        value={employee?.notes}
        editable={isEditing}
        onChange={(value) => onChange("notes", value)}
      />
    </ProfileCard>
  );
}

function EducationProfileSection({ education = [], isEditing, onChange }) {
  function addEducation() {
    onChange([
      ...education,
      {
        school: "",
        degree: "",
        startYear: "",
        endYear: "",
      },
    ]);
  }

  function updateEducation(index, field, value) {
    const nextList = education.map((item, itemIndex) =>
      itemIndex === index ? { ...item, [field]: value } : item,
    );

    onChange(nextList);
  }

  function removeEducation(index) {
    onChange(education.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <ProfileCard
      title="Education"
      subtitle="Academic background and qualifications."
      icon={GraduationCap}
    >
      {education.length === 0 ? (
        <EmptyProfileState message="No education records added yet." />
      ) : (
        <div className="space-y-4">
          {education.map((item, index) => (
            <EditableTimelineItem
              key={index}
              item={item}
              isEditing={isEditing}
              titleField="degree"
              subtitleField="school"
              meta={`${item.startYear || "—"} - ${item.endYear || "Present"}`}
              fields={[
                ["degree", "Degree / Course"],
                ["school", "School"],
                ["startYear", "Start Year"],
                ["endYear", "End Year"],
              ]}
              onChange={(field, value) => updateEducation(index, field, value)}
              onRemove={() => removeEducation(index)}
            />
          ))}
        </div>
      )}

      {isEditing && (
        <button
          type="button"
          onClick={addEducation}
          className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC] sm:w-auto"
        >
          <Plus size={16} />
          Add Education
        </button>
      )}
    </ProfileCard>
  );
}

function ExperienceProfileSection({ experience = [], isEditing, onChange }) {
  function addExperience() {
    onChange([
      ...experience,
      {
        position: "",
        company: "",
        startDate: "",
        endDate: "",
      },
    ]);
  }

  function updateExperience(index, field, value) {
    const nextList = experience.map((item, itemIndex) =>
      itemIndex === index ? { ...item, [field]: value } : item,
    );

    onChange(nextList);
  }

  function removeExperience(index) {
    onChange(experience.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <ProfileCard
      title="Experience"
      subtitle="Previous and current work experience."
      icon={Briefcase}
    >
      {experience.length === 0 ? (
        <EmptyProfileState message="No experience records added yet." />
      ) : (
        <div className="space-y-4">
          {experience.map((item, index) => (
            <EditableTimelineItem
              key={index}
              item={item}
              isEditing={isEditing}
              titleField="position"
              subtitleField="company"
              meta={`${item.startDate || "—"} - ${item.endDate || "Present"}`}
              fields={[
                ["position", "Position"],
                ["company", "Company"],
                ["startDate", "Start Date"],
                ["endDate", "End Date"],
              ]}
              onChange={(field, value) => updateExperience(index, field, value)}
              onRemove={() => removeExperience(index)}
            />
          ))}
        </div>
      )}

      {isEditing && (
        <button
          type="button"
          onClick={addExperience}
          className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC] sm:w-auto"
        >
          <Plus size={16} />
          Add Experience
        </button>
      )}
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
      title="Skills"
      subtitle="Skills and competencies."
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

function EditableTimelineItem({
  item,
  isEditing,
  titleField,
  subtitleField,
  meta,
  fields = [],
  onChange,
  onRemove,
}) {
  if (isEditing) {
    return (
      <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-3 sm:p-4">
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
          {fields.map(([field, label]) => (
            <ProfileDetail
              key={field}
              label={label}
              value={item?.[field]}
              editable
              onChange={(value) => onChange(field, value)}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 text-xs font-bold text-red-600 transition hover:bg-red-100 sm:w-auto"
        >
          <Trash2 size={14} />
          Remove
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-3 sm:p-4">
      <p className="break-words text-sm font-extrabold text-[#101828]">
        {item?.[titleField] || "N/A"}
      </p>

      <p className="mt-1 break-words text-sm font-bold text-sibs-primary-1">
        {item?.[subtitleField] || "N/A"}
      </p>

      <p className="mt-1 break-words text-xs font-semibold text-sibs-tertiary-5">
        {meta}
      </p>
    </div>
  );
}