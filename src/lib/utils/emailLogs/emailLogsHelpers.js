const ALL_FILTER = "all";

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function matchesFilter(value, filter) {
  const normalizedFilter = normalize(filter);
  return !normalizedFilter || normalizedFilter === ALL_FILTER || normalize(value) === normalizedFilter;
}

function matchesStatus(record, filter) {
  const normalizedFilter = normalize(filter);
  if (!normalizedFilter || normalizedFilter === ALL_FILTER) return true;
  if (normalizedFilter === "internal") return normalize(record.category) === "approval needed";
  if (normalizedFilter === "relay") return ["bounced", "failed"].includes(normalize(record.status));
  return normalize(record.status) === normalizedFilter;
}

export const DEFAULT_EMAIL_LOG_CATEGORIES = [
  "Job Offer",
  "Interview",
  "Approval Needed",
  "Intake Form",
  "Assessment",
  "NHO Schedule",
  "Weekly Digest",
  "Talent Pool",
  "System Email",
];

export function filterEmailLogCategoryOptions(categories = [], search = "") {
  const keyword = normalize(search);

  if (!keyword) {
    return [...categories];
  }

  return categories.filter((category) => normalize(category).includes(keyword));
}

export function buildEmailLogCategories(records = []) {
  const seen = new Set(DEFAULT_EMAIL_LOG_CATEGORIES.map(normalize));
  const additionalCategories = [];

  for (const record of records) {
    const category = String(record?.category ?? "").trim();
    const key = normalize(category);

    if (!category || seen.has(key)) continue;

    seen.add(key);
    additionalCategories.push(category);
  }

  return [
    ...DEFAULT_EMAIL_LOG_CATEGORIES,
    ...additionalCategories.sort((left, right) => left.localeCompare(right)),
  ];
}


export function normalizeEmailLogRecord(record = {}) {
  const normalizeStatus = (value) => {
    const status = normalize(value).replace(/[\s_-]+/g, " ");

    if (["sent", "success", "successful", "accepted", "processed", "delivered"].includes(status)) return "delivered";
    if (["open", "opened", "read"].includes(status)) return "opened";
    if (["click", "clicked", "clicked cta", "cta clicked"].includes(status)) return "clicked";
    if (["bounce", "bounced", "rejected", "undeliverable"].includes(status)) return "bounced";
    if (["fail", "failed", "failure", "error", "send failed"].includes(status)) return "failed";

    return status || "delivered";
  };

  return {
    ...record,
    id: String(record.id ?? record.log_id ?? record.email_log_id ?? "").trim(),
    recipient: String(record.recipient ?? record.recipient_name ?? record.email ?? record.recipient_email ?? "Recipient").trim(),
    email: String(record.email ?? record.recipient_email ?? "").trim(),
    role: String(record.role ?? record.recipient_role ?? "Recipient").trim(),
    site: String(record.site ?? record.location ?? "—").trim() || "—",
    category: String(record.category ?? record.email_category ?? "System Email").trim(),
    subject: String(record.subject ?? record.email_subject ?? "SiBS HRIS Communication").trim(),
    preview: String(record.preview ?? record.message_preview ?? "").trim(),
    textBody: String(record.textBody ?? record.text_body ?? ""),
    htmlBody: String(record.htmlBody ?? record.html_body ?? ""),
    position: String(record.position ?? record.job_position ?? "—").trim() || "—",
    account: String(record.account ?? record.account_name ?? "—").trim() || "—",
    status: normalizeStatus(record.status ?? record.delivery_status),
    statusDetail: String(record.statusDetail ?? record.status_detail ?? record.error_message ?? "").trim() || undefined,
    senderEmail: String(record.senderEmail ?? record.sender_email ?? "").trim(),
    replyTo: String(record.replyTo ?? record.reply_to ?? "").trim(),
    attachments: Array.isArray(record.attachments) ? record.attachments : [],
    dispatchedBy: String(record.dispatchedBy ?? record.dispatched_by ?? record.sent_by ?? "SiBS HRIS").trim(),
    dispatchedAt: record.dispatchedAt ?? record.dispatched_at ?? record.sent_at ?? record.created_at ?? "",
  };
}

export function filterEmailLogs(records = [], filters = {}) {
  const search = normalize(filters.search);

  return records.filter((record) => {
    const searchableText = [
      record.id,
      record.recipient,
      record.email,
      record.role,
      record.subject,
      record.category,
      record.position,
      record.account,
      record.dispatchedBy,
    ]
      .map(normalize)
      .join(" ");

    return (
      (!search || searchableText.includes(search)) &&
      matchesFilter(record.category, filters.category) &&
      matchesFilter(record.account, filters.account) &&
      matchesStatus(record, filters.status)
    );
  });
}

export function buildEmailLogMetrics(records = []) {
  const statusCounts = records.reduce((counts, record) => {
    const status = normalize(record.status);
    if (Object.hasOwn(counts, status)) counts[status] += 1;
    return counts;
  }, { delivered: 0, opened: 0, clicked: 0, bounced: 0, failed: 0 });

  return {
    total: records.length,
    ...statusCounts,
    bounceRate: records.length
      ? Number((((statusCounts.bounced + statusCounts.failed) / records.length) * 100).toFixed(1))
      : 0,
  };
}

export function paginateEmailLogs(records = [], page = 1, pageSize = 8) {
  const safePageSize = Math.max(1, Number(pageSize) || 1);
  const totalPages = Math.max(1, Math.ceil(records.length / safePageSize));
  const currentPage = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const startIndex = (currentPage - 1) * safePageSize;

  return {
    records: records.slice(startIndex, startIndex + safePageSize),
    currentPage,
    totalPages,
    totalRecords: records.length,
  };
}

export function retryEmailDelivery(records = [], recordId) {
  return records.map((record) => {
    if (record.id !== recordId || !["bounced", "failed"].includes(normalize(record.status))) {
      return record;
    }

    return {
      ...record,
      status: "delivered",
      statusDetail: undefined,
    };
  });
}

export function buildDeliveryAudit(record = {}) {
  const completedStagesByStatus = {
    delivered: ["Queued", "Processed", "Delivered"],
    opened: ["Queued", "Processed", "Delivered", "Opened"],
    clicked: ["Queued", "Processed", "Delivered", "Opened", "CTA Clicked"],
    bounced: ["Queued", "Processed", "Delivery Bounced"],
    failed: ["Queued", "Processing Failed"],
  };

  const baseTimestamp = Date.parse(record.dispatchedAt);

  return (completedStagesByStatus[normalize(record.status)] || ["Queued"]).map(
    (label, index) => ({
      label,
      completed: true,
      sequence: index + 1,
      timestamp: Number.isNaN(baseTimestamp)
        ? ""
        : new Date(baseTimestamp + index * 17000).toISOString(),
    }),
  );
}

export function buildRenderedEmail(record = {}) {
  const recipient = record.recipient || "Recipient";
  const position = record.position || "—";
  const account = record.account || "—";
  const site = record.site || "—";
  const category = normalize(record.category);

  if (category === "interview") {
    return {
      heading: `Your interview schedule is ready, ${recipient}`,
      facts: [["Position", position], ["Account", account], ["Interview Site", site]],
    };
  }

  if (category === "weekly digest") {
    return {
      heading: "Weekly recruitment summary",
      facts: [["Coverage", account], ["Audience", recipient], ["Reporting Scope", site]],
    };
  }

  if (category === "approval needed") {
    return {
      heading: `Approval required, ${recipient}`,
      facts: [["Position Under Review", position], ["Account", account], ["Reviewing Site", site]],
    };
  }

  if (category === "assessment") {
    return {
      heading: `Your assessment update, ${recipient}`,
      facts: [["Applied Position", position], ["Account", account], ["Recruitment Site", site]],
    };
  }

  if (category === "nho schedule") {
    return {
      heading: `Welcome to SiBS, ${recipient}`,
      facts: [["New Hire Position", position], ["Assigned Account", account], ["Orientation Site", site]],
    };
  }

  if (category === "intake form" || category === "talent pool") {
    return {
      heading: `Application update for ${recipient}`,
      facts: [["Applied Position", position], ["Account", account], ["Recruitment Site", site]],
    };
  }

  return {
    heading: `Congratulations, ${recipient}!`,
    facts: [["Designation", position], ["Assigned Account", account], ["Reporting Site", site]],
  };
}

export function buildSmtpHeaders(record = {}) {
  const id = String(record.id || "unknown").trim();
  const sender = String(record.dispatchedBy || "SiBS HRIS").trim();
  const recipient = String(record.recipient || "Recipient").trim();
  const email = String(record.email || "").trim();

  return {
    "Message-ID": `<${id}@sibs-hris.local>`,
    From: `${sender} <${record.senderEmail || "careers@thesiblingssolutions.com"}>`,
    To: `${recipient} <${email}>`,
    "Reply-To": record.replyTo || "recruitment@thesiblingssolutions.com",
    Subject: record.subject || "SiBS HRIS Communication",
  };
}

export function getEmailLogRenderedHtml(record = {}) {
  return String(record.htmlBody ?? record.html_body ?? "").trim();
}

export function buildPlainTextEmail(record = {}) {
  const fullTextBody = String(record.textBody ?? record.text_body ?? "").trim();

  return [
    `To: ${record.recipient || "Recipient"} <${record.email || ""}>`,
    `Subject: ${record.subject || "SiBS HRIS Communication"}`,
    "",
    fullTextBody || record.preview || "No message content available.",
  ].join("\n");
}

export function isEmailLogActivationKey(key) {
  return key === "Enter" || key === " ";
}
