import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, Eye, EyeOff, X } from "lucide-react";

import { useHeader } from "../../services/context/HeaderContext";
import { useUser } from "../../services/context/UserContext";
import { useAdmin } from "../../services/context/AdminContext";
import { getAdminLogin } from "../../lib/axios/getAdminLogin";
import { getDefaultDashboardPath } from "../../config/accessControl";
import StatusModal from "./StatusModal";

export default function AdminLoginModal() {
  const navigate = useNavigate();

  const { adminLogin, setAdminLogin } = useHeader();
  const { user, setUser } = useUser();
  const { getAccessLabel } = useAdmin();

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    setShowPassword(false);
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
      const data = await getAdminLogin(password.trim());

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

      const targetUser = data?.user || user;
      navigate(getDefaultDashboardPath(targetUser), { replace: true });
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
        className="sibs-modal-backdrop-in sibs-modal-blur fixed inset-0 z-[10000] flex h-dvh items-center justify-center p-4"
        onClick={onClose}
        role="presentation"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-login-title"
          onClick={(e) => e.stopPropagation()}
          className="sibs-modal-pop-in flex max-h-[92dvh] w-full max-w-[448px] flex-col overflow-hidden rounded-2xl border border-white/70 bg-white font-jakarta shadow-2xl"
        >
          <header className="bg-[#042C51] px-5 py-3 text-white sm:px-6 2xl:py-3.5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-2.5 2xl:gap-3">
                <div className="flex h-8 w-8 2xl:h-8.5 2xl:w-8.5 shrink-0 items-center justify-center rounded-lg bg-[#FF5C28] text-white shadow-sm">
                  <Activity size={16} />
                </div>

                <div className="min-w-0">
                  <h2
                    id="admin-login-title"
                    className="text-base sm:text-lg 2xl:text-xl font-extrabold text-white"
                  >
                    {targetAccessLabel} Login
                  </h2>

                  <p className="mt-0.5 sibs-text-xs font-semibold text-white/75">
                    Enter your password to access {targetAccessLabel} mode.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="inline-flex h-8 w-8 2xl:h-8.5 2xl:w-8.5 shrink-0 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>
          </header>

          <main className="bg-[#F8FAFC] p-4 sm:p-5 2xl:p-6">
            <div className="flex min-h-[40px] 2xl:min-h-[44px] items-center rounded-xl border border-blue-100 bg-blue-50 px-3.5 sibs-text-xs font-semibold text-[#042C51]">
              <span>Target Access:</span>
              <span className="ml-1.5 font-extrabold text-[#042C51]">
                {targetAccessLabel}
              </span>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
                  Password <span className="text-[#FF5C28]">*</span>
                </label>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={`Enter ${targetAccessLabel} password`}
                    disabled={loading}
                    autoComplete="current-password"
                    className="h-8.5 2xl:h-10 w-full rounded-xl border border-[#D7DEE8] bg-white px-3 pr-10 2xl:px-3.5 2xl:pr-11 sibs-text-xs font-semibold text-[#042C51] outline-none transition placeholder:text-[#98A2B3] focus:border-[#FF5C28] focus:ring-4 focus:ring-[#FF5C28]/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    disabled={loading}
                    className="absolute right-2.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-[#98A2B3] transition hover:bg-[#F2F4F7] hover:text-[#042C51] disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="inline-flex h-8.5 2xl:h-10 items-center justify-center rounded-lg border border-[#D6DEE8] bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-[#667085] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF8F5] hover:text-[#FF5C28] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex h-8.5 2xl:h-10 items-center justify-center rounded-lg bg-[#FF5C28] px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-white shadow-sm transition hover:bg-[#E94F1F] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Logging in..." : `Login as ${targetAccessLabel}`}
                </button>
              </div>
            </form>
          </main>
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
