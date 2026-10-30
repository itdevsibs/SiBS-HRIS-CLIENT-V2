import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import api from "@/lib/axios/api-template";

// Match the Employee Directory's avatar colors, sizes, fallback initials and
// enlarged hover/focus preview, without importing its full table component.
const AVATAR_TONES = [
  "border-orange-100 bg-orange-50 text-sibs-orange",
  "border-emerald-100 bg-emerald-50 text-emerald-700",
  "border-blue-100 bg-blue-50 text-sibs-navy",
  "border-pink-100 bg-pink-50 text-pink-700",
  "border-violet-100 bg-violet-50 text-violet-700",
];

function getProfilePictureUrl(record) {
  const source = String(record?.profilePictureUrl || record?.profile_picture_url || "").trim();
  if (!source) return "";
  if (/^https?:\/\//i.test(source)) return source;
  if (!source.startsWith("/api/employee-profile/file/")) return "";
  const base = String(api.defaults?.baseURL || "").trim().replace(/\/+$/, "");
  return `${base}${source}`;
}

function getInitials(record) {
  const first = String(record?.firstName || "").trim();
  const last = String(record?.lastName || "").trim();
  if (first || last) return `${first[0] || ""}${last[0] || ""}`.toUpperCase();
  const words = String(record?.employeeName || "")
    .replace(",", " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return `${words[0]?.[0] || "E"}${words[1]?.[0] || ""}`.toUpperCase();
}

function getPreviewPosition(element) {
  if (!element || typeof window === "undefined") return null;
  const rect = element.getBoundingClientRect();
  const placeBelow = rect.top < 188;
  return {
    left: rect.left + rect.width / 2,
    top: placeBelow ? rect.bottom + 12 : rect.top - 12,
    placeBelow,
  };
}

export default function ResigneeAvatar({ record }) {
  const src = getProfilePictureUrl(record);
  const [failedSource, setFailedSource] = useState("");
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewPosition, setPreviewPosition] = useState(null);
  const anchor = useRef(null);
  const name = String(record?.employeeName || "Employee");
  const initials = getInitials(record);
  const seed = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const tone = AVATAR_TONES[seed % AVATAR_TONES.length];
  const canShowPicture = Boolean(src) && failedSource !== src;

  const showPreview = () => {
    setPreviewPosition(getPreviewPosition(anchor.current));
    setPreviewVisible(true);
  };
  const hidePreview = () => setPreviewVisible(false);

  useEffect(() => {
    if (!previewVisible) return undefined;
    const update = () => setPreviewPosition(getPreviewPosition(anchor.current));
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [previewVisible]);

  const picture = (preview = false) => (
    <span className={`relative inline-flex ${preview ? "h-40 w-40 rounded-xl text-[24px]" : "h-9 w-9 rounded-full text-xs shadow-inner"} shrink-0 items-center justify-center overflow-hidden border font-extrabold ${tone}`}>
      <span aria-hidden="true">{initials}</span>
      {canShowPicture ? (
        <img
          src={src}
          alt=""
          loading={preview ? "eager" : "lazy"}
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setFailedSource(src)}
        />
      ) : null}
    </span>
  );

  const preview = previewVisible && previewPosition && typeof document !== "undefined"
    ? createPortal(
        <span
          className="employee-avatar-preview pointer-events-none fixed z-[9999] rounded-2xl border border-sibs-border bg-white p-2 shadow-[0_18px_45px_rgba(4,44,81,0.22)]"
          style={{
            left: previewPosition.left,
            top: previewPosition.top,
            transform: previewPosition.placeBelow ? "translate(-50%, 0)" : "translate(-50%, -100%)",
          }}
          aria-hidden="true"
        >
          {picture(true)}
        </span>,
        document.body,
      )
    : null;

  return (
    <>
      <span
        ref={anchor}
        className="relative inline-flex shrink-0 outline-none"
        tabIndex={0}
        aria-label={`${name} profile picture`}
        onMouseEnter={showPreview}
        onMouseLeave={hidePreview}
        onFocus={showPreview}
        onBlur={hidePreview}
        onKeyDown={(event) => event.stopPropagation()}
      >
        {picture()}
      </span>
      {preview}
    </>
  );
}
