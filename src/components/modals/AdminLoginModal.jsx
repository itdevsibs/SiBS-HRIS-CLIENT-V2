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
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-login-title"
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md rounded-2xl border border-sibs-tertiary-9 bg-white shadow-2xl"
        >
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="absolute right-5 top-5 text-sibs-tertiary-5 transition hover:text-sibs-primary-1 disabled:opacity-50"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>

          <div className="border-b border-sibs-tertiary-9 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--sibs-primary-1)]/10">
                <Activity size={22} className="text-sibs-primary-1" />
              </div>

              <div>
                <h2
                  id="admin-login-title"
                  className="text-2xl font-bold text-sibs-primary-1"
                >
                  {targetAccessLabel} Login
                </h2>

                <p className="text-sm text-sibs-tertiary-5">
                  Enter your password to access {targetAccessLabel} mode
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 pt-4">
            <div className="rounded-xl border border-sibs-tertiary-9 bg-sibs-tertiary-10 px-4 py-3 text-sm text-sibs-tertiary-5">
              Target Access:
              <span className="ml-2 font-semibold text-sibs-primary-1">
                {targetAccessLabel}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 p-6">
            <div>
              <label className="mb-1 block text-sm font-medium text-sibs-primary-1">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={`Enter ${targetAccessLabel} password`}
                disabled={loading}
                className="w-full rounded-xl border border-sibs-tertiary-8 bg-white px-4 py-3 text-sm text-sibs-primary-1 outline-none focus:border-[var(--sibs-primary-1)] disabled:opacity-50"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="w-full rounded-xl border border-sibs-tertiary-8 bg-white px-4 py-3 text-sm font-semibold text-sibs-tertiary-5 transition hover:bg-sibs-tertiary-10 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[var(--sibs-primary-1)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
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