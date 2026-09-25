import React, { useLayoutEffect, useRef, useState } from "react";

const COLLAPSED_LINE_COUNT = 2;
const FALLBACK_LINE_HEIGHT = 16;

export default function ExpandableCandidateRemark({ value }) {
  const remarkId = React.useId();
  const measureRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const text = String(value ?? "").trim() || "N/A";

  useLayoutEffect(() => {
    const measureOverflow = () => {
      const element = measureRef.current;
      if (!element) return;

      const parsedLineHeight = Number.parseFloat(
        window.getComputedStyle(element).lineHeight,
      );
      const lineHeight = Number.isFinite(parsedLineHeight)
        ? parsedLineHeight
        : FALLBACK_LINE_HEIGHT;
      setCanExpand(
        element.scrollHeight > lineHeight * COLLAPSED_LINE_COUNT + 1,
      );
    };

    measureOverflow();
    window.addEventListener("resize", measureOverflow);
    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(measureOverflow);
    if (measureRef.current) resizeObserver?.observe(measureRef.current);

    return () => {
      window.removeEventListener("resize", measureOverflow);
      resizeObserver?.disconnect();
    };
  }, [text]);

  const textClassName =
    "m-0 break-words text-[11.5px] font-extrabold leading-tight text-[#042C51] 2xl:text-xs";

  return (
    <>
      <div className="relative min-w-0">
        <p
          id={remarkId}
          className={`${textClassName} mt-1 ${canExpand && !expanded ? "line-clamp-2" : ""}`}
        >
          {text}
        </p>
        <p
          ref={measureRef}
          data-testid="candidate-remark-measure"
          aria-hidden="true"
          className={`${textClassName} pointer-events-none absolute left-0 top-0 -z-10 m-0 w-full whitespace-pre-wrap opacity-0`}
        >
          {text}
        </p>
      </div>
      {canExpand ? (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={remarkId}
          onClick={() => setExpanded((current) => !current)}
          className="mt-1 inline-flex min-h-7 items-center rounded text-[10px] font-bold text-[#174A7C] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C28]"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      ) : null}
    </>
  );
}
