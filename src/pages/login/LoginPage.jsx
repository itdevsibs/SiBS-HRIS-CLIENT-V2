import { useLayoutEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { GradientWave } from "@/components/ui/gradient-wave";
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

const serviceUnavailableMessage = "Sign-in is temporarily unavailable. Try again in a moment.";
const inputClassName = "h-12 w-full rounded-lg border border-sibs-border bg-sibs-surface pl-3 text-base text-sibs-navy transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sibs-orange aria-invalid:border-rose-500 disabled:opacity-70";

function getLoginFailureMessage(result) {
  if (!result || result.code === "LOGIN_SERVER_ERROR" || result.status >= 500) {
    return serviceUnavailableMessage;
  }
  if (result.code === "MISSING_CREDENTIALS") {
    return "Enter your SIBS ID and password.";
  }
  return "Check your SIBS ID and password, then try again.";
}

export default function LoginPage() {
  // The global HRIS layout reserves a scrollbar gutter. On the public login
  // screen that gutter exposes the light document background as a thin stripe
  // along the viewport edge. Make auth routes full-bleed without altering the
  // stable scrollbar layout of authenticated pages.
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.add("sibs-login-full-bleed");
    return () => root.classList.remove("sibs-login-full-bleed");
  }, []);

  const location = useLocation();
  const navigate = useNavigate();
  const { setUser } = useUser();

  const [sibsId, setSibsId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const clearFieldError = (field) => {
    if (error && (!error.field || error.field === field)) setError(null);
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
      const field = finalSibsId ? "password" : "sibsId";
      setError({ field, message: finalSibsId ? "Enter your password." : "Enter your SIBS ID." });
      e.currentTarget.elements.namedItem(field)?.focus();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await getLogin(finalSibsId, finalPassword);

      if (!result?.success) {
        setPassword("");
        setError({ message: getLoginFailureMessage(result) });
        return;
      }

      const user = getResponseUser(result);

      if (!user) {
        console.error("Login response did not include a user.");
        setPassword("");
        setError({ message: serviceUnavailableMessage });
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
    } catch {
      sessionStorage.removeItem("accessTokenExpiresAt");
      localStorage.removeItem("token_expires_at");

      setPassword("");
      setError({ message: serviceUnavailableMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-sibs-auth-bg p-4 font-jakarta sm:p-6">
      <GradientWave />

      <section aria-label="SiBS HRIS sign in" className="relative z-10 w-full max-w-md rounded-2xl border border-white/20 bg-sibs-navy p-5 shadow-2xl sm:p-8">
        <div className="mb-6 text-center">
          <img
            src="/SiBS_Login_Logo.svg"
            alt="SiBS HRIS"
            draggable={false}
            className="mx-auto block h-auto w-64 max-w-full select-none object-contain sm:w-72"
          />
        </div>

        <div role="alert" aria-atomic="true">
          {error && (
            <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-900">
              <AlertCircle aria-hidden="true" size={17} className="mt-0.5 shrink-0" />
              <p id="sign-in-error" className="m-0 text-sm font-medium leading-5">{error.message}</p>
            </div>
          )}
        </div>

        <form onSubmit={handleLogin} noValidate className="space-y-4">
          <div>
            <label htmlFor="sign-in-sibs-id" className="mb-1.5 block text-sm font-semibold text-white">SIBS ID</label>
            <input
              id="sign-in-sibs-id"
              type="text"
              name="sibsId"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              aria-invalid={error?.field === "sibsId" || undefined}
              aria-describedby={error?.field === "sibsId" ? "sign-in-error" : undefined}
              value={sibsId}
              disabled={loading}
              onChange={(e) => {
                setSibsId(e.target.value);
                clearFieldError("sibsId");
              }}
              className={`${inputClassName} pr-3`}
            />
          </div>

          <div>
            <label htmlFor="sign-in-password" className="mb-1.5 block text-sm font-semibold text-white">Password</label>
            <div className="relative">
              <input
                id="sign-in-password"
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                required
                aria-invalid={error?.field === "password" || undefined}
                aria-describedby={error?.field === "password" ? "sign-in-error" : undefined}
                value={password}
                disabled={loading}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearFieldError("password");
                }}
                className={`${inputClassName} pr-14`}
              />

              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                disabled={loading}
                className="absolute right-0.5 top-0.5 flex size-11 items-center justify-center rounded-md text-sibs-navy transition-colors hover:bg-sibs-canvas focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sibs-navy disabled:opacity-60"
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-1 min-h-12 w-full rounded-lg bg-sibs-orange px-4 py-3 text-base font-extrabold text-white transition-colors hover:bg-sibs-button-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
