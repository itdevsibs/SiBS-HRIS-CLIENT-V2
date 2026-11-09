import React, { Component } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

/**
 * Top-level React Error Boundary for SiBS HRIS.
 * Catches uncaught render crashes in child components and renders a branded recovery screen.
 */
export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error diagnostics safely to console without leaking user credentials or tokens
    console.error("AppErrorBoundary caught an unhandled rendering error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  componentDidUpdate(prevProps) {
    // Automatically recover when navigation/route changes
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: null });
    }
  }

  handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return typeof this.props.fallback === "function"
          ? this.props.fallback({ error: this.state.error, reset: this.handleReset })
          : this.props.fallback;
      }

      return (
        <main
          role="alert"
          aria-live="assertive"
          className="flex min-h-screen w-full items-center justify-center bg-sibs-canvas p-4 font-jakarta sm:p-6"
        >
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-sibs-border bg-white p-6 shadow-2xl sm:p-8">
            <span className="sibs-top-accent" aria-hidden="true" />

            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-sibs-orange/20 bg-sibs-cream-light text-sibs-orange shadow-xs">
              <AlertTriangle size={28} />
            </div>

            <h1 className="text-center text-xl font-bold tracking-tight text-sibs-navy sm:text-2xl">
              Something went wrong
            </h1>

            <p className="mt-2 text-center text-xs font-semibold leading-relaxed text-sibs-muted sm:text-sm">
              An unexpected error occurred while rendering this page. You can reload the application or return to your dashboard.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center sm:gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-sibs-border bg-white px-4 text-xs font-bold text-sibs-navy transition hover:bg-sibs-surface hover:border-sibs-orange/40 active:scale-[0.98]"
              >
                <Home size={15} />
                Return to Dashboard
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-sibs-orange px-5 text-xs font-bold text-white shadow-xs transition hover:bg-sibs-button-hover active:scale-[0.98]"
              >
                <RefreshCw size={15} />
                Reload Application
              </button>
            </div>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
