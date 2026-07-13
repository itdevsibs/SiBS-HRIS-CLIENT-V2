import { useMemo } from "react";
import DOMPurify from "dompurify";

function escapeHtml(value = "") {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function plainTextToHtml(value = "") {
  return String(value || "")
    .replace(/\r\n?/g, "\n")
    .trim()
    .split(/\n{2,}/)
    .filter(Boolean)
    .map((paragraph) => {
      const content = paragraph
        .split("\n")
        .map(escapeHtml)
        .join("<br>");

      return `<p>${content}</p>`;
    })
    .join("");
}

function containsVisibleText(html = "") {
  if (!html) return false;

  if (typeof DOMParser === "undefined") {
    return String(html)
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/gi, " ")
      .trim().length > 0;
  }

  const parsed = new DOMParser().parseFromString(
    html,
    "text/html",
  );

  return String(parsed.body?.textContent || "")
    .replace(/\u00a0/g, " ")
    .trim().length > 0;
}

export default function RichTextViewer({
  value = "",
  className = "",
  emptyText = "",
}) {
  const safeHtml = useMemo(() => {
    const source = String(value || "").trim();

    if (!source) return "";

    const html =
      /<\/?[a-z][\s\S]*>/i.test(source)
        ? source
        : plainTextToHtml(source);

    return DOMPurify.sanitize(html, {
      USE_PROFILES: {
        html: true,
      },
      ADD_ATTR: [
        "style",
        "start",
        "value",
        "type",
      ],
    });
  }, [value]);

  if (!safeHtml || !containsVisibleText(safeHtml)) {
    return emptyText ? (
      <p className="text-sm text-sibs-tertiary-5">
        {emptyText}
      </p>
    ) : null;
  }

  return (
    <>
      <style>{`
        .jd-rich-text-viewer {
          color: #344054;
          overflow-wrap: anywhere;
        }

        .jd-rich-text-viewer > * + * {
          margin-top: 0.65rem;
        }

        .jd-rich-text-viewer p,
        .jd-rich-text-viewer li {
          font-size: 0.9375rem;
          line-height: 1.5;
        }

        .jd-rich-text-viewer p {
          margin-bottom: 0;
        }

        .jd-rich-text-viewer ol,
        .jd-rich-text-viewer ul {
          margin: 0.55rem 0;
          padding-left: 2.25rem;
        }

        .jd-rich-text-viewer ol {
          list-style-type: decimal;
        }

        .jd-rich-text-viewer ol[type="a"] {
          list-style-type: lower-alpha;
        }

        .jd-rich-text-viewer ol[type="A"] {
          list-style-type: upper-alpha;
        }

        .jd-rich-text-viewer ol[type="i"] {
          list-style-type: lower-roman;
        }

        .jd-rich-text-viewer ol[type="I"] {
          list-style-type: upper-roman;
        }

        .jd-rich-text-viewer ol ol {
          list-style-type: lower-alpha;
          padding-left: 2.5rem;
        }

        .jd-rich-text-viewer ol ol ol {
          list-style-type: lower-roman;
        }

        .jd-rich-text-viewer ul {
          list-style-type: disc;
        }

        .jd-rich-text-viewer ul ul {
          list-style-type: circle;
        }

        .jd-rich-text-viewer li {
          padding-left: 0.4rem;
        }

        .jd-rich-text-viewer li + li {
          margin-top: 0.45rem;
        }

        .jd-rich-text-viewer li > p {
          margin: 0;
        }

        .jd-rich-text-viewer strong,
        .jd-rich-text-viewer b {
          font-weight: 700;
        }

        .jd-rich-text-viewer em,
        .jd-rich-text-viewer i {
          font-style: italic;
        }

        .jd-rich-text-viewer u {
          text-decoration: underline;
        }

        .jd-rich-text-viewer s,
        .jd-rich-text-viewer strike {
          text-decoration: line-through;
        }

        .jd-rich-text-viewer [style*="text-align: justify"] {
          text-align: justify;
          text-justify: inter-word;
        }

        .jd-rich-text-viewer blockquote {
          margin: 0.75rem 0;
          border-left: 3px solid #9eb9d4;
          padding-left: 1rem;
          color: #486581;
        }
      `}</style>

      <div
        className={`jd-rich-text-viewer ${className}`}
        dangerouslySetInnerHTML={{
          __html: safeHtml,
        }}
      />
    </>
  );
}
