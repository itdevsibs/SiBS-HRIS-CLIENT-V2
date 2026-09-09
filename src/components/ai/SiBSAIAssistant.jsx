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

function InsightList({ title, items, icon, tone = "default" }) {
  if (!items?.length) return null;

  const Icon = icon;

  const toneClass = {
    default: "border-[#DCE6F0] bg-[#F8FAFC] text-[#344054]",
    risk: "border-amber-200 bg-amber-50 text-amber-900",
    recommendation: "border-blue-200 bg-blue-50 text-[#19496F]",
  }[tone];

  return (
    <section className={`rounded-xl border px-3 py-3 ${toneClass}`}>
      <div className="mb-2 flex items-center gap-2 sibs-text-micro font-extrabold uppercase tracking-[0.08em]">
        <Icon size={14} />
        {title}
      </div>

      <ul className="space-y-1.5">
        {items.map((item, index) => (
          <li
            key={`${title}-${index}`}
            className="flex gap-2 sibs-text-xs font-semibold leading-5"
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
      <div className="max-w-[92%] space-y-3 rounded-2xl rounded-bl-md border border-[#E1E8F0] bg-white px-3.5 py-3 shadow-sm">
        <div className="flex items-center gap-2 sibs-text-micro font-extrabold uppercase tracking-[0.08em] text-[#667085]">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-[#042C51] text-white">
            <Bot size={13} />
          </span>
          SiBS AI
        </div>

        <p className="whitespace-pre-wrap sibs-text-xs font-medium leading-6 text-[#24364B]">
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
          <p className="border-t border-[#EEF2F6] pt-2 sibs-text-micro font-semibold text-[#98A2B3]">
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
      <div className="max-w-[86%] rounded-2xl rounded-br-md bg-[#FF5C28] px-3.5 py-2.5 sibs-text-xs font-semibold leading-5 text-white shadow-sm">
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

  const triggerRef = useRef(null);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);

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

  if (!visible) return null;

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
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open Ask SiBS AI"
        aria-expanded={open}
        className={`font-jakarta fixed bottom-5 right-5 z-[120] inline-flex items-center gap-2 rounded-2xl bg-[#042C51] px-4 py-3 sibs-text-xs font-extrabold text-white shadow-[0_14px_35px_rgba(4,44,81,0.28)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#0A3B67] focus:outline-none focus:ring-4 focus:ring-[#FF5C28]/20 sm:bottom-6 sm:right-6 ${
          open ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-[#FF5C28]">
          <Sparkles size={15} />
        </span>
        Ask SiBS AI
      </button>

      <div
        className={`fixed inset-0 z-[130] transition ${
          open ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!open}
      >
        <button
          type="button"
          tabIndex={open ? 0 : -1}
          aria-label="Close SiBS AI"
          onClick={handleClose}
          className={`absolute inset-0 bg-[#042C51]/20 backdrop-blur-[1px] transition-opacity duration-300 ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />

        <aside
          aria-label="Ask SiBS AI"
          className={`font-jakarta absolute inset-y-0 right-0 flex w-full max-w-[430px] flex-col border-l border-[#D7E0EA] bg-white shadow-[-18px_0_45px_rgba(4,44,81,0.2)] transition-transform duration-300 ease-out max-sm:max-w-none ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <header className="shrink-0 bg-[#042C51] px-4 py-4 text-white sm:px-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FF5C28] text-white shadow-sm">
                  <Bot size={20} strokeWidth={2.4} />
                </span>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate sibs-text-base font-extrabold">Ask SiBS AI</h2>
                    <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 sibs-text-micro font-extrabold uppercase tracking-wide text-emerald-200">
                      Read only
                    </span>
                  </div>
                  <p className="mt-0.5 truncate sibs-text-micro font-semibold text-white/65">
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
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <RefreshCw size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  title="Close"
                  aria-label="Close SiBS AI"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                  <X size={17} />
                </button>
              </div>
            </div>
          </header>

          <div
            ref={scrollRef}
            className="sibs-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#F7F9FC] px-4 py-4 sm:px-5"
          >
            {messages.length === 0 ? (
              <div className="space-y-4">
                <section className="rounded-2xl border border-[#DDE6EF] bg-white p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF0EA] text-[#FF5C28]">
                      <MessageCircleMore size={18} />
                    </span>
                    <div>
                      <h3 className="sibs-text-xs font-extrabold text-[#042C51]">
                        Hi {welcomeName}, what can I help you understand?
                      </h3>
                      <p className="mt-1 sibs-text-xs font-medium leading-5 text-[#667085]">
                        I can summarize authorized HRIS data using read-only tools based on your current access.
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <p className="mb-2 sibs-text-micro font-extrabold uppercase tracking-[0.1em] text-[#98A2B3]">
                    Try asking
                  </p>
                  <div className="grid gap-2">
                    {SUGGESTED_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => submitQuestion(prompt)}
                        disabled={submitting}
                        className="rounded-xl border border-[#E1E8F0] bg-white px-3.5 py-3 text-left sibs-text-xs font-bold leading-5 text-[#344054] shadow-sm transition hover:border-[#FFB49B] hover:bg-[#FFF8F5] hover:text-[#042C51] disabled:cursor-not-allowed disabled:opacity-60"
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
                <div className="inline-flex items-center gap-2 rounded-2xl rounded-bl-md border border-[#E1E8F0] bg-white px-3.5 py-3 sibs-text-xs font-semibold text-[#667085] shadow-sm">
                  <LoaderCircle size={15} className="animate-spin text-[#FF5C28]" />
                  SiBS AI is checking authorized HRIS data...
                </div>
              </div>
            ) : null}

            {error ? (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 shrink-0 text-red-600" size={15} />
                  <div>
                    <p className="sibs-text-xs font-extrabold text-red-700">
                      SiBS AI could not complete that request
                    </p>
                    <p className="mt-1 sibs-text-micro font-semibold leading-5 text-red-600">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <footer className="shrink-0 border-t border-[#E6ECF2] bg-white px-4 py-3 sm:px-5">
            <div className="rounded-2xl border border-[#D7E0EA] bg-[#F8FAFC] p-2 transition focus-within:border-[#7A9AB8] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#042C51]/5">
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
                className="max-h-32 min-h-[52px] w-full resize-none bg-transparent px-2 py-1.5 sibs-text-xs font-medium leading-5 text-[#1D2939] outline-none placeholder:text-[#98A2B3] disabled:cursor-not-allowed disabled:opacity-60"
              />

              <div className="flex items-center justify-between gap-3 px-1 pb-0.5">
                <span className="sibs-text-micro font-semibold text-[#98A2B3]">
                  Enter to send · Shift+Enter for new line
                </span>
                <button
                  type="button"
                  onClick={() => void submitQuestion()}
                  disabled={!canSend}
                  className="inline-flex h-9 min-w-9 items-center justify-center gap-2 rounded-xl bg-[#FF5C28] px-3 sibs-text-micro font-extrabold text-white transition hover:bg-[#E94E1B] disabled:cursor-not-allowed disabled:bg-[#D0D5DD]"
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

            <p className="mt-2 text-center sibs-text-micro font-semibold leading-4 text-[#98A2B3]">
              SiBS AI is advisory and read-only. Verify important employment decisions using official HRIS records.
            </p>
          </footer>
        </aside>
      </div>
    </>
  );
}
