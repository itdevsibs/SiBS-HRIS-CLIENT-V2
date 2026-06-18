import {
  Eye,
  ClipboardList,
  UserRound,
  BriefcaseBusiness,
  GraduationCap,
  ShieldCheck,
  Phone,
  FileText,
} from "lucide-react";

function cleanText(value) {
  return String(value ?? "").trim();
}

function escapeHtml(value = "") {
  return cleanText(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getApiBaseUrl() {
  return cleanText(import.meta.env.VITE_API_URL).replace(/\/+$/, "");
}

function getResolvedFileUrl(fileUrl = "") {
  const value = cleanText(fileUrl);

  if (!value) return "";

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:") ||
    value.startsWith("blob:")
  ) {
    return value;
  }

  const apiBaseUrl = getApiBaseUrl();

  if (value.startsWith("/api/") && apiBaseUrl) {
    return `${apiBaseUrl}${value}`;
  }

  return value;
}

function getFileExtension(fileName = "") {
  const value = cleanText(fileName).toLowerCase();
  const dotIndex = value.lastIndexOf(".");

  if (dotIndex === -1) return "";

  return value.slice(dotIndex);
}

function isImageFile(fileType = "", fileName = "") {
  const type = cleanText(fileType).toLowerCase();
  const extension = getFileExtension(fileName);

  return (
    type.startsWith("image/") ||
    [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg"].includes(
      extension,
    )
  );
}

function isPdfFile(fileType = "", fileName = "") {
  const type = cleanText(fileType).toLowerCase();
  const extension = getFileExtension(fileName);

  return type.includes("pdf") || extension === ".pdf";
}

function isAudioFile(fileType = "", fileName = "", audio = false) {
  const type = cleanText(fileType).toLowerCase();
  const extension = getFileExtension(fileName);

  return (
    audio ||
    type.startsWith("audio/") ||
    [
      ".mp3",
      ".wav",
      ".wave",
      ".m4a",
      ".aac",
      ".ogg",
      ".oga",
      ".webm",
      ".mp4",
      ".mpeg",
      ".mpga",
      ".flac",
      ".amr",
      ".3gp",
      ".opus",
      ".aif",
      ".aiff",
      ".caf",
      ".wma",
    ].includes(extension)
  );
}

function getViewerKind({ fileType = "", fileName = "", audio = false }) {
  if (isAudioFile(fileType, fileName, audio)) return "audio";
  if (isImageFile(fileType, fileName)) return "image";
  if (isPdfFile(fileType, fileName)) return "pdf";

  return "document";
}

function openCenteredFullPageFileViewer({
  fileUrl = "",
  fileName = "File Preview",
  fileType = "",
  audio = false,
}) {
  const resolvedUrl = getResolvedFileUrl(fileUrl);

  if (!resolvedUrl) return;

  const kind = getViewerKind({
    fileType,
    fileName,
    audio,
  });

  const safeUrl = escapeHtml(resolvedUrl);
  const safeFileName = escapeHtml(fileName || "file");

  const previewWindow = window.open("", "_blank");

  if (!previewWindow) {
    window.open(resolvedUrl, "_blank", "noopener,noreferrer");
    return;
  }

  const imageViewer = `
    <main class="viewer image-viewer">
      <img src="${safeUrl}" alt="" />
    </main>
  `;

  const audioViewer = `
    <main class="viewer audio-viewer">
      <div class="audio-card">
        <div class="audio-icon">♪</div>
        <audio src="${safeUrl}" controls autoplay></audio>
        <a href="${safeUrl}" download="${safeFileName}" class="action-button">
          Download file
        </a>
      </div>
    </main>
  `;

  const frameViewer = `
    <main class="viewer frame-viewer">
      <iframe src="${safeUrl}" title="File Preview"></iframe>
      ${
        kind === "document"
          ? `<a href="${safeUrl}" target="_blank" rel="noreferrer" class="floating-button">Open file</a>`
          : ""
      }
    </main>
  `;

  const bodyContent =
    kind === "image" ? imageViewer : kind === "audio" ? audioViewer : frameViewer;

  previewWindow.document.open();
  previewWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
        <title>File Preview</title>

        <style>
          * {
            box-sizing: border-box;
          }

          html,
          body {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            overflow: hidden;
            background: #f8fafc;
            font-family:
              "Plus Jakarta Sans",
              Inter,
              system-ui,
              -apple-system,
              BlinkMacSystemFont,
              "Segoe UI",
              sans-serif;
          }

          .viewer {
            width: 100vw;
            height: 100vh;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            background: #f8fafc;
          }

          .image-viewer {
            background:
              radial-gradient(
                circle at center,
                #ffffff 0%,
                #f8fafc 54%,
                #e9eff6 100%
              );
          }

          .image-viewer img {
            display: block;
            width: auto;
            height: auto;
            max-width: 100vw;
            max-height: 100vh;
            object-fit: contain;
            margin: auto;
          }

          .frame-viewer {
            position: relative;
            background: #f8fafc;
          }

          .frame-viewer iframe {
            width: 100vw;
            height: 100vh;
            border: 0;
            background: #ffffff;
          }

          .audio-viewer {
            padding: 24px;
            background:
              radial-gradient(
                circle at center,
                #ffffff 0%,
                #f8fafc 55%,
                #e7eef7 100%
              );
          }

          .audio-card {
            width: min(720px, calc(100vw - 32px));
            border: 1px solid #d9e2ec;
            border-radius: 24px;
            background: #ffffff;
            padding: 28px;
            box-shadow: 0 24px 70px rgba(15, 23, 42, 0.14);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 18px;
          }

          .audio-icon {
            width: 64px;
            height: 64px;
            border-radius: 22px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #eef6ff;
            color: #0d4676;
            font-size: 34px;
            font-weight: 900;
          }

          audio {
            width: 100%;
          }

          .action-button,
          .floating-button {
            min-height: 44px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 14px;
            background: #0d4676;
            color: #ffffff;
            padding: 0 18px;
            text-decoration: none;
            font-size: 14px;
            font-weight: 800;
          }

          .floating-button {
            position: fixed;
            right: 18px;
            bottom: 18px;
            box-shadow: 0 18px 50px rgba(15, 23, 42, 0.18);
          }

          @media (max-width: 640px) {
            .audio-viewer {
              padding: 14px;
            }

            .audio-card {
              padding: 20px;
              border-radius: 20px;
            }

            .floating-button {
              left: 14px;
              right: 14px;
              bottom: 14px;
              width: auto;
            }
          }
        </style>
      </head>

      <body>
        ${bodyContent}
      </body>
    </html>
  `);
  previewWindow.document.close();
}

export function FieldLabel({ children }) {
  return (
    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
      {children}
    </label>
  );
}

export function DetailRow({ label, value, stacked = false }) {
  if (stacked) {
    return (
      <div className="border-b border-[#E6ECF2] py-3 last:border-b-0">
        <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
          {label}
        </p>

        <p className="mt-1 whitespace-pre-line break-words text-sm font-bold leading-6 text-[#344054]">
          {value || "—"}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[130px_minmax(0,1fr)] items-start gap-4 border-b border-[#E6ECF2] py-3 last:border-b-0">
      <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
        {label}
      </p>

      <p className="min-w-0 whitespace-pre-line break-words text-right text-sm font-bold leading-6 text-[#344054]">
        {value || "—"}
      </p>
    </div>
  );
}

export function SectionTitle({ icon: Icon, title, description }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      {Icon && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sibs-primary-1/10 text-sibs-primary-1">
          <Icon size={18} />
        </div>
      )}

      <div className="min-w-0">
        <h3 className="text-base font-extrabold text-[#101828]">{title}</h3>

        {description && (
          <p className="mt-1 text-sm font-semibold leading-5 text-sibs-primary-1/80">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

export function InfoTile({
  label,
  value,
  description,
  icon: Icon,
  accent = false,
  className = "",
}) {
  return (
    <div
      className={`rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 transition hover:border-[#C9D6E4] ${className}`}
    >
      <div className="flex items-start gap-3">
        {Icon && (
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
              accent
                ? "bg-sibs-primary-1 text-white"
                : "bg-white text-sibs-primary-1"
            }`}
          >
            <Icon size={16} />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
            {label}
          </p>

          <p className="mt-1 break-words text-sm font-extrabold leading-6 text-[#101828]">
            {value || "—"}
          </p>

          {description && (
            <p className="mt-1 break-words text-xs font-semibold leading-5 text-sibs-tertiary-5">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function StatusTile({ label, value }) {
  const normalizedValue = String(value || "").trim();
  const isYes = normalizedValue.toLowerCase() === "yes";

  return (
    <div className="rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
      <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
        {label}
      </p>

      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="truncate text-sm font-extrabold text-[#101828]">
          {normalizedValue || "—"}
        </p>

        {normalizedValue && normalizedValue !== "—" && (
          <span
            className={`inline-flex shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-extrabold ${
              isYes
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-gray-200 bg-white text-gray-600"
            }`}
          >
            {isYes ? "Ready" : "Review"}
          </span>
        )}
      </div>
    </div>
  );
}

export function ReferenceCard({ reference, index }) {
  return (
    <div className="rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
      <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
        Reference {index + 1}
      </p>

      <p className="mt-2 truncate text-sm font-extrabold text-[#101828]">
        {reference?.name || "—"}
      </p>

      <p className="mt-1 truncate text-sm font-semibold text-sibs-primary-1">
        {reference?.phone || "No phone provided"}
      </p>
    </div>
  );
}

export function ExperienceCard({ experience, index, formatCurrency }) {
  const title =
    experience?.role || experience?.industry || `Experience ${index + 1}`;

  return (
    <div className="rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
            Experience {index + 1}
          </p>

          <p className="mt-1 truncate text-sm font-extrabold text-[#101828]">
            {title}
          </p>

          <p className="mt-1 truncate text-xs font-semibold text-sibs-tertiary-5">
            {experience?.company || "Company not provided"}
          </p>
        </div>

        <span className="inline-flex w-fit rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
          {experience?.years ? `${experience.years} year(s)` : "No duration"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
            Industry
          </p>

          <p className="mt-1 text-sm font-bold text-[#344054]">
            {experience?.industry || "—"}
          </p>
        </div>

        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
            Compensation
          </p>

          <p className="mt-1 text-sm font-bold text-[#344054]">
            {experience?.monthlyCompensation
              ? formatCurrency(experience.monthlyCompensation)
              : "—"}
          </p>
        </div>

        <div className="sm:col-span-2">
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
            Reason for Leaving
          </p>

          <p className="mt-1 text-sm font-bold leading-6 text-[#344054]">
            {experience?.reasonForLeaving || "—"}
          </p>
        </div>
      </div>
    </div>
  );
}

export function TimelineSectionHeader({
  step,
  icon: Icon,
  title,
  description,
}) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sibs-primary-1 text-sm font-extrabold text-white">
        {step}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={17} className="shrink-0 text-sibs-primary-1" />}

          <h3 className="text-sm font-extrabold text-[#101828]">{title}</h3>
        </div>

        {description && (
          <p className="mt-1 text-xs font-semibold leading-5 text-sibs-tertiary-5">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

export function ViewableFileRow({
  label,
  fileName,
  fileUrl,
  fileType,
  audio = false,
}) {
  const resolvedUrl = getResolvedFileUrl(fileUrl);
  const hasFile = Boolean(fileName || resolvedUrl);
  const canOpen = Boolean(resolvedUrl);

  const viewerKind = getViewerKind({
    fileType,
    fileName,
    audio,
  });

  const canPreview =
    viewerKind === "image" || viewerKind === "audio" || viewerKind === "pdf";

  function handleOpenFile() {
    if (!canOpen) return;

    openCenteredFullPageFileViewer({
      fileUrl: resolvedUrl,
      fileName,
      fileType,
      audio,
    });
  }

  return (
    <div className="rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
            {label}
          </p>

          <p className="mt-1 break-words text-sm font-bold text-[#344054]">
            {hasFile ? fileName || "Uploaded file" : "No file uploaded"}
          </p>

          {hasFile && !canOpen && (
            <p className="mt-1 text-xs font-semibold text-amber-700">
              File name is saved, but the actual file is not available for
              preview.
            </p>
          )}
        </div>

        {hasFile && canOpen && (
          <button
            type="button"
            onClick={handleOpenFile}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 text-sm font-bold text-sibs-primary-1 transition hover:border-sibs-primary-1 hover:bg-sibs-primary-1/5 hover:shadow-sm"
          >
            <Eye size={16} />
            {canPreview ? "View" : "Open"}
          </button>
        )}
      </div>

      {audio && canOpen && (
        <audio controls src={resolvedUrl} className="mt-4 w-full">
          <track kind="captions" />
          Your browser does not support the audio player.
        </audio>
      )}
    </div>
  );
}

export function MultiCheckGroup({
  options,
  value,
  onChange,
  columns = "md:grid-cols-2",
}) {
  const selected = Array.isArray(value) ? value : [];

  function toggle(option) {
    if (selected.includes(option)) {
      onChange(selected.filter((item) => item !== option));
      return;
    }

    onChange([...selected, option]);
  }

  return (
    <div className={`grid grid-cols-1 gap-2 ${columns}`}>
      {options.map((option) => (
        <label
          key={option}
          className="flex items-center gap-3 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 py-3 text-sm font-semibold text-[#344054] transition hover:border-[#C9D6E4] hover:bg-white"
        >
          <input
            type="checkbox"
            checked={selected.includes(option)}
            onChange={() => toggle(option)}
            className="h-4 w-4"
          />

          {option}
        </label>
      ))}
    </div>
  );
}

export const sectionIcons = {
  ClipboardList,
  UserRound,
  BriefcaseBusiness,
  GraduationCap,
  ShieldCheck,
  Phone,
  FileText,
};