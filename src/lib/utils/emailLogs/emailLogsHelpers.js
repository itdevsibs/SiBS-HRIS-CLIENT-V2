const ALL_FILTER = "all";

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function looksLikeEmail(value) {
  const text = String(value ?? "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
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
  const recipient = String(
    record.recipient ??
      record.recipient_name ??
      record.email ??
      record.recipient_email ??
      "Recipient",
  ).trim();
  const rawCandidateName = String(
    record.candidateName ?? record.candidate_name ?? "",
  ).trim();

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
    recipient,
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
    providerMessageId: String(
      record.providerMessageId ??
        record.provider_message_id ??
        record.smtp_message_id ??
        record.message_id ??
        "",
    ).trim(),
    direction: String(record.direction ?? "outgoing").trim() || "outgoing",
    isCandidateReply: Boolean(record.isCandidateReply ?? record.is_candidate_reply),
    gmailMessageId: String(record.gmailMessageId ?? record.gmail_message_id ?? "").trim(),
    gmailThreadId: String(record.gmailThreadId ?? record.gmail_thread_id ?? "").trim(),
    senderName: String(record.senderName ?? record.sender_name ?? "").trim(),
    fromAddress: String(record.fromAddress ?? record.from_address ?? "").trim(),
    toAddress: String(record.toAddress ?? record.to_address ?? "").trim(),
    sourceModule: String(record.sourceModule ?? record.source_module ?? "").trim(),
    sourceAction: String(record.sourceAction ?? record.source_action ?? "").trim(),
    relatedEntityType: String(record.relatedEntityType ?? record.related_entity_type ?? "").trim(),
    relatedEntityId: String(record.relatedEntityId ?? record.related_entity_id ?? "").trim(),
    candidatePipelineId: String(
      record.candidatePipelineId ??
        record.candidate_pipeline_id ??
        record.pipelineId ??
        "",
    ).trim(),
    candidateId: String(record.candidateId ?? record.candidate_id ?? "").trim(),
    candidateName:
      rawCandidateName || (!looksLikeEmail(recipient) ? recipient : ""),
    candidateEmail: String(
      record.candidateEmail ??
        record.candidate_email ??
        record.email ??
        record.recipient_email ??
        "",
    ).trim(),
    talentPoolApplicationId: String(
      record.talentPoolApplicationId ??
        record.talent_pool_application_id ??
        record.sourceTalentPoolId ??
        record.source_talent_pool_id ??
        "",
    ).trim(),
    talentPoolEmail: String(
      record.talentPoolEmail ??
        record.talent_pool_email ??
        "",
    ).trim(),
    candidateMatched: Boolean(record.candidateMatched ?? record.candidate_matched),
    dispatchedBy: String(record.dispatchedBy ?? record.dispatched_by ?? record.sent_by ?? "SiBS HRIS").trim(),
    dispatchedAt: record.dispatchedAt ?? record.dispatched_at ?? record.sent_at ?? record.created_at ?? "",
  };
}

function emailLogTimestamp(record = {}) {
  const timestamp = Date.parse(record.dispatchedAt);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function candidateGroupKey(record = {}) {
  const talentPoolApplicationId = normalize(record.talentPoolApplicationId);
  if (talentPoolApplicationId) return `talent-pool:${talentPoolApplicationId}`;

  const pipelineId = normalize(record.candidatePipelineId);
  if (pipelineId) return `pipeline:${pipelineId}`;

  const candidateId = normalize(record.candidateId);
  if (candidateId) return `candidate:${candidateId}`;

  // The directory is candidate-based, not email-based. Multiple candidate
  // records may intentionally reuse the same email address, so an email alone
  // is never a safe grouping key.
  return "";
}

function firstMeaningfulValue(records = [], field, fallback = "—") {
  for (const record of records) {
    const value = String(record?.[field] ?? "").trim();
    if (value && value !== "—") return value;
  }
  return fallback;
}

function firstMeaningfulNonEmailValue(records = [], field, fallback = "") {
  for (const record of records) {
    const value = String(record?.[field] ?? "").trim();
    if (value && value !== "—" && !looksLikeEmail(value)) return value;
  }
  return fallback;
}

function buildCandidateEmailAddresses(records = []) {
  const addresses = [];
  const seen = new Set();

  const addAddress = (value) => {
    const email = String(value ?? "").trim();
    const key = normalize(email);

    if (!email || !looksLikeEmail(email) || seen.has(key)) return;

    seen.add(key);
    addresses.push(email);
  };

  // Keep the current Candidate Pipeline address first, then include the
  // original Talent Pool address when it differs.
  for (const record of records) addAddress(record?.candidateEmail);
  for (const record of records) addAddress(record?.talentPoolEmail);

  // Include any historical candidate-recipient address stored on Email Logs.
  // Internal approval/manager recipients are deliberately excluded.
  for (const record of records) {
    if (
      record?.candidateMatched &&
      normalize(record?.role) === "candidate"
    ) {
      addAddress(record?.email);
    }
  }

  return addresses;
}

export function buildCandidateEmailGroups(filteredRecords = [], allRecords = filteredRecords) {
  const allByKey = new Map();

  for (const record of allRecords) {
    const key = candidateGroupKey(record);
    if (!key) continue;
    if (!allByKey.has(key)) allByKey.set(key, []);
    allByKey.get(key).push(record);
  }

  for (const records of allByKey.values()) {
    records.sort((left, right) => emailLogTimestamp(right) - emailLogTimestamp(left));
  }

  const matchedKeys = [];
  const seen = new Set();

  for (const record of filteredRecords) {
    const key = candidateGroupKey(record);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    matchedKeys.push(key);
  }

  return matchedKeys
    .map((key) => {
      const records = allByKey.get(key) || [];
      const latestRecord = records[0];
      if (!latestRecord) return null;

      const candidateName =
        firstMeaningfulNonEmailValue(records, "candidateName", "") ||
        firstMeaningfulNonEmailValue(records, "recipient", "") ||
        "Candidate";
      const emailAddresses = buildCandidateEmailAddresses(records);
      const email =
        emailAddresses[0] ||
        firstMeaningfulValue(records, "candidateEmail", "") ||
        firstMeaningfulValue(records, "email", "—");
      const candidateId = firstMeaningfulValue(records, "candidateId", "");
      const candidatePipelineId = firstMeaningfulValue(records, "candidatePipelineId", "");
      const talentPoolApplicationId = firstMeaningfulValue(
        records,
        "talentPoolApplicationId",
        "",
      );
      const categories = [...new Set(records.map((record) => record.category).filter(Boolean))];
      const statuses = [...new Set(records.map((record) => record.status).filter(Boolean))];

      return {
        key,
        candidateName,
        recipient: candidateName,
        email,
        emailAddresses,
        candidateId,
        candidatePipelineId,
        talentPoolApplicationId,
        role: records.some(
          (record) => record.candidateMatched || normalize(record.role) === "candidate",
        )
          ? "Candidate"
          : firstMeaningfulValue(records, "role", "Recipient"),
        site: firstMeaningfulValue(records, "site"),
        position: firstMeaningfulValue(records, "position"),
        account: firstMeaningfulValue(records, "account"),
        emailCount: records.length,
        categories,
        statuses,
        latestRecord,
        lastDispatchedAt: latestRecord.dispatchedAt,
        records,
      };
    })
    .filter(Boolean)
    .sort((left, right) => emailLogTimestamp(right.latestRecord) - emailLogTimestamp(left.latestRecord));
}

export function filterEmailLogs(records = [], filters = {}) {
  const search = normalize(filters.search);

  return records.filter((record) => {
    const searchableText = [
      record.id,
      record.recipient,
      record.email,
      record.candidateName,
      record.candidateEmail,
      record.candidateId,
      record.candidatePipelineId,
      record.talentPoolApplicationId,
      record.talentPoolEmail,
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
