import React from "react";
import {
  AlertTriangle,
  Bot,
  RefreshCw,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import {
  normalizeAiList,
  parseAiDisplayBlocks,
} from "../../../lib/utils/workforceHiringPlan/workforceHiringPlanAiHelpers";

function ChatFormattedText({ value, compact = false }) {
  const blocks = parseAiDisplayBlocks(value);

  if (!blocks.length) return null;

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {blocks.map((block, index) => {
        if (block.type === "numbered") {
          return (
            <div
              key={`ai-numbered-${index}`}
              className="flex gap-3 rounded-xl border border-[#E6ECF2] bg-white px-3 py-2.5"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#042C51] text-[11px] font-extrabold text-white">
                {block.number}
              </span>
              <p className="text-xs font-medium leading-6 text-[#344054]">
                {block.text}
              </p>
            </div>
          );
        }

        if (block.type === "bullet") {
          return (
            <div
              key={`ai-bullet-${index}`}
              className="flex gap-3 rounded-xl bg-white px-3 py-2"
            >
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#042C51]" />
              <p className="text-xs font-medium leading-6 text-[#344054]">
                {block.text}
              </p>
            </div>
          );
        }

        return (
          <p
            key={`ai-paragraph-${index}`}
            className="text-xs font-medium leading-6 text-[#344054]"
          >
            {block.text}
          </p>
        );
      })}
    </div>
  );
}

function ChatMessageBubble({ role = "assistant", children }) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={
          isUser
            ? "max-w-[85%] rounded-2xl rounded-br-none bg-[#FF5C28] px-3.5 py-3 text-xs font-semibold leading-6 text-white shadow-sm"
            : "max-w-[88%] rounded-2xl rounded-bl-none border border-slate-200 bg-slate-100 px-3.5 py-3 text-xs font-medium leading-6 text-slate-800 shadow-sm"
        }
      >
        {children}
      </div>
    </div>
  );
}

function EmptyStateText({ children }) {
  return (
    <p className="text-[11px] font-semibold leading-5 text-slate-500">
      {children}
    </p>
  );
}

export default function AIInsightModal({
  open,
  loading,
  insight,
  highlights = [],
  recommendations = [],
  risks = [],
  error = "",
  question,
  setQuestion,
  conversation = [],
  onClose,
  onRegenerate,
  onAskFollowUp,
}) {
  if (!open) return null;

  const cleanHighlights = normalizeAiList(highlights);
  const cleanRecommendations = normalizeAiList(recommendations);
  const cleanRisks = normalizeAiList(risks);

  const primaryRisk =
    cleanRisks[0] ||
    "No active capacity deficit risk was detected for the selected filters.";

  return (
    <div
      data-layout="ai-workforce-intelligence-advisor-v2"
      className="sibs-modal-blur sibs-modal-backdrop-in fixed inset-0 z-[9999] flex items-center justify-center p-2.5 font-jakarta sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <section className="sibs-modal-pop-in flex max-h-[88vh] 2xl:max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <header className="shrink-0 border-b border-[#19496F] bg-[#042C51] px-5 py-3 2xl:py-3.5 text-white">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5 2xl:gap-3">
              <div className="flex h-8 w-8 2xl:h-8.5 2xl:w-8.5 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-[#FF5C28] to-amber-500 text-white shadow-sm">
                <Bot size={16} />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 2xl:gap-2">
                  <h2 className="text-xs sm:text-sm 2xl:text-base font-extrabold text-white">
                    AI Workforce Intelligence Advisor
                  </h2>

                  <span className="rounded bg-amber-400 px-1.5 py-0.5 text-[8px] 2xl:text-[9px] font-extrabold uppercase text-[#042C51]">
                    Live Telemetry
                  </span>
                </div>

                <p className="mt-0.5 text-[9.5px] sm:text-[11px] font-semibold text-white/75">
                  Automated capacity deficit modeling and batch scheduling recommendations.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close AI advisor"
              title="Close"
              className="inline-flex h-8 w-8 2xl:h-8.5 2xl:w-8.5 shrink-0 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3.5 2xl:px-5 2xl:py-4 sibs-scrollbar">
          {loading ? (
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-6 2xl:py-8 text-center">
              <div className="mx-auto mb-3 flex h-9 w-9 2xl:h-10 2xl:w-10 items-center justify-center rounded-full bg-white text-[#042C51] shadow-sm">
                <Sparkles className="animate-pulse" size={18} />
              </div>

              <p className="sibs-text-xs 2xl:sibs-text-sm font-extrabold text-[#042C51]">
                Analyzing workforce hiring plan...
              </p>

              <p className="mt-1 text-[11px] 2xl:text-xs font-semibold text-[#667085]">
                Please wait while n8n reads the database and generates the AI insight.
              </p>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 2xl:p-4">
              <p className="sibs-text-xs 2xl:sibs-text-sm font-extrabold text-red-700">
                Failed to generate AI insight
              </p>
              <p className="mt-1 text-[11px] 2xl:text-xs font-semibold leading-relaxed text-red-600">
                {error}
              </p>
            </div>
          ) : (
            <div className="space-y-3 2xl:space-y-3.5 text-xs">
              <section className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-2.5 2xl:p-3">
                <AlertTriangle
                  size={16}
                  className="mt-0.5 shrink-0 text-amber-600"
                />

                <div className="min-w-0 space-y-0.5">
                  <strong className="block text-xs font-extrabold text-amber-900">
                    Capacity Deficit Risk Alert
                  </strong>
                  <p className="text-[11px] 2xl:text-xs font-medium leading-relaxed text-amber-800">
                    {primaryRisk}
                  </p>

                  {cleanRisks.length > 1 ? (
                    <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-[11px] 2xl:text-xs font-medium leading-relaxed text-amber-800">
                      {cleanRisks.slice(1).map((item, index) => (
                        <li key={`risk-${index}`}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </section>

              <section className="rounded-xl border border-blue-200 bg-blue-50 p-2.5 2xl:p-3">
                <strong className="flex items-center gap-1.5 text-xs font-extrabold text-[#042C51]">
                  <Sparkles size={14} className="text-amber-500" />
                  Recommended Mitigation Actions
                </strong>

                {cleanRecommendations.length > 0 ? (
                  <ul className="mt-1.5 list-disc space-y-1 pl-4 text-[11px] 2xl:text-xs font-medium leading-relaxed text-slate-700">
                    {cleanRecommendations.map((item, index) => (
                      <li key={`recommendation-${index}`}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="mt-1.5">
                    <EmptyStateText>
                      No mitigation recommendation was returned for the selected filters.
                    </EmptyStateText>
                  </div>
                )}
              </section>

              <section className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-2.5 2xl:p-3">
                <h3 className="text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
                  AI Executive Summary
                </h3>

                <div className="mt-1.5 rounded-lg 2xl:rounded-xl bg-white px-3 py-2.5">
                  {insight ? (
                    <ChatFormattedText value={insight} />
                  ) : (
                    <EmptyStateText>No AI summary returned.</EmptyStateText>
                  )}
                </div>
              </section>

              {cleanHighlights.length > 0 ? (
                <section className="rounded-xl border border-indigo-100 bg-indigo-50 p-2.5 2xl:p-3">
                  <h3 className="text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
                    Operational Highlights
                  </h3>

                  <ul className="mt-1.5 space-y-1.5">
                    {cleanHighlights.map((item, index) => (
                      <li
                        key={`highlight-${index}`}
                        className="rounded-lg bg-white px-2.5 py-1.5 text-[10px] 2xl:text-[11px] font-semibold leading-relaxed text-[#344054]"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {conversation.length > 0 ? (
                <section className="space-y-2.5 border-t border-[#E6ECF2] pt-3">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
                      Advisor Conversation
                    </h3>

                    <span className="rounded-full border border-[#DDE7F2] bg-white px-2 py-0.5 text-[8.5px] 2xl:text-[9px] font-extrabold text-slate-500">
                      {conversation.length} message
                      {conversation.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {conversation.map((item, index) => (
                      <div key={`ai-chat-${index}`} className="space-y-2">
                        {item.question ? (
                          <ChatMessageBubble role="user">
                            {item.question}
                          </ChatMessageBubble>
                        ) : null}

                        {item.answer ? (
                          <ChatMessageBubble role="assistant">
                            <ChatFormattedText value={item.answer} compact />
                          </ChatMessageBubble>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          )}
        </div>

        <footer className="shrink-0 border-t border-slate-200 bg-slate-50 p-3 2xl:p-3.5">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              onAskFollowUp();
            }}
            className="space-y-2.5"
          >
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                disabled={loading}
                placeholder="Ask AI Advisor a follow-up question..."
                className="h-8.5 2xl:h-10 min-w-0 flex-1 rounded-xl border border-[#D7DEE8] bg-white px-3 2xl:px-3.5 sibs-text-xs font-semibold text-[#042C51] outline-none transition placeholder:text-[#98A2B3] focus:border-[#FF5C28] focus:ring-4 focus:ring-[#FF5C28]/10 disabled:cursor-not-allowed disabled:opacity-60"
              />

              <button
                type="submit"
                disabled={loading || !String(question || "").trim()}
                className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-1.5 rounded-lg bg-[#FF5C28] px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-white shadow-sm transition hover:bg-[#E94F1F] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send size={13} />
                Ask
              </button>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-8.5 2xl:h-10 items-center justify-center rounded-lg border border-[#D6DEE8] bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-[#042C51] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF8F5] hover:text-[#FF5C28]"
              >
                Minimize
              </button>

              <button
                type="button"
                onClick={onRegenerate}
                disabled={loading}
                className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-1.5 rounded-lg border border-[#D6DEE8] bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-[#042C51] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF8F5] hover:text-[#FF5C28] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  size={13}
                  className={loading ? "animate-spin" : ""}
                />
                {loading ? "Analyzing..." : "Regenerate Insight"}
              </button>
            </div>
          </form>
        </footer>
      </section>
    </div>
  );
}