const AVATAR_TONES = [
  "border-orange-100 bg-orange-50 text-sibs-orange",
  "border-emerald-100 bg-emerald-50 text-emerald-700",
  "border-blue-100 bg-blue-50 text-sibs-navy",
  "border-pink-100 bg-pink-50 text-pink-700",
  "border-violet-100 bg-violet-50 text-violet-700",
];

export default function DirectoryAvatarCircle({
  name = "",
  initials = "",
  size = "md",
  children,
}) {
  const seed = name
    .split("")
    .reduce((total, character) => total + character.charCodeAt(0), 0);
  const tone = AVATAR_TONES[seed % AVATAR_TONES.length];
  const sizeClass = size === "lg" ? "h-11 w-11" : "h-9 w-9";
  const className = size === "preview"
    ? `relative flex h-40 w-40 items-center justify-center overflow-hidden rounded-xl border text-[24px] font-extrabold ${tone}`
    : `relative inline-flex ${sizeClass} shrink-0 items-center justify-center overflow-hidden rounded-full border text-xs font-extrabold shadow-inner ${tone}`;

  return (
    <span className={className}>
      <span aria-hidden="true">{initials}</span>
      {children}
    </span>
  );
}
