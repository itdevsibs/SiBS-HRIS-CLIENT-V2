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

export function buildPlainTextEmail(record = {}) {
  return [
    `To: ${record.recipient || "Recipient"} <${record.email || ""}>`,
    `Subject: ${record.subject || "SiBS HRIS Communication"}`,
    "",
    record.preview || "No message preview available.",
  ].join("\n");
}

export function isEmailLogActivationKey(key) {
  return key === "Enter" || key === " ";
}
