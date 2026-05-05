import { Bell } from "lucide-react";
import { useRouter, usePathname } from "@/lib/router";
import { useEffect, useState } from "react";
import { useUser } from "../../services/context/UserContext";
import UserDropdown from "./UserDropdown";

export default function Header() {
  const { user, loading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading && !user && pathname !== "/login") {
      router.replace("/login");
    }
  }, [mounted, loading, user, pathname, router]);

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
    <header className="sibs-header relative z-[999] shrink-0">
      <div className="flex h-full min-w-0 flex-1 items-center justify-end gap-3 pl-12 sm:gap-4 sm:pl-0">
        {!mounted ? (
          <>
            <div className="h-5 w-5 animate-pulse rounded bg-gray-200" />
            <div className="hidden h-6 w-px bg-[var(--sibs-tertiary-9)] sm:block" />
            <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200 sm:hidden" />
            <div className="hidden h-10 w-52 animate-pulse rounded bg-gray-200 sm:block" />
          </>
        ) : (
          <>
            <button
              type="button"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-white/70 hover:text-[var(--sibs-primary-1)]"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
            </button>

            <div className="hidden h-6 w-px bg-[var(--sibs-tertiary-9)] sm:block" />

            <div className="relative min-w-0 shrink-0">
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