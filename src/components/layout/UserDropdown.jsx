import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, LogOut, UserKey, UserRound } from "lucide-react";
import api, { handleLogout } from "../../lib/axios/api-template";
import { useUser } from "../../services/context/UserContext";
import { useHeader } from "../../services/context/HeaderContext";
import { useAdmin } from "../../services/context/AdminContext";

export default function UserDropdown({
  avatar,
  formattedName,
  email,
  mobileCompact = false,
}) {
  const [open, setOpen] = useState(false);

  const navigate = useNavigate();
  const ref = useRef(null);

  const { user, setUser, refetchUser } = useUser();
  const { setAdminLogin } = useHeader();
  const { getAccessLabel, ADMIN_ROLES } = useAdmin();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const onLogout = async () => {
    try {
      setOpen(false);
      setUser(null);
      setAdminLogin(false);

      await handleLogout(true);
    } catch (err) {
      console.error("Logout error:", err);
      navigate("/login", { replace: true });
    }
  };

  const handleSwitchToAdmin = () => {
    setOpen(false);

    setTimeout(() => {
      setAdminLogin(true);
    }, 150);
  };

  const handleSwitchToEmployee = async () => {
    try {
      setOpen(false);

      const response = await api.post(
        "/api/users/switch-to-employee",
        {},
        {
          withCredentials: true,
        },
      );

      if (response.data?.expiresAt) {
        sessionStorage.setItem(
          "accessTokenExpiresAt",
          String(res.data.expiresAt),
        );
      }

      if (response.data?.user) {
        setUser(response.data.user);
      }

      setAdminLogin(false);

      if (typeof refetchUser === "function") {
        await refetchUser();
      }

      navigate("/dashboard/employee", { replace: true });
    } catch (err) {
      console.error("Switch to employee error:", err);
    }
  };

  const isAdminSide = ADMIN_ROLES.includes(user?.role);

  const canSwitchToAdmin =
    user?.role === "employee" &&
    [1, 2, 3, 4, 5, 6, 7].includes(Number(user?.adminAccess));

  const switchToAdminLabel = `Switch to ${getAccessLabel(user?.adminAccess)}`;

  const currentAdminRoleLabel =
    Number(user?.adminAccess) === 7
      ? "Super Admin"
      : Number(user?.adminAccess) === 6
        ? "Executive"
        : Number(user?.adminAccess) === 5
          ? "Manager"
          : Number(user?.adminAccess) === 4
            ? "Finance"
            : Number(user?.adminAccess) === 3
              ? "HR Admin"
              : Number(user?.adminAccess) === 2
                ? "HR"
                : "Talent Acquisition";

  return (
    <div className="user-dropdown" ref={ref}>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((previous) => !previous);
        }}
        className={`user-dropdown-trigger ${open ? "is-open" : ""}`}
      >
        <div className="user-dropdown-avatar">{avatar || "U"}</div>

        <div
          className={`user-dropdown-info ${
            mobileCompact ? "mobile-compact" : ""
          }`}
        >
          <span className="user-dropdown-name">{formattedName || "USER"}</span>
          <span className="user-dropdown-email">
            {email || "no-email@sibs.com"}
          </span>
        </div>

        <ChevronDown
          size={16}
          className={`user-dropdown-chevron ${open ? "rotate" : ""}`}
        />
      </button>

      {open && (
        <div className="user-dropdown-menu">
          {!isAdminSide && canSwitchToAdmin && (
            <DropdownItem
              icon={UserKey}
              title={switchToAdminLabel}
              subtitle="Current Role: Employee"
              onClick={handleSwitchToAdmin}
            />
          )}

          {isAdminSide && (
            <DropdownItem
              icon={UserRound}
              title="Switch to Employee"
              subtitle={`Current Role: ${currentAdminRoleLabel}`}
              onClick={handleSwitchToEmployee}
            />
          )}

          <button
            type="button"
            onClick={onLogout}
            className="user-dropdown-item user-dropdown-logout"
          >
            <LogOut size={20} className="user-dropdown-item-icon" />
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
}

function DropdownItem({ icon: Icon, title, subtitle, onClick }) {
  return (
    <button type="button" onClick={onClick} className="user-dropdown-item">
      <Icon size={20} className="user-dropdown-item-icon" />

      <div className="user-dropdown-item-content">
        <p className="user-dropdown-item-title">{title}</p>
        <p className="user-dropdown-item-subtitle">{subtitle}</p>
      </div>
    </button>
  );
}