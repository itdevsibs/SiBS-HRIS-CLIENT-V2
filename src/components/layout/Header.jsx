import { Bell } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useUser } from "../../services/context/UserContext";
import UserDropdown from "./UserDropdown";

export default function Header() {
  const { user, loading } = useUser();

  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading && !user && pathname !== "/login") {
      navigate("/login", { replace: true });
    }
  }, [mounted, loading, user, pathname, navigate]);

  const avatar =
    user?.firstName
      ?.trim()
      .split(/\s+/)
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "U";

  const formattedName = (
    `${user?.lastName || ""}${user?.lastName ? ", " : ""}${
      user?.firstName || ""
    }${user?.middleName ? " " + user.middleName : ""}`.trim() || "User"
  ).toUpperCase();

  return (
    <header className="relative z-[999] flex h-[73px] shrink-0 items-center border-b border-sibs-tertiary-9 bg-sibs-tertiary-10 px-4 shadow-sm sm:px-6">
      <div className="flex min-w-0 flex-1 items-center justify-end gap-3 pl-12 sm:gap-4 sm:pl-0">
        {!mounted ? (
          <>
            <div className="h-5 w-5 animate-pulse rounded bg-gray-200" />

            <div className="hidden h-6 w-px bg-sibs-tertiary-9 sm:block" />

            <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200 sm:hidden" />

            <div className="hidden h-10 w-52 animate-pulse rounded bg-gray-200 sm:block" />
          </>
        ) : (
          <>
            <button
              type="button"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-white/70 hover:text-sibs-primary-1"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
            </button>

            <div className="hidden h-6 w-px bg-sibs-tertiary-9 sm:block" />

            <div className="relative z-[9999] min-w-0 shrink-0">
              {loading || !user ? (
                <>
                  <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200 sm:hidden" />

                  <div className="hidden h-10 w-52 animate-pulse rounded bg-gray-200 sm:block" />
                </>
              ) : (
                <UserDropdown
                  avatar={avatar}
                  formattedName={formattedName}
                  email={user.email}
                  mobileCompact
                />
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
}