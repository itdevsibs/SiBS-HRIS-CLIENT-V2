import test from "node:test";
import assert from "node:assert/strict";

import {
  buildDeliveryAudit,
  buildEmailLogMetrics,
  buildPlainTextEmail,
  buildRenderedEmail,
  buildSmtpHeaders,
  filterEmailLogs,
  isEmailLogActivationKey,
  paginateEmailLogs,
  retryEmailDelivery,
} from "./emailLogsHelpers.js";

const RECORDS = [
  {
    id: "EML-001",
    recipient: "Roman Cabanes Lausa",
    email: "roman@example.com",
    role: "Candidate",
    subject: "Employment Offer",
    category: "Job Offer",
    position: "Software Management",
    account: "CD Connect",
    status: "clicked",
  },
  {
    id: "EML-002",
    recipient: "Mighty Yena Labus",
    email: "mighty@example.com",
    role: "Candidate",
    subject: "Final Interview Schedule",
    category: "Interview",
    position: "Customer Service Representative",
    account: "AHG Inbound/Outbound",
    status: "opened",
  },
  {
    id: "EML-003",
    recipient: "Patricia Gomez",
    email: "patricia@example.com",
    role: "Candidate",
    subject: "Complete your assessment",
    category: "Assessment",
    position: "Customer Service Representative",
    account: "AHG Inbound/Outbound",
    status: "bounced",
  },
  {
    id: "EML-004",
    recipient: "Mark Reyes",
    email: "mark@example.com",
    role: "Candidate",
    subject: "Application received",
    category: "Intake Form",
    position: "Customer Service Representative",
    account: "AHG Inbound/Outbound",
    status: "delivered",
  },
  {
    id: "EML-005",
    recipient: "Carlos Mendoza",
    email: "carlos@example.com",
    role: "Approver",
    subject: "Compensation review",
    category: "Approval Needed",
    position: "Technical Support Specialist",
    account: "Atlas Telecom",
    status: "failed",
  },
];

const DRAWER_RECORD = {
  id: "EML-2026-0914-001",
  recipient: "Roman Cabanes Lausa",
  email: "roman@example.com",
  subject: "SiBS Employment Offer",
  preview: "Congratulations, Roman! Your approved offer is ready.",
  dispatchedBy: "SiBS Talent Acquisition",
  dispatchedAt: "2026-09-14T14:15:22+08:00",
  replyTo: "recruitment@thesiblingssolutions.com",
  status: "clicked",
};

test("filterEmailLogs combines free-text, category, account, and status filters", () => {
  const filtered = filterEmailLogs(RECORDS, {
    search: "customer service",
    category: "Assessment",
    account: "AHG Inbound/Outbound",
    status: "bounced",
  });

  assert.deepEqual(filtered.map((record) => record.id), ["EML-003"]);
});

test("filterEmailLogs exposes internal-approval and relay-issue operational views", () => {
  assert.deepEqual(
    filterEmailLogs(RECORDS, { status: "internal" }).map((record) => record.id),
    ["EML-005"],
  );
  assert.deepEqual(
    filterEmailLogs(RECORDS, { status: "relay" }).map((record) => record.id),
    ["EML-003", "EML-005"],
  );
});

test("filterEmailLogs searches recipient, message id, email, subject, position, and account case-insensitively", () => {
  const expectedByQuery = {
    roman: "EML-001",
    "EML-002": "EML-002",
    "PATRICIA@EXAMPLE.COM": "EML-003",
    received: "EML-004",
    "technical support": "EML-005",
    "cd connect": "EML-001",
  };

  for (const [query, expectedId] of Object.entries(expectedByQuery)) {
    const filtered = filterEmailLogs(RECORDS, { search: query });
    assert.deepEqual(filtered.map((record) => record.id), [expectedId]);
  }
});

test("buildEmailLogMetrics derives dashboard counts and bounce rate from records", () => {
  assert.deepEqual(buildEmailLogMetrics(RECORDS), {
    total: 5,
    delivered: 1,
    opened: 1,
    clicked: 1,
    bounced: 1,
    failed: 1,
    bounceRate: 40,
  });
});

test("paginateEmailLogs clamps invalid pages and returns the requested slice", () => {
  assert.deepEqual(paginateEmailLogs(RECORDS, 2, 2), {
    records: [RECORDS[2], RECORDS[3]],
    currentPage: 2,
    totalPages: 3,
    totalRecords: 5,
  });

  assert.deepEqual(paginateEmailLogs(RECORDS, 99, 2), {
    records: [RECORDS[4]],
    currentPage: 3,
    totalPages: 3,
    totalRecords: 5,
  });
});

test("retryEmailDelivery retries only delivery issues and clears their error detail", () => {
  const clickedRecord = { ...RECORDS[0], statusDetail: undefined };
  const bouncedRecord = { ...RECORDS[2], statusDetail: "Mailbox unavailable" };
  const nextRecords = retryEmailDelivery([clickedRecord, bouncedRecord], "EML-003");

  assert.strictEqual(nextRecords[0], clickedRecord);
  assert.deepEqual(nextRecords[1], {
    ...bouncedRecord,
    status: "delivered",
    statusDetail: undefined,
  });

  assert.strictEqual(retryEmailDelivery(nextRecords, "EML-001")[0], clickedRecord);
});

test("buildDeliveryAudit returns the completed delivery journey for the selected row", () => {
  const audit = buildDeliveryAudit(DRAWER_RECORD);

  assert.deepEqual(
    audit.map((event) => event.label),
    ["Queued", "Processed", "Delivered", "Opened", "CTA Clicked"],
  );
  assert.equal(new Set(audit.map((event) => event.timestamp)).size, 5);
});

test("buildRenderedEmail adapts the preview heading and facts to the email category", () => {
  const interview = buildRenderedEmail({
    ...DRAWER_RECORD,
    category: "Interview",
    position: "Customer Service Representative",
    account: "AHG Inbound/Outbound",
    site: "Davao City Site",
  });
  const weeklyDigest = buildRenderedEmail({
    ...DRAWER_RECORD,
    category: "Weekly Digest",
    account: "Enterprise Overview",
    site: "All Sites",
  });

  assert.equal(interview.heading, "Your interview schedule is ready, Roman Cabanes Lausa");
  assert.deepEqual(interview.facts, [
    ["Position", "Customer Service Representative"],
    ["Account", "AHG Inbound/Outbound"],
    ["Interview Site", "Davao City Site"],
  ]);
  assert.equal(weeklyDigest.heading, "Weekly recruitment summary");
  assert.deepEqual(weeklyDigest.facts, [
    ["Coverage", "Enterprise Overview"],
    ["Audience", "Roman Cabanes Lausa"],
    ["Reporting Scope", "All Sites"],
  ]);
});

test("buildSmtpHeaders derives drawer headers from the selected email record", () => {
  assert.deepEqual(buildSmtpHeaders(DRAWER_RECORD), {
    "Message-ID": "<EML-2026-0914-001@sibs-hris.local>",
    From: "SiBS Talent Acquisition <careers@thesiblingssolutions.com>",
    To: "Roman Cabanes Lausa <roman@example.com>",
    "Reply-To": "recruitment@thesiblingssolutions.com",
    Subject: "SiBS Employment Offer",
  });
});

test("buildPlainTextEmail includes the recipient, subject, and message body", () => {
  assert.equal(
    buildPlainTextEmail(DRAWER_RECORD),
    "To: Roman Cabanes Lausa <roman@example.com>\nSubject: SiBS Employment Offer\n\nCongratulations, Roman! Your approved offer is ready.",
  );
});

test("isEmailLogActivationKey accepts keyboard row activation without trapping other keys", () => {
  assert.equal(isEmailLogActivationKey("Enter"), true);
  assert.equal(isEmailLogActivationKey(" "), true);
  assert.equal(isEmailLogActivationKey("Escape"), false);
});
