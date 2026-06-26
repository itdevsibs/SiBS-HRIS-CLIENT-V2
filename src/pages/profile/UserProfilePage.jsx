import { useEffect, useRef, useState } from "react";
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
  Clock3,
  WalletCards,
  LineChart,
  Dumbbell,
  Laptop,
  StickyNote,
  ShieldAlert,
  MoreHorizontal,
} from "lucide-react";

import Header from "../../components/layout/Header";
import { useUser } from "../../services/context/UserContext";
import ProfileDropdown from "../../components/layout/profile/ProfileDropdown";
import ResignationModal from "../../components/modals/resignation/ResignationModal";
import StatusModal from "../../components/modals/StatusModal";
import { useResignationList } from "../../services/context/ResignationListContext";
import ResignationTab from "../../components/layout/tabs/profile/ResignationTab";

import {
  getMyEmployeeProfilePicture,
  uploadMyEmployeeProfilePicture,
} from "../../lib/axios/employeeProfile";

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
  "Resignation",
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
  Resignation: UserRoundPen,
};

function cleanText(value) {
  return String(value ?? "").trim();
}

function firstValue(...values) {
  return values.find((value) => cleanText(value)) || "";
}

function getFullName(user) {
  return [user?.firstName, user?.middleName, user?.lastName]
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

  // admin_access mapping:
  // 1 = TA
  // 2 = HR
  // 3 = HR Admin
  // 4 = Finance
  // 5 = Manager
  // 6 = Executive
  // 7 = Super Admin
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

    preferredName: firstValue(user?.preferredName, user?.preferred_name),

    email: firstValue(user?.email, user?.gy_email, user?.gy_user_email),

    contact: firstValue(
      user?.contact,
      user?.contactNum,
      user?.contactNumber,
      user?.gy_contact_num,
    ),

    department: firstValue(user?.department, user?.departmentName),

    account: firstValue(user?.account, user?.accountName),

    position: firstValue(user?.position, user?.jobTitle, user?.roleTitle),

    location: firstValue(
      user?.location,
      user?.site,
      user?.homeAddress,
      user?.gy_assignedloc,
    ),

    homeAddress: firstValue(user?.homeAddress, user?.address, user?.location),

    hireDate: firstValue(user?.hireDate, user?.gy_emp_hiredate),

    birthdate: firstValue(user?.birthdate, user?.birthDate, user?.gy_emp_dob),

    gender: firstValue(user?.gender, user?.gy_emp_gender),

    civilStatus: firstValue(
      user?.civilStatus,
      user?.maritalStatus,
      user?.gy_emp_civil_status,
    ),

    status: firstValue(user?.status, "Active"),

    workSetup: firstValue(user?.workSetup, "On-site"),

    sss: firstValue(user?.sss),
    phic: firstValue(user?.phic),
    hdmf: firstValue(user?.hdmf),
    tin: firstValue(user?.tin),

    education: Array.isArray(user?.education) ? user.education : [],
    experience: Array.isArray(user?.experience) ? user.experience : [],
    skills: Array.isArray(user?.skills) ? user.skills : [],

    emergencyName: firstValue(
      user?.emergencyName,
      user?.emergencyContactName,
    ),

    emergencyRelationship: firstValue(
      user?.emergencyRelationship,
      user?.emergencyContactRelationship,
    ),

    emergencyPhone: firstValue(
      user?.emergencyPhone,
      user?.emergencyContactNumber,
    ),

    emergencyEmail: firstValue(user?.emergencyEmail),

    notes: firstValue(user?.notes),
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

              <h2 className="mt-3 text-2xl font-extrabold text-sibs-primary-1">
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

  const [activeTab, setActiveTab] = useState("Personal");
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

  const contentRef = useRef(null);
  const [contentHeight, setContentHeight] = useState(0);

  const displayUser = isEditing
    ? draftProfile || localProfile || user
    : localProfile || user;

  const fullName = getFullName(displayUser);
  const canEditDetails = canEditProfileDetails(user);
  const resolvedSibsId = getProfileSibsId(displayUser);
  const tokenSibsId = getProfileSibsId(user);

  const education = Array.isArray(displayUser?.education)
    ? displayUser.education
    : [];

  const experience = Array.isArray(displayUser?.experience)
    ? displayUser.experience
    : [];

  const skills = Array.isArray(displayUser?.skills) ? displayUser.skills : [];

  function formatDate(dateString) {
    if (!dateString) return "N/A";

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) return "N/A";

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

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
    const updateContentHeight = () => {
      if (contentRef.current) {
        setContentHeight(contentRef.current.offsetHeight);
      }
    };

    updateContentHeight();
    window.addEventListener("resize", updateContentHeight);

    return () => window.removeEventListener("resize", updateContentHeight);
  }, [user, activeTab, displayUser]);

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
    if (activeTab === "Personal") {
      return (
        <PersonalProfileTab
          user={displayUser}
          isEditing={isEditing}
          onChange={updateDraftField}
          formatDate={formatDate}
        />
      );
    }

    if (activeTab === "Job") {
      return (
        <JobProfileTab
          user={displayUser}
          experience={experience}
          isEditing={isEditing}
          onChange={updateDraftField}
          onExperienceChange={(nextList) =>
            updateDraftList("experience", nextList)
          }
          formatDate={formatDate}
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
          user={displayUser}
          isEditing={isEditing}
          onChange={updateDraftField}
        />
      );
    }

    if (activeTab === "Emergency") {
      return (
        <EmergencyProfileTab
          user={displayUser}
          isEditing={isEditing}
          onChange={updateDraftField}
        />
      );
    }

    if (activeTab === "Notes") {
      return (
        <NotesProfileTab
          user={displayUser}
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

    if (activeTab === "Resignation") {
      return <ResignationTab maxHeight={contentHeight || undefined} />;
    }

    return null;
  }

  return (
    <div
      onClick={() => setOpenProfileDropdown(false)}
      className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta"
    >
      <Header />

      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-sibs-tertiary-10 p-4 sm:p-6">
        {!user ? (
          <div className="rounded-2xl bg-white p-6 text-sm font-medium text-sibs-tertiary-5 shadow-sm">
            Loading...
          </div>
        ) : (
          <div className="sibs-page-header-in w-full space-y-5">
            <section className="overflow-visible rounded-[22px] bg-sibs-primary-1 shadow-sm ring-1 ring-[#D9E2EC]">
              <div className="relative z-10 overflow-visible rounded-[22px] bg-sibs-primary-1 px-5 py-5 text-white">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start">
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
                    className="flex flex-wrap items-center gap-2 lg:justify-end"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {canEditDetails ? (
                      isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={cancelEditing}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 text-sm font-bold text-white transition hover:bg-white/20"
                          >
                            <RotateCcw size={16} />
                            Cancel
                          </button>

                          <button
                            type="button"
                            onClick={saveLocalChanges}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-sibs-primary-1 shadow-sm transition hover:opacity-90"
                          >
                            <Save size={16} />
                            Save Changes
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={startEditing}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-sibs-primary-1 shadow-sm transition hover:opacity-90"
                        >
                          <Edit3 size={16} />
                          Edit Profile
                        </button>
                      )
                    ) : (
                      <button
                        type="button"
                        onClick={openResignationModal}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-sibs-primary-1 shadow-sm transition hover:opacity-90"
                      >
                        <UserRoundPen size={16} />
                        Request a Change
                      </button>
                    )}

                    <div className="relative z-[60]">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenProfileDropdown((prev) => !prev);
                        }}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sibs-primary-1 transition hover:opacity-90"
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

            <div className="sibs-page-card-in grid min-h-[calc(100vh-300px)] grid-cols-1 items-stretch gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
              <ProfileSideNav
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />

              <section ref={contentRef} className="min-w-0">
                <div
                  key={activeTab}
                  className="sibs-profile-tab-panel h-full min-h-[calc(100vh-300px)]"
                >
                  {renderActiveTabContent()}
                </div>
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
          setActiveTab("Resignation");
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
    <aside className="h-full min-h-[calc(100vh-300px)] rounded-[18px] border border-[#E6ECF2] bg-white p-3 shadow-sm">
      <div className="flex h-full gap-2 overflow-x-auto no-scrollbar xl:flex-col xl:overflow-visible">
        {tabs.map((tab) => {
          const Icon = tabIcons[tab] || FileText;
          const isActive = activeTab === tab;

          return (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange(tab)}
              className={`flex h-11 min-w-max items-center gap-3 rounded-xl px-4 text-left text-sm font-extrabold transition xl:min-w-0 ${
                isActive
                  ? "bg-sibs-primary-1 text-white shadow-sm"
                  : "text-sibs-primary-1 hover:bg-[#F8FAFC]"
              }`}
            >
              <Icon size={17} className="shrink-0" />
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
      className={`rounded-[18px] border border-[#E6ECF2] bg-white p-5 shadow-sm ${className}`}
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
}) {
  const isLongText = ["email", "address"].includes(
    String(label || "").toLowerCase(),
  );

  return (
    <div className="flex h-[84px] min-w-0 flex-col justify-center rounded-[10px] bg-[#F8FAFC] px-4 py-2.5">
      <p className="mb-1.5 text-[11px] font-extrabold uppercase leading-4 tracking-wide text-sibs-primary-1/70">
        {label}
      </p>

      {editable ? (
        <input
          type={type}
          value={value || ""}
          onChange={(e) => onChange?.(e.target.value)}
          className="h-9 w-full rounded-[10px] border border-[#D0D5DD] bg-white px-3 text-sm font-bold text-[#344054] outline-none transition placeholder:text-slate-400 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
        />
      ) : (
        <p
          className={`flex min-h-9 items-center text-sm font-extrabold leading-[18px] text-[#344054] ${
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
    <div className="min-w-0 rounded-[10px] bg-[#F8FAFC] px-4 py-3">
      <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1/70">
        {label}
      </p>

      {editable ? (
        <textarea
          value={value || ""}
          onChange={(e) => onChange?.(e.target.value)}
          rows={6}
          className="w-full resize-none rounded-[10px] border border-[#D0D5DD] bg-white px-3 py-3 text-sm font-bold text-[#344054] outline-none transition placeholder:text-slate-400 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
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
    <div className="rounded-xl border border-dashed border-[#D9E2EC] bg-[#F8FAFC] px-5 py-8 text-center text-sm font-bold text-sibs-tertiary-5">
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

function PersonalProfileTab({ user, isEditing, onChange, formatDate }) {
  return (
    <div className="flex h-full min-h-[calc(100vh-300px)] flex-col gap-5">
      <ProfileCard
        title="Personal Information"
        subtitle="Basic identity and personal details."
        icon={User}
        className="shrink-0"
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

          <ProfileGrid cols="md:grid-cols-2 xl:grid-cols-4">
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
              label="Preferred Name"
              value={user?.preferredName}
              editable={isEditing}
              onChange={(value) => onChange("preferredName", value)}
            />
          </ProfileGrid>

          <ProfileGrid cols="md:grid-cols-3">
            <ProfileDetail
              label="Birth Date"
              value={
                isEditing
                  ? toInputDate(user?.birthdate || user?.birthDate)
                  : formatDate(user?.birthdate || user?.birthDate)
              }
              editable={isEditing}
              type="date"
              onChange={(value) => onChange("birthdate", value)}
            />

            <ProfileDetail
              label="Gender"
              value={user?.gender}
              editable={isEditing}
              onChange={(value) => onChange("gender", value)}
            />

            <ProfileDetail
              label="Marital Status"
              value={user?.civilStatus || user?.maritalStatus}
              editable={isEditing}
              onChange={(value) => onChange("civilStatus", value)}
            />
          </ProfileGrid>
        </div>
      </ProfileCard>

      <div className="grid flex-1 grid-cols-1 items-stretch gap-5 xl:grid-cols-2">
        <ProfileCard
          title="Contact Information"
          subtitle="Email and phone details."
          icon={Mail}
          className="h-full"
        >
          <ProfileGrid cols="md:grid-cols-[minmax(0,1.6fr)_minmax(180px,0.8fr)]">
            <ProfileDetail
              label="Email"
              value={user?.email}
              editable={isEditing}
              onChange={(value) => onChange("email", value)}
            />

            <ProfileDetail
              label="Phone Number"
              value={user?.contact}
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
          <ProfileGrid cols="md:grid-cols-[minmax(0,1.3fr)_minmax(180px,0.8fr)]">
            <ProfileDetail
              label="Address"
              value={user?.homeAddress || user?.location}
              editable={isEditing}
              onChange={(value) => onChange("homeAddress", value)}
            />

            <ProfileDetail
              label="Work Setup"
              value={user?.workSetup || "On-site"}
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
  user,
  experience = [],
  isEditing,
  onChange,
  onExperienceChange,
  formatDate,
}) {
  return (
    <div className="space-y-5">
      <ProfileCard
        title="Job Information"
        subtitle="Employment assignment and work details."
        icon={Briefcase}
      >
        <ProfileGrid cols="md:grid-cols-2 xl:grid-cols-3">
          <ProfileDetail
            label="Department"
            value={user?.department}
            editable={isEditing}
            onChange={(value) => onChange("department", value)}
          />

          <ProfileDetail
            label="Account"
            value={user?.account}
            editable={isEditing}
            onChange={(value) => onChange("account", value)}
          />

          <ProfileDetail
            label="Position / Role"
            value={user?.position || user?.jobTitle}
            editable={isEditing}
            onChange={(value) => onChange("position", value)}
          />

          <ProfileDetail
            label="Hire Date"
            value={
              isEditing
                ? toInputDate(user?.hireDate)
                : formatDate(user?.hireDate)
            }
            editable={isEditing}
            type="date"
            onChange={(value) => onChange("hireDate", value)}
          />

          <ProfileDetail
            label="Employment Status"
            value={user?.status || "Active"}
            editable={isEditing}
            onChange={(value) => onChange("status", value)}
          />

          <ProfileDetail
            label="Manager / Supervisor"
            value={user?.manager || user?.supervisor || user?.accountManager}
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
    <div className="space-y-5">
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

function BenefitsProfileTab({ user, isEditing, onChange }) {
  return (
    <ProfileCard
      title="Benefits"
      subtitle="Government and statutory benefit information."
      icon={WalletCards}
    >
      <ProfileGrid cols="md:grid-cols-2 xl:grid-cols-4">
        <ProfileDetail
          label="SSS"
          value={user?.sss}
          editable={isEditing}
          onChange={(value) => onChange("sss", value)}
        />

        <ProfileDetail
          label="PHIC"
          value={user?.phic}
          editable={isEditing}
          onChange={(value) => onChange("phic", value)}
        />

        <ProfileDetail
          label="HDMF"
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
      </ProfileGrid>
    </ProfileCard>
  );
}

function EmergencyProfileTab({ user, isEditing, onChange }) {
  return (
    <ProfileCard
      title="Emergency Contact"
      subtitle="Emergency contact details."
      icon={ShieldAlert}
    >
      <ProfileGrid cols="md:grid-cols-2">
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
  );
}

function NotesProfileTab({ user, isEditing, onChange }) {
  return (
    <ProfileCard
      title="Notes"
      subtitle="Private employee profile notes."
      icon={StickyNote}
    >
      <ProfileTextarea
        label="Notes"
        value={user?.notes}
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
          className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
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
          className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
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
              className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-sm font-bold text-sibs-primary-1"
            >
              {isEditing ? (
                <input
                  value={typeof skill === "string" ? skill : skill?.name || ""}
                  onChange={(e) => updateSkill(index, e.target.value)}
                  className="h-7 w-40 bg-transparent text-sm font-bold outline-none"
                  placeholder="Skill"
                />
              ) : (
                <>
                  <BadgeCheck size={14} />

                  {typeof skill === "string"
                    ? skill
                    : skill?.name || skill?.skillName || "Skill"}
                </>
              )}

              {isEditing && (
                <button type="button" onClick={() => removeSkill(index)}>
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
          className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
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
      <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
          className="mt-4 inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 text-xs font-bold text-red-600 transition hover:bg-red-100"
        >
          <Trash2 size={14} />
          Remove
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
      <p className="text-sm font-extrabold text-[#101828]">
        {item?.[titleField] || "N/A"}
      </p>

      <p className="mt-1 text-sm font-bold text-sibs-primary-1">
        {item?.[subtitleField] || "N/A"}
      </p>

      <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
        {meta}
      </p>
    </div>
  );
}