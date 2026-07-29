import { useEffect, useState } from "react";

import {
  getEmployeeInitials,
  getProfileImageUrl,
} from "../../../../lib/utils/employees/employeeProfileHelpers.js";

export default function EmployeeProfileAvatar({ employee, apiUrl, onClick }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = getProfileImageUrl(employee, apiUrl);
  const shouldShowImage = Boolean(imageUrl) && !imageFailed;

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex h-16 w-16 shrink-0 items-center justify-center overflow-visible rounded-2xl bg-transparent text-xl font-extrabold text-white transition hover:-translate-y-0.5 active:scale-[0.98]"
      title="View profile picture"
    >
      <span className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#042C51] to-[#084782] shadow-md transition group-hover:shadow-lg">
        {shouldShowImage ? (
          <img
            src={imageUrl}
            alt="Employee profile"
            className="h-full w-full object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span>{getEmployeeInitials(employee)}</span>
        )}

        <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/0 text-[10px] font-bold opacity-0 transition group-hover:bg-black/35 group-hover:opacity-100">
          View
        </span>
      </span>

      <span
        className="pointer-events-none absolute -bottom-1 -right-1 z-10 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-emerald-500 shadow-sm"
        title="Active account"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-white" />
      </span>
    </button>
  );
}
