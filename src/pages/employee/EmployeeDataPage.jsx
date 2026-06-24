import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Phone,
  Mail,
  Building2,
  Briefcase,
  MapPin,
  CalendarDays,
  ChevronLeft,
  MoreHorizontal,
  X,
  Image as ImageIcon,
} from "lucide-react";

import Header from "../../components/layout/Header";
import { getEmployeeById } from "../../lib/axios/getEmployee";
import { formatDate } from "../../components/layout/FormatDateTime";

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

  const fullName = employee
    ? [employee.firstName, employee.middleName, employee.lastName]
        .filter(Boolean)
        .join(" ")
    : "";

  return (
    <div
      className="fixed inset-0 z-[99999] flex h-dvh items-center justify-center bg-black/45 px-4 py-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-[#E6ECF2] bg-gradient-to-r from-[#F8FAFC] via-white to-white px-5 py-5 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                <ImageIcon size={14} />
                Profile Picture
              </div>

              <h2 className="mt-3 text-2xl font-extrabold text-sibs-primary-1">
                {fullName || "Employee Profile"}
              </h2>

              <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                SiBS ID: {employee?.sibsId || "N/A"}
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

        <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-5 sm:p-6">
          <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-[#D0D5DD] bg-white p-4">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Employee profile"
                className="max-h-[620px] w-full max-w-[620px] rounded-2xl object-contain shadow-sm"
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
                  This employee has no uploaded profile picture yet.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-[#E6ECF2] bg-white px-5 py-4 sm:px-6">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:opacity-90 hover:shadow-md active:scale-[0.98]"
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
      className="group relative flex h-[96px] w-[96px] shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-white/15 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/20 hover:shadow-lg active:scale-[0.98] sm:h-[110px] sm:w-[110px]"
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
          size={36}
          className="text-white transition-transform duration-300 group-hover:scale-110"
        />
      )}

      <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-200 group-hover:bg-black/35 group-hover:opacity-100">
        <div className="rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-sibs-primary-1 shadow-sm">
          View
        </div>
      </div>
    </button>
  );
}

export default function EmployeeDataPage() {
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [activeTab, setActiveTab] = useState("Personal");
  const [loading, setLoading] = useState(true);
  const [openProfilePictureModal, setOpenProfilePictureModal] = useState(false);

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

        setEmployee(result.data);
      } catch (error) {
        console.error("Failed to fetch employee:", error);
        navigate("/employee", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [navigate]);

  const fullName = employee
    ? [employee.firstName, employee.middleName, employee.lastName]
        .filter(Boolean)
        .join(" ")
    : "";

  const profileImageUrl = getProfileImageUrl(employee);

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta">
      <Header />

      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
        <button
          type="button"
          onClick={() => navigate("/employee")}
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-sibs-primary-1 transition hover:underline"
        >
          <ChevronLeft size={16} />
          Back to Employees
        </button>

        {loading ? (
          <div className="rounded-2xl bg-white p-6 text-sm font-medium text-sibs-tertiary-5 shadow-sm">
            Loading...
          </div>
        ) : !employee ? (
          <div className="rounded-2xl bg-white p-6 text-sm font-medium text-sibs-tertiary-5 shadow-sm">
            Employee not found
          </div>
        ) : (
          <div className="space-y-6">
            <section className="overflow-hidden rounded-3xl bg-white">
              <div className="bg-sibs-primary-1 px-4 pb-0 pt-5 text-white sm:px-6">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
                      <EmployeeProfileAvatar
                        employee={employee}
                        onClick={() => setOpenProfilePictureModal(true)}
                      />

                      <div className="min-w-0 pt-1">
                        <h1 className="break-words text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl">
                          {fullName || "Employee Name"}
                        </h1>

                        <p className="mt-1 text-sm font-medium text-white/80">
                          {employee.account || "Employee"}
                        </p>

                        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-white/70">
                          SiBS ID: {employee.sibsId || "N/A"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className="rounded-full bg-white px-4 py-2 text-sm font-medium text-sibs-primary-1 transition hover:opacity-90"
                      >
                        Request a Change
                      </button>

                      <button
                        type="button"
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sibs-primary-1 transition hover:opacity-90"
                        aria-label="More actions"
                      >
                        <MoreHorizontal size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto pt-1 no-scrollbar">
                    <div className="flex min-w-max">
                      {tabs.map((tab) => {
                        const isActive = activeTab === tab;

                        return (
                          <button
                            key={tab}
                            type="button"
                            onClick={() => setActiveTab(tab)}
                            className={`whitespace-nowrap rounded-t-lg px-4 py-2 text-sm font-medium transition ${
                              isActive
                                ? "bg-sibs-tertiary-10 text-sibs-primary-1"
                                : "text-white/90 hover:bg-white/10"
                            }`}
                          >
                            {tab}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div className="grid min-h-0 grid-cols-1 gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
              <aside className="min-w-0 space-y-4">
                <SideCard title="Vitals">
                  <div className="space-y-3 text-sm text-sibs-tertiary-5">
                    <InfoRow icon={Phone} value={employee.contact || "N/A"} />

                    <InfoRow
                      icon={Mail}
                      value={employee.email || "N/A"}
                      breakText
                    />

                    <InfoRow
                      icon={Building2}
                      value={employee.department || "N/A"}
                    />

                    <InfoRow
                      icon={Briefcase}
                      value={employee.account || "N/A"}
                    />

                    <InfoRow
                      icon={MapPin}
                      value={employee.location || "N/A"}
                    />
                  </div>
                </SideCard>

                <SideCard title="Hire Date">
                  <InfoRow
                    icon={CalendarDays}
                    value={formatDate(employee.hireDate)}
                  />
                </SideCard>

                <SideCard title="Benefits">
                  <div className="space-y-4 text-sm text-sibs-tertiary-5">
                    <SidebarField label="SSS" value={employee.sss || "N/A"} />
                    <SidebarField label="PHIC" value={employee.phic || "N/A"} />
                    <SidebarField label="HDMF" value={employee.hdmf || "N/A"} />
                    <SidebarField label="TIN" value={employee.tin || "N/A"} />
                  </div>
                </SideCard>
              </aside>

              <section className="min-w-0 space-y-6">
                {activeTab === "Personal" && (
                  <div className="rounded-[22px] border border-[#D9E2EC] bg-white p-6 shadow-sm">
                    <div className="mb-6 flex items-center gap-2">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-sibs-tertiary-9">
                        <span className="text-[11px] font-bold text-sibs-primary-1">
                          ▣
                        </span>
                      </div>

                      <h3 className="text-[28px] font-bold leading-none text-sibs-primary-1">
                        Basic Information
                      </h3>
                    </div>

                    <div className="space-y-5">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <InfoField label="SiBS ID" value={employee.sibsId} />

                        <InfoField
                          label="Status"
                          value={employee.status || "Active"}
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <InfoField
                          label="First Name"
                          value={employee.firstName}
                        />

                        <InfoField
                          label="Middle Name"
                          value={employee.middleName}
                        />

                        <InfoField
                          label="Last Name"
                          value={employee.lastName}
                        />

                        <InfoField
                          label="Preferred Name"
                          value={employee.preferredName || ""}
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <InfoField
                          label="Birth Date"
                          value={formatDate(employee.birthdate)}
                        />

                        <InfoField
                          label="Gender"
                          value={employee.gender || ""}
                        />

                        <InfoField
                          label="Marital Status"
                          value={employee.civilStatus || ""}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab !== "Personal" && (
                  <div className="rounded-2xl border border-[#D9E2EC] bg-white p-6 text-sm font-medium text-sibs-tertiary-5 shadow-sm">
                    {activeTab} content can be added here.
                  </div>
                )}
              </section>
            </div>
          </div>
        )}
      </main>

      <ProfilePictureViewModal
        open={openProfilePictureModal}
        employee={employee}
        imageUrl={profileImageUrl}
        onClose={() => setOpenProfilePictureModal(false)}
      />
    </div>
  );
}

function SideCard({ title, children }) {
  return (
    <div className="rounded-2xl border border-[#D9E2EC] bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-sibs-primary-1">
        {title}
      </h2>

      {children}
    </div>
  );
}

function InfoRow({ icon: Icon, value, breakText = false }) {
  return (
    <div className="flex min-w-0 items-start gap-3 text-sm text-sibs-tertiary-5">
      <Icon size={16} className="mt-0.5 shrink-0" />

      <span className={breakText ? "min-w-0 break-all" : "min-w-0 break-words"}>
        {value || "N/A"}
      </span>
    </div>
  );
}

function InfoField({ label, value }) {
  return (
    <div className="w-full min-w-0">
      <label className="mb-2 block text-[14px] font-medium text-sibs-primary-1">
        {label}
      </label>

      <div className="flex min-h-[52px] items-center rounded-[10px] border border-[#8FA9C8] bg-white px-4 py-3 text-[15px] text-[#2F5E93]">
        <span className="break-words">{value || "N/A"}</span>
      </div>
    </div>
  );
}

function SidebarField({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="mb-1 font-medium text-sibs-primary-1">{label}</p>

      <p className="break-all leading-5">{value || "N/A"}</p>
    </div>
  );
}