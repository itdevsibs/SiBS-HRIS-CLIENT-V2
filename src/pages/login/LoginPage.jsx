import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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

function getSafeRedirectPath(search = "") {
  const params = new URLSearchParams(search);
  const redirectPath = String(params.get("redirect") || "").trim();

  if (!redirectPath.startsWith("/") || redirectPath.startsWith("//")) {
    return "";
  }

  return redirectPath;
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
  const location = useLocation();
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

      const expiresAt =
        result?.expiresAt ||
        result?.data?.expiresAt ||
        result?.accessTokenExpiresAt ||
        result?.data?.accessTokenExpiresAt ||
        null;

      saveExpiry(result);
      setUser(user, expiresAt);

      const redirectPath = getSafeRedirectPath(location.search);
      const destinationPath = redirectPath || getDashboardPath(user);

      navigate(destinationPath, { replace: true });
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
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#051733] p-6 font-jakarta">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(circle at 16% 18%, rgba(35, 92, 178, 0.34), transparent 24%),
              radial-gradient(circle at 82% 84%, rgba(255, 96, 40, 0.32), transparent 28%),
              radial-gradient(circle at 64% 72%, rgba(255, 132, 78, 0.14), transparent 22%),
              linear-gradient(135deg, #03112a 0%, #07285b 46%, #08122b 100%)
            `,
          }}
        />

        <div className="sibs-drift-1 absolute -left-24 top-[8%] h-80 w-80 rounded-full bg-[#11438b]/35 blur-3xl" />
        <div className="sibs-drift-2 absolute left-[12%] bottom-[-9%] h-72 w-72 rounded-full bg-[#0b2f6f]/30 blur-3xl" />
        <div className="sibs-drift-3 absolute right-[-7%] bottom-[-10%] h-[28rem] w-[28rem] rounded-full bg-[#ff6228]/25 blur-3xl" />
        <div className="sibs-drift-4 absolute right-[14%] top-[12%] h-64 w-64 rounded-full bg-white/6 blur-3xl" />

        <div
          className="sibs-float-slow absolute left-[-8%] top-[24%] h-64 w-[34rem] rotate-[-18deg] rounded-full blur-3xl"
          style={{
            background:
              'linear-gradient(90deg, rgba(12,55,121,0.08) 0%, rgba(32,92,176,0.28) 40%, rgba(255,255,255,0.08) 100%)',
          }}
        />
        <div
          className="sibs-float-reverse absolute right-[-10%] bottom-[14%] h-72 w-[36rem] rotate-[18deg] rounded-full blur-3xl"
          style={{
            background:
              'linear-gradient(90deg, rgba(255,93,35,0.05) 0%, rgba(255,95,46,0.3) 42%, rgba(255,255,255,0.08) 100%)',
          }}
        />

        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-[32vh] bg-gradient-to-t from-[#ff5b2e]/10 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-md">
        <div className="mb-6 flex items-center justify-center gap-3">
          <img
            src="/SiBS_Login_Logo.svg"
            alt="SiBS HRIS"
            draggable={false}
            className="block h-auto w-full max-w-[300px] select-none object-contain"
          />
        </div>

        {showError && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-rose-300/40 bg-rose-500/20 p-3.5 text-white">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-rose-200" />
            <div>
              <p className="m-0 text-sm font-semibold text-rose-100">Login Error</p>
              <p className="m-0 text-sm text-rose-50">{errorMessage}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <label className="mb-4 block text-sm font-semibold text-white/85">
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
              className="mt-1.5 w-full rounded-lg border border-white/20 bg-white/20 px-4 py-2.5 text-base text-white outline-none transition placeholder:text-white/40 focus:border-white/50 focus:ring-2 focus:ring-white/20"
            />
          </label>

          <label className="mb-4 block text-sm font-semibold text-white/85">
            Password
            <div className="relative">
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
                className="mt-1.5 w-full rounded-lg border border-white/20 bg-white/20 pl-4 pr-12 py-2.5 text-base text-white outline-none transition placeholder:text-white/40 focus:border-white/50 focus:ring-2 focus:ring-white/20"
              />

              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                disabled={loading}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-md text-white/90 transition hover:bg-white/10"
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-lg bg-sibs-orange py-3 text-base font-extrabold text-white transition hover:bg-sibs-button-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
