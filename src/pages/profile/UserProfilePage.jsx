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
            {/* PROFILE HEADER */}
            <section className="profile-hero">
              <div className="profile-hero-content">
                <div className="profile-user-block">
                  <div className="profile-avatar">
                    <User size={42} strokeWidth={2} />
                  </div>

                  <div className="profile-name-block">
                    <h1>{fullName || "USER NAME"} </h1>
                    <p>{user.account || "User"}</p>
                  </div>
                </div>

                <div
                  className="profile-action-area"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button type="button" className="profile-request-btn">
                    <UserRoundPen size={16} />
                    <span>Request a Change</span>
                  </button>

                  <div className="profile-dropdown-wrap">
                    <ChevronDown
                      size={18}
                      onClick={() =>
                        setOpenProfileDropdown((prev) => !prev)
                      }
                      className={`profile-dropdown-icon ${
                        openProfileDropdown ? "rotate" : ""
                      }`}
                    />

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

            {/* PROFILE BODY */}
            <div className="profile-body-grid">
              <aside ref={asideRef} className="profile-left-column">
                <div className="profile-side-card">
                  <h2>Vitals</h2>

                  <div className="profile-info-list">
                    <InfoRow
                      icon={Phone}
                      value={user.contactNum || user.contact || "N/A"}
                    />
                    <InfoRow
                      icon={Mail}
                      value={user.email || "N/A"}
                      breakText
                    />
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

      <style>{`
        .profile-page {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: var(--sibs-tertiary-10);
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .profile-main {
          min-width: 0;
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 24px;
          background: var(--sibs-tertiary-10);
        }

        .profile-wrapper {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .profile-loading-card {
          background: #ffffff;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
        }

        .profile-hero {
          overflow: visible;
          border-radius: 24px;
          background: var(--sibs-primary-1);
          color: #ffffff;
          padding: 20px 24px 0;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
        }

        .profile-hero-content {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 24px;
        }

        .profile-user-block {
          display: flex;
          align-items: flex-start;
          gap: 20px;
          min-width: 0;
        }

        .profile-avatar {
          width: 110px;
          height: 110px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.22);
          background: rgba(255, 255, 255, 0.14);
          color: #ffffff;
        }

        .profile-name-block {
          padding-top: 6px;
          min-width: 0;
        }

        .profile-name-block h1 {
          margin: 0;
          color: #ffffff;
          font-size: 38px;
          line-height: 1.1;
          font-weight: 800;
          letter-spacing: -0.9px;
          word-break: break-word;
        }

        .profile-name-block p {
          margin: 8px 0 0;
          color: rgba(255, 255, 255, 0.86);
          font-size: 14px;
          font-weight: 500;
        }

        .profile-action-area {
          display: flex;
          align-items: center;
          gap: 14px;
          position: relative;
          z-index: 60;
        }

        .profile-request-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          height: 40px;
          padding: 0 18px;
          border: none;
          border-radius: 999px;
          background: #ffffff;
          color: var(--sibs-primary-1);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }

        .profile-dropdown-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .profile-dropdown-icon {
          color: #ffffff;
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .profile-dropdown-icon.rotate {
          transform: rotate(180deg);
        }

        .profile-dropdown-menu {
          position: absolute;
          right: 0;
          top: 100%;
          z-index: 70;
          margin-top: 8px;
        }

        .profile-tabs-scroll {
          overflow-x: auto;
          padding-top: 18px;
        }

        .profile-tabs {
          display: flex;
          gap: 4px;
          min-width: max-content;
        }

        .profile-tabs button {
          white-space: nowrap;
          border: none;
          border-radius: 8px 8px 0 0;
          padding: 10px 16px;
          background: transparent;
          color: #ffffff;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }

        .profile-tabs button:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .profile-tabs button.active {
          background: var(--sibs-tertiary-10);
          color: var(--sibs-primary-1);
        }

        .profile-body-grid {
          display: grid;
          grid-template-columns: 320px minmax(0, 1fr);
          gap: 24px;
          align-items: start;
        }

        .profile-left-column {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .profile-right-column {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .profile-side-card {
          background: #ffffff;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
        }

        .profile-side-card h2 {
          margin: 0 0 16px;
          color: var(--sibs-primary-1);
          font-size: 14px;
          font-weight: 700;
        }

        .profile-info-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .profile-info-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          color: var(--sibs-tertiary-5);
          font-size: 14px;
          line-height: 1.45;
        }

        .profile-info-row svg {
          margin-top: 2px;
          flex-shrink: 0;
          color: var(--sibs-tertiary-5);
        }

        .profile-info-row span {
          min-width: 0;
        }

        .profile-info-row .break-text {
          word-break: break-all;
        }

        .profile-benefits-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          color: var(--sibs-tertiary-5);
          font-size: 14px;
        }

        .profile-benefit-field {
          min-width: 0;
        }

        .profile-benefit-field .label {
          margin: 0 0 4px;
          color: var(--sibs-primary-1);
          font-weight: 600;
        }

        .profile-benefit-field .value {
          margin: 0;
          color: var(--sibs-tertiary-5);
          line-height: 1.45;
          word-break: break-all;
        }

        .profile-empty-tab {
          background: #ffffff;
          border-radius: 16px;
          padding: 24px;
          color: var(--sibs-tertiary-5);
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
        }

        @media (max-width: 1280px) {
          .profile-body-grid {
            grid-template-columns: 1fr;
          }

          .profile-name-block h1 {
            font-size: 30px;
          }
        }

        @media (max-width: 768px) {
          .profile-main {
            padding: 16px;
          }

          .profile-hero {
            padding: 16px 16px 0;
          }

          .profile-hero-content {
            flex-direction: column;
          }

          .profile-user-block {
            flex-direction: column;
          }

          .profile-avatar {
            width: 96px;
            height: 96px;
          }

          .profile-action-area {
            width: 100%;
            justify-content: space-between;
          }

          .profile-name-block h1 {
            font-size: 26px;
          }
        }
      `}</style>
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