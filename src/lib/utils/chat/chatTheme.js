import { getChatAttachmentUrl } from "../../axios/sibsChat";

export const BUILTIN_THEME_PRESETS = [
  {
    key: "default",
    name: "SiBS Classic",
    type: "DEFAULT",
    background: "#F4F7FA",
    preview: "#F4F7FA",
    isDark: false,
    description: "Default clean slate canvas",
  },
  {
    key: "sunset_glow",
    name: "Sunset Glow",
    type: "PRESET",
    gradient: "linear-gradient(135deg, #FF6B35 0%, #F7941D 45%, #9B51E0 100%)",
    preview: "linear-gradient(135deg, #FF6B35, #F7941D, #9B51E0)",
    isDark: false,
    description: "Warm sunset orange into twilight purple",
  },
  {
    key: "midnight_navy",
    name: "Midnight Navy",
    type: "PRESET",
    gradient: "linear-gradient(135deg, #0B192C 0%, #1E3E62 60%, #000000 100%)",
    preview: "linear-gradient(135deg, #0B192C, #1E3E62)",
    isDark: true,
    description: "Deep enterprise navy and deep night",
  },
  {
    key: "mint_breeze",
    name: "Mint Breeze",
    type: "PRESET",
    gradient: "linear-gradient(135deg, #0ba360 0%, #3cba92 100%)",
    preview: "linear-gradient(135deg, #0ba360, #3cba92)",
    isDark: false,
    description: "Refreshing mint and jade tones",
  },
  {
    key: "royal_amethyst",
    name: "Royal Amethyst",
    type: "PRESET",
    gradient: "linear-gradient(135deg, #654ea3 0%, #eaafc8 100%)",
    preview: "linear-gradient(135deg, #654ea3, #eaafc8)",
    isDark: false,
    description: "Vibrant royal purple and rose quartz",
  },
  {
    key: "subtle_doodle",
    name: "WhatsApp Doodle",
    type: "PRESET",
    pattern: "doodle",
    backgroundColor: "#EFEAE2",
    preview: "#EFEAE2",
    isDark: false,
    description: "Classic messenger doodle wallpaper pattern",
  },
  {
    key: "dark_charcoal",
    name: "Dark Charcoal",
    type: "PRESET",
    gradient: "linear-gradient(135deg, #18191a 0%, #242526 100%)",
    preview: "#18191a",
    isDark: true,
    description: "Sleek low-glare dark theme",
  },
  {
    key: "rose_blush",
    name: "Rose Blush",
    type: "PRESET",
    gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    preview: "linear-gradient(135deg, #f093fb, #f5576c)",
    isDark: false,
    description: "Vibrant pink and soft coral",
  },
  {
    key: "ocean_depths",
    name: "Ocean Depths",
    type: "PRESET",
    gradient: "linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)",
    preview: "linear-gradient(135deg, #2193b0, #6dd5ed)",
    isDark: false,
    description: "Calm tropical ocean blues",
  },
  {
    key: "emerald_forest",
    name: "Emerald Forest",
    type: "PRESET",
    gradient: "linear-gradient(135deg, #134e5e 0%, #71b280 100%)",
    preview: "linear-gradient(135deg, #134e5e, #71b280)",
    isDark: true,
    description: "Deep evergreen and emerald hues",
  },
];

export const PRESET_SOLID_COLORS = [
  { name: "Sky Blue", value: "#38BDF8" },
  { name: "Indigo", value: "#6366F1" },
  { name: "Emerald", value: "#10B981" },
  { name: "Amber", value: "#F59E0B" },
  { name: "Rose", value: "#F43F5E" },
  { name: "Violet", value: "#8B5CF6" },
  { name: "Slate", value: "#64748B" },
  { name: "Teal", value: "#14B8A6" },
];

export const DOODLE_SVG_DATA_URI =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
      <g fill="none" stroke="#7e7769" stroke-width="1.2" opacity="0.14" stroke-linecap="round" stroke-linejoin="round">
        <path d="M15 15h12v9h-6l-3 3v-3h-3z" />
        <circle cx="65" cy="20" r="5" />
        <path d="M63 20h4M65 18v4" />
        <path d="M20 65c2-4 7-4 9 0c2 4 7 4 9 0" />
        <path d="M75 60l5 10h-10z" />
        <path d="M45 40c0-3 5-3 5 0c0 3-5 5-5 7" />
        <circle cx="45" cy="51" r="0.8" fill="#7e7769" />
        <path d="M82 35a3 3 0 1 0 0-6a3 3 0 0 0 0 6z" />
        <path d="M10 85l6-6M16 85l-6-6" />
        <circle cx="85" cy="85" r="4" />
      </g>
    </svg>`
  );

export function isChatThemeCustom(theme) {
  if (!theme || typeof theme !== "object") return false;
  const type = String(theme.type || "").toUpperCase();
  if (type === "DEFAULT" || !type) {
    return false;
  }
  return true;
}

export function isColorDark(hexColor) {
  if (!hexColor || typeof hexColor !== "string") return false;
  const clean = hexColor.trim().replace(/^#/, "");
  let r = 0;
  let g = 0;
  let b = 0;

  if (clean.length === 3) {
    r = parseInt(clean[0] + clean[0], 16);
    g = parseInt(clean[1] + clean[1], 16);
    b = parseInt(clean[2] + clean[2], 16);
  } else if (clean.length === 6) {
    r = parseInt(clean.slice(0, 2), 16);
    g = parseInt(clean.slice(2, 4), 16);
    b = parseInt(clean.slice(4, 6), 16);
  } else {
    return false;
  }

  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    return false;
  }

  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance < 0.55;
}

export function calculatePixelLuminanceIsDark(pixelArray) {
  if (!pixelArray || !pixelArray.length) return false;
  let totalLuminance = 0;
  let count = 0;
  for (let i = 0; i < pixelArray.length; i += 4) {
    const r = pixelArray[i];
    const g = pixelArray[i + 1];
    const b = pixelArray[i + 2];
    totalLuminance += 0.2126 * r + 0.7152 * g + 0.0722 * b;
    count++;
  }
  if (!count) return false;
  const avgLuminance = (totalLuminance / count) / 255;
  return avgLuminance < 0.55;
}

export function isChatThemeDark(theme, dynamicImageIsDark = null) {
  if (!theme || typeof theme !== "object") return false;
  const type = String(theme.type || "").toUpperCase();

  if (type === "COLOR" && theme.color) {
    return isColorDark(theme.color);
  }

  if (type === "IMAGE") {
    if (typeof dynamicImageIsDark === "boolean") {
      return dynamicImageIsDark;
    }
    if (typeof theme.isDark === "boolean") {
      return theme.isDark;
    }
    return true;
  }

  if (theme.preset && typeof theme.preset.isDark === "boolean") {
    return theme.preset.isDark;
  }

  const matched = BUILTIN_THEME_PRESETS.find(
    (p) => p.key === theme.key || p.key === theme?.preset?.key
  );
  return Boolean(matched?.isDark);
}

export function getChatThemeBackgroundStyle(theme) {
  if (!theme || typeof theme !== "object") {
    return {};
  }

  const type = String(theme.type || "").toUpperCase();

  if (type === "IMAGE" && theme.imageUrl) {
    const timestamp = theme.updatedAt
      ? new Date(theme.updatedAt).getTime()
      : "";
    const separator = theme.imageUrl.includes("?") ? "&" : "?";
    const cacheBustedPath =
      timestamp && !theme.imageUrl.includes("t=") && !theme.imageUrl.includes("v=")
        ? `${theme.imageUrl}${separator}t=${timestamp}`
        : theme.imageUrl;

    const fullUrl = getChatAttachmentUrl(cacheBustedPath);
    return {
      backgroundImage: `url("${fullUrl}")`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    };
  }

  if (type === "COLOR" && theme.color) {
    return {
      backgroundColor: theme.color,
    };
  }

  if (type === "PRESET") {
    const preset =
      theme.preset ||
      BUILTIN_THEME_PRESETS.find((p) => p.key === theme.key) ||
      null;

    if (preset?.pattern === "doodle" || theme.key === "subtle_doodle") {
      return {
        backgroundColor: preset?.backgroundColor || "#EFEAE2",
        backgroundImage: `url("${DOODLE_SVG_DATA_URI}")`,
        backgroundRepeat: "repeat",
        backgroundSize: "140px 140px",
      };
    }

    if (preset?.gradient) {
      return {
        background: preset.gradient,
      };
    }
  }

  return {};
}

export function calculateCropCoordinates({
  viewportWidth,
  viewportHeight,
  naturalWidth,
  naturalHeight,
  zoom = 1,
  offset = { x: 0, y: 0 },
}) {
  if (
    !viewportWidth ||
    !viewportHeight ||
    !naturalWidth ||
    !naturalHeight ||
    naturalWidth <= 0 ||
    naturalHeight <= 0 ||
    viewportWidth <= 0 ||
    viewportHeight <= 0
  ) {
    return {
      sx: 0,
      sy: 0,
      sWidth: naturalWidth || 0,
      sHeight: naturalHeight || 0,
      renderedWidth: 0,
      renderedHeight: 0,
      clampedOffsetX: 0,
      clampedOffsetY: 0,
      maxOffsetX: 0,
      maxOffsetY: 0,
    };
  }

  const safeZoom = Math.max(1, Math.min(5, Number(zoom) || 1));
  const fitScale = Math.max(
    viewportWidth / naturalWidth,
    viewportHeight / naturalHeight,
  );
  const scale = fitScale * safeZoom;
  const renderedWidth = naturalWidth * scale;
  const renderedHeight = naturalHeight * scale;

  const maxOffsetX = Math.max(0, (renderedWidth - viewportWidth) / 2);
  const maxOffsetY = Math.max(0, (renderedHeight - viewportHeight) / 2);

  const clampedOffsetX = Math.max(
    -maxOffsetX,
    Math.min(maxOffsetX, Number(offset?.x) || 0),
  );
  const clampedOffsetY = Math.max(
    -maxOffsetY,
    Math.min(maxOffsetY, Number(offset?.y) || 0),
  );

  const imgLeft = (viewportWidth - renderedWidth) / 2 + clampedOffsetX;
  const imgTop = (viewportHeight - renderedHeight) / 2 + clampedOffsetY;

  const sx = Math.max(0, -imgLeft / scale);
  const sy = Math.max(0, -imgTop / scale);
  const sWidth = Math.min(naturalWidth - sx, viewportWidth / scale);
  const sHeight = Math.min(naturalHeight - sy, viewportHeight / scale);

  return {
    sx,
    sy,
    sWidth,
    sHeight,
    renderedWidth,
    renderedHeight,
    clampedOffsetX,
    clampedOffsetY,
    maxOffsetX,
    maxOffsetY,
  };
}
