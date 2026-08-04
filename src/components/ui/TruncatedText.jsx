import React, { useEffect, useRef, useState } from "react";

/**
 * TruncatedText automatically detects if text overflows/truncates and displays
 * a native browser tooltip (`title`) or optional custom tooltip on hover.
 */
export default function TruncatedText({
  text = "",
  children,
  className = "",
  as: Component = "span",
  showTooltipWhenTruncated = true,
  customTitle = "",
  ...props
}) {
  const elementRef = useRef(null);
  const [isTruncated, setIsTruncated] = useState(false);

  const content = text || children;
  const rawTextString = typeof content === "string" ? content : String(text || "");

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const checkTruncation = () => {
      // scrollWidth > clientWidth detects horizontal text truncation
      // scrollHeight > clientHeight detects vertical multi-line clamping
      const truncated =
        el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight;
      setIsTruncated(truncated);
    };

    checkTruncation();

    const resizeObserver = new ResizeObserver(checkTruncation);
    resizeObserver.observe(el);

    return () => {
      resizeObserver.disconnect();
    };
  }, [content]);

  const tooltipText = customTitle || (isTruncated && showTooltipWhenTruncated ? rawTextString : undefined);

  return (
    <Component
      ref={elementRef}
      title={tooltipText}
      className={`truncate ${className}`}
      {...props}
    >
      {content}
    </Component>
  );
}
