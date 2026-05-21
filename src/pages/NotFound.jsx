import { useNavigate } from "react-router-dom";

const LAST_ROUTE_KEY = "lastRoute";

const allowedRoutes = [
  "/dashboard",
  "/employee",
  "/attendance",
  "/requisitions",
  "/profile",
  "/leaves",
  "/payroll",
];

export default function NotFound() {
  const navigate = useNavigate();

  const handleGoBack = () => {
    const lastRoute = sessionStorage.getItem(LAST_ROUTE_KEY);

    if (lastRoute && allowedRoutes.includes(lastRoute)) {
      navigate(lastRoute);
      return;
    }

    navigate("/dashboard/employee");
  };

  return (
    <div className="flex items-center justify-center h-screen flex-col">
      <h1 className="text-3xl font-bold">404</h1>
      <p className="mb-4">Page not found</p>

      <button
        onClick={handleGoBack}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Go Back
      </button>
    </div>
  );
}
