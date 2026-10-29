import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
    .replace(/[\\s-]+/g, "_");
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

function MrSibsCrown({ className = "h-4 w-4" }) {
  return (
    <svg
      viewBox="0 0 24 20"
      className={`${className} drop-shadow-[0_2px_3px_rgba(180,83,9,0.45)]`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="mrSibsCrownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="45%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        <linearGradient id="mrSibsBaseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
      </defs>

      {/* Main Crown Body with 3 Peaks */}
      <path
        d="M2.5 15.5 C 7 14, 17 14, 21.5 15.5 L 20 6 L 14.5 11 L 12 2.5 L 9.5 11 L 4 6 Z"
        fill="url(#mrSibsCrownGrad)"
        stroke="#B45309"
        strokeWidth="0.6"
        strokeLinejoin="round"
      />

      {/* Crown Base Arc */}
      <path
        d="M2.5 15.5 C 7 14, 17 14, 21.5 15.5 L 21 17.5 C 17 16, 7 16, 3 17.5 Z"
        fill="url(#mrSibsBaseGrad)"
      />

      {/* Golden Spheres on the 3 Peaks */}
      <circle cx="4" cy="6" r="1.5" fill="#FEF08A" stroke="#B45309" strokeWidth="0.5" />
      <circle cx="12" cy="2.5" r="1.8" fill="#FFFBEB" stroke="#B45309" strokeWidth="0.5" />
      <circle cx="20" cy="6" r="1.5" fill="#FEF08A" stroke="#B45309" strokeWidth="0.5" />

      {/* Center 4-Point Star Sparkle */}
      <path
        d="M12 8 C 12 10.2, 10.5 11.5, 8.5 11.5 C 10.5 11.5, 12 12.8, 12 15 C 12 12.8, 13.5 11.5, 15.5 11.5 C 13.5 11.5, 12 10.2, 12 8 Z"
        fill="#FFFFFF"
      />
    </svg>
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
  const [menuMounted, setMenuMounted] = useState(false);
  const [menuActive, setMenuActive] = useState(false);

  useEffect(() => {
    let timer;
    let frame;
    if (open) {
      setMenuMounted(true);
      frame = requestAnimationFrame(() => setMenuActive(true));
    } else {
      setMenuActive(false);
      timer = setTimeout(() => setMenuMounted(false), 200);
    }
    return () => {
      if (frame) cancelAnimationFrame(frame);
      if (timer) clearTimeout(timer);
    };
  }, [open]);
  const [actionLoading, setActionLoading] = useState("");
  const [profileImageFailed, setProfileImageFailed] = useState(false);
  const [avatarPreviewOpen, setAvatarPreviewOpen] = useState(false);
  const [avatarPreviewPosition, setAvatarPreviewPosition] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState(null);

  const navigate = useNavigate();
  const ref = useRef(null);
  const dropdownRef = useRef(null);
  const avatarPreviewAnchorRef = useRef(null);

  const { user, setUser, refetchUser } = useUser();
  const { setAdminLogin } = useHeader();
  const { getAccessLabel, ADMIN_ROLES = [] } = useAdmin();

  const calculateAvatarPreviewPosition = () => {
    const anchor = avatarPreviewAnchorRef.current;
    if (!anchor || typeof window === "undefined") return null;

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

    return { top, left };
  };

  const calculateDropdownPosition = () => {
    const anchor = ref.current;
    if (!anchor || typeof window === "undefined") return null;

    const rect = anchor.getBoundingClientRect();
    const viewportPadding = 12;
    const gap = 8;
    const width = window.innerWidth >= 1536 ? 286 : 260;
    const menuHeight = dropdownRef.current?.offsetHeight || 126;

    let left = rect.right - width;
    left = Math.max(
      viewportPadding,
      Math.min(left, window.innerWidth - width - viewportPadding),
    );

    let top = rect.bottom + gap;
    if (top + menuHeight > window.innerHeight - viewportPadding) {
      top = Math.max(viewportPadding, rect.top - menuHeight - gap);
    }

    return { top, left, width };
  };

  useEffect(() => {
    setProfileImageFailed(false);
    setAvatarPreviewOpen(false);
  }, [profilePictureUrl]);

  useLayoutEffect(() => {
    if (!avatarPreviewOpen) return undefined;

    const updateAvatarPreviewPosition = () => {
      const nextPos = calculateAvatarPreviewPosition();
      if (nextPos) setAvatarPreviewPosition(nextPos);
    };

    updateAvatarPreviewPosition();
    window.addEventListener("resize", updateAvatarPreviewPosition);
    window.addEventListener("scroll", updateAvatarPreviewPosition, true);

    return () => {
      window.removeEventListener("resize", updateAvatarPreviewPosition);
      window.removeEventListener("scroll", updateAvatarPreviewPosition, true);
    };
  }, [avatarPreviewOpen]);

  useLayoutEffect(() => {
    if (!open) return undefined;

    let frame = 0;

    const updateDropdownPosition = () => {
      const nextPos = calculateDropdownPosition();
      if (nextPos) setDropdownPosition(nextPos);
    };

    updateDropdownPosition();
    frame = window.requestAnimationFrame(updateDropdownPosition);
    window.addEventListener("resize", updateDropdownPosition);
    window.addEventListener("scroll", updateDropdownPosition, true);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateDropdownPosition);
      window.removeEventListener("scroll", updateDropdownPosition, true);
    };
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedTrigger = ref.current?.contains(event.target);
      const clickedDropdown = dropdownRef.current?.contains(event.target);

      if (!clickedTrigger && !clickedDropdown) {
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

  const userAccountIdentifiers = [
    user?.sibs_id,
    user?.sibsId,
    user?.gy_user_code,
    user?.gy_emp_code,
    user?.gy_emp_id,
    user?.accountId,
    user?.account,
    user?.id,
    user?.username,
  ]
    .filter((value) => value !== undefined && value !== null)
    .map((value) => String(value).trim());

  const isAccount6784 = userAccountIdentifiers.some((id) => id === "6784");

  const isRalphDulla =
    (/ralph/i.test(user?.firstName || "") && /dulla/i.test(user?.lastName || "")) ||
    (/ralph/i.test(formattedName || "") && /dulla/i.test(formattedName || "")) ||
    (/ralph/i.test(user?.email || "") && /dulla/i.test(user?.email || ""));

  // Strictly limited to account 6784 RALPH DULLA
  const isMrSibs = Boolean(
    (isAccount6784 && isRalphDulla) ||
      (isRalphDulla && !userAccountIdentifiers.length) ||
      (isAccount6784 && !formattedName),
  );

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
    if (open || !avatarPreviewAnchorRef.current) return;
    const nextPos = calculateAvatarPreviewPosition();
    if (nextPos) {
      setAvatarPreviewPosition(nextPos);
      setAvatarPreviewOpen(true);
    }
  };

  const hideAvatarPreview = () => {
    setAvatarPreviewOpen(false);
  };

  const handleToggleDropdown = (event) => {
    event.stopPropagation();
    hideAvatarPreview();
    setOpen((previous) => {
      if (!previous) {
        const nextPos = calculateDropdownPosition();
        if (nextPos) setDropdownPosition(nextPos);
      }
      return !previous;
    });
  };

  const dropdownMenu =
    menuMounted && dropdownPosition && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={dropdownRef}
            role="menu"
            className={`sibs-animated-dropdown ${menuActive ? "open" : "closed"} fixed z-[2147483000]`}
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
            }}
          >
            <div className="sibs-animated-dropdown-inner">
              <div className="sibs-animated-dropdown-box overflow-hidden rounded-xl border border-sibs-border-subtle bg-white shadow-[0_18px_50px_rgba(4,44,81,0.20)]">
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
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="relative z-[99999] min-w-0" ref={ref}>
      <button
        type="button"
        onClick={handleToggleDropdown}
        aria-expanded={open}
        aria-haspopup="menu"
        className={[
          "group flex max-w-[360px] cursor-pointer items-center gap-2 2xl:gap-2.5 rounded-xl border px-2 py-1 2xl:py-1.5 text-left transition-all duration-150",
          mobileCompact ? "max-[430px]:gap-0 max-[430px]:px-0 max-[430px]:py-0" : "",
          open
            ? "border-sibs-primary-1/25 bg-white shadow-sm ring-2 ring-sibs-primary-1/10"
            : "border-transparent bg-transparent hover:border-sibs-tertiary-9 hover:bg-white",
        ].join(" ")}
      >
        <div
          ref={avatarPreviewAnchorRef}
          onMouseEnter={showAvatarPreview}
          onMouseLeave={hideAvatarPreview}
          className="relative flex shrink-0 items-center justify-center"
        >
          <div
            className={`flex h-8 w-8 2xl:h-9 2xl:w-9 items-center justify-center overflow-hidden rounded-full bg-sibs-primary-1 text-[11px] 2xl:text-xs font-extrabold uppercase text-white shadow-[0_6px_16px_rgba(0,48,142,0.24)] max-[360px]:h-7.5 max-[360px]:w-7.5 ${
              isMrSibs
                ? "ring-2 ring-amber-400 ring-offset-1 ring-offset-white shadow-[0_0_8px_rgba(245,158,11,0.35)]"
                : ""
            }`}
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

          {isMrSibs && (
            <>
              {/* Crown on top-right */}
              <div
                className="pointer-events-none absolute -top-2.5 -right-1.5 z-10 rotate-[22deg] transition-transform duration-200 group-hover:scale-110 group-hover:rotate-[26deg]"
                aria-hidden="true"
              >
                <MrSibsCrown className="h-4 w-4 2xl:h-4.5 2xl:w-4.5" />
              </div>

              {/* MR. SiBS Pill Badge at bottom */}
              <span
                className="pointer-events-none absolute -bottom-1.5 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full border-[1.5px] border-white bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 px-1.5 py-[0.5px] text-[6.5px] 2xl:text-[7px] font-black uppercase tracking-tight text-white shadow-[0_2px_4px_rgba(4,44,81,0.25)] select-none leading-none"
                aria-label="MR. SiBS"
              >
                MR. SiBS
              </span>
            </>
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
        avatarPreviewPosition &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="pointer-events-none fixed z-[2147483001] h-[152px] w-[152px] rounded-2xl border border-sibs-border-subtle bg-white p-1.5 shadow-[0_18px_50px_rgba(4,44,81,0.28)]"
            style={{
              top: avatarPreviewPosition.top,
              left: avatarPreviewPosition.left,
            }}
            aria-hidden="true"
          >
            <div
              className={`relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl bg-sibs-primary-1 text-4xl font-extrabold uppercase text-white ${
                isMrSibs
                  ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-white shadow-[0_0_12px_rgba(245,158,11,0.35)]"
                  : ""
              }`}
            >
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

              {isMrSibs && (
                <span className="absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border-2 border-white bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 px-3 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-md">
                  MR. SiBS
                </span>
              )}
            </div>

            {isMrSibs && (
              <div className="absolute -top-3.5 -right-2.5 z-20 rotate-[22deg]">
                <MrSibsCrown className="h-8 w-8" />
              </div>
            )}
          </div>,
          document.body,
        )}

      {dropdownMenu}
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
      className="flex min-h-[48px] 2xl:min-h-[58px] w-full items-center gap-2.5 2xl:gap-3 rounded-lg px-2.5 2xl:px-3 py-1.5 2xl:py-2.5 text-left text-sibs-primary-1 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className="flex h-8 w-8 2xl:h-9 2xl:w-9 shrink-0 items-center justify-center rounded-lg bg-sibs-canvas text-sibs-primary-1">
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
