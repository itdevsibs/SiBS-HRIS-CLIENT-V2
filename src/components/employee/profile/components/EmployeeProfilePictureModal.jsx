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
      className="sibs-modal-blur fixed inset-0 z-[99999] flex h-dvh items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
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
        className="sibs-modal-pop-in flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <header className="border-b border-[#E6ECF2] bg-white px-5 py-5 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-[#042C51]">
                <ImageIcon size={14} />
                My Profile Picture
              </span>
              <h2
                id="my-profile-picture-title"
                className="mt-3 break-words text-xl font-extrabold text-[#042C51] sm:text-2xl"
              >
                {getFullName(employee) || "Employee Profile"}
              </h2>
              <p className="mt-1 text-xs font-semibold text-[#667085]">
                SIBS ID: {getProfileSibsId(employee) || "N/A"}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Close profile picture modal"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto bg-[#F8FAFC] p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
            <section className="rounded-2xl border border-[#E6ECF2] bg-white p-3 shadow-sm">
              <button
                type="button"
                disabled={uploading}
                className={`mb-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold transition ${
                  uploading
                    ? "bg-[#F8FAFC] text-[#042C51]"
                    : "bg-[#042C51] text-white"
                }`}
              >
                <Eye size={17} />
                View Picture
              </button>

              {canUpload && (
                <>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold transition ${
                      uploading
                        ? "bg-[#042C51] text-white"
                        : "bg-[#F8FAFC] text-[#042C51] hover:bg-[#E9F0FC]"
                    }`}
                  >
                    <UploadCloud size={17} />
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