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
        className="sibs-modal-backdrop-in sibs-modal-blur fixed inset-0 z-[10000] flex h-dvh items-center justify-center p-4"
        onClick={onClose}
        role="presentation"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-login-title"
          onClick={(e) => e.stopPropagation()}
          className="sibs-modal-pop-in flex max-h-[92dvh] w-full max-w-[448px] flex-col overflow-hidden rounded-3xl border border-white/70 bg-white font-jakarta shadow-2xl"
        >
          <header className="bg-[#042C51] px-5 py-4 text-white sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#FF5C28]/30 bg-[#FF5C28]/15 text-[#FF5C28]">
                  <Activity size={20} />
                </div>

                <div className="min-w-0">
                  <h2
                    id="admin-login-title"
                    className="text-base font-black leading-6 text-white"
                  >
                    {targetAccessLabel} Login
                  </h2>

                  <p className="mt-0.5 text-xs font-semibold leading-5 text-slate-300">
                    Enter your password to access {targetAccessLabel} mode.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-slate-200 transition hover:bg-white/20 hover:text-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>
          </header>

          <main className="bg-[#F8FAFC] p-5 sm:p-6">
            <div className="flex min-h-[46px] items-center rounded-xl border border-blue-100 bg-blue-50 px-4 text-xs font-semibold text-[#042C51]">
              <span>Target Access:</span>
              <span className="ml-1.5 font-extrabold text-[#042C51]">
                {targetAccessLabel}
              </span>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-5">
              <div>
                <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wider text-[#667085]">
                  Password
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={`Enter ${targetAccessLabel} password`}
                  disabled={loading}
                  autoComplete="current-password"
                  className="h-10 w-full rounded-xl border border-[#D0D5DD] bg-white px-3.5 text-xs font-semibold text-[#344054] outline-none transition placeholder:text-slate-400 focus:border-[#042C51] focus:ring-4 focus:ring-[#042C51]/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="h-10 rounded-xl border border-[#D0D5DD] bg-white px-4 text-xs font-extrabold text-[#344054] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="h-10 rounded-xl bg-[#042C51] px-4 text-xs font-extrabold text-white transition hover:bg-[#063968] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
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
