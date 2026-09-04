import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { useUser } from "../../services/context/UserContext";
import { getLogin } from "../../lib/axios/getLogin";
import { getDefaultDashboardPath } from "../../config/accessControl";

function getResponseUser(result) {
  return (
    result?.user ||
    result?.data?.user ||
    result?.data ||
    null
  );
}

function getDashboardPath(user) {
  return getDefaultDashboardPath(user);
}

function getLoginFailureMessage(result = {}) {
  if (result.message) {
    return result.message;
  }

  switch (result.code) {
    case "USER_NOT_FOUND_OR_INACTIVE":
      return "SIBS ID was not found or the account is inactive.";

    case "PASSWORD_MISMATCH":
      return "Password does not match. Check the backend encryption values.";

    case "MISSING_CREDENTIALS":
      return "Please enter your SIBS ID and password.";

    case "LOGIN_SERVER_ERROR":
      return "The login server encountered an error. Check the backend terminal.";

    default:
      return "Login failed. Please check your credentials.";
  }
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useUser();

  const [sibsId, setSibsId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

    /*
     * Preserve the password exactly as entered.
     */
    const finalPassword = password;

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
        showPopup(getLoginFailureMessage(result));
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
          <img
            src="/SiBS_Login_Logo.svg"
            alt="SiBS HRIS"
            draggable={false}
            style={styles.logoImage}
          />
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
              name="sibsId"
              autoComplete="username"
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
            <div style={styles.passwordField}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                value={password}
                disabled={loading}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (showError) clearError();
                }}
                style={{ ...styles.input, ...styles.passwordInput }}
              />

              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                disabled={loading}
                style={styles.passwordToggle}
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
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
  logoImage: {
    display: "block",
    width: "100%",
    maxWidth: "300px",
    height: "auto",
    objectFit: "contain",
    userSelect: "none",
    WebkitUserDrag: "none",
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
  passwordField: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: "46px",
  },
  passwordToggle: {
    position: "absolute",
    right: "10px",
    top: "50%",
    transform: "translateY(-38%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "30px",
    height: "30px",
    padding: 0,
    border: "none",
    borderRadius: "6px",
    background: "transparent",
    color: "rgba(255,255,255,0.9)",
    cursor: "pointer",
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
