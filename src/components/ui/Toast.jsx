/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  X,
} from "lucide-react";
import usePrefersReducedMotion from "../../hooks/usePrefersReducedMotion";

const ToastContext = createContext(null);

const TOAST_ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const TOAST_STYLES = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-950 shadow-emerald-900/5",
  error: "border-rose-200 bg-rose-50 text-rose-950 shadow-rose-900/5",
  warning: "border-amber-200 bg-amber-50 text-amber-950 shadow-amber-900/5",
  info: "border-blue-200 bg-blue-50 text-blue-950 shadow-blue-900/5",
};

const TOAST_ICON_STYLES = {
  success: "text-emerald-600 bg-emerald-100",
  error: "text-rose-600 bg-rose-100",
  warning: "text-amber-600 bg-amber-100",
  info: "text-blue-600 bg-blue-100",
};

function ToastItem({ toast, onDismiss, prefersReducedMotion }) {
  const [isPaused, setIsPaused] = useState(false);
  const remainingTimeRef = useRef(toast.duration ?? 3500);
  const timerStartRef = useRef(0);
  const timerIdRef = useRef(null);

  const Icon = TOAST_ICONS[toast.type] || Info;
  const isAssertive = toast.type === "error";

  useEffect(() => {
    if (toast.duration === Infinity || toast.duration <= 0) return undefined;

    if (isPaused) {
      if (timerIdRef.current) {
        clearTimeout(timerIdRef.current);
        const elapsed = Date.now() - timerStartRef.current;
        remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
      }
      return undefined;
    }

    timerStartRef.current = Date.now();
    timerIdRef.current = setTimeout(() => {
      onDismiss(toast.id);
    }, remainingTimeRef.current);

    return () => {
      if (timerIdRef.current) clearTimeout(timerIdRef.current);
    };
  }, [toast.id, toast.duration, isPaused, onDismiss]);

  return (
    <div
      role={isAssertive ? "alert" : "status"}
      aria-live={isAssertive ? "assertive" : "polite"}
      aria-atomic="true"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      className={`pointer-events-auto relative flex w-full items-start gap-3 rounded-2xl border p-3.5 font-jakarta shadow-lg transition-all duration-200 ${
        TOAST_STYLES[toast.type] || TOAST_STYLES.info
      } ${prefersReducedMotion ? "" : "sibs-toast-in"}`}
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
          TOAST_ICON_STYLES[toast.type] || TOAST_ICON_STYLES.info
        }`}
      >
        <Icon size={16} />
      </span>

      <div className="min-w-0 flex-1 pt-0.5">
        {toast.title ? (
          <h4 className="text-xs font-bold leading-tight">{toast.title}</h4>
        ) : null}
        <p className="text-xs font-semibold leading-relaxed opacity-90 break-words">
          {toast.message}
        </p>
      </div>

      {toast.count > 1 ? (
        <span className="shrink-0 rounded-full bg-slate-900/10 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide">
          ×{toast.count}
        </span>
      ) : null}

      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="shrink-0 rounded-lg p-1 opacity-60 transition hover:bg-black/5 hover:opacity-100"
      >
        <X size={15} />
      </button>
    </div>
  );
}

export function ToastProvider({ children, maxToasts = 4 }) {
  const [toasts, setToasts] = useState([]);
  const prefersReducedMotion = usePrefersReducedMotion();

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clear = useCallback(() => {
    setToasts([]);
  }, []);

  const show = useCallback(
    (type, message, options = {}) => {
      const title = options.title || null;
      const duration = options.duration ?? 3500;
      const toastKey = `${type}:${title || ""}:${message}`;
      const now = Date.now();

      setToasts((prev) => {
        const existingIndex = prev.findIndex(
          (t) => t.key === toastKey && now - t.createdAt < 2000
        );

        if (existingIndex >= 0) {
          const next = [...prev];
          const existing = next[existingIndex];
          next[existingIndex] = {
            ...existing,
            count: (existing.count || 1) + 1,
            createdAt: now,
            duration,
          };
          return next;
        }

        const newToast = {
          id: `toast_${now}_${Math.random().toString(36).substring(2, 7)}`,
          key: toastKey,
          type,
          message,
          title,
          duration,
          count: 1,
          createdAt: now,
        };

        const next = [newToast, ...prev];
        return next.slice(0, maxToasts);
      });
    },
    [maxToasts]
  );

  const toast = useMemo(
    () => ({
      success: (message, options) => show("success", message, options),
      error: (message, options) => show("error", message, options),
      warning: (message, options) => show("warning", message, options),
      info: (message, options) => show("info", message, options),
      dismiss,
      clear,
    }),
    [show, dismiss, clear]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {typeof document !== "undefined" &&
        toasts.length > 0 &&
        createPortal(
          <div
            aria-label="Notifications"
            className="pointer-events-none fixed right-3 top-3 z-[3000] flex w-full max-w-sm flex-col gap-2.5 sm:right-5 sm:top-5"
          >
            {toasts.map((item) => (
              <ToastItem
                key={item.id}
                toast={item}
                onDismiss={dismiss}
                prefersReducedMotion={prefersReducedMotion}
              />
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      success: (msg) => console.log("[Toast success]", msg),
      error: (msg) => console.error("[Toast error]", msg),
      warning: (msg) => console.warn("[Toast warning]", msg),
      info: (msg) => console.info("[Toast info]", msg),
      dismiss: () => {},
      clear: () => {},
    };
  }
  return context;
}

export default ToastProvider;
