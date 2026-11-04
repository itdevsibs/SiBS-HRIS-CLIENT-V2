import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
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
import { getActiveCollectibleProfile } from "../../../config/developerBorders";
import CollectibleAvatarFrame from "./CollectibleAvatarFrame.jsx";
import DeveloperEasterEgg from "./DeveloperEasterEgg.jsx";

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
  // Keep exactly one profile menu mounted while open. The old delayed unmount
  // could leave an exiting dropdown visible when users toggled the menu quickly.
  const [open, setOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [profileImageFailed, setProfileImageFailed] = useState(false);
  const [avatarPreviewOpen, setAvatarPreviewOpen] = useState(false);
  const [avatarPreviewPosition, setAvatarPreviewPosition] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState(null);
  const [easterEggProfile, setEasterEggProfile] = useState(null);

  const navigate = useNavigate();
  const ref = useRef(null);
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const avatarPreviewAnchorRef = useRef(null);
  const easterEggClicksRef = useRef({ count: 0, startedAt: 0, account: null });

  const { user, setUser, refetchUser } = useUser();
  const { setAdminLogin } = useHeader();
  const { getAccessLabel, ADMIN_ROLES = [] } = useAdmin();
  const collectible = getActiveCollectibleProfile(user, formattedName);

  const calculateAvatarPreviewPosition = useCallback(() => {
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
  }, []);

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
  }, [avatarPreviewOpen, calculateAvatarPreviewPosition]);

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
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, { passive: true });
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
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

  const closeEasterEgg = useCallback(() => setEasterEggProfile(null), []);

  const handleAvatarClick = (event) => {
    if (!collectible?.easterEgg?.src) return;
    const now = Date.now();
    const clicks = easterEggClicksRef.current;
    const continueSequence = clicks.account === user && now - clicks.startedAt <= 1000;
    const count = continueSequence ? clicks.count + 1 : 1;
    easterEggClicksRef.current = {
      count,
      startedAt: continueSequence ? clicks.startedAt : now,
      account: user,
    };
    if (count < 3) return;

    easterEggClicksRef.current = { count: 0, startedAt: 0, account: null };
    event.stopPropagation();
    setOpen(false);
    setAvatarPreviewOpen(false);
    setEasterEggProfile(collectible);
  };

  const handleMenuKeyDown = (event) => {
    if (!dropdownRef.current) return;
    const items = Array.from(
      dropdownRef.current.querySelectorAll('[role="menuitem"]:not([disabled])')
    );
    if (!items.length) return;

    const currentIndex = items.indexOf(document.activeElement);

    if (event.key === "ArrowDown") {
      event.preventDefault();
      const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
      items[nextIndex]?.focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
      items[prevIndex]?.focus();
    } else if (event.key === "Home") {
      event.preventDefault();
      items[0]?.focus();
    } else if (event.key === "End") {
      event.preventDefault();
      items[items.length - 1]?.focus();
    }
  };

  const handleToggleDropdown = (event) => {
    event.stopPropagation();
    hideAvatarPreview();
    if (!open) {
      const nextPos = calculateDropdownPosition();
      if (nextPos) setDropdownPosition(nextPos);
    }
    setOpen((previous) => !previous);
  };

  const dropdownMenu =
    open && dropdownPosition && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={dropdownRef}
            role="menu"
            aria-label="User actions"
            onKeyDown={handleMenuKeyDown}
            className="sibs-animated-dropdown open fixed z-[2147483000]"
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
        ref={triggerRef}
        type="button"
        onClick={handleToggleDropdown}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`User menu: ${formattedName || "User"}${
          collectible ? ` (${collectible.title})` : ""
        }`}
        className={[
          // The profile itself is the trigger; do not turn it into a second
          // bordered dropdown-style card while its menu is open.
          "group flex min-w-0 max-w-[290px] cursor-pointer items-center gap-2 rounded-xl border border-transparent bg-transparent px-2 py-1 text-left transition-colors duration-150 hover:bg-sibs-tertiary-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sibs-primary-1/30 xl:max-w-[320px] 2xl:max-w-[360px] 2xl:gap-2.5 2xl:py-1.5",
          mobileCompact ? "max-[430px]:gap-0 max-[430px]:px-0 max-[430px]:py-0" : "",
        ].join(" ")}
      >
        <div
          ref={avatarPreviewAnchorRef}
          onMouseEnter={showAvatarPreview}
          onMouseLeave={hideAvatarPreview}
          onClick={handleAvatarClick}
          className="relative flex shrink-0 items-center justify-center"
        >
          {collectible ? (
            <CollectibleAvatarFrame
              collectible={collectible}
              photoUrl={profilePictureUrl && !profileImageFailed ? profilePictureUrl : ""}
              fallback={avatar || "U"}
              variant="header"
              onPhotoError={() => setProfileImageFailed(true)}
            />
          ) : (
          <div className="flex h-8 w-8 2xl:h-9 2xl:w-9 items-center justify-center overflow-hidden rounded-full bg-sibs-primary-1 text-[11px] 2xl:text-xs font-extrabold uppercase text-white shadow-[0_6px_16px_rgba(0,48,142,0.24)] max-[360px]:h-7.5 max-[360px]:w-7.5">
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
          )}
        </div>

        <div
          className={[
            "min-w-0 flex-1 flex-col overflow-hidden text-left leading-tight",
            mobileCompact ? "hidden lg:flex" : "flex",
          ].join(" ")}
        >
          {/* Keep long employee names/emails within the header. The full values
              remain accessible via the native hover tooltip. */}
          <span
            className="block w-full min-w-0 truncate text-[11px] font-extrabold text-sibs-primary-1 2xl:text-xs"
            title={formattedName || "USER"}
          >
            {formattedName || "USER"}
          </span>

          <span
            className="mt-0.5 block w-full min-w-0 truncate text-[9px] font-semibold text-sibs-primary-2 2xl:text-[10px]"
            title={email || "no-email@sibs.com"}
          >
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

      {!open && avatarPreviewOpen &&
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
            {collectible ? (
              <CollectibleAvatarFrame
                collectible={collectible}
                photoUrl={profilePictureUrl && !profileImageFailed ? profilePictureUrl : ""}
                fallback={avatar || "U"}
                variant="preview"
                onPhotoError={() => setProfileImageFailed(true)}
              />
            ) : (
              <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl bg-sibs-primary-1 text-4xl font-extrabold uppercase text-white">
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
            )}
          </div>,
          document.body,
        )}

      {dropdownMenu}
      {easterEggProfile && easterEggProfile.id === collectible?.id && (
        <DeveloperEasterEgg key={easterEggProfile.id} collectible={easterEggProfile} onClose={closeEasterEgg} />
      )}
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
