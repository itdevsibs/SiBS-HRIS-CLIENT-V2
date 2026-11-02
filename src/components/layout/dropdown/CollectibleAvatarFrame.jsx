import React from "react";
import { DeveloperAccessory } from "./DeveloperAccessories.jsx";

const VARIANTS = Object.freeze({
  header: {
    frame: "h-8 w-8 2xl:h-9 2xl:w-9 max-[360px]:h-7.5 max-[360px]:w-7.5",
    picture: "rounded-full text-[11px] 2xl:text-xs",
    accessory: "-top-2.5 -right-1.5 h-4 w-4 2xl:h-4.5 2xl:w-4.5",
    badge: "-bottom-1.5 px-1.5 py-[0.5px] text-[6.5px] 2xl:text-[7px]",
  },
  profile: {
    frame: "h-13 w-13 2xl:h-16 2xl:w-16",
    picture: "rounded-2xl text-lg 2xl:text-xl",
    accessory: "-top-2.5 -right-2 h-5 w-5 2xl:h-6 2xl:w-6",
    badge: "-bottom-2 px-1.5 py-[0.5px] text-[7px] 2xl:text-[7.5px]",
  },
  preview: {
    frame: "h-full w-full",
    picture: "rounded-xl text-4xl",
    accessory: "-top-3.5 -right-2.5 h-8 w-8",
    badge: "bottom-2 px-3 py-0.5 text-[9px]",
  },
});

/** Compact photo, ring, accessory, and text labels shared by collectible avatars. */
export default function CollectibleAvatarFrame({
  collectible,
  photoUrl,
  fallback = "U",
  variant = "header",
  onPhotoError,
}) {
  if (!collectible) return null;
  const style = VARIANTS[variant] || VARIANTS.header;
  const isHeader = variant === "header";

  return (
    <span
      className={`relative inline-block shrink-0 overflow-visible align-middle ${style.frame}`}
      data-collectible-avatar={collectible.id}
      data-collectible-variant={variant}
      title={collectible.title}
      aria-label={`${collectible.title} avatar`}
    >
      <span className={`relative flex h-full w-full items-center justify-center overflow-hidden bg-sibs-primary-1 font-extrabold uppercase text-white ${style.picture} ${isHeader ? collectible.ringClass : collectible.previewRingClass}`}>
        {photoUrl ? (
          <img src={photoUrl} alt="Employee profile" onError={onPhotoError} className="h-full w-full object-cover" />
        ) : (
          <span aria-hidden="true">{fallback}</span>
        )}
      </span>
      <span className={`pointer-events-none absolute z-20 rotate-[22deg] ${style.accessory}`} aria-hidden="true">
        <DeveloperAccessory accessoryKey={collectible.accessoryKey} className="h-full w-full" />
      </span>
      <span
        className={`pointer-events-none absolute left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full border-[1.5px] border-white bg-gradient-to-r ${collectible.badgeGradient} font-black uppercase leading-none tracking-tight text-white shadow-[0_2px_4px_rgba(4,44,81,0.25)] ${style.badge}`}
        aria-hidden="true"
      >
        {isHeader ? collectible.headerTitle || collectible.title : collectible.title}
      </span>
    </span>
  );
}
