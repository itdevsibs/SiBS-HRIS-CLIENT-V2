import { useEffect, useMemo, useRef, useState } from "react";
import {
  User,
  Mail,
  Briefcase,
  MapPin,
  UserRoundPen,
  X,
  UploadCloud,
  Image as ImageIcon,
  Eye,
  Edit3,
  Save,
  RotateCcw,
  BadgeCheck,
  GraduationCap,
  Sparkles,
  Plus,
  Trash2,
  FileText,
  WalletCards,
  Dumbbell,
  StickyNote,
  ShieldAlert,
  MoreHorizontal,
  ChevronRight,
} from "lucide-react";

import Header from "../../components/layout/Header";
import { useUser } from "../../services/context/UserContext";
import ProfileDropdown from "../../components/layout/profile/ProfileDropdown";
import ResignationModal from "../../components/modals/resignation/ResignationModal";
import StatusModal from "../../components/modals/StatusModal";
import { useResignationList } from "../../services/context/ResignationListContext";

import {
  getMyEmployeeProfilePicture,
  uploadMyEmployeeProfilePicture,
} from "../../lib/axios/employeeProfile";

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


const EDUCATION_LEVEL_OPTIONS = [
  { value: "Elementary", label: "Elementary" },
  { value: "Secondary", label: "Secondary" },
  { value: "Vocational / Trade Course", label: "Vocational / Trade Course" },
  { value: "College", label: "College" },
  { value: "Graduate Studies", label: "Graduate Studies" },
];

function cleanText(value) {
  return String(value ?? "").trim();
}

const PROFILE_FIELD_EDITING_CLASS = "bg-[#F1F5F9]";
const PROFILE_FIELD_FILLED_CLASS = "bg-[#F1F5F9]";
const PROFILE_FIELD_EMPTY_CLASS = "bg-[#F1F5F9]";

function hasMeaningfulValue(value) {
  if (Array.isArray(value)) {
    return value.some((item) => hasMeaningfulValue(item));
  }

  if (value && typeof value === "object") {
    return Object.values(value).some((item) => hasMeaningfulValue(item));
  }

  if (value === null || value === undefined) return false;

  const normalized = String(value).trim().toLowerCase();

  return ![
    "",
    "—",
    "-",
    "n/a",
    "na",
    "none",
    "null",
    "undefined",
  ].includes(normalized);
}

function getProfileFieldClasses(value, editable = false) {
  if (editable) return PROFILE_FIELD_EDITING_CLASS;

  return hasMeaningfulValue(value)
    ? PROFILE_FIELD_FILLED_CLASS
    : PROFILE_FIELD_EMPTY_CLASS;
}

function getProfileValueClasses(value) {
  return hasMeaningfulValue(value) ? "text-[#344054]" : "text-[#667085] italic";
}

function firstValue(...values) {
  return values.find((value) => cleanText(value)) || "";
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

function getFullName(user) {
  return [
    user?.firstName,
    user?.middleName,
    user?.lastName,
    user?.nameExtension,
  ]
    .filter(Boolean)
    .join(" ");
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

  return access >= 1 && access <= 7;
}

function getProfileSibsId(user) {
  const value = firstValue(
    user?.sibsId,
    user?.sibs_id,
    user?.employeeSibsId,
    user?.employee_sibs_id,
    user?.gy_emp_code,
    user?.gy_user_code,
    user?.username,
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

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "N/A";

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function normalizeProfileData(user) {
  const sibsId = getProfileSibsId(user);

  return {
    ...(user || {}),

    sibsId,

    firstName: firstValue(user?.firstName, user?.first_name, user?.gy_emp_fname),

    middleName: firstValue(
      user?.middleName,
      user?.middle_name,
      user?.gy_emp_mname,
    ),

    lastName: firstValue(user?.lastName, user?.last_name, user?.gy_emp_lname),

    nameExtension: firstValue(
      user?.nameExtension,
      user?.name_extension,
      user?.extensionName,
      user?.extension_name,
    ),

    preferredName: firstValue(
      user?.preferredName,
      user?.preferred_name,
      user?.nickname,
    ),

    email: firstValue(user?.email, user?.gy_email, user?.gy_user_email),

    contact: firstValue(
      user?.contact,
      user?.contactNum,
      user?.contactNumber,
      user?.mobileNumber,
      user?.mobile_number,
      user?.gy_contact_num,
    ),

    telephone: firstValue(user?.telephone, user?.telephoneNumber),

    department: firstValue(user?.department, user?.departmentName),

    account: firstValue(user?.account, user?.accountName),

    position: firstValue(user?.position, user?.jobTitle, user?.roleTitle),

    location: firstValue(
      user?.location,
      user?.site,
      user?.homeAddress,
      user?.gy_assignedloc,
    ),

    residentialAddress: firstValue(
      user?.residentialAddress,
      user?.residential_address,
      user?.homeAddress,
      user?.address,
      user?.location,
    ),

    permanentAddress: firstValue(
      user?.permanentAddress,
      user?.permanent_address,
      user?.homeAddress,
      user?.address,
      user?.location,
    ),

    hireDate: firstValue(user?.hireDate, user?.gy_emp_hiredate),

    birthdate: firstValue(user?.birthdate, user?.birthDate, user?.gy_emp_dob),

    placeOfBirth: firstValue(
      user?.placeOfBirth,
      user?.place_of_birth,
      user?.birthPlace,
      user?.birth_place,
    ),

    gender: firstValue(user?.gender, user?.sex, user?.gy_emp_gender),

    civilStatus: firstValue(
      user?.civilStatus,
      user?.maritalStatus,
      user?.gy_emp_civil_status,
    ),

    citizenship: firstValue(user?.citizenship, user?.nationality),

    status: firstValue(user?.status, "Active"),

    workSetup: firstValue(user?.workSetup, user?.work_setup, "On-site"),

    height: firstValue(user?.height),
    weight: firstValue(user?.weight),
    bloodType: firstValue(user?.bloodType, user?.blood_type),

    gsis: firstValue(user?.gsis, user?.gsisNo, user?.gsis_no),
    sss: firstValue(user?.sss, user?.sssNo, user?.sss_no),
    phic: firstValue(
      user?.phic,
      user?.philhealth,
      user?.philhealthNo,
      user?.philhealth_no,
    ),
    hdmf: firstValue(user?.hdmf, user?.pagibig, user?.pagibigNo),
    tin: firstValue(user?.tin, user?.tinNo, user?.tin_no),

    spouseSurname: firstValue(user?.spouseSurname, user?.spouse_surname),
    spouseFirstName: firstValue(user?.spouseFirstName, user?.spouse_first_name),
    spouseMiddleName: firstValue(
      user?.spouseMiddleName,
      user?.spouse_middle_name,
    ),
    spouseOccupation: firstValue(
      user?.spouseOccupation,
      user?.spouse_occupation,
    ),
    spouseEmployer: firstValue(user?.spouseEmployer, user?.spouse_employer),
    spouseBusinessAddress: firstValue(
      user?.spouseBusinessAddress,
      user?.spouse_business_address,
    ),
    spouseTelephone: firstValue(user?.spouseTelephone, user?.spouse_telephone),

    fatherSurname: firstValue(user?.fatherSurname, user?.father_surname),
    fatherFirstName: firstValue(user?.fatherFirstName, user?.father_first_name),
    fatherMiddleName: firstValue(
      user?.fatherMiddleName,
      user?.father_middle_name,
    ),

    motherMaidenSurname: firstValue(
      user?.motherMaidenSurname,
      user?.mother_maiden_surname,
      user?.motherSurname,
      user?.mother_surname,
    ),
    motherFirstName: firstValue(user?.motherFirstName, user?.mother_first_name),
    motherMiddleName: firstValue(
      user?.motherMiddleName,
      user?.mother_middle_name,
    ),

    children: normalizeList(user?.children),

    emergencyName: firstValue(user?.emergencyName, user?.emergencyContactName),

    emergencyRelationship: firstValue(
      user?.emergencyRelationship,
      user?.emergencyContactRelationship,
    ),

    emergencyPhone: firstValue(
      user?.emergencyPhone,
      user?.emergencyContactNumber,
    ),

    emergencyEmail: firstValue(user?.emergencyEmail),

    education: normalizeList(user?.education),
    eligibility: normalizeList(
      user?.eligibility || user?.civilServiceEligibility,
    ),
    experience: normalizeList(user?.experience || user?.workExperience),
    trainings: normalizeList(user?.trainings || user?.training),
    skills: normalizeList(user?.skills),
    recognitions: normalizeList(user?.recognitions || user?.awards),
    organizations: normalizeList(user?.organizations),
    references: normalizeList(user?.references),

    appliedPosition: firstValue(
      user?.appliedPosition,
      user?.applied_position,
      user?.position,
      user?.jobTitle,
    ),

    preferredAccount: firstValue(
      user?.preferredAccount,
      user?.preferred_account,
      user?.account,
      user?.accountName,
    ),

    source: firstValue(user?.source, user?.candidateSource),
    pipelineStage: firstValue(user?.pipelineStage, user?.currentPipelineStage),
    prfMatchStatus: firstValue(user?.prfMatchStatus, user?.matchStatus),
    expectedSalary: firstValue(user?.expectedSalary, user?.expected_salary),
    availability: firstValue(user?.availability, user?.availableDate),
    recruiter: firstValue(user?.recruiter, user?.recruiterName),
    assessmentStatus: firstValue(
      user?.assessmentStatus,
      user?.assessment_status,
    ),
    assessmentScore: firstValue(user?.assessmentScore, user?.score),
    remarks: firstValue(user?.remarks, user?.notes),
    statusHistory: normalizeList(user?.statusHistory || user?.status_history),

    notes: firstValue(user?.notes, user?.remarks),
  };
}

function buildEditableUser(user) {
  return normalizeProfileData(user);
}

function ProfilePictureModal({
  open,
  onClose,
  user,
  currentImage,
  onUploadImage,
  uploading = false,
}) {
  const fileInputRef = useRef(null);
  const [activeView, setActiveView] = useState("view");

  useEffect(() => {
    if (!open) return;

    setActiveView(currentImage ? "view" : "upload");

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const handleEscape = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, currentImage, onClose]);

  if (!open) return null;

  const fullName = getFullName(user);

  function handleFileChange(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
      "image/gif",
    ];

    if (!allowedTypes.includes(file.type)) {
      onUploadImage?.(null, {
        type: "error",
        title: "Invalid File",
        message: "Please select a valid JPG, PNG, WEBP, or GIF image file.",
      });

      e.target.value = "";
      return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      onUploadImage?.(null, {
        type: "error",
        title: "File Too Large",
        message: "Profile picture must be 5MB or below.",
      });

      e.target.value = "";
      return;
    }

    setActiveView("upload");
    onUploadImage?.(file);
    e.target.value = "";
  }

  return (
    <div
      className="fixed inset-0 z-[99999] flex h-dvh items-center justify-center bg-black/45 px-4 py-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <div className="border-b border-[#E6ECF2] bg-gradient-to-r from-[#F8FAFC] via-white to-white px-5 py-5 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                <ImageIcon size={14} />
                Profile Picture
              </div>

              <h2 className="mt-3 break-words text-xl font-extrabold text-sibs-primary-1 sm:text-2xl">
                {fullName || "User Profile"}
              </h2>

              <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                View your current profile picture or upload a new one.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="shrink-0 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Close profile picture modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
            <div className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm">
              <button
                type="button"
                disabled={uploading}
                onClick={() => setActiveView("view")}
                className={`mb-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${
                  activeView === "view"
                    ? "bg-sibs-primary-1 text-white"
                    : "bg-[#F8FAFC] text-sibs-primary-1 hover:bg-[#EEF5FB]"
                }`}
              >
                <Eye size={17} />
                View Picture
              </button>

              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${
                  activeView === "upload"
                    ? "bg-sibs-primary-1 text-white"
                    : "bg-[#F8FAFC] text-sibs-primary-1 hover:bg-[#EEF5FB]"
                }`}
              >
                <UploadCloud size={17} />
                {uploading ? "Uploading..." : "Upload New"}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                onChange={handleFileChange}
                className="hidden"
              />

              <p className="mt-4 text-xs font-semibold leading-5 text-sibs-tertiary-5">
                Accepted formats: JPG, PNG, WEBP, and GIF. Maximum file size:
                5MB.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
              <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-[#D0D5DD] bg-[#F8FAFC] p-4">
                {uploading ? (
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="flex h-28 w-28 items-center justify-center rounded-3xl border border-sibs-primary-1/10 bg-sibs-primary-1/10">
                      <UploadCloud
                        size={44}
                        className="animate-pulse text-sibs-primary-1"
                      />
                    </div>

                    <h3 className="mt-4 text-base font-extrabold text-sibs-primary-1">
                      Uploading...
                    </h3>

                    <p className="mt-1 max-w-sm text-sm font-medium leading-6 text-sibs-tertiary-5">
                      Please wait while your profile picture is being saved.
                    </p>
                  </div>
                ) : currentImage ? (
                  <img
                    src={currentImage}
                    alt="Profile"
                    className="max-h-[420px] w-full max-w-[420px] rounded-2xl object-cover shadow-sm"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="flex h-28 w-28 items-center justify-center rounded-3xl border border-sibs-primary-1/10 bg-sibs-primary-1/10">
                      <User size={44} className="text-sibs-primary-1" />
                    </div>

                    <h3 className="mt-4 text-base font-extrabold text-sibs-primary-1">
                      No Profile Picture
                    </h3>

                    <p className="mt-1 max-w-sm text-sm font-medium leading-6 text-sibs-tertiary-5">
                      Click Upload New to add your profile picture.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UserProfilePage() {
  const { user } = useUser();
  const { openEditResignationModal } = useResignationList();

  const [activeTab, setActiveTab] = useState("personal.basic");
  const [openProfileDropdown, setOpenProfileDropdown] = useState(false);
  const [openAddResignation, setOpenAddResignation] = useState(false);
  const [openProfilePictureModal, setOpenProfilePictureModal] = useState(false);

  const [profilePicture, setProfilePicture] = useState("");
  const [profilePictureLoading, setProfilePictureLoading] = useState(false);

  const [localProfile, setLocalProfile] = useState(null);
  const [draftProfile, setDraftProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  const displayUser = isEditing
    ? draftProfile || localProfile || user
    : localProfile || user;

  const fullName = getFullName(displayUser);
  const canEditDetails = canEditProfileDetails(user);
  const resolvedSibsId = getProfileSibsId(displayUser);
  const tokenSibsId = getProfileSibsId(user);

  function openResignationModal() {
    setOpenProfileDropdown(false);
    setOpenAddResignation(true);
  }

  useEffect(() => {
    if (!user) return;

    setLocalProfile((prev) => {
      const prevKey = getProfileSibsId(prev) || prev?.email;
      const nextKey = getProfileSibsId(user) || user?.email;

      if (prev && prevKey === nextKey) return prev;

      return buildEditableUser(user);
    });
  }, [user]);

  useEffect(() => {
    if (!tokenSibsId) return;

    const controller = new AbortController();

    async function fetchCurrentEmployeeProfile() {
      try {
        const response = await fetch(
          `${API_URL}/api/employees/${encodeURIComponent(tokenSibsId)}`,
          {
            method: "GET",
            credentials: "include",
            signal: controller.signal,
          },
        );

        if (!response.ok) return;

        const result = await response.json();

        if (result?.success && result?.data) {
          setLocalProfile(
            buildEditableUser({
              ...user,
              ...result.data,
            }),
          );
        }
      } catch (error) {
        if (error?.name !== "AbortError") {
          console.error("USER PROFILE FETCH ERROR:", error);
        }
      }
    }

    fetchCurrentEmployeeProfile();

    return () => {
      controller.abort();
    };
  }, [tokenSibsId, user]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function loadProfilePicture() {
      const result = await getMyEmployeeProfilePicture();

      if (cancelled) return;

      if (result?.success && result?.data?.profilePictureUrl) {
        setProfilePicture(`${result.data.profilePictureUrl}?v=${Date.now()}`);
      } else {
        setProfilePicture("");
      }
    }

    loadProfilePicture();

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (openEditResignationModal) {
      setOpenAddResignation(true);
    }
  }, [openEditResignationModal]);

  async function handleUploadProfilePicture(file, modalStatus) {
    if (modalStatus?.type === "error") {
      setStatusModal({
        open: true,
        type: "error",
        title: modalStatus.title || "Upload Failed",
        message: modalStatus.message || "Unable to upload profile picture.",
      });
      return;
    }

    if (!file) return;

    setProfilePictureLoading(true);

    try {
      const result = await uploadMyEmployeeProfilePicture(file);

      if (!result?.success) {
        setStatusModal({
          open: true,
          type: "error",
          title: "Upload Failed",
          message: result?.message || "Failed to upload profile picture.",
        });
        return;
      }

      setProfilePicture(
        result?.data?.profilePictureUrl
          ? `${result.data.profilePictureUrl}?v=${Date.now()}`
          : "",
      );

      setOpenProfilePictureModal(false);

      setStatusModal({
        open: true,
        type: "success",
        title: "Profile Picture Updated",
        message: result?.message || "Your profile picture has been updated.",
      });
    } catch (error) {
      console.error("UPLOAD PROFILE PICTURE ERROR:", error);

      setStatusModal({
        open: true,
        type: "error",
        title: "Upload Failed",
        message: "Failed to upload profile picture.",
      });
    } finally {
      setProfilePictureLoading(false);
    }
  }

  function startEditing() {
    setOpenProfileDropdown(false);
    setDraftProfile(buildEditableUser(displayUser));
    setIsEditing(true);
  }

  function cancelEditing() {
    setDraftProfile(null);
    setIsEditing(false);
  }

  function saveLocalChanges() {
    if (!draftProfile) return;

    setLocalProfile(draftProfile);
    setDraftProfile(null);
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
    setDraftProfile((prev) => ({
      ...(prev || buildEditableUser(displayUser)),
      [field]: value,
    }));
  }

  function updateDraftList(listKey, nextList) {
    setDraftProfile((prev) => ({
      ...(prev || buildEditableUser(displayUser)),
      [listKey]: nextList,
    }));
  }

  function renderActiveTabContent() {
    if (activeTab.startsWith("personal.")) {
      return (
        <PersonalPdsTab
          activeSubTab={activeTab.replace("personal.", "")}
          user={displayUser}
          isEditing={isEditing}
          onChange={updateDraftField}
        />
      );
    }

    if (activeTab.startsWith("family.")) {
      return (
        <FamilyPdsTab
          activeSubTab={activeTab.replace("family.", "")}
          user={displayUser}
          isEditing={isEditing}
          onChange={updateDraftField}
          onChildrenChange={(nextList) => updateDraftList("children", nextList)}
        />
      );
    }

    if (activeTab === "education") {
      return (
        <EducationPdsTab
          education={displayUser?.education || []}
          isEditing={isEditing}
          onChange={(nextList) => updateDraftList("education", nextList)}
        />
      );
    }

    if (activeTab === "eligibility") {
      return (
        <EligibilityPdsTab
          eligibility={displayUser?.eligibility || []}
          isEditing={isEditing}
          onChange={(nextList) => updateDraftList("eligibility", nextList)}
        />
      );
    }

    if (activeTab === "experience") {
      return (
        <ExperiencePdsTab
          experience={displayUser?.experience || []}
          isEditing={isEditing}
          onChange={(nextList) => updateDraftList("experience", nextList)}
        />
      );
    }

    if (activeTab === "training") {
      return (
        <TrainingPdsTab
          trainings={displayUser?.trainings || []}
          isEditing={isEditing}
          onChange={(nextList) => updateDraftList("trainings", nextList)}
        />
      );
    }

    if (activeTab.startsWith("skills.")) {
      return (
        <SkillsPdsTab
          activeSubTab={activeTab.replace("skills.", "")}
          skills={displayUser?.skills || []}
          recognitions={displayUser?.recognitions || []}
          organizations={displayUser?.organizations || []}
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
          references={displayUser?.references || []}
          isEditing={isEditing}
          onChange={(nextList) => updateDraftList("references", nextList)}
        />
      );
    }

    if (activeTab.startsWith("application.")) {
      return (
        <ApplicationPdsTab
          activeSubTab={activeTab.replace("application.", "")}
          user={displayUser}
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
          user={displayUser}
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
      className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#DDE4EC] font-jakarta"
    >
      <Header />

      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-[#DDE4EC] px-3 py-4 sm:p-6">
        {!user ? (
          <div className="rounded-2xl bg-white p-6 text-sm font-medium text-sibs-tertiary-5 shadow-sm">
            Loading...
          </div>
        ) : (
          <div className="sibs-page-header-in w-full space-y-5">
            <section className="overflow-visible rounded-[22px] bg-sibs-primary-1 shadow-sm ring-1 ring-[#D9E2EC]">
              <div className="relative z-10 overflow-visible rounded-[22px] bg-sibs-primary-1 px-4 py-5 text-white sm:px-5">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenProfilePictureModal(true);
                      }}
                      className="group relative flex h-[96px] w-[96px] shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-white/15 text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/20 hover:shadow-lg active:scale-[0.98] sm:h-[110px] sm:w-[110px]"
                      title="View or upload profile picture"
                    >
                      {profilePicture ? (
                        <img
                          src={profilePicture}
                          alt="Profile"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User
                          size={36}
                          className="text-white transition-transform duration-300 group-hover:scale-110"
                        />
                      )}

                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-200 group-hover:bg-black/35 group-hover:opacity-100">
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-sibs-primary-1 shadow-sm">
                          Edit
                        </span>
                      </div>
                    </button>

                    <div className="min-w-0 pt-1">
                      <h1 className="break-words text-2xl font-extrabold leading-tight text-white sm:text-3xl lg:text-4xl">
                        {fullName || "User Name"}
                      </h1>

                      <p className="mt-1 text-sm font-bold text-white/85">
                        {displayUser?.account || "User"}
                      </p>

                      {resolvedSibsId && (
                        <p className="mt-2 text-xs font-extrabold uppercase tracking-wide text-white/70">
                          SIBS ID: {resolvedSibsId}
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
                        onClick={openResignationModal}
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

            <div className="sibs-page-card-in grid grid-cols-1 items-start gap-4 sm:gap-5 xl:min-h-[calc(100vh-300px)] xl:grid-cols-[260px_minmax(0,1fr)]">
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

      <ProfilePictureModal
        open={openProfilePictureModal}
        onClose={() => setOpenProfilePictureModal(false)}
        user={displayUser}
        currentImage={profilePicture}
        onUploadImage={handleUploadProfilePicture}
        uploading={profilePictureLoading}
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
      className={`transform-gpu transition-all duration-300 ease-out xl:h-full xl:min-h-[calc(100vh-300px)] ${
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
                        className={`mt-1 space-y-1 pr-1 transition-all duration-300 ease-out ${
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
                            className={`sibs-profile-subtopic group/sub ${
                              childActive ? "is-active" : ""
                            }`}
                          >
                            <span
                              className={`sibs-profile-subtopic-dot ${
                                childActive ? "is-active" : ""
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
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          {Icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF2FB] text-sibs-primary-1">
              <Icon size={20} />
            </div>
          )}

          <div className="min-w-0">
            <h2 className="text-base font-extrabold text-[#101828]">
              {title}
            </h2>

            {subtitle && (
              <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
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
  return <div className={`grid grid-cols-1 gap-3 ${cols}`}>{children}</div>;
}

function ProfileDetail({
  label,
  value,
  editable = false,
  onChange,
  type = "text",
  options = [],
  placeholder = "Select option",
}) {
  const isLongText = [
    "email",
    "address",
    "residential address",
    "permanent address",
  ].includes(String(label || "").toLowerCase());

  const hasValue = hasMeaningfulValue(value);
  const fieldClasses = getProfileFieldClasses(value, editable);
  const valueClasses = getProfileValueClasses(value);

  return (
    <div
      className={`flex min-h-[76px] min-w-0 flex-col justify-center rounded-[10px] px-3 py-2.5 transition-colors sm:min-h-[84px] sm:px-4 ${fieldClasses}`}
    >
      <p className="mb-1.5 break-words text-[10px] font-extrabold uppercase leading-4 tracking-wide text-sibs-primary-1/70 sm:text-[11px]">
        {label}
      </p>

      {editable ? (
        type === "select" ? (
          <select
            value={value || ""}
            onChange={(e) => onChange?.(e.target.value)}
            className="h-9 w-full min-w-0 rounded-[10px] border border-[#D0D5DD] bg-white px-3 text-sm font-bold text-[#344054] outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
          >
            <option value="">{placeholder}</option>

            {value &&
              !options.some((option) =>
                typeof option === "string"
                  ? option === value
                  : String(option.value) === String(value),
              ) && <option value={value}>{value}</option>}

            {options.map((option) => {
              const optionValue =
                typeof option === "string" ? option : option.value;
              const optionLabel =
                typeof option === "string" ? option : option.label;

              return (
                <option key={optionValue} value={optionValue}>
                  {optionLabel}
                </option>
              );
            })}
          </select>
        ) : (
          <input
            type={type}
            value={value || ""}
            onChange={(e) => onChange?.(e.target.value)}
            className="h-9 w-full min-w-0 rounded-[10px] border border-[#D0D5DD] bg-white px-3 text-sm font-bold text-[#344054] outline-none transition placeholder:text-slate-400 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
          />
        )
      ) : (
        <p
          className={`flex min-h-9 min-w-0 items-center text-sm font-extrabold leading-[18px] ${
            isLongText ? "break-all" : "break-words"
          } ${valueClasses}`}
        >
          {hasValue ? value : "—"}
        </p>
      )}
    </div>
  );
}

function ProfileTextarea({ label, value, editable = false, onChange }) {
  const hasValue = hasMeaningfulValue(value);
  const fieldClasses = getProfileFieldClasses(value, editable);
  const valueClasses = getProfileValueClasses(value);

  return (
    <div
      className={`min-w-0 rounded-[10px] px-3 py-3 transition-colors sm:px-4 ${fieldClasses}`}
    >
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
        <p
          className={`whitespace-pre-wrap break-words text-sm font-extrabold leading-6 ${valueClasses}`}
        >
          {hasValue ? value : "—"}
        </p>
      )}
    </div>
  );
}

function EmptyProfileState({ message }) {
  return (
    <div className="rounded-xl border border-dashed border-[#C8D3DF] bg-[#E2E8F0] px-5 py-8 text-center text-sm font-bold text-sibs-tertiary-5">
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
  user,
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
              <ProfileDetail label="SIBS ID" value={getProfileSibsId(user)} />

              <ProfileDetail
                label="Status"
                value={user?.status || "Active"}
                editable={isEditing}
                onChange={(value) => onChange("status", value)}
              />
            </ProfileGrid>

            <ProfileGrid cols="sm:grid-cols-2 xl:grid-cols-4">
              <ProfileDetail
                label="First Name"
                value={user?.firstName}
                editable={isEditing}
                onChange={(value) => onChange("firstName", value)}
              />

              <ProfileDetail
                label="Middle Name"
                value={user?.middleName}
                editable={isEditing}
                onChange={(value) => onChange("middleName", value)}
              />

              <ProfileDetail
                label="Last Name"
                value={user?.lastName}
                editable={isEditing}
                onChange={(value) => onChange("lastName", value)}
              />

              <ProfileDetail
                label="Name Extension"
                value={user?.nameExtension}
                editable={isEditing}
                onChange={(value) => onChange("nameExtension", value)}
              />
            </ProfileGrid>

            <ProfileGrid cols="sm:grid-cols-2 xl:grid-cols-4">
              <ProfileDetail
                label="Preferred Name"
                value={user?.preferredName}
                editable={isEditing}
                onChange={(value) => onChange("preferredName", value)}
              />

              <ProfileDetail
                label="Birth Date"
                value={
                  isEditing
                    ? toInputDate(user?.birthdate)
                    : displayDate(user?.birthdate)
                }
                editable={isEditing}
                type="date"
                onChange={(value) => onChange("birthdate", value)}
              />

              <ProfileDetail
                label="Place of Birth"
                value={user?.placeOfBirth}
                editable={isEditing}
                onChange={(value) => onChange("placeOfBirth", value)}
              />

              <ProfileDetail
                label="Gender"
                value={user?.gender}
                editable={isEditing}
                onChange={(value) => onChange("gender", value)}
              />
            </ProfileGrid>

            <ProfileGrid cols="sm:grid-cols-2 xl:grid-cols-3">
              <ProfileDetail
                label="Civil Status"
                value={user?.civilStatus}
                editable={isEditing}
                onChange={(value) => onChange("civilStatus", value)}
              />

              <ProfileDetail
                label="Citizenship"
                value={user?.citizenship}
                editable={isEditing}
                onChange={(value) => onChange("citizenship", value)}
              />

              <ProfileDetail
                label="Blood Type"
                value={user?.bloodType}
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
              value={user?.email}
              editable={isEditing}
              onChange={(value) => onChange("email", value)}
            />

            <ProfileDetail
              label="Mobile Number"
              value={user?.contact}
              editable={isEditing}
              onChange={(value) => onChange("contact", value)}
            />

            <ProfileDetail
              label="Telephone"
              value={user?.telephone}
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
              value={user?.residentialAddress}
              editable={isEditing}
              onChange={(value) => onChange("residentialAddress", value)}
            />

            <ProfileTextarea
              label="Permanent Address"
              value={user?.permanentAddress}
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
              value={user?.gsis}
              editable={isEditing}
              onChange={(value) => onChange("gsis", value)}
            />

            <ProfileDetail
              label="SSS"
              value={user?.sss}
              editable={isEditing}
              onChange={(value) => onChange("sss", value)}
            />

            <ProfileDetail
              label="PhilHealth"
              value={user?.phic}
              editable={isEditing}
              onChange={(value) => onChange("phic", value)}
            />

            <ProfileDetail
              label="PAG-IBIG / HDMF"
              value={user?.hdmf}
              editable={isEditing}
              onChange={(value) => onChange("hdmf", value)}
            />

            <ProfileDetail
              label="TIN"
              value={user?.tin}
              editable={isEditing}
              onChange={(value) => onChange("tin", value)}
            />

            <ProfileDetail
              label="Height"
              value={user?.height}
              editable={isEditing}
              onChange={(value) => onChange("height", value)}
            />

            <ProfileDetail
              label="Weight"
              value={user?.weight}
              editable={isEditing}
              onChange={(value) => onChange("weight", value)}
            />

            <ProfileDetail
              label="Work Setup"
              value={user?.workSetup}
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
  user,
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
              value={user?.spouseSurname}
              editable={isEditing}
              onChange={(value) => onChange("spouseSurname", value)}
            />

            <ProfileDetail
              label="First Name"
              value={user?.spouseFirstName}
              editable={isEditing}
              onChange={(value) => onChange("spouseFirstName", value)}
            />

            <ProfileDetail
              label="Middle Name"
              value={user?.spouseMiddleName}
              editable={isEditing}
              onChange={(value) => onChange("spouseMiddleName", value)}
            />

            <ProfileDetail
              label="Occupation"
              value={user?.spouseOccupation}
              editable={isEditing}
              onChange={(value) => onChange("spouseOccupation", value)}
            />

            <ProfileDetail
              label="Employer / Business"
              value={user?.spouseEmployer}
              editable={isEditing}
              onChange={(value) => onChange("spouseEmployer", value)}
            />

            <ProfileDetail
              label="Telephone"
              value={user?.spouseTelephone}
              editable={isEditing}
              onChange={(value) => onChange("spouseTelephone", value)}
            />
          </ProfileGrid>

          <div className="mt-3">
            <ProfileTextarea
              label="Business Address"
              value={user?.spouseBusinessAddress}
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
                  value={user?.fatherSurname}
                  editable={isEditing}
                  onChange={(value) => onChange("fatherSurname", value)}
                />

                <ProfileDetail
                  label="First Name"
                  value={user?.fatherFirstName}
                  editable={isEditing}
                  onChange={(value) => onChange("fatherFirstName", value)}
                />

                <ProfileDetail
                  label="Middle Name"
                  value={user?.fatherMiddleName}
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
                  value={user?.motherMaidenSurname}
                  editable={isEditing}
                  onChange={(value) => onChange("motherMaidenSurname", value)}
                />

                <ProfileDetail
                  label="First Name"
                  value={user?.motherFirstName}
                  editable={isEditing}
                  onChange={(value) => onChange("motherFirstName", value)}
                />

                <ProfileDetail
                  label="Middle Name"
                  value={user?.motherMiddleName}
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
          records={user?.children || []}
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
              value={user?.emergencyName}
              editable={isEditing}
              onChange={(value) => onChange("emergencyName", value)}
            />

            <ProfileDetail
              label="Relationship"
              value={user?.emergencyRelationship}
              editable={isEditing}
              onChange={(value) => onChange("emergencyRelationship", value)}
            />

            <ProfileDetail
              label="Phone Number"
              value={user?.emergencyPhone}
              editable={isEditing}
              onChange={(value) => onChange("emergencyPhone", value)}
            />

            <ProfileDetail
              label="Email"
              value={user?.emergencyEmail}
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
        { key: "level", label: "Level", type: "select", options: EDUCATION_LEVEL_OPTIONS, placeholder: "Select education level" },
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
  user,
  isEditing,
  onChange,
  onStatusHistoryChange,
}) {
  return (
    <div className="space-y-4 sm:space-y-5">
      {activeSubTab === "overview" && (
        <ProfileCard
          title="Application Overview"
          subtitle="Talent Pool or recruitment details."
          icon={FileText}
        >
          <ProfileGrid cols="sm:grid-cols-2 xl:grid-cols-3">
            <ProfileDetail
              label="Applied Position"
              value={user?.appliedPosition}
              editable={isEditing}
              onChange={(value) => onChange("appliedPosition", value)}
            />

            <ProfileDetail
              label="Preferred Account"
              value={user?.preferredAccount}
              editable={isEditing}
              onChange={(value) => onChange("preferredAccount", value)}
            />

            <ProfileDetail
              label="Source"
              value={user?.source}
              editable={isEditing}
              onChange={(value) => onChange("source", value)}
            />

            <ProfileDetail
              label="Expected Salary"
              value={user?.expectedSalary}
              editable={isEditing}
              onChange={(value) => onChange("expectedSalary", value)}
            />

            <ProfileDetail
              label="Availability"
              value={user?.availability}
              editable={isEditing}
              onChange={(value) => onChange("availability", value)}
            />

            <ProfileDetail
              label="Recruiter"
              value={user?.recruiter}
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
              value={user?.status}
              editable={isEditing}
              onChange={(value) => onChange("status", value)}
            />

            <ProfileDetail
              label="Pipeline Stage"
              value={user?.pipelineStage}
              editable={isEditing}
              onChange={(value) => onChange("pipelineStage", value)}
            />

            <ProfileDetail
              label="PRF Match Status"
              value={user?.prfMatchStatus}
              editable={isEditing}
              onChange={(value) => onChange("prfMatchStatus", value)}
            />
          </ProfileGrid>

          <div className="mt-3">
            <ProfileTextarea
              label="Recruitment Remarks"
              value={user?.remarks}
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
              value={user?.assessmentStatus}
              editable={isEditing}
              onChange={(value) => onChange("assessmentStatus", value)}
            />

            <ProfileDetail
              label="Assessment Score"
              value={user?.assessmentScore}
              editable={isEditing}
              onChange={(value) => onChange("assessmentScore", value)}
            />
          </ProfileGrid>
        </ProfileCard>
      )}

      {activeSubTab === "history" && (
        <EditableRecordList
          title="Status History"
          subtitle="Candidate or employee status movement history."
          icon={FileText}
          records={user?.statusHistory || []}
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

function NotesProfileTab({ user, isEditing, onChange }) {
  return (
    <ProfileCard title="Notes" subtitle="Private profile notes." icon={StickyNote}>
      <ProfileTextarea
        label="Notes"
        value={user?.notes}
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
              className="rounded-xl border border-[#D9E2EC] bg-[#F1F5F9] p-3 sm:p-4"
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
                <p
                  className={`break-words text-sm font-extrabold ${getProfileValueClasses(
                    typeof item === "string" ? item : item?.name,
                  )}`}
                >
                  {hasMeaningfulValue(typeof item === "string" ? item : item?.name)
                    ? typeof item === "string"
                      ? item
                      : item?.name
                    : "—"}
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
                  className="rounded-xl border border-[#D9E2EC] bg-[#F1F5F9] p-3 sm:p-4"
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
                        options={field.options}
                        placeholder={field.placeholder}
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
                className="rounded-xl border border-[#D9E2EC] bg-[#F1F5F9] p-3 sm:p-4"
              >
                <p
                  className={`break-words text-sm font-extrabold ${getProfileValueClasses(
                    primaryField ? item?.[primaryField] : getRecordTitle(item),
                  )}`}
                >
                  {hasMeaningfulValue(primaryField ? item?.[primaryField] : getRecordTitle(item))
                    ? primaryField
                      ? item?.[primaryField]
                      : getRecordTitle(item)
                    : "—"}
                </p>

                {secondaryField && (
                  <p
                    className={`mt-1 break-words text-sm font-bold ${
                      hasMeaningfulValue(item?.[secondaryField])
                        ? "text-sibs-primary-1"
                        : "text-[#667085] italic"
                    }`}
                  >
                    {hasMeaningfulValue(item?.[secondaryField])
                      ? item?.[secondaryField]
                      : "—"}
                  </p>
                )}

                {metaFields.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {metaFields.map((fieldKey) => {
                      const metaValue = item?.[fieldKey];
                      const metaHasValue = hasMeaningfulValue(metaValue);

                      return (
                        <span
                          key={fieldKey}
                          className={`rounded-full border px-3 py-1 text-xs font-bold ${
                            metaHasValue
                              ? "border-blue-100 bg-blue-50 text-sibs-primary-1"
                              : "border-[#C8D3DF] bg-[#E2E8F0] text-[#667085] italic"
                          }`}
                        >
                          {metaHasValue ? metaValue : "—"}
                        </span>
                      );
                    })}
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
