import { useEffect, useRef, useState } from "react";
import {
  User,
  Phone,
  Mail,
  Building2,
  Briefcase,
  MapPin,
  CalendarDays,
  UserRoundPen,
  ChevronUp,
  X,
  UploadCloud,
  Image as ImageIcon,
  Eye,
} from "lucide-react";

import Header from "../../components/layout/Header";
import { useUser } from "../../services/context/UserContext";
import ProfileDropdown from "../../components/layout/profile/ProfileDropdown";
import ResignationModal from "../../components/modals/resignation/ResignationModal";
import PersonalTab from "../../components/layout/tabs/profile/PersonalTab";
import StatusModal from "../../components/modals/StatusModal";
import { useResignationList } from "../../services/context/ResignationListContext";
import ResignationTab from "../../components/layout/tabs/profile/ResignationTab";

import {
  getMyEmployeeProfilePicture,
  uploadMyEmployeeProfilePicture,
} from "../../lib/axios/employeeProfile";

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
  }, [open, currentImage, onClose]);

  if (!open) return null;

  const fullName = user
    ? [user.firstName, user.middleName, user.lastName]
        .filter(Boolean)
        .join(" ")
    : "";

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

  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  const asideRef = useRef(null);
  const [asideHeight, setAsideHeight] = useState(0);

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
    const updateAsideHeight = () => {
      if (asideRef.current) {
        setAsideHeight(asideRef.current.offsetHeight);
      }
    };

    updateAsideHeight();
    window.addEventListener("resize", updateAsideHeight);

    return () => window.removeEventListener("resize", updateAsideHeight);
  }, [user, activeTab]);

  useEffect(() => {
    setOpenAddResignation(openEditResignationModal);
  }, [openEditResignationModal]);

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

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return "N/A";
    }

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const fullName = user
    ? [user.firstName, user.middleName, user.lastName]
        .filter(Boolean)
        .join(" ")
    : "";

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

  function renderActiveTabContent() {
    if (activeTab === "Personal") {
      return <PersonalTab />;
    }

    if (activeTab === "Resignation") {
      return <ResignationTab maxHeight={asideHeight} />;
    }

    return (
      <div className="rounded-2xl border border-[#E6ECF2] bg-white p-6 text-sm font-medium text-sibs-tertiary-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        {activeTab} content can be added here.
      </div>
    );
  }

  return (
    <div
      onClick={() => setOpenProfileDropdown(false)}
      className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta"
    >
      <Header />

      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-sibs-tertiary-10 p-4 sm:p-6">
        {!user ? (
          <div className="sibs-profile-tab-panel rounded-2xl bg-white p-6 text-sm font-medium text-sibs-tertiary-5 shadow-sm">
            Loading...
          </div>
        ) : (
          <div className="space-y-6">
            <section className="sibs-page-header-in overflow-visible rounded-3xl bg-white">
              <div className="relative z-10 overflow-visible rounded-3xl bg-sibs-primary-1 px-4 pb-0 pt-5 text-white sm:px-6">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
                    <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenProfilePictureModal(true);
                        }}
                        className="group relative flex h-[96px] w-[96px] shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-white/15 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/20 hover:shadow-lg active:scale-[0.98] sm:h-[110px] sm:w-[110px]"
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
                          <div className="rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-sibs-primary-1 shadow-sm">
                            Edit
                          </div>
                        </div>
                      </button>

                      <div className="min-w-0 pt-1">
                        <h1 className="break-words text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl">
                          {fullName || "User Name"}
                        </h1>

                        <p className="mt-1 text-sm font-medium text-white/80">
                          {user.account || "User"}
                        </p>
                      </div>
                    </div>

                    <div
                      className="flex items-center justify-between gap-3 sm:justify-end"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenProfileDropdown((prev) => !prev)}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-sibs-primary-1 transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 hover:shadow-md active:scale-[0.98]"
                      >
                        <UserRoundPen size={16} className="shrink-0" />

                        <span className="hidden sm:inline">
                          Request a Change
                        </span>

                        <span className="sm:hidden">Request</span>
                      </button>

                      <div className="relative z-[60]">
                        <ChevronUp
                          size={18}
                          onClick={() =>
                            setOpenProfileDropdown((prev) => !prev)
                          }
                          className={`cursor-pointer shrink-0 text-white transition-transform duration-300 ${
                            openProfileDropdown ? "" : "rotate-180"
                          }`}
                        />

                        {openProfileDropdown && (
                          <div className="sibs-profile-dropdown-panel absolute right-0 top-full z-[70] mt-2">
                            <ProfileDropdown
                              openModal={setOpenAddResignation}
                              openDropdown={setOpenProfileDropdown}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto pb-0 pt-1 no-scrollbar">
                    <div className="flex min-w-max gap-1">
                      {tabs.map((tab) => {
                        const isActive = activeTab === tab;

                        return (
                          <button
                            key={tab}
                            type="button"
                            onClick={() => setActiveTab(tab)}
                            className={`group relative whitespace-nowrap rounded-t-lg px-4 py-2 text-sm font-medium transition-all duration-300 ease-out active:scale-[0.97] ${
                              isActive
                                ? "translate-y-0 bg-sibs-tertiary-10 text-sibs-primary-1 shadow-sm"
                                : "text-white/90 hover:-translate-y-0.5 hover:bg-white/10 hover:text-white"
                            }`}
                          >
                            <span className="relative z-10">{tab}</span>

                            {isActive && (
                              <span className="sibs-profile-tab-indicator absolute inset-x-2 bottom-0 h-[3px] rounded-full bg-sibs-primary-1/70" />
                            )}

                            {!isActive && (
                              <span className="absolute inset-x-2 bottom-0 h-[3px] scale-x-0 rounded-full bg-white/40 transition-transform duration-300 group-hover:scale-x-100" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div className="grid min-h-0 grid-cols-1 gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
              <aside ref={asideRef} className="min-w-0 space-y-4">
                <div
                  className="sibs-page-card-in rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                  style={{ animationDelay: "60ms" }}
                >
                  <h2 className="mb-4 text-sm font-semibold text-sibs-primary-1">
                    Vitals
                  </h2>

                  <div className="space-y-3 text-sm text-sibs-tertiary-5">
                    <InfoRow
                      icon={Phone}
                      value={user.contactNum || user.contact || "N/A"}
                    />

                    <InfoRow icon={Mail} value={user.email || "N/A"} breakText />

                    <InfoRow
                      icon={Building2}
                      value={user.department || "N/A"}
                    />

                    <InfoRow icon={Briefcase} value={user.account || "N/A"} />

                    <InfoRow
                      icon={MapPin}
                      value={user.homeAddress || user.location || "N/A"}
                    />
                  </div>
                </div>

                <div
                  className="sibs-page-card-in rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                  style={{ animationDelay: "120ms" }}
                >
                  <h2 className="mb-4 text-sm font-semibold text-sibs-primary-1">
                    Hire Date
                  </h2>

                  <InfoRow
                    icon={CalendarDays}
                    value={formatDate(user.hireDate)}
                  />
                </div>

                <div
                  className="sibs-page-card-in rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                  style={{ animationDelay: "180ms" }}
                >
                  <h2 className="mb-4 text-sm font-semibold text-sibs-primary-1">
                    Benefits
                  </h2>

                  <div className="space-y-4 text-sm text-sibs-tertiary-5">
                    <SidebarField label="SSS" value={user.sss || "N/A"} />
                    <SidebarField label="PHIC" value={user.phic || "N/A"} />
                    <SidebarField label="HDMF" value={user.hdmf || "N/A"} />
                    <SidebarField label="TIN" value={user.tin || "N/A"} />
                  </div>
                </div>
              </aside>

              <section className="min-w-0 space-y-6">
                <div key={activeTab} className="sibs-profile-tab-panel">
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
        user={user}
        currentImage={profilePicture}
        onUploadImage={handleUploadProfilePicture}
        uploading={profilePictureLoading}
      />

      <ResignationModal
        open={openAddResignation}
        onClose={() => setOpenAddResignation(false)}
        onSuccess={() => {}}
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

function InfoRow({ icon: Icon, value, breakText = false }) {
  return (
    <div className="flex min-w-0 items-start gap-3 text-sm text-sibs-tertiary-5 transition-all duration-200 hover:translate-x-1 hover:text-sibs-primary-1">
      <Icon
        size={16}
        className="mt-0.5 shrink-0 text-sibs-tertiary-5 transition-colors duration-200"
      />

      <span
        className={`min-w-0 leading-5 ${
          breakText ? "break-all" : "break-words"
        }`}
      >
        {value || "N/A"}
      </span>
    </div>
  );
}

function SidebarField({ label, value }) {
  return (
    <div className="min-w-0 transition-all duration-200 hover:translate-x-1">
      <p className="mb-1 font-medium text-sibs-primary-1">{label}</p>

      <p className="break-all leading-5 text-sibs-tertiary-5">
        {value || "N/A"}
      </p>
    </div>
  );
}