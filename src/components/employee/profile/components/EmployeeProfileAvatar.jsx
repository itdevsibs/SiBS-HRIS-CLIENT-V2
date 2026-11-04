import React, { useState } from "react";

import {
  getEmployeeInitials,
  getProfileImageUrl,
} from "../../../../lib/utils/employees/employeeProfileHelpers.js";
import { getActiveCollectibleProfile } from "../../../../config/developerBorders.js";
import CollectibleAvatarFrame from "../../../layout/dropdown/CollectibleAvatarFrame.jsx";

export default function EmployeeProfileAvatar({ employee, apiUrl, onClick }) {
  const [failedImageUrl, setFailedImageUrl] = useState(null);
  const imageUrl = getProfileImageUrl(employee, apiUrl);
  const shouldShowImage = Boolean(imageUrl) && failedImageUrl !== imageUrl;
  const collectible = getActiveCollectibleProfile(employee);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex shrink-0 items-center justify-center overflow-visible rounded-2xl bg-transparent text-lg 2xl:text-xl font-extrabold text-white transition hover:-translate-y-0.5 active:scale-[0.98] ${collectible ? "h-[88px] w-[88px] 2xl:h-[104px] 2xl:w-[104px]" : "h-13 w-13 2xl:h-16 2xl:w-16"}`}
      title={`View profile picture${collectible ? ` (${collectible.title})` : ""}`}
    >
      {collectible ? (
        <CollectibleAvatarFrame
          collectible={collectible}
          photoUrl={shouldShowImage ? imageUrl : ""}
          fallback={getEmployeeInitials(employee)}
          variant="profile"
          onPhotoError={() => setFailedImageUrl(imageUrl)}
        />
      ) : (
        <span className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-sibs-navy to-slate-800 shadow-md transition group-hover:shadow-lg">
        {shouldShowImage ? (
          <img
            src={imageUrl}
            alt="Employee profile"
            className="h-full w-full object-cover"
            onError={() => setFailedImageUrl(imageUrl)}
          />
        ) : (
          <span>{getEmployeeInitials(employee)}</span>
        )}

        <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/0 text-[10px] font-bold opacity-0 transition group-hover:bg-black/35 group-hover:opacity-100">
          View
        </span>
        </span>
      )}

      {/* Active account status indicator */}
      <span
        className="pointer-events-none absolute -bottom-1 -right-1 z-20 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-emerald-500 shadow-sm"
        title="Active account"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-white" />
      </span>
    </button>
  );
}
