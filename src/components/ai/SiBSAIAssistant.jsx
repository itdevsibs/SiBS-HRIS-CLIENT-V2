import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  LoaderCircle,
  MessageCircleMore,
  Send,
  Sparkles,
  X,
} from "lucide-react";

import { AI_CHAT_TIMEOUT_MS, askSibsAi } from "@/lib/axios/ai";
import AiResultCardsClient from "@/components/ai/AiResultCardsClient";
import { formatAiDisplayDates } from "@/lib/utils/ai/aiDateDisplayClient";
import {
  readAiConversationClient,
  writeAiConversationClient,
} from "@/lib/utils/ai/aiConversationStorageClient";
import { toPublicAiAnswerClient } from "@/lib/utils/ai/aiPublicAnswerClient";
import {
  buildConversationPayload,
  getAiErrorMessage,
  normalizeAiAnswerPayload,
} from "@/lib/utils/ai/aiAssistantHelpers";
import { useUser } from "@/services/context/UserContext";

const SUGGESTED_PROMPTS = [
  "What is my profile?",
  "How was my attendance this month?",
  "What is my leave balance?",
  "Summarize the recent applicant leads.",
];

const VIEWPORT_PADDING = 16;
const DRAG_THRESHOLD = 6;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function InsightList({ title, items, icon, tone = "default" }) {
  const visibleItems = (items || []).map(toPublicAiAnswerClient).filter(Boolean);
  if (!visibleItems.length) return null;

  const Icon = icon;

  const toneClass = {
    default: "border-sibs-border bg-sibs-surface text-sibs-secondary",
    risk: "border-amber-200 bg-amber-50 text-amber-900",
    recommendation: "border-blue-200 bg-blue-50 text-sibs-navy",
  }[tone];

  return (
    <section className={`rounded-xl border px-3 py-3 ${toneClass}`}>
      <div className="mb-2 flex items-center gap-2 sibs-kicker">
        <Icon size={14} />
        {title}
      </div>

      <ul className="grid gap-2">
        {visibleItems.map((item, index) => (
          <li
            key={`${title}-${index}`}
            className="flex items-start gap-2.5 rounded-xl border border-current/15 bg-white/75 px-3 py-2.5 sibs-text-xs font-semibold leading-5 text-sibs-secondary"
          >
            <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-current/20 bg-white/70 text-current"><CheckCircle2 size={12} aria-hidden="true" /></span>
            <span>{formatAiDisplayDates(item)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}


function AssistantMessage({ message }) {
  return (
    <div className="flex justify-start">
      <div className="min-w-0 w-full max-w-[96%] space-y-2.5 rounded-2xl rounded-bl-md border border-sibs-border bg-white px-3.5 py-3 shadow-xs">
        <div className="flex items-center gap-2 sibs-kicker text-sibs-muted">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-sibs-navy text-white">
            <Bot size={13} />
          </span>
          SiBS AI
        </div>

        <AiResultCardsClient content={message.content} />

        <InsightList
          title="Highlights"
          items={message.highlights}
          icon={CheckCircle2}
        />
        <InsightList
          title="Risks"
          items={message.risks}
          icon={AlertTriangle}
          tone="risk"
        />
        <InsightList
          title="Recommendations"
          items={message.recommendations}
          icon={Sparkles}
          tone="recommendation"
        />

      </div>
    </div>
  );
}

function UserMessage({ message }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[86%] rounded-2xl rounded-br-md bg-sibs-orange px-3.5 py-2.5 sibs-text-xs font-semibold leading-5 text-white shadow-xs">
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
  // Restore on mount (including a page refresh) before the first chat render.
  const initialConversationRef = useRef(null);
  if (initialConversationRef.current === null) {
    initialConversationRef.current = readAiConversationClient(loggedInEmployeeKey);
  }
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState(initialConversationRef.current.messages);
  const [conversationId, setConversationId] = useState(initialConversationRef.current.conversationId);
  const [hydratedEmployeeKey, setHydratedEmployeeKey] = useState(loggedInEmployeeKey);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
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

  // Hide the previous account's messages until the next account is hydrated.
  const visible = enabled && !userLoading && Boolean(user) && Boolean(loggedInEmployeeKey) &&
    hydratedEmployeeKey === loggedInEmployeeKey;
  const canSend = Boolean(question.trim()) && !submitting;
  const activeEmployeeKeyRef = useRef(loggedInEmployeeKey);
  activeEmployeeKeyRef.current = loggedInEmployeeKey;

  useEffect(() => {
    if (hydratedEmployeeKey === loggedInEmployeeKey) return;
    const saved = readAiConversationClient(loggedInEmployeeKey);
    setMessages(saved.messages);
    setConversationId(saved.conversationId);
    setQuestion("");
    setError("");
    setHydratedEmployeeKey(loggedInEmployeeKey);
  }, [hydratedEmployeeKey, loggedInEmployeeKey]);

  useEffect(() => {
    // Never overwrite the incoming account's history with the previous user's
    // messages during React's account-switch render.
    if (!loggedInEmployeeKey || hydratedEmployeeKey !== loggedInEmployeeKey) return;
    writeAiConversationClient(loggedInEmployeeKey, { messages, conversationId });
  }, [loggedInEmployeeKey, hydratedEmployeeKey, messages, conversationId]);

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
      if (event.key === "Escape") {
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

  async function submitQuestion(value = question) {
    const cleanQuestion = String(value || "").trim();
    if (!cleanQuestion || submitting || requestInFlightRef.current || !loggedInEmployeeKey ||
        hydratedEmployeeKey !== loggedInEmployeeKey) return;
    requestInFlightRef.current = true;

    const requestEmployeeKey = loggedInEmployeeKey;
    const conversation = buildConversationPayload(messages);
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
    let deadlineExpired = false;
    const deadlineTimer = window.setTimeout(() => {
      deadlineExpired = true;
      controller.abort();
    }, AI_CHAT_TIMEOUT_MS);
    try {
      const response = await askSibsAi({
        message: cleanQuestion,
        conversation,
        conversationId,
        signal: controller.signal,
        expectedSibsId: requestEmployeeKey,
        expectedEmployeeId: user?.gy_emp_id || user?.gyEmpId || "",
        context: {
          source: "global_assistant",
        },
      });

      if (!response?.success) {
        throw new Error(response?.message || "SiBS AI could not complete the request.");
      }

      if (activeEmployeeKeyRef.current !== requestEmployeeKey) return;
      // Do not render or persist any response that was not bound to the
      // account visible in this tab. Cookies may be replaced in another tab.
      if (String(response.authenticatedSibsId ?? "").trim().toLowerCase() !== requestEmployeeKey.toLowerCase()) {
        throw new Error("SiBS AI could not verify your signed-in account. Please sign out and sign in again.");
      }
      const normalized = normalizeAiAnswerPayload(response);
      setConversationId(normalized.conversationId || conversationId);
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: normalized.answer || "No answer was returned.",
          highlights: normalized.highlights,
          risks: normalized.risks,
          recommendations: normalized.recommendations,
          toolsUsed: normalized.toolsUsed,
        },
      ]);
    } catch (requestError) {
      if (activeEmployeeKeyRef.current === requestEmployeeKey) {
        const isTimeout = deadlineExpired || requestError?.code === "ECONNABORTED" ||
          requestError?.response?.data?.code === "AI_REQUEST_TIMEOUT";
        setError(isTimeout
          ? "This request exceeded the 60-second limit and was stopped. Please try again or ask a more specific question."
          : getAiErrorMessage(requestError));
      }
    } finally {
      window.clearTimeout(deadlineTimer);
      requestInFlightRef.current = false;
      setSubmitting(false);
    }
  }

  // Suggested questions use exactly the same authenticated request path as
  // manually typed questions. Clicking a card submits it immediately.
  function handleSuggestedPrompt(prompt) {
    if (requestInFlightRef.current || submitting) return;
    void submitQuestion(prompt);
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
          aria-label="Open Ask SiBS AI"
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
          <span className="hidden xs:inline sm:inline pr-1">Ask SiBS AI</span>
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
          aria-label="Ask SiBS AI"
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
                      Ask SiBS AI
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
                    <AssistantMessage key={message.id} message={message} />
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
                onChange={(event) => setQuestion(event.target.value.slice(0, 4000))}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void submitQuestion();
                  }
                }}
                disabled={submitting}
                rows={2}
                maxLength={4000}
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
