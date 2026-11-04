import React from "react";
import { DeveloperAccessory } from "./DeveloperAccessories.jsx";

const VARIANTS = Object.freeze({
  header: {
    frame: "h-[54px] w-[54px] 2xl:h-[60px] 2xl:w-[60px] max-sm:h-12 max-sm:w-12",
    picture: "rounded-full text-[11px] 2xl:text-xs",
    accessory: "-top-2.5 -right-1.5 h-4 w-4 2xl:h-4.5 2xl:w-4.5",
    badge: "-bottom-1.5 px-1.5 py-[0.5px] text-[6.5px] 2xl:text-[7px]",
  },
  profile: {
    frame: "h-[88px] w-[88px] 2xl:h-[104px] 2xl:w-[104px]",
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

/** Original ornate header/profile artwork with the existing square hover preview. */
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

  if (variant !== "preview") {
    return (
      <span
        className={`relative inline-block shrink-0 overflow-visible align-middle ${style.frame}`}
        data-collectible-avatar={collectible.id}
        data-collectible-variant={variant}
        aria-label={`${collectible.title} avatar`}
      >
        <span
          className="absolute flex items-center justify-center overflow-hidden rounded-full bg-sibs-primary-1 text-xs font-extrabold uppercase text-white"
          style={collectible.portrait}
        >
          {photoUrl ? (
            <img src={photoUrl} alt="Employee profile" onError={onPhotoError} className="h-full w-full object-cover" />
          ) : (
            <span aria-hidden="true">{fallback}</span>
          )}
        </span>
        <img
          data-collectible-artwork="true"
          src={collectible.asset}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="pointer-events-none absolute inset-0 z-10 h-full w-full select-none object-contain"
        />
      </span>
    );
  }

  return (
    <span
      className={`relative inline-block shrink-0 overflow-visible align-middle ${style.frame}`}
      data-collectible-avatar={collectible.id}
      data-collectible-variant={variant}
      aria-label={`${collectible.title} avatar`}
      style={{ "--sibs-collectible-ring": collectible.ringColor || "#34d399" }}
    >
      <span className={`sibs-collectible-photo relative flex h-full w-full items-center justify-center font-extrabold uppercase text-white ${style.picture}`}>
        <span className="sibs-collectible-photo-content flex items-center justify-center">
          {photoUrl ? (
            <img src={photoUrl} alt="Employee profile" onError={onPhotoError} className="h-full w-full object-cover" />
          ) : (
            <span aria-hidden="true">{fallback}</span>
          )}
        </span>
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
