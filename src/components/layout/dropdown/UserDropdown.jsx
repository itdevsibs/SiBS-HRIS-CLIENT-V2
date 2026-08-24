import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  8: "Team Leaders",
  9: "WFM",
  10: "SOM",
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
  profilePictureUrl = "",
  formattedName,
  email,
  mobileCompact = false,
}) {
  const [open, setOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [profileImageFailed, setProfileImageFailed] = useState(false);
  const [avatarPreviewOpen, setAvatarPreviewOpen] = useState(false);
  const [avatarPreviewPosition, setAvatarPreviewPosition] = useState({
    top: 0,
    left: 0,
  });

  const navigate = useNavigate();
  const ref = useRef(null);
  const avatarPreviewAnchorRef = useRef(null);
  const avatarHoveredRef = useRef(false);
  const avatarPreviewLockedRef = useRef(false);

  const { user, setUser, refetchUser } = useUser();
  const { setAdminLogin } = useHeader();
  const { getAccessLabel, ADMIN_ROLES = [] } = useAdmin();

  useEffect(() => {
    setProfileImageFailed(false);
    setAvatarPreviewOpen(false);
    avatarPreviewLockedRef.current = false;
  }, [profilePictureUrl]);

  useEffect(() => {
    if (open) {
      setAvatarPreviewOpen(false);
    }
  }, [open]);

  useEffect(() => {
    if (!avatarPreviewOpen) return undefined;

    const updateAvatarPreviewPosition = () => {
      const anchor = avatarPreviewAnchorRef.current;
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      const previewSize = 152;
      const gap = 10;
      const viewportPadding = 12;
      const maxLeft = Math.max(
        viewportPadding,
        window.innerWidth - previewSize - viewportPadding,
      );
      const left = Math.min(
        Math.max(
          rect.left + rect.width / 2 - previewSize / 2,
          viewportPadding,
        ),
        maxLeft,
      );

      let top = rect.bottom + gap;
      if (top + previewSize > window.innerHeight - viewportPadding) {
        top = Math.max(viewportPadding, rect.top - previewSize - gap);
      }

      setAvatarPreviewPosition({ top, left });
    };

    updateAvatarPreviewPosition();
    window.addEventListener("resize", updateAvatarPreviewPosition);
    window.addEventListener("scroll", updateAvatarPreviewPosition, true);

    return () => {
      window.removeEventListener("resize", updateAvatarPreviewPosition);
      window.removeEventListener("scroll", updateAvatarPreviewPosition, true);
    };
  }, [avatarPreviewOpen]);

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
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].includes(adminAccess);

  const switchToAdminLabel = `Switch to ${
    typeof getAccessLabel === "function"
      ? getAccessLabel(adminAccess)
      : ADMIN_ACCESS_LABELS[adminAccess] || "Admin"
  }`;

  const currentAdminRoleLabel =
    ADMIN_ACCESS_LABELS[adminAccess] || "Talent Acquisition";

  const showAvatarPreview = () => {
    if (
      open ||
      avatarPreviewLockedRef.current ||
      !avatarPreviewAnchorRef.current
    ) {
      return;
    }

    setAvatarPreviewOpen(true);
  };

  const hideAvatarPreview = () => {
    setAvatarPreviewOpen(false);
  };

  const handleAvatarMouseEnter = () => {
    avatarHoveredRef.current = true;
    showAvatarPreview();
  };

  const handleAvatarMouseLeave = () => {
    avatarHoveredRef.current = false;
    avatarPreviewLockedRef.current = false;
    hideAvatarPreview();
  };

  return (
    <div className="relative z-[99999] min-w-0" ref={ref}>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          hideAvatarPreview();

          setOpen((previous) => {
            const nextOpen = !previous;

            if (nextOpen && avatarHoveredRef.current) {
              avatarPreviewLockedRef.current = true;
            }

            return nextOpen;
          });
        }}
        aria-expanded={open}
        aria-haspopup="menu"
        className={[
          "group flex max-w-[360px] cursor-pointer items-center gap-2 2xl:gap-2.5 rounded-xl border px-2 py-1 2xl:py-1.5 text-left transition-all duration-150",
          mobileCompact ? "max-[430px]:gap-0 max-[430px]:px-0 max-[430px]:py-0" : "",
          open
            ? "border-sibs-orange/40 bg-sibs-cream shadow-sm ring-2 ring-sibs-orange/15"
            : "border-transparent bg-transparent hover:border-sibs-orange/30 hover:bg-sibs-cream-subtle hover:shadow-xs",
        ].join(" ")}
      >
        <div
          ref={avatarPreviewAnchorRef}
          onMouseEnter={handleAvatarMouseEnter}
          onMouseLeave={handleAvatarMouseLeave}
          className="flex h-8 w-8 2xl:h-9 2xl:w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sibs-primary-1 text-[11px] 2xl:text-xs font-extrabold uppercase text-white shadow-[0_6px_16px_rgba(0,48,142,0.24)] max-[360px]:h-7.5 max-[360px]:w-7.5"
        >
          {profilePictureUrl && !profileImageFailed ? (
            <img
              src={profilePictureUrl}
              alt={`${formattedName || "User"} profile`}
              className="h-full w-full object-cover"
              onError={() => setProfileImageFailed(true)}
            />
          ) : (
            avatar || "U"
          )}
        </div>

        <div
          className={[
            "min-w-0 flex-1 flex-col text-left leading-tight",
            mobileCompact ? "hidden lg:flex" : "flex",
          ].join(" ")}
        >
          <span className="max-w-[220px] truncate text-[11px] 2xl:text-xs font-extrabold text-sibs-primary-1">
            {formattedName || "USER"}
          </span>

          <span className="mt-0.5 max-w-[220px] truncate text-[9px] 2xl:text-[10px] font-semibold text-sibs-primary-2">
            {email || "no-email@sibs.com"}
          </span>
        </div>

        <ChevronDown
          size={14}
          strokeWidth={2}
          className={[
            "shrink-0 text-sibs-tertiary-6 transition-transform duration-200 group-hover:text-sibs-primary-1 2xl:h-4 2xl:w-4",
            open ? "rotate-180 text-sibs-primary-1" : "",
            mobileCompact ? "hidden lg:block" : "",
          ].join(" ")}
        />
      </button>

      {avatarPreviewOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="pointer-events-none fixed z-[1000000] h-[152px] w-[152px] overflow-hidden rounded-2xl border border-[#D7E0E9] bg-white p-1.5 shadow-[0_18px_50px_rgba(4,44,81,0.28)]"
            style={{
              top: avatarPreviewPosition.top,
              left: avatarPreviewPosition.left,
            }}
            aria-hidden="true"
          >
            <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-xl bg-sibs-primary-1 text-4xl font-extrabold uppercase text-white">
              {profilePictureUrl && !profileImageFailed ? (
                <img
                  src={profilePictureUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={() => setProfileImageFailed(true)}
                />
              ) : (
                avatar || "U"
              )}
            </div>
          </div>,
          document.body,
        )}

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-[999999] w-[260px] 2xl:w-[286px] origin-top-right overflow-hidden rounded-xl border border-[#D7E0E9] bg-white shadow-[0_18px_50px_rgba(4,44,81,0.20)] animate-[sibsUserDropdownOpen_180ms_ease-out_both]"
        >
          <div className="p-1.5 2xl:p-2">
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
              className="mt-0.5 flex min-h-[44px] 2xl:min-h-[50px] w-full items-center gap-2.5 2xl:gap-3 rounded-lg px-2.5 2xl:px-3 py-2 2xl:py-2.5 text-left text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {actionLoading === "logout" ? (
                <Loader2 size={16} className="shrink-0 animate-spin" />
              ) : (
                <LogOut size={16} className="shrink-0" />
              )}

              <span className="text-[11px] 2xl:text-xs font-extrabold">
                {actionLoading === "logout" ? "Logging out..." : "Logout"}
              </span>
            </button>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes sibsUserDropdownOpen {
            from {
              opacity: 0;
              transform: translateY(-8px) scale(0.97);
            }

            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
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
      className="flex min-h-[48px] 2xl:min-h-[58px] w-full items-center gap-2.5 2xl:gap-3 rounded-lg px-2.5 2xl:px-3 py-1.5 2xl:py-2.5 text-left text-sibs-primary-1 transition hover:bg-[#F1F5F9] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className="flex h-8 w-8 2xl:h-9 2xl:w-9 shrink-0 items-center justify-center rounded-lg bg-[#EAF0F7] text-sibs-primary-1">
        {loading ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <MenuIcon size={15} />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[11px] 2xl:text-xs font-extrabold text-sibs-primary-1">
          {loading ? "Switching..." : title}
        </span>
        <span className="mt-0.5 block truncate text-[9px] 2xl:text-[10px] font-semibold text-sibs-tertiary-6">
          {subtitle}
        </span>
      </span>
    </button>
  );
}
