import React, { useRef } from "react";
import { Eye, Image as ImageIcon, UploadCloud, User } from "lucide-react";

import { ModalShell } from "@/components/ui";
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
    <ModalShell
      open={open}
      onClose={() => {
        if (!uploading) onClose?.();
      }}
      title={getFullName(employee) || "Employee Profile"}
      subtitle={`SIBS ID: ${getProfileSibsId(employee) || "N/A"} • Profile Picture`}
      icon={ImageIcon}
      maxWidth="max-w-3xl"
    >
      <div className="bg-sibs-surface p-4 sm:p-5 2xl:p-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
          <section className="rounded-xl border border-sibs-border bg-white p-3 shadow-xs">
            <button
              type="button"
              disabled={uploading}
              className={`mb-2 flex h-8.5 2xl:h-10 w-full items-center gap-2.5 rounded-lg px-3.5 2xl:px-4 text-left font-jakarta sibs-text-xs font-extrabold transition ${
                uploading
                  ? "bg-sibs-surface text-sibs-navy"
                  : "bg-sibs-navy text-white"
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
                  className={`flex h-8.5 2xl:h-10 w-full items-center gap-2.5 rounded-lg px-3.5 2xl:px-4 text-left font-jakarta sibs-text-xs font-extrabold transition ${
                    uploading
                      ? "bg-sibs-navy text-white"
                      : "bg-sibs-surface text-sibs-navy hover:bg-sibs-cream-subtle hover:text-sibs-orange"
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

                <p className="mt-4 sibs-text-micro font-semibold leading-5 text-sibs-muted">
                  Accepted formats: JPG, PNG, WEBP, and GIF. Maximum file size:
                  5MB.
                </p>
              </>
            )}
          </section>

          <section className="rounded-2xl border border-sibs-border bg-white p-4 shadow-sm">
            <div className="flex min-h-[330px] items-center justify-center rounded-2xl border border-dashed border-sibs-border-subtle bg-sibs-surface p-4">
              {uploading ? (
                <div className="text-center">
                  <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-3xl bg-blue-50">
                    <UploadCloud size={42} className="animate-pulse text-sibs-navy" />
                  </div>
                  <h3 className="sibs-modal-section-title mt-4 text-sibs-navy">
                    Uploading profile picture
                  </h3>
                  <p className="sibs-modal-section-subtitle mt-1 text-sibs-muted">
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
                  <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-3xl bg-blue-50 text-3xl font-extrabold text-sibs-navy">
                    {getEmployeeInitials(employee) || <User size={42} />}
                  </div>
                  <h3 className="sibs-modal-section-title mt-4 text-sibs-navy">
                    No profile picture
                  </h3>
                  <p className="sibs-modal-section-subtitle mt-1 text-sibs-muted">
                    {canUpload
                      ? "Select Upload New to add a profile picture."
                      : "No profile picture is available for this employee."}
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </ModalShell>
  );
}