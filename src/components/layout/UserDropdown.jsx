import { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  LogOut,
  UserKey,
  UserRound,
} from "lucide-react";
import { useRouter } from "@/lib/router";
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

  const router = useRouter();
  const ref = useRef(null);
  const { user, setUser, refetchUser } = useUser();
  const { setAdminLogin } = useHeader();
  const { getAccessLabel, ADMIN_ROLES } = useAdmin();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const onLogout = async () => {
    try {
      setOpen(false);
      setUser(null);
      setAdminLogin(false);

      await handleLogout(true);
    } catch (err) {
      console.error("Logout error:", err);
      router.replace("/login");
      router.refresh();
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

      const res = await api.post(
        "/api/users/switch-to-employee",
        {},
        {
          withCredentials: true,
        }
      );

      if (res.data?.expiresAt) {
        sessionStorage.setItem(
          "accessTokenExpiresAt",
          String(res.data.expiresAt)
        );
      }

      if (res.data?.user) {
        setUser(res.data.user);
      }

      setAdminLogin(false);

      if (typeof refetchUser === "function") {
        await refetchUser();
      }

      router.replace("/dashboard/employee");
      router.refresh();
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
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className="flex max-w-full cursor-pointer select-none items-center gap-2 rounded-xl px-1 py-1 transition hover:bg-white/70 sm:gap-3 sm:px-2"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-800 font-semibold text-white">
          {avatar || "U"}
        </div>

        {!mobileCompact && (
          <div className="hidden min-w-0 flex-col leading-tight text-left sm:flex">
            <span className="truncate text-sm font-medium text-sibs-primary-1">
              {formattedName}
            </span>
            <span className="truncate text-xs text-sibs-tertiary-5">
              {email || "no-email@sibs.com"}
            </span>
          </div>
        )}

        {mobileCompact && (
          <div className="hidden min-w-0 flex-col leading-tight text-left lg:flex">
            <span className="truncate text-sm font-medium text-sibs-primary-1">
              {formattedName}
            </span>
            <span className="truncate text-xs text-sibs-tertiary-5">
              {email || "no-email@sibs.com"}
            </span>
          </div>
        )}

        <ChevronDown
          size={16}
          className={`shrink-0 text-gray-500 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-3 w-[220px] overflow-hidden rounded-lg border border-sibs-tertiary-9 bg-white shadow-lg sm:min-w-[220px]">
          <div className="border-b border-sibs-tertiary-9 px-4 py-3 sm:hidden">
            <p className="truncate text-sm font-semibold text-sibs-primary-1">
              {formattedName}
            </p>
            <p className="truncate text-xs text-sibs-tertiary-5">
              {email || "no-email@sibs.com"}
            </p>
          </div>

          {!isAdminSide && canSwitchToAdmin && (
            <button
              type="button"
              onClick={handleSwitchToAdmin}
              className="flex h-14 w-full items-center gap-2 px-4 py-2 text-sm text-sibs-primary-1 transition hover:bg-blue-50"
            >
              <UserKey size={20} />
              <div className="flex flex-col leading-tight text-left">
                <span className="font-semibold">{switchToAdminLabel}</span>
                <span className="text-[10px] text-slate-400">
                  Current Role: Employee
                </span>
              </div>
            </button>
          )}

          {isAdminSide && (
            <button
              type="button"
              onClick={handleSwitchToEmployee}
              className="flex h-14 w-full items-center gap-2 px-4 py-2 text-sm text-sibs-primary-1 transition hover:bg-blue-50"
            >
              <UserRound size={20} />
              <div className="flex flex-col leading-tight text-left">
                <span className="font-semibold">Switch to Employee</span>
                <span className="text-[10px] text-slate-400">
                  Current Role: {currentAdminRoleLabel}
                </span>
              </div>
            </button>
          )}

          <button
            type="button"
            onClick={onLogout}
            className="flex h-14 w-full items-center gap-2 px-4 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-50"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}