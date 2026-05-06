import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Activity } from "lucide-react";

import { useHeader } from "../../services/context/HeaderContext";
import { useUser } from "../../services/context/UserContext";
import { useAdmin } from "../../services/context/AdminContext";
import { getAdminLogin } from "../../lib/axios/getAdminLogin";
import StatusModal from "./StatusModal";

export default function AdminLoginModal() {
  const navigate = useNavigate();

  const { adminLogin, setAdminLogin } = useHeader();
  const { user, setUser } = useUser();
  const { getAccessLabel } = useAdmin();

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  const targetAccessLabel = useMemo(() => {
    return getAccessLabel(user?.adminAccess);
  }, [user?.adminAccess, getAccessLabel]);

  const showStatus = ({ type, title, message }) => {
    setStatusModal({
      open: true,
      type,
      title,
      message,
    });
  };

  const closeStatusModal = () => {
    setStatusModal({
      open: false,
      type: "success",
      title: "",
      message: "",
    });
  };

  const onClose = () => {
    if (loading) return;

    setAdminLogin(false);
    setPassword("");
    closeStatusModal();
  };

  useEffect(() => {
    if (!adminLogin) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [adminLogin, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password.trim()) {
      showStatus({
        type: "error",
        title: "Password Required",
        message: "Please enter your password.",
      });
      return;
    }

    setLoading(true);

    try {
      const data = await getAdminLogin(password);

      if (!data?.success) {
        showStatus({
          type: "error",
          title: "Login Failed",
          message:
            data?.message ||
            `Login failed. Please check your ${targetAccessLabel} credentials.`,
        });

        setPassword("");
        return;
      }

      if (data?.user) {
        setUser(data.user);
      }

      setPassword("");
      setAdminLogin(false);

      navigate("/dashboard/admin", { replace: true });
    } catch (error) {
      showStatus({
        type: "error",
        title: "Login Failed",
        message:
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          `Login failed. Please check your ${targetAccessLabel} credentials.`,
      });

      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  if (!adminLogin) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[10000] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
        onClick={onClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-login-title"
          className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>

          <div className="border-b border-[#E6ECF2] px-5 pb-5 pt-6 sm:px-6">
            <div className="flex items-start gap-4 pr-10">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sibs-primary-1 text-white shadow-sm">
                <Activity size={24} />
              </div>

              <div className="min-w-0">
                <h2
                  id="admin-login-title"
                  className="text-xl font-bold text-sibs-primary-1"
                >
                  {targetAccessLabel} Login
                </h2>

                <p className="mt-1 text-sm leading-6 text-sibs-tertiary-5">
                  Enter your password to access {targetAccessLabel} mode
                </p>
              </div>
            </div>
          </div>

          <div className="border-b border-[#E6ECF2] bg-[#F8FAFC] px-5 py-4 sm:px-6">
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#E6ECF2] bg-white px-4 py-3">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-sibs-tertiary-5">
                Target Access
              </span>

              <strong className="text-sm font-bold text-sibs-primary-1">
                {targetAccessLabel}
              </strong>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 px-5 py-5 sm:px-6">
            <div>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-sibs-tertiary-5">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={`Enter ${targetAccessLabel} password`}
                disabled={loading}
                autoComplete="current-password"
                className="h-12 w-full rounded-2xl border border-[#E6ECF2] bg-white px-4 text-sm font-medium text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5/70 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Logging in..." : `Login as ${targetAccessLabel}`}
              </button>
            </div>
          </form>
        </div>
      </div>

      <StatusModal
        open={statusModal.open}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        onClose={closeStatusModal}
      />
    </>
  );
}