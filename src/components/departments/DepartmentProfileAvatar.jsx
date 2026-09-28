import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import api from "@/lib/axios/api-template";

function cleanText(value) {
  return String(value ?? "").trim();
}

function getInitials(name = "") {
  const parts = cleanText(name).split(/\s+/).filter(Boolean);

  if (!parts.length) return "—";

  return `${parts[0]?.[0] || ""}${
    parts.length > 1 ? parts.at(-1)?.[0] || "" : ""
  }`.toUpperCase();
}

function getApiBaseUrl() {
  const configuredBase =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    api?.defaults?.baseURL ||
    "";

  return cleanText(configuredBase)
    .replace(/\/api\/?$/i, "")
    .replace(/\/+$/, "");
}

function resolveProfilePictureUrl(value = "") {
  const url = cleanText(value);
  if (!url) return "";

  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:") ||
    url.startsWith("blob:")
  ) {
    return url;
  }

  const apiBaseUrl = getApiBaseUrl();

  if (url.startsWith("/api/")) {
    return apiBaseUrl ? `${apiBaseUrl}${url}` : url;
  }

  if (url.startsWith("api/")) {
    return apiBaseUrl ? `${apiBaseUrl}/${url}` : `/${url}`;
  }

  return url;
}

function getEmployeeProfilePictureUrl(employee = {}) {
  const directUrl = cleanText(
    employee?.profilePictureUrl || employee?.profile_picture_url,
  );

  if (directUrl) {
    return resolveProfilePictureUrl(directUrl);
  }

  const filename = cleanText(
    employee?.profileFilename ||
      employee?.profile_filename ||
      employee?.profilePicture ||
      employee?.profile_picture,
  );

  if (!filename) return "";

  return resolveProfilePictureUrl(
    `/api/employee-profile/file/${encodeURIComponent(filename)}`,
  );
}

function getPreviewPosition(element) {
  if (!element || typeof window === "undefined") return null;

  const rect = element.getBoundingClientRect();
  const previewSize = 176;
  const gap = 12;
  const viewportPadding = 8;

  let left = rect.left + rect.width / 2;

  left = Math.max(
    viewportPadding + previewSize / 2,
    Math.min(
      left,
      window.innerWidth - viewportPadding - previewSize / 2,
    ),
  );

  const availableAbove = rect.top - gap;
  const placeBelow = availableAbove < previewSize;

  let top = placeBelow ? rect.bottom + gap : rect.top - gap;

  if (placeBelow) {
    top = Math.min(
      top,
      window.innerHeight - previewSize - viewportPadding,
    );
  } else {
    top = Math.max(previewSize + viewportPadding, top);
  }

  return {
    left,
    top,
    placeBelow,
  };
}

export default function DepartmentProfileAvatar({
  employee = {},
  size = "md",
}) {
  const employeeName =
    cleanText(employee?.name) ||
    cleanText(employee?.fullName) ||
    "Employee";

  const initials = getInitials(employeeName);
  const profilePictureUrl = getEmployeeProfilePictureUrl(employee);

  const [failedImageUrl, setFailedImageUrl] = useState("");
  const [imageReady, setImageReady] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewPosition, setPreviewPosition] = useState(null);
  const avatarRef = useRef(null);

  const sizeClass =
    size === "lg"
      ? "h-12 w-12 text-sm"
      : size === "sm"
        ? "h-8 w-8 text-[9px]"
        : "h-9 w-9 text-xs";

  const canUseImage =
    Boolean(profilePictureUrl) &&
    failedImageUrl !== profilePictureUrl;

  const canPreviewImage = canUseImage && imageReady;
  const canPreview = true;

  useEffect(() => {
    setFailedImageUrl("");
    setImageReady(false);
    setPreviewVisible(false);
  }, [profilePictureUrl]);

  function showPreview() {
    setPreviewPosition(getPreviewPosition(avatarRef.current));
    setPreviewVisible(true);
  }

  function hidePreview() {
    setPreviewVisible(false);
  }

  useEffect(() => {
    if (!previewVisible || !canPreview) return undefined;

    function updatePosition() {
      setPreviewPosition(getPreviewPosition(avatarRef.current));
    }

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [previewVisible, canPreview]);

  const preview =
    previewVisible &&
    canPreview &&
    previewPosition &&
    typeof document !== "undefined"
      ? createPortal(
          <span
            className="pointer-events-none fixed z-[999999] overflow-hidden rounded-2xl border border-[#D9E6F2] bg-white p-2 shadow-[0_18px_45px_rgba(4,44,81,0.22)]"
            style={{
              left: previewPosition.left,
              top: previewPosition.top,
              transform: previewPosition.placeBelow
                ? "translate(-50%, 0)"
                : "translate(-50%, -100%)",
              width: "176px",
              height: "176px",
            }}
            aria-hidden="true"
          >
            {canPreviewImage ? (
              <img
                src={profilePictureUrl}
                alt=""
                draggable={false}
                className="h-full w-full rounded-xl object-cover"
                onError={() => {
                  setFailedImageUrl(profilePictureUrl);
                  setImageReady(false);
                }}
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center rounded-xl bg-sibs-navy text-4xl font-extrabold text-white">
                {initials}
              </span>
            )}
          </span>,
          document.body,
        )
      : null;

  return (
    <>
      <span
        ref={avatarRef}
        className="relative inline-flex shrink-0 cursor-default outline-none"
        tabIndex={0}
        aria-label={`${employeeName} profile picture`}
        onMouseEnter={showPreview}
        onMouseLeave={hidePreview}
        onFocus={showPreview}
        onBlur={hidePreview}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <span
          className={`relative inline-flex ${sizeClass} shrink-0 items-center justify-center overflow-hidden rounded-full bg-sibs-navy font-extrabold text-white shadow-inner`}
        >
          <span aria-hidden="true">{initials}</span>

          {canUseImage ? (
            <img
              src={profilePictureUrl}
              alt={`${employeeName} profile`}
              className="absolute inset-0 h-full w-full object-cover"
              onLoad={() => setImageReady(true)}
              onError={() => {
                setFailedImageUrl(profilePictureUrl);
                setImageReady(false);
                setPreviewVisible(false);
              }}
            />
          ) : null}
        </span>
      </span>

      {preview}
    </>
  );
}
