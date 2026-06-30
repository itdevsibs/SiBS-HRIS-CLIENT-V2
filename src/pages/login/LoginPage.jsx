import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, AlertCircle } from "lucide-react";
import { useUser } from "../../services/context/UserContext";
import { getLogin } from "../../lib/axios/getLogin";

function getResponseUser(result) {
  return (
    result?.user ||
    result?.data?.user ||
    result?.data ||
    null
  );
}

function getUserRole(user) {
  return String(
    user?.role ||
      user?.userRole ||
      user?.user_role ||
      user?.access ||
      "",
  )
    .trim()
    .toLowerCase();
}

function getDashboardPath(user) {
  const role = getUserRole(user);

  if (role === "employee") {
    return "/dashboard/employee";
  }

  return "/dashboard/admin";
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useUser();

  const [sibsId, setSibsId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);

  const showPopup = (message) => {
    setErrorMessage(message);
    setShowError(true);
    setTimeout(() => setShowError(false), 3000);
  };

  const clearError = () => {
    setErrorMessage("");
    setShowError(false);
  };

  const saveExpiry = (result) => {
    const expiresAt =
      result?.expiresAt ||
      result?.data?.expiresAt ||
      result?.accessTokenExpiresAt ||
      result?.data?.accessTokenExpiresAt;

    if (expiresAt) {
      sessionStorage.setItem("accessTokenExpiresAt", String(expiresAt));
      localStorage.setItem("token_expires_at", String(expiresAt));
      return;
    }

    sessionStorage.removeItem("accessTokenExpiresAt");
    localStorage.removeItem("token_expires_at");
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    const finalSibsId = sibsId.trim();
    const finalPassword = password.trim();

    if (!finalSibsId || !finalPassword) {
      showPopup("Please enter your SIBS ID and password.");
      setPassword("");
      return;
    }

    setLoading(true);
    clearError();

    try {
      const result = await getLogin(finalSibsId, finalPassword);

      if (!result?.success) {
        setPassword("");
        showPopup(result?.message || "Invalid SIBS ID or password.");
        return;
      }

      const user = getResponseUser(result);

      if (!user) {
        console.error("Login success but no user returned:", result);
        setPassword("");
        showPopup("Login successful, but user details were not returned.");
        return;
      }

      saveExpiry(result);
      setUser(user);

      const dashboardPath = getDashboardPath(user);

      navigate(dashboardPath, { replace: true });
    } catch (err) {
      console.error("Login error:", err?.response?.data || err?.message);

      sessionStorage.removeItem("accessTokenExpiresAt");
      localStorage.removeItem("token_expires_at");

      setPassword("");
      showPopup(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Invalid SIBS ID or password.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoBox}>
          <Activity size={40} color="white" />
          <span style={styles.logoText}>
            SiBS <span style={styles.orange}>HRIS</span>
          </span>
        </div>

        {showError && (
          <div style={styles.errorBox}>
            <AlertCircle size={18} color="#fecaca" />
            <div>
              <p style={styles.errorTitle}>Login Error</p>
              <p style={styles.errorText}>{errorMessage}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <label style={styles.label}>
            SIBS ID
            <input
              type="text"
              value={sibsId}
              disabled={loading}
              onChange={(e) => {
                setSibsId(e.target.value);
                if (showError) clearError();
              }}
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            Password
            <input
              type="password"
              value={password}
              disabled={loading}
              onChange={(e) => {
                setPassword(e.target.value);
                if (showError) clearError();
              }}
              style={styles.input}
            />
          </label>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    width: "100vw",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    background:
      "linear-gradient(135deg, #1e4d7b 0%, #3b5f7f 45%, #f05a28 100%)",
    boxSizing: "border-box",
  },
  card: {
    width: "100%",
    maxWidth: "448px",
    padding: "32px",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.2)",
    background: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(16px)",
    boxShadow: "0 25px 50px rgba(0,0,0,0.35)",
    boxSizing: "border-box",
  },
  logoBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    marginBottom: "24px",
  },
  logoText: {
    color: "white",
    fontSize: "30px",
    fontWeight: "600",
  },
  orange: {
    color: "#f97316",
  },
  label: {
    display: "block",
    color: "rgba(255,255,255,0.85)",
    fontSize: "14px",
    marginBottom: "16px",
  },
  input: {
    width: "100%",
    marginTop: "6px",
    padding: "11px 16px",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.2)",
    background: "rgba(255,255,255,0.2)",
    color: "white",
    outline: "none",
    fontSize: "15px",
    boxSizing: "border-box",
  },
  button: {
    width: "100%",
    marginTop: "8px",
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    background: "#f97316",
    color: "white",
    fontWeight: "600",
    cursor: "pointer",
  },
  errorBox: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-start",
    marginBottom: "16px",
    padding: "12px 16px",
    borderRadius: "12px",
    border: "1px solid #fca5a5",
    background: "rgba(239,68,68,0.18)",
    color: "white",
  },
  errorTitle: {
    margin: 0,
    fontSize: "14px",
    fontWeight: "600",
    color: "#fee2e2",
  },
  errorText: {
    margin: 0,
    fontSize: "14px",
    color: "#fef2f2",
  },
};