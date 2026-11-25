import React, { memo, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Maximize2, ShieldCheck } from "lucide-react";
import HermesReportView from "./HermesReportView";
import HermesExpandedViewer from "./HermesExpandedViewer";

/**
 * Preprocess raw Hermes reply:
 * 1. Strips <think>...</think> internal reasoning tokens (e.g. from local Qwen 3.5 via Ollama).
 * 2. Normalizes pseudo-headings like "**Heading:**" or "Heading:" on a standalone line to Markdown headings.
 */
function preprocessMarkdown(content) {
  if (typeof content !== "string") return "";

  // Strip closed <think>...</think> reasoning blocks
  let text = content.replace(/<think>[\s\S]*?<\/think>/gi, "");
  // Strip unclosed <think>... blocks if generation truncated during thinking
  text = text.replace(/<think>[\s\S]*$/gi, "");
  text = text.replace(/^[\s\S]*?<\/think>/gi, "").trim();

  // Normalize line breaks
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const processed = [];

  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i];
    const trimmed = raw.trim();

    // Check for bold title line like "**Employment:**" or "Your profile:"
    const boldHeading = trimmed.match(/^\*\*([^*]+):\*\*$/);
    const colonHeading = trimmed.match(/^([A-Za-z0-9][A-Za-z0-9\s]{1,45}):$/);

    if (boldHeading) {
      processed.push(`### ${boldHeading[1].trim()}`);
    } else if (colonHeading && !trimmed.startsWith("-") && !trimmed.startsWith("*") && !trimmed.startsWith("#")) {
      processed.push(`### ${colonHeading[1].trim()}`);
    } else {
      processed.push(raw);
    }
  }

  return processed.join("\n");
}

/**
 * Custom table wrapper with horizontal scroll and expandable viewer modal
 */
function MarkdownTableWrapper({ children }) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="relative my-3 group">
      <div className="overflow-x-auto rounded-xl border border-sibs-border bg-white shadow-xs max-w-full">
        <table className="w-full border-collapse text-left text-xs">
          {children}
        </table>
      </div>

      <div className="mt-1 flex justify-end">
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1 rounded-md border border-sibs-border-subtle bg-sibs-surface px-2 py-0.5 text-[10px] font-bold text-sibs-secondary hover:bg-sibs-cream-light hover:text-sibs-orange transition"
        >
          <Maximize2 size={11} />
          <span>Expand Table</span>
        </button>
      </div>

      {modalOpen ? (
        <HermesExpandedViewer
          open={modalOpen}
          title="Data Table View"
          onClose={() => setModalOpen(false)}
        >
          <div className="overflow-x-auto rounded-xl border border-sibs-border bg-white p-2">
            <table className="w-full border-collapse text-left text-sm">
              {children}
            </table>
          </div>
        </HermesExpandedViewer>
      ) : null}
    </div>
  );
}

/**
 * HermesResponseRenderer
 *
 * Enterprise Markdown and business report renderer for Ask SiBS AI (Hermes).
 * Memoized to prevent expensive re-rendering across conversation turns.
 */
function HermesResponseRendererComponent({
  content,
  report = null,
  verifiedData = null,
  status = "completed",
  finishReason = "stop",
  onContinue = null,
}) {
  const cleanMarkdown = useMemo(() => preprocessMarkdown(content), [content]);

  // Markdown component mappings
  const components = useMemo(() => ({
    h1: ({ children }) => (
      <h1 className="border-b border-sibs-border pb-2 pt-2.5 font-heading text-base font-extrabold text-sibs-navy mb-2">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="border-b border-sibs-border-subtle pb-1.5 pt-2 font-heading text-sm font-bold text-sibs-navy mb-2">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="border-b border-sibs-border-subtle pb-1 pt-1.5 font-heading text-xs font-bold text-sibs-navy mb-1.5">
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="pt-1 font-heading text-xs font-bold text-sibs-navy mb-1">
        {children}
      </h4>
    ),
    h5: ({ children }) => (
      <h5 className="font-heading text-xs font-semibold text-sibs-navy mb-1">
        {children}
      </h5>
    ),
    h6: ({ children }) => (
      <h6 className="font-heading text-xs font-semibold text-sibs-muted mb-1">
        {children}
      </h6>
    ),
    p: ({ children }) => (
      <p className="sibs-text-xs font-medium leading-5 text-sibs-navy mb-2 last:mb-0">
        {children}
      </p>
    ),
    strong: ({ children }) => (
      <strong className="font-bold text-sibs-navy">{children}</strong>
    ),
    em: ({ children }) => (
      <em className="italic">{children}</em>
    ),
    ul: ({ children }) => (
      <ul className="space-y-1 my-2 pl-0 list-none">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="space-y-1 my-2 pl-4 list-decimal marker:font-bold marker:text-sibs-muted sibs-text-xs font-medium">
        {children}
      </ol>
    ),
    li: ({ children, node }) => {
      // If list item is inside an ordered list, let standard decimal handle it
      return (
        <li className="flex items-start gap-2 sibs-text-xs font-medium text-sibs-navy">
          <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sibs-orange" />
          <span className="min-w-0 flex-1">{children}</span>
        </li>
      );
    },
    blockquote: ({ children }) => (
      <blockquote className="my-2 rounded-r-lg border-l-3 border-sibs-orange bg-sibs-surface/70 px-3 py-2 text-xs italic text-sibs-muted">
        {children}
      </blockquote>
    ),
    hr: () => <hr className="my-3 border-t border-sibs-border-subtle" />,
    table: ({ children }) => <MarkdownTableWrapper>{children}</MarkdownTableWrapper>,
    thead: ({ children }) => (
      <thead className="border-b border-sibs-border bg-sibs-surface/80">
        {children}
      </thead>
    ),
    tbody: ({ children }) => (
      <tbody className="divide-y divide-sibs-border-subtle">
        {children}
      </tbody>
    ),
    tr: ({ children }) => (
      <tr className="hover:bg-sibs-cream-light/40 transition-colors">
        {children}
      </tr>
    ),
    th: ({ children }) => {
      const text = typeof children === "string" ? children : "";
      const isNumeric = /count|number|total|headcount|rate|percent|%|hours|days/i.test(text);
      return (
        <th
          className={`px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-sibs-muted ${
            isNumeric ? "text-right" : "text-left"
          }`}
        >
          {children}
        </th>
      );
    },
    td: ({ children }) => {
      const text = typeof children === "string" ? children : "";
      const isNumeric = /^\s*[\d,.-]+%?\s*$/.test(text);
      return (
        <td
          className={`px-3 py-2 text-xs text-sibs-navy ${
            isNumeric ? "text-right font-mono tabular-nums font-semibold" : "font-medium"
          }`}
        >
          {children}
        </td>
      );
    },
    pre: ({ children }) => (
      <pre className="my-2.5 overflow-x-auto rounded-xl bg-sibs-navy p-3 text-[11px] font-mono leading-relaxed text-white shadow-xs">
        {children}
      </pre>
    ),
    code: ({ inline, children, ...props }) => {
      if (inline) {
        return (
          <code className="rounded bg-sibs-surface px-1.5 py-0.5 font-mono text-[11px] font-semibold text-sibs-navy border border-sibs-border-subtle">
            {children}
          </code>
        );
      }
      return <code {...props}>{children}</code>;
    },
    a: ({ href, children }) => {
      // Strict URL protocol validation to prevent javascript: or data: XSS
      const isSafe = /^https?:\/\/|^mailto:/i.test(href || "");
      if (!isSafe) {
        return <span>{children}</span>;
      }
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-sibs-orange hover:underline inline-flex items-center gap-0.5"
        >
          {children}
        </a>
      );
    },
  }), []);

  const isComplete = status !== "incomplete";

  return (
    <div className="space-y-3 break-words sibs-text-xs leading-5 text-sibs-navy [overflow-wrap:anywhere]">
      {/* If verified structured report is present and response is completed, render it first */}
      {isComplete && report ? <HermesReportView report={report} /> : null}

      {/* Render Markdown prose */}
      {cleanMarkdown ? (
        <div className="prose-container">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={components}
          >
            {cleanMarkdown}
          </ReactMarkdown>
        </div>
      ) : null}

      {/* If response is incomplete, display a subtle warning banner with a Continue option */}
      {!isComplete ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/80 px-3.5 py-2.5 text-xs text-amber-900 mt-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0 animate-pulse" />
            <span className="font-semibold truncate">
              Response incomplete {finishReason === "length" ? "· generation reached token limit" : ""}
            </span>
          </div>
          {onContinue ? (
            <button
              type="button"
              onClick={onContinue}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-xs hover:bg-amber-700 active:scale-95 transition"
            >
              <span>Continue</span>
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export const HermesResponseRenderer = memo(HermesResponseRendererComponent);
export default HermesResponseRenderer;
