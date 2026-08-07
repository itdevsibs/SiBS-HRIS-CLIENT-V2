import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Award,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  Loader2,
  MapPin,
  Send,
  UserRoundCheck,
  Users,
} from "lucide-react";

import { getPublicJobDescriptionById } from "@/lib/axios/getPublicJobDescription";

const PUBLIC_APPLICATION_HOST = "sibsapply.getleadsource.com";

function cleanText(value) {
  return String(value ?? "").trim();
}

function firstText(...values) {
  for (const value of values) {
    const text = cleanText(value);

    if (text) return text;
  }

  return "";
}

function safeArray(value) {
  if (Array.isArray(value)) return value;

  if (typeof value !== "string") return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const MBTI_PERSONALITY_LABELS = {
  INTJ: "Architect",
  INTP: "Logician",
  ENTJ: "Commander",
  ENTP: "Debater",
  INFJ: "Advocate",
  INFP: "Mediator",
  ENFJ: "Protagonist",
  ENFP: "Campaigner",
  ISTJ: "Logistician",
  ISFJ: "Defender",
  ESTJ: "Executive",
  ESFJ: "Consul",
  ISTP: "Virtuoso",
  ISFP: "Adventurer",
  ESTP: "Entrepreneur",
  ESFP: "Entertainer",
};

function parsePersonalityTypes(value) {
  const rawValue = cleanText(value);

  if (!rawValue) return [];

  const values = rawValue
    .split(/[,;\n|]/)
    .map((item) => cleanText(item))
    .filter(Boolean);

  return [...new Set(values)].map((item) => {
    const code = item.toUpperCase();
    const knownLabel = MBTI_PERSONALITY_LABELS[code] || "";

    return {
      raw: item,
      code: knownLabel ? code : "",
      label: knownLabel,
    };
  });
}

function formatDate(value) {
  const text = cleanText(value);

  if (!text) return "";

  const date = new Date(text);

  if (Number.isNaN(date.getTime())) return text;

  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function sanitizeRichText(value) {
  const html = cleanText(value);

  if (!html) return "";

  if (
    typeof window === "undefined" ||
    typeof window.DOMParser === "undefined"
  ) {
    return html;
  }

  const parser = new window.DOMParser();
  const documentNode = parser.parseFromString(html, "text/html");

  documentNode
    .querySelectorAll("script, style, iframe, object, embed, link, meta")
    .forEach((node) => node.remove());

  documentNode.querySelectorAll("*").forEach((node) => {
    [...node.attributes].forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const valueText = cleanText(attribute.value).toLowerCase();

      if (
        name.startsWith("on") ||
        valueText.startsWith("javascript:") ||
        name === "srcdoc"
      ) {
        node.removeAttribute(attribute.name);
      }
    });
  });

  return documentNode.body.innerHTML;
}

function isEnabledCompetencyFlag(value) {
  if (value === true || value === 1) return true;

  const normalized = cleanText(value).toLowerCase();

  return normalized === "true" || normalized === "1";
}

function competencyTierDescription(value) {
  if (value === true || value === false || value === 1 || value === 0) {
    return "";
  }

  const text = cleanText(value);
  const normalized = text.toLowerCase();

  if (
    normalized === "true" ||
    normalized === "false" ||
    normalized === "1" ||
    normalized === "0"
  ) {
    return "";
  }

  return text;
}

function normalizeCompetency(competency = {}, index = 0) {
  if (typeof competency === "string") {
    return {
      id: `competency-${index}`,
      title: competency,
      description: "",
      level: "",
      averageDescription: "",
      proficientDescription: "",
      excellentDescription: "",
    };
  }

  const explicitLevel = firstText(
    competency.level,
    competency.proficiencyLevel,
    competency.proficiency_level,
  );

  const level =
    explicitLevel ||
    (isEnabledCompetencyFlag(competency.excellent)
      ? "Excellent"
      : isEnabledCompetencyFlag(competency.proficient)
        ? "Proficient"
        : isEnabledCompetencyFlag(competency.average)
          ? "Average"
          : "");

  return {
    id:
      competency.id ||
      competency.competencyId ||
      competency.competency_id ||
      `competency-${index}`,

    title: firstText(
      competency.title,
      competency.name,
      competency.competency,
      `Competency ${index + 1}`,
    ),

    description: firstText(
      competency.description,
      competency.details,
      competency.definition,
    ),

    level,

    averageDescription: competencyTierDescription(
      competency.averageDescription ?? competency.average,
    ),

    proficientDescription: competencyTierDescription(
      competency.proficientDescription ?? competency.proficient,
    ),

    excellentDescription: competencyTierDescription(
      competency.excellentDescription ?? competency.excellent,
    ),
  };
}

function normalizeJobDescription(payload = {}, routeId = "") {
  const source =
    payload?.jobDescription ||
    payload?.job_description ||
    payload?.data ||
    payload ||
    {};

  const rawCompetencies =
    source.competencies ||
    source.jdCompetencies ||
    source.jd_competencies ||
    source.competencyList ||
    source.competency_list ||
    [];

  return {
    id: firstText(
      source.id,
      source.rawId,
      source.raw_id,
      source.jdId,
      source.jd_id,
      routeId,
    ),

    jdCode: firstText(source.jdCode, source.jd_code, source.code),

    documentTitle: firstText(
      source.documentTitle,
      source.document_title,
      source.roleTitle,
      source.role_title,
      source.positionTitle,
      source.position_title,
      "Job Description",
    ),

    roleTitle: firstText(
      source.roleTitle,
      source.role_title,
      source.positionTitle,
      source.position_title,
      source.documentTitle,
      source.document_title,
    ),

    department: firstText(
      source.department,
      source.departmentName,
      source.department_name,
    ),

    account: firstText(
      source.account,
      source.accountName,
      source.account_name,
      source.accountGhlName,
      source.account_ghl_name,
    ),

    location: firstText(
      source.locationSite,
      source.location_site,
      source.location,
      source.site,
      "Philippines",
    ),

    reportsTo: firstText(source.reportsTo, source.reports_to),

    supervisory: firstText(
      source.supervisory,
      source.supervisoryRole,
      source.supervisory_role,
      "No",
    ),

    effectiveDate: firstText(
      source.effectiveDate,
      source.effective_date,
      source.dateEffective,
      source.date_effective,
    ),

    description: firstText(
      source.description,
      source.positionOverview,
      source.position_overview,
      source.jobDescription,
      source.job_description,
    ),

    responsibilities: firstText(
      source.responsibilities,
      source.dutiesAndResponsibilities,
      source.duties_and_responsibilities,
      source.duties,
    ),

    qualifications: firstText(
      source.qualifications,
      source.requirements,
      source.preferredSkills,
      source.preferred_skills,
    ),

    personalityType: firstText(
      source.personalityType,
      source.personality_type,
      source.personality,
    ),

    remarks: firstText(source.remarks, source.notes),

    competencies: safeArray(rawCompetencies).map(normalizeCompetency),
  };
}

function hasHtml(value) {
  return /<\/?[a-z][\s\S]*>/i.test(cleanText(value));
}

function hasOrderedListHtml(value) {
  return /<ol(?:\s|>)/i.test(cleanText(value));
}

function parseNumberedPlainText(value) {
  const text = cleanText(value);

  if (!text || hasHtml(text)) {
    return {
      intro: "",
      items: [],
      outro: "",
      fallbackText: text,
    };
  }

  const rawLines = text.split(/\r?\n/);
  const introLines = [];
  const outroLines = [];
  const items = [];

  let currentItem = null;
  let listStarted = false;
  let listFinished = false;
  let blankAfterItem = false;

  rawLines.forEach((rawLine) => {
    const line = rawLine.trim();

    if (!line) {
      if (listStarted && currentItem) {
        blankAfterItem = true;
      }

      return;
    }

    const match = line.match(/^(\d+)[.)]\s*(.+)$/);

    if (match && !listFinished) {
      listStarted = true;
      blankAfterItem = false;

      currentItem = {
        number: Number(match[1]),
        text: match[2].trim(),
      };

      items.push(currentItem);
      return;
    }

    if (!listStarted) {
      introLines.push(line);
      return;
    }

    if (blankAfterItem) {
      listFinished = true;
      currentItem = null;
      outroLines.push(line);
      return;
    }

    if (listFinished) {
      outroLines.push(line);
      return;
    }

    if (currentItem) {
      currentItem.text = `${currentItem.text} ${line}`.trim();
      return;
    }

    outroLines.push(line);
  });

  if (!items.length) {
    return {
      intro: "",
      items: [],
      outro: "",
      fallbackText: text,
    };
  }

  return {
    intro: introLines.join(" "),
    items,
    outro: outroLines.join(" "),
    fallbackText: "",
  };
}
function RichTextBlock({ value, emptyText, className = "" }) {
  const text = cleanText(value);

  const sanitizedHtml = useMemo(() => sanitizeRichText(text), [text]);

  const numberedContent = useMemo(() => parseNumberedPlainText(text), [text]);

  if (!text) {
    return (
      <p
        className={`text-xs font-medium italic leading-6 text-slate-400 sm:text-sm ${className}`}
      >
        {emptyText}
      </p>
    );
  }

  if (!hasHtml(text)) {
    if (numberedContent.items.length > 0) {
      return (
        <div
          className={`public-jd-enumerated-flat relative pl-4 sm:pl-5 ${className}`}
        >
          <span
            aria-hidden="true"
            className="absolute bottom-0 left-0 top-0 w-[3px] rounded-full bg-[#FF5C28]"
          />

          {numberedContent.intro ? (
            <p className="mb-4 text-xs font-semibold leading-6 text-slate-700 sm:text-sm">
              {numberedContent.intro}
            </p>
          ) : null}

          <ol className="space-y-3 pl-3 sm:pl-5">
            {numberedContent.items.map((item, index) => (
              <li
                key={`${item.number}-${index}`}
                className="grid grid-cols-[28px_minmax(0,1fr)] items-start gap-3 text-xs font-medium leading-6 text-slate-700 sm:grid-cols-[30px_minmax(0,1fr)] sm:text-sm"
              >
                <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg border border-[#D9E6F0] bg-[#F0F6FA] text-[11px] font-black text-[#07345D]">
                  {item.number}
                </span>

                <span>{item.text}</span>
              </li>
            ))}
          </ol>

          {numberedContent.outro ? (
            <p className="mt-5 border-t border-[#E5ECF3] pt-4 text-xs font-medium leading-6 text-slate-600 sm:text-sm">
              {numberedContent.outro}
            </p>
          ) : null}
        </div>
      );
    }

    return (
      <div
        className={`whitespace-pre-line text-xs font-medium leading-6 text-slate-700 sm:text-sm ${className}`}
      >
        {text}
      </div>
    );
  }

  return (
    <div
      className={`public-jd-rich-text text-xs font-medium leading-6 text-slate-700 sm:text-sm ${className}`}
      dangerouslySetInnerHTML={{
        __html: sanitizedHtml,
      }}
    />
  );
}

function AdditionalInformationBlock({ value }) {
  return (
    <RichTextBlock
      value={value}
      emptyText="No additional information was provided."
    />
  );
}

function PublicApplicationHeaderLogo() {
  return (
    <div className="flex min-w-0 select-none items-center gap-3">
      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-[#FF5C28] shadow-[0_10px_24px_rgba(255,92,40,0.22)]">
        <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-[#042C51] bg-white" />

        <span className="relative text-[20px] font-semibold leading-none tracking-[-0.04em] text-white">
          S
        </span>
      </div>

      <div className="min-w-0 leading-none">
        <div className="flex min-w-0 items-baseline whitespace-nowrap">
          <span className="text-[22px] font-semibold tracking-[-0.035em] text-white">
            SiBS&nbsp;
          </span>

          <span className="text-[22px] font-semibold tracking-[-0.035em] text-[#FF5C28]">
            HRIS
          </span>
        </div>

        <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-300/80">
          Human Resource System
        </p>
      </div>
    </div>
  );
}

function PublicLogo() {
  return (
    <div className="flex min-w-0 select-none items-center gap-3">
      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-[#FF5C28] shadow-[0_10px_24px_rgba(255,92,40,0.22)]">
        <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-[#042C51] bg-white" />

        <span className="text-[20px] font-semibold leading-none text-white">
          S
        </span>
      </div>

      <div className="min-w-0 leading-none">
        <div className="flex items-baseline whitespace-nowrap">
          <span className="text-[22px] font-semibold tracking-[-0.035em] text-white">
            SiBS&nbsp;
          </span>

          <span className="text-[22px] font-semibold tracking-[-0.035em] text-[#FF5C28]">
            HRIS
          </span>
        </div>

        <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-300/80">
          Careers
        </p>
      </div>
    </div>
  );
}

function CareerSection({ icon: Icon, title, children, noBorder = false }) {
  return (
    <section
      className={`py-5 sm:py-6 ${noBorder ? "" : "border-b border-[#E5ECF3]"}`}
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#FFF0EA] text-[#F05223]">
          <Icon size={16} />
        </div>

        <h2 className="text-sm font-extrabold uppercase tracking-[0.045em] text-[#07345D] sm:text-[15px]">
          {title}
        </h2>
      </div>

      {children}
    </section>
  );
}

function SimpleFact({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EEF5FA] text-[#07345D]">
        <Icon size={15} />
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-extrabold leading-6 text-[#07345D]">
          {value}
        </p>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-2xl border border-[#E3EAF1] bg-white p-8 text-center shadow-[0_18px_60px_rgba(4,44,81,0.12)]">
        <Loader2 className="mx-auto animate-spin text-[#FF5C28]" size={34} />

        <h1 className="mt-5 text-lg font-extrabold text-[#07345D]">
          Loading job description
        </h1>

        <p className="mt-2 text-sm font-semibold text-slate-500">
          Please wait while we prepare the selected position.
        </p>
      </div>
    </div>
  );
}

function ErrorState({ title, message, onBack, onRetry }) {
  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-2xl border border-red-100 bg-white p-7 text-center shadow-[0_18px_60px_rgba(4,44,81,0.12)] sm:p-9">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
          <AlertTriangle size={28} />
        </div>

        <h1 className="mt-5 text-xl font-extrabold text-[#07345D]">{title}</h1>

        <p className="mx-auto mt-3 max-w-md text-sm font-semibold leading-6 text-slate-500">
          {message}
        </p>

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#CAD6E2] bg-white px-5 text-sm font-extrabold text-[#07345D] transition hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Back to application
          </button>

          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-[#07345D] px-5 text-sm font-extrabold text-white transition hover:bg-[#0A416F]"
            >
              Try again
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function PublicJobDescriptionPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [requestState, setRequestState] = useState({
    loading: true,
    error: "",
    data: null,
    reloadKey: 0,
  });

  const jobDescription = useMemo(
    () =>
      requestState.data ? normalizeJobDescription(requestState.data, id) : null,
    [id, requestState.data],
  );

  useEffect(() => {
    const className = "public-job-description-page";

    const styleId = "public-job-description-isolated-style";

    document.documentElement.classList.add(className);

    document.body.classList.add(className);

    let style = document.getElementById(styleId);

    if (!style) {
      style = document.createElement("style");

      style.id = styleId;

      document.head.appendChild(style);
    }

    style.innerHTML = `
      html.public-job-description-page,
      body.public-job-description-page {
        margin: 0 !important;
        min-height: 100% !important;
        overflow: hidden !important;
        background: #f3f7fb !important;
      }

      body.public-job-description-page aside,
      body.public-job-description-page .sidebar,
      body.public-job-description-page [data-sidebar],
      body.public-job-description-page nav.sidebar,
      body.public-job-description-page .app-sidebar,
      body.public-job-description-page .main-sidebar {
        display: none !important;
        width: 0 !important;
        min-width: 0 !important;
        max-width: 0 !important;
      }

      body.public-job-description-page .main-content,
      body.public-job-description-page .content-wrapper,
      body.public-job-description-page .page-content {
        width: 100% !important;
        max-width: 100% !important;
        margin-left: 0 !important;
        padding-left: 0 !important;
      }

      .public-jd-rich-text {
        word-break: normal;
        overflow-wrap: anywhere;
      }

      .public-jd-rich-text p {
        margin: 0 0 1rem;
      }

      .public-jd-rich-text p:last-child {
        margin-bottom: 0;
      }

      .public-jd-rich-text h1,
      .public-jd-rich-text h2,
      .public-jd-rich-text h3,
      .public-jd-rich-text h4,
      .public-jd-rich-text h5,
      .public-jd-rich-text h6 {
        margin: 1.35rem 0 0.55rem;
        color: #07345d;
        font-weight: 800;
        line-height: 1.45;
      }

      .public-jd-rich-text h1:first-child,
      .public-jd-rich-text h2:first-child,
      .public-jd-rich-text h3:first-child,
      .public-jd-rich-text h4:first-child,
      .public-jd-rich-text h5:first-child,
      .public-jd-rich-text h6:first-child {
        margin-top: 0;
      }

      .public-jd-rich-text ul {
        margin: 0.8rem 0 1rem;
        padding-left: 1.55rem;
        list-style: disc;
      }

      .public-jd-rich-text ul > li {
        margin: 0.42rem 0;
        padding-left: 0.15rem;
      }

      .public-jd-rich-text ol {
        position: relative;
        margin: 0.9rem 0 0;
        padding-left: 2.25rem;
        list-style: none;
        counter-reset: jd-enumeration;
      }

      .public-jd-rich-text ol::before {
        content: "";
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        width: 3px;
        border-radius: 9999px;
        background: #ff5c28;
      }

      .public-jd-rich-text ol > li {
        position: relative;
        min-height: 1.75rem;
        margin: 0.72rem 0;
        padding-left: 2.6rem;
        counter-increment: jd-enumeration;
      }

      .public-jd-rich-text ol > li::before {
        content: counter(jd-enumeration);
        position: absolute;
        left: 0;
        top: 0.08rem;
        display: flex;
        width: 1.75rem;
        height: 1.75rem;
        align-items: center;
        justify-content: center;
        border: 1px solid #d9e6f0;
        border-radius: 0.5rem;
        background: #f0f6fa;
        color: #07345d;
        font-size: 0.7rem;
        font-weight: 900;
        line-height: 1;
      }

      .public-jd-rich-text strong,
      .public-jd-rich-text b {
        font-weight: 800;
        color: #07345d;
      }

      .public-jd-rich-text em,
      .public-jd-rich-text i {
        font-style: italic;
      }

      .public-jd-rich-text a {
        color: #e84a17;
        font-weight: 700;
        text-decoration: underline;
        text-underline-offset: 2px;
      }

      .public-jd-rich-text blockquote {
        margin: 1rem 0;
        border-left: 3px solid #ff5c28;
        padding-left: 1rem;
        color: #475569;
      }

      .public-jd-rich-text table {
        width: 100%;
        margin: 1rem 0;
        border-collapse: collapse;
        overflow: hidden;
      }

      .public-jd-rich-text th,
      .public-jd-rich-text td {
        border: 1px solid #dfe7ef;
        padding: 0.65rem 0.75rem;
        text-align: left;
        vertical-align: top;
      }

      .public-jd-rich-text th {
        background: #f4f8fb;
        color: #07345d;
        font-weight: 800;
      }

    `;

    return () => {
      document.documentElement.classList.remove(className);

      document.body.classList.remove(className);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadJobDescription() {
      if (!cleanText(id)) {
        setRequestState((current) => ({
          ...current,
          loading: false,
          error:
            "The job description link is incomplete. Select an open position from the application form first.",
          data: null,
        }));

        return;
      }

      setRequestState((current) => ({
        ...current,
        loading: true,
        error: "",
        data: null,
      }));

      try {
        const result = await getPublicJobDescriptionById(id);

        if (cancelled) return;

        if (!result?.success || !result?.data) {
          throw new Error(
            result?.message || "The selected job description was not found.",
          );
        }

        setRequestState((current) => ({
          ...current,
          loading: false,
          error: "",
          data: result.data,
        }));
      } catch (error) {
        if (cancelled) return;

        setRequestState((current) => ({
          ...current,
          loading: false,
          error:
            error?.response?.data?.message ||
            error?.response?.data?.error ||
            error?.message ||
            "Unable to load the selected job description.",
          data: null,
        }));
      }
    }

    loadJobDescription();

    return () => {
      cancelled = true;
    };
  }, [id, requestState.reloadKey]);

  function getApplicationPath() {
    const hostname =
      typeof window !== "undefined"
        ? String(window.location.hostname || "").toLowerCase()
        : "";

    return hostname === PUBLIC_APPLICATION_HOST ? "/" : "/apply";
  }

  function handleReturnToApplication() {
    if (typeof window !== "undefined") {
      if (window.opener && !window.opener.closed) {
        window.opener.focus();
        window.close();
        return;
      }

      if (window.history.length <= 1) {
        window.close();

        window.setTimeout(() => {
          navigate(getApplicationPath());
        }, 120);

        return;
      }
    }

    navigate(getApplicationPath());
  }

  function handleRetry() {
    setRequestState((current) => ({
      ...current,
      reloadKey: current.reloadKey + 1,
    }));
  }

  if (requestState.loading) {
    return (
      <div className="fixed inset-0 z-[10000] overflow-y-auto bg-[#F3F7FB] font-jakarta">
        <LoadingState />
      </div>
    );
  }

  if (requestState.error || !jobDescription) {
    return (
      <div className="fixed inset-0 z-[10000] overflow-y-auto bg-[#F3F7FB] font-jakarta">
        <ErrorState
          title="Job description unavailable"
          message={
            requestState.error ||
            "The selected job description could not be loaded."
          }
          onBack={handleReturnToApplication}
          onRetry={cleanText(id) ? handleRetry : null}
        />
      </div>
    );
  }

  const competencyCount = jobDescription.competencies.length;

  const effectiveDate = formatDate(jobDescription.effectiveDate);

  const personalityTypes = parsePersonalityTypes(
    jobDescription.personalityType,
  );

  const hasRoleFacts =
    Boolean(jobDescription.account) || Boolean(effectiveDate);

  return (
    <div className="fixed inset-0 z-[10000] overflow-y-auto bg-[#F3F7FB] font-jakarta text-slate-800">
      {/* =================================================
          EXISTING HEADER — KEPT
      ================================================= */}

      <header className="sticky top-0 z-[500] border-b border-[#083A69] bg-[#042C51] text-white shadow-md">
        <div className="mx-auto flex w-full max-w-[1060px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <PublicApplicationHeaderLogo />

            <div className="min-w-0 border-l border-white/10 pl-3">
              <span className="rounded-full border border-[#FF5C28]/40 bg-[#FF5C28]/15 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-[#FF8A63] sm:text-[10px]">
                Public Portal
              </span>

              <p className="mt-1.5 truncate text-[10px] font-semibold text-slate-300 sm:text-[11px]">
                SiBS Job Description
              </p>
            </div>
          </div>
        </div>

        <div className="h-1.5 bg-[#02172C]" />
      </header>

      <main className="mx-auto w-full max-w-[1060px] px-4 py-6 sm:px-6 sm:py-8">
        {/* =================================================
            EXISTING JOB TITLE HERO — KEPT
        ================================================= */}

        <section className="relative overflow-hidden rounded-2xl border border-[#0A467E] bg-[#07345D] p-5 text-white shadow-lg sm:p-6">
          <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-[#FF5C28]/18 blur-2xl" />

          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-60 w-60 rounded-full bg-sky-300/10 blur-3xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 max-w-4xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.15em] text-white/85">
                <BriefcaseBusiness size={14} />
                Open Position
              </div>

              <h1 className="mt-3 break-words text-2xl font-black leading-tight tracking-[-0.03em] sm:text-3xl">
                {jobDescription.roleTitle || jobDescription.documentTitle}
              </h1>

              {jobDescription.documentTitle &&
              jobDescription.documentTitle !== jobDescription.roleTitle ? (
                <p className="mt-3 text-sm font-semibold leading-6 text-slate-200 sm:text-base">
                  {jobDescription.documentTitle}
                </p>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                {jobDescription.jdCode ? (
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-extrabold text-white/90">
                    {jobDescription.jdCode}
                  </span>
                ) : null}

                {jobDescription.department ? (
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-extrabold text-white/90">
                    {jobDescription.department}
                  </span>
                ) : null}

                {jobDescription.location ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-extrabold text-white/90">
                    <MapPin size={13} />

                    {jobDescription.location}
                  </span>
                ) : null}
              </div>
            </div>

            <button
              type="button"
              onClick={handleReturnToApplication}
              className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[#FF5C28] px-5 text-xs font-extrabold sm:text-sm text-white shadow-[0_12px_28px_rgba(255,92,40,0.30)] transition hover:bg-[#F04F1B] active:scale-[0.99] sm:w-auto"
            >
              <Send size={17} />
              Continue Application
            </button>
          </div>
        </section>

        {/* =================================================
            CAREERS-STYLE SINGLE COLUMN BODY
        ================================================= */}

        <div className="mt-6 w-full">
          <article className="overflow-hidden rounded-2xl border border-[#E0E8F0] bg-white px-5 shadow-sm sm:px-6">
            {/* POSITION OVERVIEW */}

            <CareerSection icon={FileText} title="Position Overview">
              <RichTextBlock
                value={jobDescription.description}
                emptyText="No position overview was provided."
              />
            </CareerSection>

            {/* SUPERVISORY */}

            <CareerSection icon={Users} title="Supervisory">
              <p className="text-sm font-bold leading-6 text-slate-700">
                {jobDescription.supervisory || "No"}
              </p>
            </CareerSection>

            {/* DUTIES & RESPONSIBILITIES */}

            <CareerSection
              icon={ClipboardList}
              title="Duties & Responsibilities"
            >
              <RichTextBlock
                value={jobDescription.responsibilities}
                emptyText="No duties and responsibilities were provided."
              />
            </CareerSection>

            {/* REPORTS TO */}

            <CareerSection icon={UserRoundCheck} title="Reports To">
              <p className="text-sm font-bold leading-6 text-slate-700">
                {jobDescription.reportsTo || "Not specified"}
              </p>
            </CareerSection>

            {/* QUALIFICATIONS */}

            <CareerSection
              icon={CheckCircle2}
              title="Qualifications & Characteristics"
            >
              <RichTextBlock
                value={jobDescription.qualifications}
                emptyText="No qualifications were provided."
              />
            </CareerSection>

            {/* KEY COMPETENCIES */}

            {competencyCount > 0 ? (
              <CareerSection icon={Award} title="Key Competencies">
                <div className="space-y-7">
                  {jobDescription.competencies.map((competency, index) => {
                    const tierDescriptions = [
                      ["Average", competency.averageDescription],
                      ["Proficient", competency.proficientDescription],
                      ["Excellent", competency.excellentDescription],
                    ].filter(([, value]) => cleanText(value));

                    return (
                      <div
                        key={competency.id || `competency-${index}`}
                        className="relative pl-5 sm:pl-6"
                      >
                        <span className="absolute bottom-0 left-0 top-0 w-[3px] rounded-full bg-[#FF5C28]" />

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-5">
                          <h3 className="text-sm font-extrabold leading-6 text-[#07345D]">
                            {competency.title}
                          </h3>

                          {competency.level ? (
                            <span className="w-fit shrink-0 rounded-full bg-[#EEF5FA] px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#07345D]">
                              {competency.level}
                            </span>
                          ) : null}
                        </div>

                        {competency.description ? (
                          <p className="mt-2 whitespace-pre-line text-xs font-medium leading-6 text-slate-600 sm:text-sm">
                            {competency.description}
                          </p>
                        ) : null}

                        {tierDescriptions.length > 0 ? (
                          <div className="mt-4 space-y-3">
                            {tierDescriptions.map(([label, value]) => (
                              <div
                                key={label}
                                className="rounded-xl bg-[#F6F9FC] px-4 py-3"
                              >
                                <p className="text-[10px] font-extrabold uppercase tracking-[0.11em] text-[#F05223]">
                                  {label}
                                </p>

                                <p className="mt-1 whitespace-pre-line text-xs font-medium leading-6 text-slate-600 sm:text-sm">
                                  {value}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </CareerSection>
            ) : null}

            {/* PREFERRED PERSONALITY TYPE */}

            {personalityTypes.length > 0 ? (
              <CareerSection
                icon={UserRoundCheck}
                title="Preferred Personality Type"
              >
                <div className="flex flex-wrap gap-3">
                  {personalityTypes.map((personality, index) => (
                    <div
                      key={`${personality.raw}-${index}`}
                      className="group flex min-w-[155px] items-center gap-2.5 rounded-xl border border-[#D6E3EF] bg-gradient-to-br from-[#F8FBFE] to-[#EEF5FA] px-3.5 py-3 shadow-[0_6px_18px_rgba(7,52,93,0.045)] transition duration-200 hover:-translate-y-0.5 hover:border-[#B9D1E5] hover:shadow-[0_10px_24px_rgba(7,52,93,0.08)]"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#07345D] shadow-[0_6px_14px_rgba(7,52,93,0.16)]">
                        <span className="text-[11px] font-black tracking-[0.055em] text-white">
                          {personality.code || "TYPE"}
                        </span>
                      </div>

                      <div className="min-w-0">
                        {personality.code ? (
                          <>
                            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#FF5C28]">
                              {personality.code}
                            </p>

                            <p className="mt-0.5 text-xs font-extrabold leading-5 text-[#07345D] sm:text-sm">
                              {personality.label}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#FF5C28]">
                              Personality Type
                            </p>

                            <p className="mt-0.5 break-words text-xs font-extrabold leading-5 text-[#07345D] sm:text-sm">
                              {personality.raw}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CareerSection>
            ) : null}

            {/* ADDITIONAL INFORMATION */}

            {jobDescription.remarks ? (
              <CareerSection
                icon={BriefcaseBusiness}
                title="Additional Information"
                noBorder
              >
                <AdditionalInformationBlock value={jobDescription.remarks} />
              </CareerSection>
            ) : null}
          </article>

          {/* =================================================
              READY TO APPLY CTA
          ================================================= */}

          <section className="relative mt-6 overflow-hidden rounded-2xl bg-[#07345D] p-5 text-white shadow-lg sm:p-6">
            <div className="pointer-events-none absolute -right-14 -top-20 h-52 w-52 rounded-full bg-[#FF5C28]/20 blur-2xl" />

            <div className="pointer-events-none absolute -bottom-24 left-1/4 h-48 w-48 rounded-full bg-sky-300/10 blur-3xl" />

            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-xl">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#FF9A79]">
                  SiBS Careers
                </p>

                <h2 className="mt-2 text-xl font-black tracking-[-0.025em] sm:text-2xl">
                  Ready to apply?
                </h2>

                <p className="mt-3 text-xs font-semibold leading-6 text-slate-200 sm:text-sm">
                  Continue your application for this position and submit your
                  candidate information.
                </p>
              </div>

              <button
                type="button"
                onClick={handleReturnToApplication}
                className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[#FF5C28] px-5 text-xs font-extrabold sm:text-sm text-white shadow-[0_12px_28px_rgba(255,92,40,0.28)] transition hover:bg-[#F04F1B] active:scale-[0.99] sm:w-auto"
              >
                <Send size={17} />
                Apply Now
              </button>
            </div>
          </section>
        </div>
      </main>

      {/* =================================================
          CAREERS FOOTER
      ================================================= */}

      <footer className="border-t border-white/10 bg-[#052F55]">
        <div className="mx-auto flex w-full max-w-[1060px] flex-col gap-3 px-4 py-5 text-center sm:px-6 md:flex-row md:items-center md:justify-between md:text-left">
          <PublicLogo />

          <p className="text-xs font-semibold text-slate-300/80">
            © {new Date().getFullYear()} SiBS HRIS Careers
          </p>
        </div>
      </footer>
    </div>
  );
}
