import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  Bot,
  LoaderCircle,
  MessageCircleMore,
  RefreshCw,
  Send,
  Sparkles,
  X,
} from "lucide-react";

import { AI_CHAT_TIMEOUT_MS } from "@/lib/axios/ai";
import { formatAiDisplayDates } from "@/lib/utils/ai/aiDateDisplayClient";
import {
  buildConversationPayload,
  getAiErrorMessage,
} from "@/lib/utils/ai/aiAssistantHelpers";
import { useUser } from "@/services/context/UserContext";
import HermesResponseRenderer from "./HermesResponseRenderer";
import HrisUatPanel from "./HrisUatPanel";

const SUGGESTED_PROMPTS = [
  "What is my profile?",
  "How was my attendance this month?",
  "What is my leave balance?",
  "Summarize the recent applicant leads.",
];

const HERMES_CHAT_TIMEOUT_MS = 300_000;
const VIEWPORT_PADDING = 16;
const DRAG_THRESHOLD = 6;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function AssistantMessage({ message, onContinue = null }) {
  return (
    <article className="min-w-0 w-full space-y-4 rounded-2xl border border-sibs-border bg-white p-4 sm:p-5 shadow-xs">
      <div className="flex items-center gap-2.5 border-b border-sibs-border-subtle pb-3">
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sibs-navy text-white"><Bot size={17} /></span>
        <div className="min-w-0"><p className="font-heading text-sm font-bold text-sibs-navy">SiBS AI</p><p className="text-[11px] text-sibs-muted">HRIS assistant</p></div>
      </div>
      <HermesResponseRenderer content={message.content} report={message.report}
        status={message.status} finishReason={message.finishReason} onContinue={onContinue} />
    </article>
  );
}

function UserMessage({ message }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] break-words rounded-2xl rounded-br-md bg-sibs-orange px-3.5 py-2.5 text-sm font-medium leading-6 text-white shadow-xs">
        {formatAiDisplayDates(message.content)}
      </div>
    </div>
  );
}

export default function SiBSAIAssistant({
  enabled = true,
  isOpen: controlledOpen,
  onOpenChange,
  hideTrigger = false,
}) {
  const assistantName = "Ask SiBS AI";
  const { user, loading: userLoading } = useUser() || {};
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = useCallback(
    (nextOpen) => {
      const resolvedOpen =
        typeof nextOpen === "function" ? nextOpen(open) : nextOpen;
      if (!resolvedOpen && drawerRef.current?.contains(document.activeElement)) {
        document.activeElement?.blur?.();
      }
      if (!isControlled) {
        setInternalOpen(resolvedOpen);
      }
      onOpenChange?.(resolvedOpen);
    },
    [isControlled, open, onOpenChange],
  );
  const loggedInEmployeeKey = String(
    user?.sibs_id || user?.sibsId || user?.username || user?.gy_user_code || "",
  ).trim();
  const sessionKey = JSON.stringify([loggedInEmployeeKey, user?.tokenType, user?.role, user?.adminAccess, user?.gy_emp_id]);
  // Keep sensitive Hermes results in memory for the signed-in account.
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [hydratedEmployeeKey, setHydratedEmployeeKey] = useState(sessionKey);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [uatSession, setUatSession] = useState(0);
  const [triggerPosition, setTriggerPosition] = useState(null);
  const [triggerDragging, setTriggerDragging] = useState(false);

  const triggerRef = useRef(null);
  const drawerRef = useRef(null);
  const openerRef = useRef(null);
  const setOpenRef = useRef(setOpen);
  setOpenRef.current = setOpen;
  const inputRef = useRef(null);
  const scrollRef = useRef(null);
  const dragStateRef = useRef(null);
  const suppressTriggerClickRef = useRef(false);
  const requestInFlightRef = useRef(false);
  const activeRequestControllerRef = useRef(null);

  useEffect(() => {
    return () => {
      activeRequestControllerRef.current?.abort();
    };
  }, []);

  // Hide the previous account's messages until the next account is hydrated.
  const visible = enabled && !userLoading && Boolean(user) && Boolean(loggedInEmployeeKey) &&
    hydratedEmployeeKey === sessionKey;
  const canSend = Boolean(question.trim()) && !submitting;
  const activeEmployeeKeyRef = useRef(sessionKey);
  activeEmployeeKeyRef.current = sessionKey;

  useEffect(() => {
    if (hydratedEmployeeKey === sessionKey) return;
    activeRequestControllerRef.current?.abort();
    activeRequestControllerRef.current = null;
    requestInFlightRef.current = false;
    setSubmitting(false);
    setMessages([]);
    setQuestion("");
    setError("");
    setHydratedEmployeeKey(sessionKey);
  }, [hydratedEmployeeKey, sessionKey]);

  const welcomeName = useMemo(() => {
    const rawName =
      user?.firstName ||
      user?.firstname ||
      user?.first_name ||
      user?.name ||
      "";

    return String(rawName).trim().split(/\s+/)[0] || "there";
  }, [user]);

  useEffect(() => {
    if (!open) {
      const opener = openerRef.current;
      openerRef.current = null;
      if (opener?.isConnected) {
        const frame = window.requestAnimationFrame(() => opener.focus?.());
        return () => window.cancelAnimationFrame(frame);
      }
      return undefined;
    }
    if (!drawerRef.current?.contains(document.activeElement)) {
      openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    }
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !document.querySelector("[data-hermes-expanded-view]")) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation?.();
        setOpenRef.current(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown, true);
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus?.());
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    window.requestAnimationFrame(() => {
      scrollRef.current?.scrollTo?.({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  }, [messages, submitting, error, open]);

  useEffect(() => {
    function keepTriggerInsideViewport() {
      const trigger = triggerRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();

      setTriggerPosition((current) => {
        if (!current) return current;

        const nextLeft = clamp(
          current.left,
          VIEWPORT_PADDING,
          window.innerWidth - rect.width - VIEWPORT_PADDING,
        );
        const nextTop = clamp(
          current.top,
          VIEWPORT_PADDING,
          window.innerHeight - rect.height - VIEWPORT_PADDING,
        );

        if (nextLeft === current.left && nextTop === current.top) {
          return current;
        }

        return { left: nextLeft, top: nextTop };
      });
    }

    window.addEventListener("resize", keepTriggerInsideViewport);

    return () => {
      window.removeEventListener("resize", keepTriggerInsideViewport);
    };
  }, []);

  if (!visible) return null;

  function handleTriggerPointerDown(event) {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();

    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startLeft: rect.left,
      startTop: rect.top,
      width: rect.width,
      height: rect.height,
      dragging: false,
    };

    suppressTriggerClickRef.current = false;
    trigger.setPointerCapture?.(event.pointerId);
  }

  function handleTriggerPointerMove(event) {
    const dragState = dragStateRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;
    const distance = Math.hypot(deltaX, deltaY);

    if (!dragState.dragging && distance < DRAG_THRESHOLD) return;

    if (!dragState.dragging) {
      dragState.dragging = true;
      suppressTriggerClickRef.current = true;
      setTriggerDragging(true);
    }

    event.preventDefault();

    setTriggerPosition({
      left: clamp(
        dragState.startLeft + deltaX,
        VIEWPORT_PADDING,
        window.innerWidth - dragState.width - VIEWPORT_PADDING,
      ),
      top: clamp(
        dragState.startTop + deltaY,
        VIEWPORT_PADDING,
        window.innerHeight - dragState.height - VIEWPORT_PADDING,
      ),
    });
  }

  function finishTriggerDrag(event, cancelled = false) {
    const dragState = dragStateRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) return;

    suppressTriggerClickRef.current = cancelled
      ? false
      : Boolean(dragState.dragging);

    const trigger = triggerRef.current;
    if (trigger?.hasPointerCapture?.(event.pointerId)) {
      trigger.releasePointerCapture(event.pointerId);
    }

    dragStateRef.current = null;
    setTriggerDragging(false);
  }

  function handleTriggerPointerUp(event) {
    finishTriggerDrag(event);
  }

  function handleTriggerPointerCancel(event) {
    finishTriggerDrag(event, true);
  }

  function handleTriggerClick() {
    if (suppressTriggerClickRef.current) {
      suppressTriggerClickRef.current = false;
      return;
    }

    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
  }

  function handleNewChat() {
    activeRequestControllerRef.current?.abort();
    activeRequestControllerRef.current = null;
    requestInFlightRef.current = false;
    setMessages([]);
    setQuestion("");
    setError("");
    setSubmitting(false);
    setUatSession((current) => current + 1);
    window.requestAnimationFrame(() => inputRef.current?.focus?.());
  }

  async function submitQuestion(value = question, uatScenario = null) {
    const cleanQuestion = String(value || "").trim();
    if (!cleanQuestion || submitting || requestInFlightRef.current || !loggedInEmployeeKey ||
        hydratedEmployeeKey !== sessionKey) return;
    requestInFlightRef.current = true;

    const requestEmployeeKey = sessionKey;
    const conversation = uatScenario ? [] : buildConversationPayload(messages);
    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: cleanQuestion,
    };

    setMessages((current) => [...current, userMessage]);
    setQuestion("");
    setError("");
    setSubmitting(true);

    const controller = new AbortController();
    activeRequestControllerRef.current = controller;
    let deadlineExpired = false;
    const deadlineTimer = window.setTimeout(() => {
      deadlineExpired = true;
      controller.abort();
    }, uatScenario ? AI_CHAT_TIMEOUT_MS : HERMES_CHAT_TIMEOUT_MS);
    try {
      {
        const startedAt = performance.now();
        const [{ default: api }, { sendHermesAgentChat }] = await Promise.all([
          import("@/lib/axios/api-template"),
          import("@/lib/axios/hermes-agent-chat"),
        ]);
        const response = await sendHermesAgentChat({
          apiClient: api,
          message: cleanQuestion,
          conversation,
          includeReport: true,
          expectedSibsId: loggedInEmployeeKey,
          expectedEmployeeId: user?.gy_emp_id,
          expectedTokenType: user?.tokenType,
          ...(uatScenario ? { uatScenarioId: uatScenario.id } : {}),
          signal: controller.signal,
        });
        if (controller.signal.aborted || activeEmployeeKeyRef.current !== requestEmployeeKey) return;
        const responseMs = Math.round(performance.now() - startedAt);
        setMessages((current) => [...current, {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: response.reply,
          status: response.status || "completed",
          finishReason: response.finishReason || "stop",
          responseMs,
          requestId: response.requestId,
          actualCapability: response.actualCapability,
          uatScenarioId: uatScenario?.id || null,
          report: response.report,
        }]);
        return {
          correlationId: response.requestId || "",
          actualCapability: response.actualCapability || null,
          latencyMs: responseMs,
          completionStatus: response.status || "completed",
          uatEvidence: response.uatEvidence || null,
          executionRecordId: response.uatExecution?.recordId || null,
        };
      }
    } catch (requestError) {
      if (activeEmployeeKeyRef.current === requestEmployeeKey && activeRequestControllerRef.current === controller) {
        const isTimeout = deadlineExpired || requestError?.code === "ECONNABORTED" ||
          requestError?.response?.data?.code === "AI_REQUEST_TIMEOUT";
        setError(isTimeout
          ? `This request exceeded the ${uatScenario ? 60 : 300}-second limit and was stopped. Please try again or ask a more specific question.`
          : getAiErrorMessage(requestError));
      }
      const failedReceipt = requestError?.response?.data?.uatExecution;
      if (uatScenario && failedReceipt?.recordId && failedReceipt?.correlationId) {
        return { executionRecordId: failedReceipt.recordId, correlationId: failedReceipt.correlationId, completionStatus: "error", latencyMs: null };
      }
    } finally {
      window.clearTimeout(deadlineTimer);
      if (activeRequestControllerRef.current === controller) {
        activeRequestControllerRef.current = null;
        requestInFlightRef.current = false;
        setSubmitting(false);
      }
    }
  }

  // Suggested questions use exactly the same authenticated request path as
  // manually typed questions. Clicking a card submits it immediately.
  function handleSuggestedPrompt(prompt) {
    if (requestInFlightRef.current || submitting) return;
    void submitQuestion(prompt);
  }

  function handleContinue() {
    if (submitting || requestInFlightRef.current) return;
    void submitQuestion("Please continue where you left off.");
  }

  const assistantUi = (
    <>
      {/* Floating Launcher Button with safe-area support */}
      {!hideTrigger ? (
        <button
          ref={triggerRef}
          type="button"
          onClick={handleTriggerClick}
          onPointerDown={handleTriggerPointerDown}
          onPointerMove={handleTriggerPointerMove}
          onPointerUp={handleTriggerPointerUp}
          onPointerCancel={handleTriggerPointerCancel}
          aria-label={`Open ${assistantName}`}
          aria-expanded={open}
          tabIndex={open ? -1 : 0}
          className={`font-jakarta fixed z-[120] transform-gpu inline-flex select-none items-center gap-2 sm:gap-2.5 rounded-2xl bg-sibs-navy p-2 sm:px-4 sm:py-3 font-heading text-sm font-bold tracking-tight text-white shadow-xl border border-white/10 transition-[transform,background-color,box-shadow,opacity] duration-200 hover:bg-sibs-tertiary-2 focus:outline-none focus:ring-4 focus:ring-sibs-orange/20 ${
            triggerPosition ? "" : "right-4 sm:right-6"
          } ${
            triggerDragging
              ? "cursor-grabbing"
              : "cursor-grab hover:-translate-y-0.5 active:scale-[0.98]"
          } ${open ? "pointer-events-none opacity-0" : "opacity-100"}`}
          style={
            triggerPosition
              ? {
                  left: `${triggerPosition.left}px`,
                  top: `${triggerPosition.top}px`,
                  right: "auto",
                  bottom: "auto",
                  touchAction: "none",
                }
              : {
                  bottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))",
                  touchAction: "none",
                }
          }
        >
          <span className="inline-flex h-8 w-8 sm:h-7 sm:w-7 items-center justify-center rounded-xl bg-sibs-orange text-white shadow-xs">
            <Sparkles size={16} />
          </span>
          <span className="hidden xs:inline sm:inline pr-1">{assistantName}</span>
        </button>
      ) : null}

      {/* Drawer Overlay & Panel */}
      <div
        className={`fixed inset-0 z-[2147483600] transition ${
          open ? "pointer-events-auto" : "pointer-events-none"
        }`}
        ref={drawerRef}
        inert={!open}
      >
        {/* Backdrop */}
        <button
          type="button"
          tabIndex={-1}
          aria-label="Close SiBS AI"
          onClick={handleClose}
          className={`absolute inset-0 bg-sibs-navy/40 backdrop-blur-xs transition-opacity duration-300 ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Aside Container (No Top Accent Bar per user preference) */}
        <aside
          aria-label={assistantName}
          className={`font-jakarta absolute inset-y-0 right-0 flex w-full max-w-[430px] flex-col border-l border-sibs-border-subtle bg-white shadow-2xl transition-transform duration-300 ease-out max-sm:max-w-none ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Header */}
          <header className="shrink-0 bg-sibs-navy px-4 py-4 text-white sm:px-5 border-b border-white/10">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sibs-orange text-white shadow-xs">
                  <Bot size={20} strokeWidth={2.4} />
                </span>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate font-heading text-base 2xl:text-lg font-bold tracking-tight text-white">
                      {assistantName}
                    </h2>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2 py-0.5 sibs-text-micro font-extrabold uppercase tracking-wide text-emerald-300 border border-emerald-400/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Read only
                    </span>
                  </div>
                  <p className="mt-0.5 truncate sibs-text-micro font-medium text-white/70">
                    Authorized HRIS insights and summaries
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {(
                  <button
                    type="button"
                    onClick={handleNewChat}
                    title="New chat"
                    aria-label={`Start a new ${assistantName} chat`}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                  >
                    <RefreshCw size={15} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleClose}
                  title="Close"
                  aria-label="Close SiBS AI"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </header>

          {/* Chat Messages Body */}
          <div
            ref={scrollRef}
            className="sibs-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain bg-sibs-surface px-4 py-4 sm:px-5"
          >
            {import.meta.env.DEV && open ? (
              <HrisUatPanel
                key={`${user?.sibsId || user?.sibs_id || user?.username || user?.id || "session"}:${user?.adminAccess || user?.admin_access || ""}:${user?.role || ""}:${uatSession}`}
                submitting={submitting}
                onRunScenario={(scenario) => submitQuestion(scenario.question, scenario)}
              />
            ) : null}
            {messages.length === 0 ? (
              <div className="space-y-4">
                {/* Welcome Card */}
                <section className="rounded-2xl border border-sibs-border bg-white p-4 shadow-xs">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-sibs-orange">
                      <MessageCircleMore size={18} />
                    </span>
                    <div>
                      <h3 className="font-heading text-sm 2xl:text-base font-bold text-sibs-navy tracking-tight">
                        Hi {welcomeName}, what can I help you understand?
                      </h3>
                      <p className="mt-1 sibs-text-xs font-medium leading-5 text-sibs-muted">
                        I can summarize authorized HRIS data using read-only tools based on your current access.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Suggested Prompts */}
                <section>
                  <p className="sibs-kicker mb-2">
                    Try asking
                  </p>
                  <div className="grid gap-2">
                    {SUGGESTED_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => handleSuggestedPrompt(prompt)}
                        aria-label={`Ask SiBS AI: ${prompt}`}
                        disabled={submitting}
                        className="rounded-xl border border-sibs-border-subtle bg-white px-3.5 py-2.5 text-left sibs-text-xs font-bold leading-5 text-sibs-secondary shadow-xs transition hover:border-sibs-orange/40 hover:bg-sibs-cream-light hover:text-sibs-orange active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message) =>
                  message.role === "user" ? (
                    <UserMessage key={message.id} message={message} />
                  ) : (
                    <AssistantMessage
                      key={message.id}
                      message={message}
                      onContinue={handleContinue}
                    />
                  ),
                )}
              </div>
            )}

            {submitting ? (
              <div className="mt-3 flex justify-start">
                <div className="inline-flex items-center gap-2 rounded-2xl rounded-bl-md border border-sibs-border bg-white px-3.5 py-3 sibs-text-xs font-semibold text-sibs-muted shadow-xs">
                  <LoaderCircle size={15} className="animate-spin text-sibs-orange" />
                  SiBS AI is checking authorized HRIS data...
                </div>
              </div>
            ) : null}

            {error ? (
              <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 shrink-0 text-rose-600" size={15} />
                  <div>
                    <p className="sibs-text-xs font-extrabold text-rose-700">
                      SiBS AI could not complete that request
                    </p>
                    <p className="mt-1 sibs-text-micro font-semibold leading-5 text-rose-600">
                      {formatAiDisplayDates(error)}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Footer Input Area */}
          <footer className="shrink-0 border-t border-sibs-border bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5 sm:pb-3">
            <div className="rounded-2xl border border-sibs-orange bg-sibs-surface p-2 transition-colors focus-within:border-sibs-orange focus-within:bg-white">
              <textarea
                ref={inputRef}
                value={question}
                onChange={(event) => setQuestion(event.target.value.slice(0, 2000))}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void submitQuestion();
                  }
                }}
                disabled={submitting}
                rows={2}
                maxLength={2000}
                placeholder="Ask about your authorized HRIS data..."
                className="sibs-ai-composer-textarea max-h-32 min-h-[52px] w-full resize-none border-0 bg-transparent px-2 py-1.5 sibs-text-xs font-medium leading-5 text-sibs-navy outline-none shadow-none ring-0 placeholder:text-sibs-faint disabled:cursor-not-allowed disabled:opacity-60"
              />

              <div className="flex items-center justify-between gap-3 px-1 pb-0.5">
                <span className="sibs-text-micro font-semibold text-sibs-faint">
                  Enter to send · Shift+Enter for new line
                </span>
                <button
                  type="button"
                  onClick={() => void submitQuestion()}
                  disabled={!canSend}
                  className="inline-flex h-8.5 2xl:h-9 min-w-9 items-center justify-center gap-2 rounded-xl bg-sibs-orange px-3.5 sibs-text-xs font-extrabold text-white shadow-xs transition hover:bg-sibs-button-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? (
                    <LoaderCircle size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                  <span className="hidden sm:inline">Send</span>
                </button>
              </div>
            </div>

            <p className="mt-2 text-center sibs-text-micro font-semibold leading-4 text-sibs-faint">
              SiBS AI is advisory and read-only. Verify important employment decisions using official HRIS records.
            </p>
          </footer>
        </aside>
      </div>
    </>
  );

  // Match the Assistant launcher portal: nested Calendar modal stacking contexts
  // must not hide the AI drawer or its backdrop.
  return typeof document !== "undefined"
    ? createPortal(assistantUi, document.body)
    : assistantUi;
}
