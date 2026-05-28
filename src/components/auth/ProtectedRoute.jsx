import { Navigate, useLocation } from "react-router-dom";
import { useUser } from "../../services/context/UserContext";
import { canAccessPath, cleanRole } from "../../config/accessControl";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useUser();
  const location = useLocation();

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
    const role = cleanRole(user?.role);

    return (
      <Navigate
        to={role === "employee" ? "/dashboard/employee" : "/dashboard/admin"}
        replace
      />
    );
  }

  return children;
}