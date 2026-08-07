import { Navigate, useLocation } from "react-router-dom";
import { useUser } from "../../services/context/UserContext";
import { canAccessPath, getDefaultDashboardPath } from "../../config/accessControl";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/online-assessment",
  "/apply",
  "/public/talent-pool/apply",
  "/public/interview-date",
  "/public/offer-response",
  "/public/nho-schedule-response",
  "/recruitment/talent-pool/apply",
];

function isPublicPath(pathname = "") {
  return PUBLIC_PATHS.some((path) => {
    if (path === "/") return pathname === "/";
    return pathname === path || pathname.startsWith(`${path}/`);
  });
}

export default function ProtectedRoute({ children }) {
  const { user, loading } = useUser();
  const location = useLocation();

  if (isPublicPath(location.pathname)) {
    return children;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sibs-tertiary-10 font-jakarta">
        <div className="rounded-xl border border-sibs-tertiary-9 bg-white px-5 py-4 text-sm font-semibold text-sibs-primary-1 shadow-sm">
          Loading...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const allowed = canAccessPath(user, location.pathname);

  if (!allowed) {
    return (
      <Navigate
        to={getDefaultDashboardPath(user)}
        replace
      />
    );
  }

  return children;
}
