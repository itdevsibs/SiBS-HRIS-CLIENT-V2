import { useEffect, useRef } from "react";
import { Eye, Image as ImageIcon, UploadCloud, User, X } from "lucide-react";

import {
  getEmployeeInitials,
  getFullName,
  getProfileImageUrl,
  getProfileSibsId,
} from "../../../../lib/utils/employees/employeeProfileHelpers.js";

const ACCEPTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
];

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export default function MyEmployeeProfilePictureModal({
  open,
  onClose,
  employee,
  apiUrl,
  currentImage = "",
  onUploadImage,
  uploading = false,
}) {
  const fileInputRef = useRef(null);

  const canUpload = typeof onUploadImage === "function";
  const imageUrl = currentImage || getProfileImageUrl(employee, apiUrl);

  useEffect(() => {
    if (!open) return undefined;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    function handleEscape(event) {
      if (event.key === "Escape" && !uploading) {
        onClose?.();
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose, open, uploading]);

  if (!open) return null;

  function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      onUploadImage?.(null, {
        type: "error",
        title: "Invalid File",
        message: "Please select a valid JPG, PNG, WEBP, or GIF image file.",
      });
      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      onUploadImage?.(null, {
        type: "error",
        title: "File Too Large",
        message: "Profile picture must be 5MB or below.",
      });
      event.target.value = "";
      return;
    }

    onUploadImage?.(file);
    event.target.value = "";
  }

  return (
    <div
      className="sibs-modal-blur sibs-modal-backdrop-in fixed inset-0 z-[99999] flex h-dvh items-center justify-center p-2 font-jakarta sm:p-4"
      onClick={() => {
        if (!uploading) onClose?.();
      }}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="my-profile-picture-title"
        onClick={(event) => event.stopPropagation()}
        className="sibs-modal-pop-in flex max-h-[90dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl font-jakarta"
      >
        <header className="flex shrink-0 items-center justify-between gap-4 bg-[#042C51] px-5 py-3 text-white sm:px-6 2xl:py-3.5">
          <div className="flex min-w-0 items-center gap-2.5 2xl:gap-3">
            <span className="flex h-8 w-8 2xl:h-8.5 2xl:w-8.5 shrink-0 items-center justify-center rounded-lg bg-[#FF5C28] text-white shadow-sm">
              <ImageIcon size={16} />
            </span>
            <div className="min-w-0">
              <h2
                id="my-profile-picture-title"
                className="truncate text-base sm:text-lg 2xl:text-xl font-extrabold text-white"
              >
                {getFullName(employee) || "Employee Profile"}
              </h2>
              <p className="mt-0.5 truncate sibs-text-xs font-semibold text-white/75">
                SIBS ID: {getProfileSibsId(employee) || "N/A"} • Profile Picture
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="inline-flex h-8 w-8 2xl:h-8.5 2xl:w-8.5 shrink-0 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close profile picture modal"
          >
            <X size={18} />
          </button>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto bg-[#F8FAFC] p-4 sm:p-5 2xl:p-6 sibs-scrollbar">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
            <section className="rounded-xl border border-[#E6ECF2] bg-white p-3 shadow-2xs">
              <button
                type="button"
                disabled={uploading}
                className={`mb-2 flex h-8.5 2xl:h-10 w-full items-center gap-2.5 rounded-lg px-3.5 2xl:px-4 text-left sibs-text-xs font-extrabold transition ${
                  uploading
                    ? "bg-[#F8FAFC] text-[#042C51]"
                    : "bg-[#042C51] text-white"
                }`}
              >
                <Eye size={15} />
                View Picture
              </button>

              {canUpload && (
                <>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className={`flex h-8.5 2xl:h-10 w-full items-center gap-2.5 rounded-lg px-3.5 2xl:px-4 text-left sibs-text-xs font-extrabold transition ${
                      uploading
                        ? "bg-[#042C51] text-white"
                        : "bg-[#F8FAFC] text-[#042C51] hover:bg-[#FFF8F5] hover:text-[#FF5C28]"
                    }`}
                  >
                    <UploadCloud size={15} />
                    {uploading ? "Uploading..." : "Upload New"}
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <p className="mt-4 text-[10px] font-semibold leading-5 text-[#667085]">
                    Accepted formats: JPG, PNG, WEBP, and GIF. Maximum file size:
                    5MB.
                  </p>
                </>
              )}
            </section>

            <section className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm">
              <div className="flex min-h-[330px] items-center justify-center rounded-2xl border border-dashed border-[#D0D5DD] bg-[#F8FAFC] p-4">
                {uploading ? (
                  <div className="text-center">
                    <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-3xl bg-[#E9F0FC]">
                      <UploadCloud size={42} className="animate-pulse text-[#042C51]" />
                    </div>
                    <h3 className="mt-4 text-base font-extrabold text-[#042C51]">
                      Uploading profile picture
                    </h3>
                    <p className="mt-1 text-sm font-medium text-[#667085]">
                      Please wait while the new image is saved.
                    </p>
                  </div>
                ) : imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Employee profile"
                    className="max-h-[500px] w-full max-w-[520px] rounded-2xl object-contain shadow-sm"
                  />
                ) : (
                  <div className="text-center">
                    <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-3xl bg-[#E9F0FC] text-3xl font-extrabold text-[#042C51]">
                      {getEmployeeInitials(employee) || <User size={42} />}
                    </div>
                    <h3 className="mt-4 text-base font-extrabold text-[#042C51]">
                      No profile picture
                    </h3>
                    <p className="mt-1 text-sm font-medium text-[#667085]">
                      {canUpload
                        ? "Select Upload New to add a profile picture."
                        : "No profile picture is available for this employee."}
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}