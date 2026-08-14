import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  Loader2,
  LogOut,
  UserKey,
  UserRound,
} from "lucide-react";

import api, { handleLogout } from "../../../lib/axios/api-template";
import { useUser } from "../../../services/context/UserContext";
import { useHeader } from "../../../services/context/HeaderContext";
import { useAdmin } from "../../../services/context/AdminContext";

const ADMIN_ACCESS_LABELS = {
  1: "Talent Acquisition",
  2: "HR",
  3: "HR Admin",
  4: "Finance",
  5: "Manager",
  6: "Executive",
  7: "Super Admin",
};

function normalizeRole(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function getAdminAccess(user = {}) {
  return Number(
    user?.adminAccess ??
      user?.admin_access ??
      user?.access ??
      user?.gy_user_access ??
      user?.gyUserAccess ??
      0,
  );
}

export default function UserDropdown({
  avatar,
  formattedName,
  email,
  mobileCompact = false,
}) {
  const [open, setOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState("");

  const navigate = useNavigate();
  const ref = useRef(null);

  const { user, setUser, refetchUser } = useUser();
  const { setAdminLogin } = useHeader();
  const { getAccessLabel, ADMIN_ROLES = [] } = useAdmin();

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
    if (actionLoading) return;

    try {
      setActionLoading("logout");
      setOpen(false);
      setUser(null);
      setAdminLogin(false);

      await handleLogout(true);
    } catch (error) {
      console.error("Logout error:", error);
      navigate("/login", { replace: true });
    } finally {
      setActionLoading("");
    }
  };

  const handleSwitchToAdmin = () => {
    if (actionLoading) return;

    setOpen(false);

    window.setTimeout(() => {
      setAdminLogin(true);
    }, 150);
  };

  const handleSwitchToEmployee = async () => {
    if (actionLoading) return;

    try {
      setActionLoading("employee");
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
          String(response.data.expiresAt),
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
    } catch (error) {
      console.error("Switch to employee error:", error);
    } finally {
      setActionLoading("");
    }
  };

  const normalizedAdminRoles = ADMIN_ROLES.map(normalizeRole);
  const role = normalizeRole(user?.role);
  const adminAccess = getAdminAccess(user);

  const isAdminSide = normalizedAdminRoles.includes(role);

  const canSwitchToAdmin =
    role === "employee" &&
    [1, 2, 3, 4, 5, 6, 7].includes(adminAccess);

  const switchToAdminLabel = `Switch to ${
    typeof getAccessLabel === "function"
      ? getAccessLabel(adminAccess)
      : ADMIN_ACCESS_LABELS[adminAccess] || "Admin"
  }`;

  const currentAdminRoleLabel =
    ADMIN_ACCESS_LABELS[adminAccess] || "Talent Acquisition";

  return (
    <div className="relative z-[99999] min-w-0" ref={ref}>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((previous) => !previous);
        }}
        aria-expanded={open}
        aria-haspopup="menu"
        className={[
          "group flex max-w-[360px] cursor-pointer items-center gap-2.5 rounded-xl border px-2.5 py-1.5 text-left transition-all duration-200 outline-none",
          mobileCompact ? "max-[430px]:gap-0 max-[430px]:px-0 max-[430px]:py-0" : "",
          open
            ? "border-sibs-primary-1/30 bg-white shadow-md ring-2 ring-sibs-primary-1/10"
            : "border-transparent bg-transparent hover:border-sibs-tertiary-9 hover:bg-white/80",
        ].join(" ")}
      >
        <div className="flex h-8 w-8 2xl:h-9 2xl:w-9 shrink-0 items-center justify-center rounded-full bg-sibs-primary-1 text-[11px] 2xl:text-xs font-extrabold uppercase text-white shadow-[0_4px_12px_rgba(4,44,81,0.22)] transition-transform duration-200 group-hover:scale-105 max-[360px]:h-8 max-[360px]:w-8">
          {avatar || "U"}
        </div>

        <div
          className={[
            "min-w-0 flex-1 flex-col text-left leading-tight",
            mobileCompact ? "hidden lg:flex" : "flex",
          ].join(" ")}
        >
          <span className="max-w-[180px] 2xl:max-w-[220px] truncate sibs-text-xs font-bold text-sibs-primary-1 tracking-tight">
            {formattedName || "USER"}
          </span>

          <span className="mt-0.5 max-w-[180px] 2xl:max-w-[220px] truncate sibs-text-micro font-medium text-sibs-tertiary-6">
            {email || "no-email@sibs.com"}
          </span>
        </div>

        <ChevronDown
          size={15}
          strokeWidth={2.2}
          className={[
            "shrink-0 text-sibs-tertiary-6 transition-transform duration-200 ease-out group-hover:text-sibs-primary-1",
            open ? "rotate-180 text-sibs-primary-1" : "",
            mobileCompact ? "hidden lg:block" : "",
          ].join(" ")}
        />
      </button>

      <div
        role="menu"
        aria-hidden={!open}
        className={[
          "sibs-animated-dropdown absolute right-0 top-[calc(100%+8px)] z-[999999] w-[260px] 2xl:w-[286px] origin-top-right",
          open ? "open" : "closed",
        ].join(" ")}
      >
        <div className="sibs-animated-dropdown-inner">
          <div className="sibs-animated-dropdown-box p-2 border border-[#D7DEE8] bg-white shadow-[0_16px_40px_rgba(4,44,81,0.16)] rounded-xl">
            {!isAdminSide && canSwitchToAdmin && (
              <DropdownItem
                icon={UserKey}
                title={switchToAdminLabel}
                subtitle="Current role: Employee"
                onClick={handleSwitchToAdmin}
                disabled={Boolean(actionLoading)}
              />
            )}

            {isAdminSide && (
              <DropdownItem
                icon={UserRound}
                title="Switch to Employee"
                subtitle={`Current role: ${currentAdminRoleLabel}`}
                onClick={handleSwitchToEmployee}
                loading={actionLoading === "employee"}
                disabled={Boolean(actionLoading)}
              />
            )}

            <button
              type="button"
              role="menuitem"
              onClick={onLogout}
              disabled={Boolean(actionLoading)}
              className="mt-1 flex min-h-[48px] w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-red-600 transition-colors duration-150 hover:bg-red-50 focus:bg-red-50 outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100/60 text-red-600">
                {actionLoading === "logout" ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <LogOut size={16} strokeWidth={2} />
                )}
              </span>

              <span className="text-xs font-extrabold">
                {actionLoading === "logout" ? "Logging out..." : "Logout"}
              </span>
            </button>
          </div>
        </div>
      </div>

      <style>
        {`
          .sibs-animated-dropdown {
            visibility: hidden;
            opacity: 0;
            transform: translateY(-8px) scale(0.97);
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            pointer-events: none;
          }
          .sibs-animated-dropdown.open {
            visibility: visible;
            opacity: 1;
            transform: translateY(0) scale(1);
            pointer-events: auto;
          }
        `}
      </style>
    </div>
  );
}

function DropdownItem({
  icon,
  title,
  subtitle,
  onClick,
  loading = false,
  disabled = false,
}) {
  const MenuIcon = icon;

  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
      className="flex min-h-[52px] w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sibs-primary-1 transition-colors duration-150 hover:bg-[#F1F5F9] focus:bg-[#F1F5F9] outline-none disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EAF0F7] text-sibs-primary-1 transition-transform duration-150 group-hover:scale-105">
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <MenuIcon size={16} strokeWidth={2} />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-extrabold text-sibs-primary-1 leading-snug">
          {loading ? "Switching..." : title}
        </span>
        <span className="block truncate text-[10px] font-medium text-sibs-tertiary-6 leading-tight">
          {subtitle}
        </span>
      </span>
    </button>
  );
}
