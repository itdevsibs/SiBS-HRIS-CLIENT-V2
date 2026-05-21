import { Bell } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useUser } from "../../services/context/UserContext";
import UserDropdown from "./dropdown/UserDropdown";

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

  if (!mounted) {
    return (
      <header className="h-[73px] shrink-0 border-b border-[#C9D6E4] bg-sibs-tertiary-10 px-4 shadow-[2px] sm:px-6">
        <div className="flex h-full items-center justify-end gap-3 pl-12 sm:pl-0">
          <div className="h-5 w-5 animate-pulse rounded bg-gray-200" />
          <div className="hidden h-6 w-px bg-[#C9D6E4] sm:block" />
          <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200 sm:hidden" />
          <div className="hidden h-10 w-52 animate-pulse rounded bg-gray-200 sm:block" />
        </div>
      </header>
    );
  }

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
    <header className="relative z-[999] flex h-[73px] shrink-0 items-center border-b border-gray-300 bg-sibs-tertiary-10 px-4 sm:px-6">
      <div className="flex min-w-0 flex-1 items-center justify-end gap-4 pl-12 sm:pl-0">
        <button
          type="button"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sibs-tertiary-6 transition hover:bg-white/70 hover:text-sibs-primary-1"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" strokeWidth={1.8} />
        </button>

        <div className="hidden h-6 w-px bg-[#C9D6E4] sm:block" />

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
      </div>
    </header>
  );
}