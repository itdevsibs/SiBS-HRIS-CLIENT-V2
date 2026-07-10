import React from "react";
import { Send, Sparkles, X } from "lucide-react";
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
              className="flex gap-3 rounded-[12px] border border-[#E6ECF2] bg-white px-3 py-2"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sibs-primary-1 text-[11px] font-extrabold text-white">
                {block.number}
              </span>
              <p className="text-sm font-medium leading-7 text-[#344054]">
                {block.text}
              </p>
            </div>
          );
        }

        if (block.type === "bullet") {
          return (
            <div
              key={`ai-bullet-${index}`}
              className="flex gap-3 rounded-[12px] bg-white px-3 py-2"
            >
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sibs-primary-1" />
              <p className="text-sm font-medium leading-7 text-[#344054]">
                {block.text}
              </p>
            </div>
          );
        }

        return (
          <p
            key={`ai-paragraph-${index}`}
            className="text-sm font-medium leading-7 text-[#344054]"
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
            ? "max-w-[86%] rounded-[18px] rounded-br-[6px] bg-sibs-primary-1 px-4 py-3 text-sm font-bold leading-6 text-white shadow-sm"
            : "max-w-[92%] rounded-[18px] rounded-bl-[6px] border border-[#DDE7F2] bg-white px-4 py-3 text-sm font-medium leading-7 text-[#344054] shadow-sm"
        }
      >
        {children}
      </div>
    </div>
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

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/50 px-3 py-4">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[18px] bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#E6ECF2] px-5 py-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
              <Sparkles size={14} />
              AI Insight
            </div>

            <h2 className="mt-3 text-xl font-extrabold text-sibs-primary-1">
              Workforce Hiring Plan AI Insight
            </h2>

            <p className="mt-1 text-sm font-semibold text-sibs-tertiary-5">
              Analysis generated from the selected week, cluster, and account filters.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#E6ECF2] bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
            aria-label="Minimize AI insight"
            title="Minimize"
          >
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="rounded-[14px] border border-blue-100 bg-blue-50 px-5 py-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-sibs-primary-1 shadow-sm">
                <Sparkles className="animate-pulse" size={24} />
              </div>

              <p className="text-base font-extrabold text-sibs-primary-1">
                Analyzing workforce hiring plan...
              </p>

              <p className="mt-2 text-sm font-semibold text-sibs-tertiary-5">
                Please wait while n8n reads the database and generates the AI insight.
              </p>
            </div>
          ) : error ? (
            <div className="rounded-[14px] border border-red-100 bg-red-50 px-5 py-5">
              <p className="text-sm font-extrabold text-red-700">
                Failed to generate AI insight
              </p>

              <p className="mt-2 text-sm font-semibold text-red-600">
                {error}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <section className="rounded-[14px] border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                <h3 className="text-sm font-extrabold uppercase tracking-wide text-sibs-primary-1">
                  Summary
                </h3>

                <div className="mt-3 rounded-[14px] bg-white px-4 py-3 shadow-[0_1px_0_rgba(15,23,42,0.03)]">
                  {insight ? (
                    <ChatFormattedText value={insight} />
                  ) : (
                    <p className="text-sm font-medium leading-7 text-[#344054]">
                      No AI summary returned.
                    </p>
                  )}
                </div>
              </section>

              {cleanRisks.length > 0 && (
                <section className="rounded-[14px] border border-red-100 bg-red-50 p-4">
                  <h3 className="text-sm font-extrabold uppercase tracking-wide text-red-700">
                    Key Risks
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {cleanRisks.map((item, index) => (
                      <li
                        key={`risk-${index}`}
                        className="rounded-[10px] bg-white px-3 py-2 text-sm font-semibold leading-6 text-red-700"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {cleanHighlights.length > 0 && (
                <section className="rounded-[14px] border border-blue-100 bg-blue-50 p-4">
                  <h3 className="text-sm font-extrabold uppercase tracking-wide text-sibs-primary-1">
                    Highlights
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {cleanHighlights.map((item, index) => (
                      <li
                        key={`highlight-${index}`}
                        className="rounded-[10px] bg-white px-3 py-2 text-sm font-semibold leading-6 text-[#344054]"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {cleanRecommendations.length > 0 && (
                <section className="rounded-[14px] border border-emerald-100 bg-emerald-50 p-4">
                  <h3 className="text-sm font-extrabold uppercase tracking-wide text-emerald-700">
                    Recommended Actions
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {cleanRecommendations.map((item, index) => (
                      <li
                        key={`recommendation-${index}`}
                        className="rounded-[10px] bg-white px-3 py-2 text-sm font-semibold leading-6 text-emerald-700"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {conversation.length > 0 && (
                <section className="rounded-[18px] border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-extrabold uppercase tracking-wide text-sibs-primary-1">
                      Conversation
                    </h3>

                    <span className="rounded-full border border-[#DDE7F2] bg-white px-3 py-1 text-[11px] font-extrabold text-slate-500">
                      {conversation.length} message
                      {conversation.length > 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="mt-4 space-y-4">
                    {conversation.map((item, index) => (
                      <div key={`ai-chat-${index}`} className="space-y-3">
                        {item.question && (
                          <ChatMessageBubble role="user">
                            {item.question}
                          </ChatMessageBubble>
                        )}

                        {item.answer && (
                          <ChatMessageBubble role="assistant">
                            <ChatFormattedText value={item.answer} compact />
                          </ChatMessageBubble>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-[#E6ECF2] bg-[#F8FAFC] px-5 py-4">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              onAskFollowUp();
            }}
            className="flex flex-col gap-3"
          >
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                disabled={loading}
                placeholder="Message AI about this hiring plan..."
                className="min-h-[44px] flex-1 rounded-[12px] border border-[#D9E2EC] bg-white px-4 text-sm font-semibold text-[#344054] outline-none transition placeholder:text-slate-400 focus:border-sibs-primary-1 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
              />

              <button
                type="submit"
                disabled={loading || !String(question || "").trim()}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[12px] bg-sibs-primary-1 px-4 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#0A3A63] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send size={15} />
                Ask
              </button>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-[10px] border border-[#D9E2EC] bg-white px-4 py-2.5 text-sm font-extrabold text-[#344054] transition hover:bg-slate-50"
              >
                Minimize
              </button>

              <button
                type="button"
                onClick={onRegenerate}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-sibs-primary-1 px-4 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#0A3A63] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Sparkles size={16} />
                {loading ? "Analyzing..." : "Regenerate Insight"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
