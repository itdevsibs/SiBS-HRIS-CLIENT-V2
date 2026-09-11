import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  LoaderCircle,
  MessageCircleMore,
  RefreshCw,
  Send,
  Sparkles,
  X,
} from "lucide-react";

import { askSibsAi } from "@/lib/axios/ai";
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
  "What is my schedule this week?",
];

const DRAG_THRESHOLD = 6;
const VIEWPORT_PADDING = 8;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function InsightList({ title, items, icon, tone = "default" }) {
  if (!items?.length) return null;

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

      <ul className="space-y-1.5">
        {items.map((item, index) => (
          <li
            key={`${title}-${index}`}
            className="flex gap-2 sibs-text-xs font-semibold leading-5 text-sibs-secondary"
          >
            <span className="mt-[8px] h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-70" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function AssistantMessage({ message }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[92%] space-y-3 rounded-2xl rounded-bl-md border border-sibs-border bg-white px-3.5 py-3 shadow-xs">
        <div className="flex items-center gap-2 sibs-kicker text-sibs-muted">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-sibs-navy text-white">
            <Bot size={13} />
          </span>
          SiBS AI
        </div>

        <p className="whitespace-pre-wrap sibs-text-xs font-medium leading-6 text-sibs-navy">
          {message.content}
        </p>

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

        {message.toolsUsed?.length ? (
          <p className="border-t border-sibs-border pt-2 sibs-text-micro font-semibold text-sibs-faint">
            Live HRIS data used: {message.toolsUsed.join(", ")}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function UserMessage({ message }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[86%] rounded-2xl rounded-br-md bg-sibs-orange px-3.5 py-2.5 sibs-text-xs font-semibold leading-5 text-white shadow-xs">
        {message.content}
      </div>
    </div>
  );
}

export default function SiBSAIAssistant({ enabled = true }) {
  const { user, loading: userLoading } = useUser() || {};
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [triggerPosition, setTriggerPosition] = useState(null);
  const [triggerDragging, setTriggerDragging] = useState(false);

  const triggerRef = useRef(null);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);
  const dragStateRef = useRef(null);
  const suppressTriggerClickRef = useRef(false);

  const visible = enabled && !userLoading && Boolean(user);
  const canSend = Boolean(question.trim()) && !submitting;

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
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        window.requestAnimationFrame(() => triggerRef.current?.focus?.());
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.requestAnimationFrame(() => inputRef.current?.focus?.());

    return () => window.removeEventListener("keydown", handleKeyDown);
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
    window.requestAnimationFrame(() => triggerRef.current?.focus?.());
  }

  function handleNewChat() {
    if (submitting) return;

    setMessages([]);
    setConversationId("");
    setQuestion("");
    setError("");
    window.requestAnimationFrame(() => inputRef.current?.focus?.());
  }

  async function submitQuestion(value = question) {
    const cleanQuestion = String(value || "").trim();
    if (!cleanQuestion || submitting) return;

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

    try {
      const response = await askSibsAi({
        message: cleanQuestion,
        conversation,
        conversationId,
        context: {
          source: "global_assistant",
        },
      });

      if (!response?.success) {
        throw new Error(response?.message || "SiBS AI could not complete the request.");
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
      setError(getAiErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* Floating Launcher Button with safe-area support */}
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
        className={`font-jakarta fixed right-4 sm:right-6 z-[120] transform-gpu inline-flex items-center gap-2 sm:gap-2.5 rounded-2xl bg-sibs-navy p-2 sm:px-4 sm:py-3 font-heading text-sm font-bold tracking-tight text-white shadow-xl border border-white/10 transition-[transform,background-color,box-shadow,opacity] duration-200 hover:-translate-y-0.5 hover:bg-sibs-tertiary-2 focus:outline-none focus:ring-4 focus:ring-sibs-orange/20 active:scale-[0.98] ${
          open ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
        style={{
          bottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <span className="inline-flex h-8 w-8 sm:h-7 sm:w-7 items-center justify-center rounded-xl bg-sibs-orange text-white shadow-xs">
          <Sparkles size={16} />
        </span>
        <span className="hidden xs:inline sm:inline pr-1">Ask SiBS AI</span>
      </button>

      {/* Drawer Overlay & Panel */}
      <div
        className={`fixed inset-0 z-[130] transition ${
          open ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!open}
      >
        {/* Backdrop */}
        <button
          type="button"
          tabIndex={open ? 0 : -1}
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
                  onClick={handleNewChat}
                  disabled={submitting}
                  title="New chat"
                  aria-label="Start a new SiBS AI chat"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <RefreshCw size={15} />
                </button>
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
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF0EB] text-sibs-orange">
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
                        onClick={() => submitQuestion(prompt)}
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
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Footer Input Area */}
          <footer className="shrink-0 border-t border-sibs-border bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5 sm:pb-3">
            <div className="rounded-2xl border border-sibs-border-subtle bg-sibs-surface p-2 transition focus-within:border-sibs-orange focus-within:bg-white focus-within:ring-4 focus-within:ring-sibs-orange/10">
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
                className="max-h-32 min-h-[52px] w-full resize-none bg-transparent px-2 py-1.5 sibs-text-xs font-medium leading-5 text-sibs-navy outline-none placeholder:text-sibs-faint disabled:cursor-not-allowed disabled:opacity-60"
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
}
