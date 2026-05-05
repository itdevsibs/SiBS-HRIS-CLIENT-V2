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
  ChevronDown,
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
        .toUpperCase()
    : "";

  return (
    <div
      onClick={() => setOpenProfileDropdown(false)}
      className="profile-page"
    >
      <Header />

      <main className="profile-main">
        {!user ? (
          <div className="profile-loading-card">Loading...</div>
        ) : (
          <div className="profile-wrapper">
            <section className="profile-hero">
              <div className="profile-hero-content">
                <div className="profile-user-block">
                  <div className="profile-avatar">
                    <User size={42} strokeWidth={2} />
                  </div>

                  <div className="profile-name-block">
                    <h1>{fullName || "USER NAME"}</h1>
                    <p>{user.account || "User"}</p>
                  </div>
                </div>

                <div
                  className="profile-action-area"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="profile-request-btn"
                    onClick={() => setOpenProfileDropdown((prev) => !prev)}
                  >
                    <UserRoundPen size={16} />
                    <span>Request a Change</span>

                    <ChevronDown
                      size={16}
                      className={`profile-request-chevron ${
                        openProfileDropdown ? "rotate" : ""
                      }`}
                    />
                  </button>

                  {openProfileDropdown && (
                    <div className="profile-dropdown-menu">
                      <ProfileDropdown
                        openModal={setOpenAddResignation}
                        openDropdown={setOpenProfileDropdown}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="profile-tabs-scroll no-scrollbar">
                <div className="profile-tabs">
                  {tabs.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={activeTab === tab ? "active" : ""}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <div className="profile-body-grid">
              <aside ref={asideRef} className="profile-left-column">
                <div className="profile-side-card">
                  <h2>Vitals</h2>

                  <div className="profile-info-list">
                    <InfoRow
                      icon={Phone}
                      value={user.contactNum || user.contact || "N/A"}
                    />
                    <InfoRow icon={Mail} value={user.email || "N/A"} breakText />
                    <InfoRow
                      icon={Building2}
                      value={user.department || "N/A"}
                    />
                    <InfoRow
                      icon={Briefcase}
                      value={user.account || "N/A"}
                    />
                    <InfoRow
                      icon={MapPin}
                      value={user.homeAddress || user.location || "N/A"}
                    />
                  </div>
                </div>

                <div className="profile-side-card">
                  <h2>Hire Date</h2>

                  <InfoRow
                    icon={CalendarDays}
                    value={formatDate(user.hireDate)}
                  />
                </div>

                <div className="profile-side-card">
                  <h2>Benefits</h2>

                  <div className="profile-benefits-list">
                    <SidebarField label="SSS" value={user.sss || "N/A"} />
                    <SidebarField label="PHIC" value={user.phic || "N/A"} />
                    <SidebarField label="HDMF" value={user.hdmf || "N/A"} />
                    <SidebarField label="TIN" value={user.tin || "N/A"} />
                  </div>
                </div>
              </aside>

              <section className="profile-right-column">
                {activeTab === "Personal" && <PersonalTab />}

                {activeTab === "Resignation" && (
                  <ResignationTab maxHeight={asideHeight} />
                )}

                {activeTab !== "Personal" && activeTab !== "Resignation" && (
                  <div className="profile-empty-tab">
                    {activeTab} content can be added here.
                  </div>
                )}
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
    <div className="profile-info-row">
      <Icon size={16} strokeWidth={2} />
      <span className={breakText ? "break-text" : ""}>{value || "N/A"}</span>
    </div>
  );
}

function SidebarField({ label, value }) {
  return (
    <div className="profile-benefit-field">
      <p className="label">{label}</p>
      <p className="value">{value || "N/A"}</p>
    </div>
  );
}