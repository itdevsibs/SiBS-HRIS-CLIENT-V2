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
} from "lucide-react";

import Header from "../../components/layout/Header";
import { useUser } from "../../services/context/UserContext";
import ProfileDropdown from "../../components/layout/profile/ProfileDropdown";
import ResignationModal from "../../components/modals/resignation/ResignationModal";
import PersonalTab from "../../components/layout/tabs/profile/PersonalTab";
import StatusModal from "../../components/modals/StatusModal";
import { useResignationList } from "../../services/context/ResignationListContext";
import ResignationTab from "../../components/layout/tabs/profile/ResignationTab";

export default function UserProfilePage() {
  const { user } = useUser();
  const { openEditResignationModal } = useResignationList();

  const [activeTab, setActiveTab] = useState("Personal");
  const [openProfileDropdown, setOpenProfileDropdown] = useState(false);
  const [openAddResignation, setOpenAddResignation] = useState(false);

  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  const asideRef = useRef(null);
  const [asideHeight, setAsideHeight] = useState(0);

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
                      <div className="flex h-[96px] w-[96px] shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-white/15 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/20 hover:shadow-lg sm:h-[110px] sm:w-[110px]">
                        <User
                          size={36}
                          className="text-white transition-transform duration-300 hover:scale-110"
                        />
                      </div>

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
      <p className="break-all leading-5 text-sibs-tertiary-5">{value || "N/A"}</p>
    </div>
  );
}