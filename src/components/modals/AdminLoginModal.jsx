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
      <div className="admin-login-overlay" onClick={onClose}>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-login-title"
          className="admin-login-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="admin-login-close"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>

          <div className="admin-login-header">
            <div className="admin-login-title-row">
              <div className="admin-login-icon">
                <Activity size={24} />
              </div>

              <div className="admin-login-title-text">
                <h2 id="admin-login-title">{targetAccessLabel} Login</h2>
                <p>Enter your password to access {targetAccessLabel} mode</p>
              </div>
            </div>
          </div>

          <div className="admin-login-access-wrap">
            <div className="admin-login-access-box">
              <span>Target Access:</span>
              <strong>{targetAccessLabel}</strong>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="admin-login-form">
            <div className="admin-login-field">
              <label>Password</label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={`Enter ${targetAccessLabel} password`}
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            <div className="admin-login-actions">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="admin-login-cancel"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="admin-login-submit"
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