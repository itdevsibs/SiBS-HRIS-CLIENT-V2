import { useEffect } from "react";
import { Image as ImageIcon, X } from "lucide-react";

import {
  getEmployeeInitials,
  getFullName,
  getProfileImageUrl,
  getProfileSibsId,
} from "../../../../lib/utils/EmployeeProfile/employeeProfileHelpers.js";

export default function EmployeeProfilePictureModal({
  open,
  employee,
  apiUrl,
  onClose,
}) {
  useEffect(() => {
    if (!open) return undefined;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const handleEscape = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  if (!open) return null;

  const imageUrl = getProfileImageUrl(employee, apiUrl);

  return (
    <div
      className="sibs-modal-backdrop-in fixed inset-0 z-[99999] flex h-dvh items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="sibs-modal-pop-in w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-[#E6ECF2] px-5 py-5 sm:px-6">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-[#FF5C28]">
              <ImageIcon size={14} />
              Profile Picture
            </span>
            <h2 className="mt-3 break-words text-xl font-extrabold text-[#042C51] sm:text-2xl">
              {getFullName(employee) || "Employee Profile"}
            </h2>
            <p className="mt-1 text-xs font-semibold text-[#667085]">
              SIBS ID: {getProfileSibsId(employee) || "N/A"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close profile picture modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="bg-[#F8FAFC] p-4 sm:p-6">
          <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-[#D0D5DD] bg-white p-4 sm:min-h-[460px]">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Employee profile"
                className="max-h-[580px] w-full max-w-[620px] rounded-2xl object-contain"
              />
            ) : (
              <div className="text-center">
                <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-3xl bg-[#E9F0FC] text-3xl font-extrabold text-[#042C51]">
                  {getEmployeeInitials(employee)}
                </div>
                <h3 className="mt-4 text-base font-extrabold text-[#042C51]">
                  No Profile Picture
                </h3>
                <p className="mt-1 text-sm font-medium text-[#667085]">
                  This employee has no uploaded profile picture.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
