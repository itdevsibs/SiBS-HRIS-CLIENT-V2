/**
 * Display-only structure for Ask SiBS AI's plain-text replies.
 * Never changes the underlying answer or the conversation sent back to the server.
 * No HTML/Markdown parsing is required here: React renders the resulting strings safely.
 */
const BULLET_LINE = /^(\s*)(?:[-•*–—]\s+|\d{1,3}[.)]\s+)(\S[\s\S]*)$/;
const MARKDOWN_HEADING = /^\s*#{1,4}\s+(.+)$/;
const EMPLOYEE_PROFILE_LINE = /^(.+?)\s+\(SiBS\s*ID:\s*(\d+)\)\s+(is listed in (?:the )?(?:HRIS )?employee directory\.?)$/iu;
const FACT_LINE = /^\s*([\p{L}][\p{L}\p{N}\s/().,&'’\-]{1,55}):\s+(\S.*)$/u;

// A markdown two-column profile table is presentation, not natural prose.
// Some LLMs put all rows on one line; safely decode only well-formed
// field/value pairs and never interpret Markdown as HTML.
const TABLE_SEPARATOR = /^:?-{3,}:?$/;
function markdownTableFacts(line) {
  const value = String(line || "").trim();
  if (!value.includes("|")) return null;
  // Single `|` in ordinary prose is not a table.
  const cells = value.split("|").map((part) => part.trim()).filter(Boolean);
  if (cells.length < 4 || cells.length % 2 !== 0) return null;
  const items = [];
  let sawTableMarker = false;
  for (let i = 0; i < cells.length; i += 2) {
    const label = cells[i].replace(/^\*\*|\*\*$/g, "").trim();
    const data = cells[i + 1].replace(/^\*\*|\*\*$/g, "").trim();
    if (TABLE_SEPARATOR.test(label) && TABLE_SEPARATOR.test(data)) {
      sawTableMarker = true;
      continue;
    }
    if (/^(?:field|attribute|item)$/i.test(label) && /^(?:value|details?)$/i.test(data)) {
      sawTableMarker = true;
      continue;
    }
    if (!label || !data || label.length > 60 || data.length > 400) return null;
    items.push({ label, value: data });
  }
  if (!sawTableMarker && items.length < 2) return null;
  return items.length ? items : null;
}

function splitMarkdownCells(line) {
  const value = String(line || "").trim();
  if (!/^\|/.test(value) || !/\|\s*$/.test(value)) return null;
  return value.slice(1, -1).split("|").map((part) => part.trim());
}

function readMarkdownTable(lines, index) {
  const header = splitMarkdownCells(lines[index]);
  const separator = splitMarkdownCells(lines[index + 1]);
  if (!header || !separator || header.length !== 2 || separator.length !== 2 ||
    !separator.every((item) => TABLE_SEPARATOR.test(item))) return null;
  let next = index + 2;
  const items = [];
  while (next < lines.length) {
    const row = splitMarkdownCells(lines[next]);
    if (!row || row.length !== 2) break;
    if (row[0] && row[1]) items.push({ label: row[0], value: row[1] });
    next++;
  }
  return items.length ? { items, next } : null;
}

// Render employee answers as labeled HRIS profile details, not a paragraph.
// Only transform a response that itself identifies one employee with a SiBS ID;
// never infer fields from conversation history or make another HRIS request.
const PROFILE_FIELD_NAMES = new Map([
  ["full name", "Full Name"], ["employee name", "Full Name"],
  ["name", "Full Name"], ["sibs id", "SiBS ID"],
  ["sibs employee id", "SiBS ID"], ["account", "Account"],
  ["assigned account", "Account"], ["department", "Department"],
  ["email", "Email"], ["email address", "Email"],
  ["hire date", "Hire Date"], ["date hired", "Hire Date"],
  ["employment since", "Since"], ["since", "Since"],
  ["tenure", "Tenure"], ["employment status", "Employment Status"],
  ["status", "Status"], ["manager", "Manager"],
  ["team leader", "Team Leader"], ["operations manager", "Operations Manager"],
  ["position", "Position"], ["role", "Role"],
]);

function canonicalProfileLabel(label) {
  return PROFILE_FIELD_NAMES.get(String(label ?? "")
    .replace(/\*\*/g, "").replace(/\s+/g, " ").trim().toLowerCase()) || null;
}

function safeProfileName(value) {
  const name = String(value ?? "").replace(/\*\*/g, "").trim();
  if (!name || name.length > 120 || !/[\p{L}]/u.test(name)) return null;
  return name;
}

function profileFromFacts(items) {
  const facts = (items || []).map(({ label, value }) => ({
    label: canonicalProfileLabel(label), value: visibleText(value),
  })).filter((entry) => entry.label && entry.value);
  const name = safeProfileName(facts.find(({ label }) => label === "Full Name")?.value);
  const sibsId = facts.find(({ label }) => label === "SiBS ID")?.value;
  if (!name || !/^\d{2,12}$/.test(sibsId ?? "")) return null;
  const distinct = new Set();
  const details = facts.filter(({ label }) => {
    if (label === "Full Name" || label === "SiBS ID" || distinct.has(label)) return false;
    distinct.add(label);
    return true;
  });
  return { type: "employeeCard", name, sibsId, items: details };
}

/**
 * A narrow text contract from the authenticated HRIS reporting-line lookup.
 * This changes presentation only; it never resolves a manager from a name or
 * prior conversation, and cannot infer an ID that is not in the answer.
 * Requiring exactly three well-formed lines avoids catching ordinary chat.
 */
function reportingLineCard(content) {
  const source = String(content ?? "").replace(/\r\n?/g, "\n").trim();
  if (!source || source.length > 900) return null;
  const lines = source.split("\n").map((line) => line.trim()).filter(Boolean);
  if (lines.length !== 3 || !/^#{1,4}\s+Reporting Line$/i.test(lines[0])) return null;
  const employeeText = lines[1].match(/^Employee:\s*(.+)$/i)?.[1];
  const managerText = lines[2].match(/^Direct Manager:\s*(.+)$/i)?.[1];
  if (!employeeText || !managerText) return null;

  const readPerson = (value) => {
    const parsed = value.match(/^(.+?)(?:\s+\(SiBS\s*ID:\s*(\d{1,16})\))?$/i);
    if (!parsed) return null;
    const name = parsed[1].trim();
    if (!name || name.length > 160 || !/[\p{L}]/u.test(name)) return null;
    return { name, sibsId: parsed[2] || null };
  };
  const employee = readPerson(employeeText);
  const manager = readPerson(managerText);
  if (!employee || !manager) return null;
  return {
    type: "reportingLine",
    employee,
    manager: {
      ...manager,
      unavailable: /^No verified manager information was returned$/i.test(manager.name),
      nameNotReturned: /^Name not returned$/i.test(manager.name),
    },
  };
}

// Use the exact same verified schedule validator for both standalone schedule
// cards and the existing attendance cards, including midnight placeholders.
function readVerifiedScheduleSection(lines, nextLine) {
  let schedule = null;
  if (lines.length > nextLine) {
    const states = {
      "scheduled": "scheduled",
      "no schedule recorded": "notRecorded",
      "rest day": "restDay",
      "shift time unavailable": "timeUnavailable",
      "unable to verify": "unavailable",
      "not authorized": "notAuthorized",
    };
    const raw = lines[nextLine].match(/^Schedule Status:\s*(.+)$/i)?.[1];
    const scheduleStatus = states[String(raw || "").toLowerCase()];
    if (!scheduleStatus) return null;
    const shifts = [];
    const seenBreaks = new Set();
    let notice = null;
    const time = "(?:(?:0?[1-9]|1[0-2]):[0-5][0-9] [AP]M|Time unavailable)";
    const rangePattern = new RegExp(`^(${time}) - (${time})$`, "i");
    for (const line of lines.slice(nextLine + 1)) {
      const shift = line.match(/^Shift (\d+):\s*(.+)$/i);
      const brk = line.match(/^Break (\d+):\s*(.+)$/i);
      const extra = line.match(/^Schedule Notice:\s*(.+)$/i);
      if (shift && scheduleStatus === "scheduled" && shifts.length < 4 &&
          Number(shift[1]) === shifts.length + 1 && rangePattern.test(shift[2])) {
        shifts.push({ time: shift[2], breakTime: null });
      } else if (brk && scheduleStatus === "scheduled" && shifts.length > 0 &&
          Number(brk[1]) === shifts.length && !seenBreaks.has(shifts.length) && rangePattern.test(brk[2])) {
        seenBreaks.add(shifts.length);
        shifts.at(-1).breakTime = /^12:00 AM - 12:00 AM$/i.test(brk[2].trim())
          ? null : brk[2];
      } else if (extra && scheduleStatus === "scheduled" && shifts.length === 4 &&
          !notice && extra[1] === "Additional schedules are available in Time & Attendance.") {
        notice = extra[1];
      } else {
        return null;
      }
    }
    if ((scheduleStatus === "scheduled") !== (shifts.length > 0)) return null;
    schedule = { status: scheduleStatus, shifts, notice };
  }
  return { schedule };
}

/** Verified date-specific attendance answer. Only presentation, never a data lookup. */
function employeeAttendanceStatusCard(content) {
  const source = String(content ?? "").replace(/\r\n?/g, "\n").trim();
  if (!source || source.length > 2000) return null;
  const lines = source.split("\n").map((line) => line.trim()).filter(Boolean);
  if (lines.length < 5 || lines.length > 16 || !/^#{1,4}\s+Attendance Check$/i.test(lines[0])) return null;
  const person = lines[1].match(/^Employee:\s*(.+?)\s+\(SiBS\s*ID:\s*(\d{2,12})\)$/i);
  const date = lines[2].match(/^Date:\s*(.+)$/i)?.[1];
  const status = lines[3].match(/^Status:\s*(Attendance recorded|No attendance recorded|Unable to verify)$/i)?.[1];
  const note = lines[4].match(/^Note:\s*(.+)$/i)?.[1];
  if (!person || !date || date.length > 70 || !status || !note || note.length > 450) return null;
  const name = safeProfileName(person[1]);
  if (!name) return null;
  const statusKey = /^Attendance recorded$/i.test(status) ? "recorded" :
    /^No attendance recorded$/i.test(status) ? "notRecorded" : "unavailable";

  // Existing saved five-line replies still render exactly as before. New
  // responses may include a strictly-structured schedule for the SAME day.
  let loginTime = null;
  let nextLine = 5;
  if (/^Login Time:/i.test(lines[nextLine] || "")) {
    const match = lines[nextLine].match(/^Login Time:\s*((?:0?[1-9]|1[0-2]):[0-5][0-9] [AP]M)$/i);
    if (!match || statusKey !== "recorded") return null;
    loginTime = match[1];
    nextLine++;
  }
  const parsedSchedule = readVerifiedScheduleSection(lines, nextLine);
  if (!parsedSchedule) return null;
  const { schedule } = parsedSchedule;
  return { type: "attendanceStatus", employee: { name, sibsId: person[2] },
    date, status: statusKey, note, ...(loginTime ? { loginTime } : {}), ...(schedule ? { schedule } : {}) };
}

/** Verified standalone employee schedule reply; same strict shift parser as attendance. */
function employeeScheduleCheckCard(content) {
  const source = String(content ?? '').replace(/\r\n?/g, '\n').trim();
  if (!source || source.length > 1800) return null;
  const lines = source.split('\n').map((line) => line.trim()).filter(Boolean);
  if (lines.length < 4 || lines.length > 13 ||
      !/^#{1,4}\s+Schedule Check$/i.test(lines[0])) return null;
  const person = lines[1].match(/^Employee:\s*(.+?)\s+\(SiBS\s*ID:\s*(\d{2,12})\)$/i);
  const date = lines[2].match(/^Date:\s*(.+)$/i)?.[1];
  if (!person || !date || date.length > 70) return null;
  const name = safeProfileName(person[1]);
  if (!name) return null;
  const parsed = readVerifiedScheduleSection(lines, 3);
  if (!parsed?.schedule) return null;
  return { type: 'employeeSchedule', employee: { name, sibsId: person[2] },
    date, schedule: parsed.schedule };
}

/**
 * A name collision is a CHOICE, not a verified profile. Display only the
 * directory-matched names + SiBS IDs supplied by the HRIS read-only gateway;
 * never embellish the options with inferred age, role or account.
 *
 * The strict preamble protects normal employee/department list responses from
 * being changed into a disambiguation menu.
 */
function employeeDisambiguation(content) {
  const source = String(content ?? "").replace(/\r\n?/g, "\n").trim();
  if (!source || source.length > 4500 ||
      !/(?:employees? matching|matching employees?|which one do you mean|which employee do you mean|matching that name)/i.test(source)) return null;
  const lines = source.split("\n");
  const options = [];
  const seen = new Set();
  for (const line of lines) {
    // Accept only an exact name/ID choice, not a description or fabricated
    // employment detail. The HRIS gateway enforces authorized scope.
    const option = line.trim().match(/^(?:[-*•]\s+|\d+[.)]\s+)(?:\*\*)?([\p{L}][\p{L}\p{M} .,'’\-]{1,110}?)(?:\*\*)?\s*\(SiBS\s*ID\s*:\s*(\d{2,12})\)\s*$/iu);
    if (!option || seen.has(option[2])) continue;
    const name = safeProfileName(option[1]);
    if (!name) continue;
    seen.add(option[2]);
    options.push({ name, sibsId: option[2] });
    if (options.length >= 5) break;
  }
  if (!options.length) return null;
  return {
    type: "employeeChoices",
    title: "Which employee do you mean?",
    options,
    hasMore: /additional matching employees|more matching employees|not shown here/i.test(source),
    prompt: "Reply with the SiBS ID to view the correct employee.",
  };
}

/**
 * Only organize information already written in the authorized HRIS answer.
 * Never create new employee or manager facts in the presentation layer.
 */
function employeeSubmenu(name, sibsId, items) {
  return { type: "employeeSubmenu", heading: "Based on SiBS HRIS records", name, sibsId, items };
}

function submenuFromProfileFacts(profile) {
  const fields = new Map(profile.items.map(({ label, value }) => [label, value]));
  const bullets = [];
  const account = fields.get("Account");
  const department = fields.get("Department");
  if (account || department) {
    bullets.push(
      `Works for SiBS${account ? ` in **${account}**` : ""}${department ? `, within the **${department}** department` : ""}.`,
    );
  }
  const hireDate = fields.get("Hire Date");
  const since = fields.get("Since");
  const tenure = fields.get("Tenure");
  if (hireDate || since || tenure) {
    const date = hireDate || since;
    bullets.push(`${date ? `Joined on **${date}**` : "Tenure"}${tenure ? `${date ? " — " : ": "}${tenure}` : ""}.`);
  }
  const manager = fields.get("Manager");
  if (manager) bullets.push(`Direct manager: **${manager}**.`);
  for (const { label, value } of profile.items) {
    if (["Account", "Department", "Hire Date", "Since", "Tenure", "Manager"].includes(label)) continue;
    bullets.push(`**${label}:** ${value}`);
  }
  return employeeSubmenu(profile.name, profile.sibsId, bullets);
}

function narrativeEmployeeSubmenu(content) {
  const source = String(content ?? "").replace(/\r\n?/g, "\n").trim();
  if (!source || source.length > 2500) return null;
  const withoutHeading = source.replace(/^(?:#{1,4}\s*)?Based on SiBS HRIS records\s*:?\s*/i, "").trim();

  // Recognize the actual prose returned by Hermes ("works in", "was hired",
  // "joined", etc.), rather than require one fixed sentence template. Keep
  // any additional verified facts verbatim; the Client must never invent HRIS
  // values or guess a manager when the answer did not include one.
  const first = withoutHeading.match(
    /^\*{0,2}([^()\n]{3,120}?)\s*\(\s*SiBS\s*ID\s*:\s*(\d{2,12})\s*\)\*{0,2}\s+(?=(?:is|was|works|has|holds|joined|belongs|reports|serves)\b)/iu,
  );
  if (!first) return legacyEmployeeSubmenu(withoutHeading);
  const name = safeProfileName(first[1]);
  if (!name) return null;

  // Retain the established field-specific conversion of older "account
  // holder" replies, which is also used by persisted conversations.
  const legacy = legacyEmployeeSubmenu(withoutHeading);
  if (legacy) return legacy;

  const rest = withoutHeading.slice(first[0].length).trim();
  if (!rest || /\n\s*(?:[-*•]|\d+[.)])\s/.test(rest)) return null;
  // Only split on completed sentence boundaries. For example, an email like
  // first.last@example.com is not broken into bogus employee facts.
  const sentences = rest.split(/(?<=[.!?])\s+(?=[\p{Lu}])/u)
    .map((sentence) => sentence.trim()).filter(Boolean);
  if (!sentences.length || sentences.length > 10) return null;
  return employeeSubmenu(name, first[2], sentences);
}

/** Format older stored employee paragraphs without discarding verified facts. */
function legacyEmployeeSubmenu(text) {
  const header = String(text).match(/^([^()\n]{3,120}?)\s*\(\s*SiBS\s*ID\s*:\s*(\d{2,12})\s*\)\s+is\s+(?:an?\s+)?[\s\S]+?account holder\b/i);
  if (!header) return null;
  const name = safeProfileName(header[1]);
  if (!name) return null;
  const items = [];
  const add = (label, regex) => {
    const match = text.match(regex);
    if (match?.[1]) items.push({ label, value: match[1].trim() });
  };
  add("Account", /\bis\s+(?:an?\s+)?([\p{L}\p{N}][\p{L}\p{N}\s&.,'’\/-]{1,85}?)\s+account holder\b/iu);
  add("Department", /\bin\s+the\s+([\p{L}\p{N}][\p{L}\p{N}\s&.,'’\/-]{1,85}?)\s+department\b/iu);
  add("Email", /\b(?:email|e-mail)(?:\s+address)?(?:\s+is|\s+of|\s+under|\s*:)??\s+([\w.+-]+@[\w.-]+\.[A-Za-z]{2,})/i);
  add("Since", /\bsince\s+((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}|\d{4}-\d{2}-\d{2})\b/i);
  add("Tenure", /\b(?:with\s+)?tenure\s+of\s+(.+?)(?=[.;]|$)/i);
  if (/\b(?:his|her|their)\s+manager(?:'s)?\s+information\b/i.test(text)) {
    items.push({ label: "Manager", value: "Not included in this profile response" });
  }
  return items.length ? submenuFromProfileFacts({ name, sibsId: header[2], items }) : null;
}

function assembleProfileBlocks(blocks) {
  const output = [];
  const subject = /^(.+?)\s*\(\s*SiBS\s*ID\s*:\s*(\d{2,12})\s*\)$/i;
  for (let index = 0; index < blocks.length; index++) {
    const block = blocks[index];
    const card = block.type === "facts" ? profileFromFacts(block.items) : null;
    if (card) {
      if (output.at(-1)?.type === "heading" &&
        /^(?:employee|staff)\s+profile(?:\s+summary)?$/i.test(output.at(-1).text)) output.pop();
      output.push(submenuFromProfileFacts(card));
      continue;
    }
    // Hermes can return the exact requested heading + bold employee name +
    // bullets. Keep those bullets verbatim inside one expandable submenu.
    if (block.type === "heading" && /^Based on SiBS HRIS records$/i.test(block.text)) {
      const header = blocks[index + 1];
      const match = header?.type === "heading" ? header.text.match(subject) : null;
      const list = blocks[index + 2];
      if (match && list?.type === "list" && list.items.every(item => typeof item === "string")) {
        output.push(employeeSubmenu(match[1], match[2], [...list.items]));
        index += 2;
        continue;
      }
    }
    if (block.type === "employeeCard") {
      output.push(submenuFromProfileFacts(block));
      continue;
    }
    output.push(block);
  }
  return output;
}

function visibleText(text) {
  return String(text ?? "").trim();
}

function classifyLine(line) {
  const trimmed = visibleText(line);
  if (!trimmed) return { type: "space" };

  const bullet = String(line).match(BULLET_LINE);
  if (bullet) return { type: "list", text: visibleText(bullet[2]), level: bullet[1].length >= 2 ? 1 : 0 };

  const heading = trimmed.match(MARKDOWN_HEADING);
  if (heading) return { type: "heading", text: visibleText(heading[1]) };

  // A standalone Markdown-bold heading is a heading, not a paragraph.
  if (/^\*\*[^*]+\*\*$/.test(trimmed)) {
    return { type: "heading", text: trimmed.slice(2, -2) };
  }

  // A heading ending in ':' should be checked before key/value fields.
  // This also covers "These are the common issues (...):".
  if (trimmed.endsWith(":") && trimmed.length <= 200) {
    return { type: "heading", text: trimmed.slice(0, -1) };
  }

  // Employee ID is part of a name, not a fact label. Keep the name and
  // SiBS ID together in one header; show the explanation on the next line.
  const employeeProfile = trimmed.match(EMPLOYEE_PROFILE_LINE);
  if (employeeProfile) {
    return {
      type: "employeeProfile",
      name: visibleText(employeeProfile[1]),
      sibsId: employeeProfile[2],
      description: visibleText(employeeProfile[3]),
    };
  }

  const fact = trimmed.match(FACT_LINE);
  if (fact && !/\(SiBS\s*ID$/i.test(fact[1])) {
    const label = visibleText(fact[1]);
    const value = visibleText(fact[2]);
    // Avoid converting entire explanatory sentences to arbitrary fields.
    if (label.length <= 48 && value.length <= 250) {
      return { type: "facts", label, value };
    }
  }

  return { type: "paragraph", text: trimmed };
}

// Strict verified server-only headcount result. Reject invalid/mismatched
// totals instead of silently presenting an incorrect workforce count.
function activeHeadcountCard(content) {
  const source = String(content ?? "").trim();
  if (!source || source.length > 25000) return null;
  const lines = source.split(/\r?\n/);
  if (lines.length !== 3 || lines[0].trim() !== "### Active Employee Breakdown") return null;
  const date = lines[1].match(/^Date: (.+)$/)?.[1];
  const raw = lines[2].match(/^Headcount Data: (\{.*\})$/)?.[1];
  if (!date || date.length > 65 || !raw) return null;
  let payload;
  try { payload = JSON.parse(raw); } catch { return null; }
  const validCount = (n) => Number.isSafeInteger(n) && n >= 0;
  if (!validCount(payload?.total) || payload.total > 3000 ||
      !Array.isArray(payload?.departments) || payload.departments.length > 50) return null;
  let sum = 0;
  const departments = [];
  for (const dept of payload.departments) {
    if (typeof dept?.name !== "string" || !dept.name.trim() || dept.name.length > 120 ||
        !validCount(dept.count) || !Array.isArray(dept.accounts) || dept.accounts.length > 150) return null;
    const accounts = [];
    let accountSum = 0;
    for (const acc of dept.accounts) {
      if (typeof acc?.name !== "string" || !acc.name.trim() || acc.name.length > 120 || !validCount(acc.count)) return null;
      accounts.push({ name: acc.name, count: acc.count });
      accountSum += acc.count;
    }
    if (accountSum !== dept.count) return null;
    sum += dept.count;
    departments.push({ name: dept.name, count: dept.count, accounts });
  }
  if (sum !== payload.total) return null;
  return { type: "activeHeadcount", total: payload.total, date, departments };
}

/** Strict, display-only contracts for three verified HRIS summary replies.
 * No attempt is made to infer employee facts from arbitrary Hermes prose. */
function verifiedSummaryCard(content) {
  const source = String(content ?? '').replace(/\r\n?/g, '\n').trim();
  if (!source || source.length > 12000) return null;
  const lines = source.split('\n').map((line) => line.trim()).filter(Boolean);
  if (lines.length < 4) return null;
  const header = lines[0];
  const textValue = (index, label) => lines[index]?.match(new RegExp(`^${label}:\\s*(.+)$`, 'i'))?.[1] || null;
  const period = (value) => {
    const parts = String(value ?? '').split(' to ');
    if (parts.length !== 2 || parts.some((part) => part.length > 55 || !/\d{4}/.test(part))) return null;
    return { from: parts[0], to: parts[1] };
  };
  const metric = (v) => v === 'Not verified' ? null : /^\d+$/.test(String(v)) && Number.isSafeInteger(Number(v)) ? Number(v) : undefined;
  const credit = (v) => v === 'Not verified' ? null : /^(?:\d+)(?:\.\d+)?$/.test(String(v)) && Number.isFinite(Number(v)) ? Number(v) : undefined;
  if (header === '### Monthly Attendance Summary' && lines.length >= 7 && lines.length <= 101) {
    const dates = period(textValue(1, 'Period'));
    const tracked = metric(textValue(2, 'Tracked Days'));
    const present = metric(textValue(3, 'Days With Login'));
    const missing = metric(textValue(4, 'Missing Login Days'));
    const rawLate = textValue(5, 'Verified Late Days');
    const lateIsMinimum = /^\d+\+$/.test(rawLate || '');
    const late = lateIsMinimum ? metric(rawLate.slice(0,-1)) : metric(rawLate);
    const note = textValue(lines.length - 1, 'Note');
    if (!dates || [tracked,present,missing,late].some((v) => v === undefined) ||
        (tracked !== null && present !== null && present > tracked) || !note) return null;
    const daily = [];
    const rowLines = lines.slice(6, -1);
    if (rowLines.length) {
      if (rowLines[0] !== '### Daily Attendance Details') return null;
      const rowRegex = /^Day: (\w+ \d{1,2}, \d{4}) \| (Recorded|No login recorded|No tracker record) \| Login: ((?:0?[1-9]|1[0-2]):[0-5][0-9] [AP]M|Not recorded) \| Logout: ((?:0?[1-9]|1[0-2]):[0-5][0-9] [AP]M|Not recorded) \| Punctuality: (Late|On time|Not verified)(?: \| Day Type: (Scheduled|Day off|Rest day|Holiday|Not recorded) \| Shift: ((?:0?[1-9]|1[0-2]):[0-5][0-9] [AP]M - (?:0?[1-9]|1[0-2]):[0-5][0-9] [AP]M|Not recorded) \| Holiday: ([^|\r\n]{1,90}))?$/;
      for (const line of rowLines.slice(1)) {
        const match = line.match(rowRegex);
        if (!match) return null;
        if (match[2] !== 'Recorded' && match[5] !== 'Not verified') return null;
        daily.push({date:match[1], attendance:match[2],
          login:match[3],logout:match[4],punctuality:match[5],
          dayType:match[6] ?? 'Not recorded',
          shift:match[7] && match[7] !== 'Not recorded' ? match[7] : null,
          holiday:match[8] && match[8] !== 'None' ? match[8].trim() : null});
      }
      if (daily.length === 0 || daily.length > 93 || new Set(daily.map(row=>row.date)).size !== daily.length) return null;
    }
    return { type: 'monthlyAttendanceSummary', period: dates, tracked, present, missing, late,
      lateIsMinimum, daily, note };
  }
  if (header === '### My Leave Balance' && (lines.length === 5 || lines.length === 6)) {
    const remaining = credit(textValue(1, 'Remaining Credits'));
    const total = credit(textValue(2, 'Total Credits'));
    const plotted = credit(textValue(3, 'Plotted Leaves'));
    const hasSnapshot = lines.length === 6;
    const snapshot = hasSnapshot ? textValue(4, 'Snapshot Date') : null;
    const note = textValue(hasSnapshot ? 5 : 4, 'Note');
    if ([remaining,total,plotted].some((v) => v === undefined) ||
        (hasSnapshot && (!snapshot || !/\d{4}/.test(snapshot))) || !note) return null;
    return { type:'leaveBalanceSummary', remaining, total, plotted, snapshot, note };
  }
  if (header === '### Recent Applicant Leads' && lines.length >= 4) {
    const dates = period(textValue(1, 'Period'));
    const total = metric(textValue(2, 'Total Leads'));
    const note = textValue(lines.length - 1, 'Note');
    if (!dates || total == null || !note || lines.length > 44) return null;
    const statuses = [];
    let sum = 0;
    for (const line of lines.slice(3, -1)) {
      const matched = line.match(/^Status:\s*([^|\r\n]{1,80})\s*\|\s*(\d+)$/);
      if (!matched || !Number.isSafeInteger(Number(matched[2]))) return null;
      const n = Number(matched[2]);
      sum += n;
      statuses.push({ status: matched[1].trim(), count: n });
    }
    if (sum !== total) return null;
    return { type: 'applicantLeadsSummary', period: dates, total, statuses, note };
  }
  return null;
}

/**
 * Turn a response into presentational blocks (intro/tiles/facts), while
 * preserving the order and exact wording of the visible content.
 */
export function parseAiResultBlocks(content) {
  const summary = verifiedSummaryCard(content);
  if (summary) return [summary];
  const employeeSchedule = employeeScheduleCheckCard(content);
  if (employeeSchedule) return [employeeSchedule];
  const activeHeadcount = activeHeadcountCard(content);
  if (activeHeadcount) return [activeHeadcount];
  const attendanceStatus = employeeAttendanceStatusCard(content);
  if (attendanceStatus) return [attendanceStatus];
  const reportingLine = reportingLineCard(content);
  if (reportingLine) return [reportingLine];
  const choices = employeeDisambiguation(content);
  if (choices) return [choices];
  const narrativeProfile = narrativeEmployeeSubmenu(content);
  if (narrativeProfile) return [narrativeProfile];
  const lines = String(content ?? "").replace(/\r\n?/g, "\n").split("\n");
  const blocks = [];
  let current = null;

  function flush() {
    if (current) blocks.push(current);
    current = null;
  }

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    const table = readMarkdownTable(lines, lineIndex);
    if (table) {
      flush();
      blocks.push({ type: "facts", items: table.items });
      lineIndex = table.next - 1;
      continue;
    }
    const inlineFacts = markdownTableFacts(line);
    if (inlineFacts) {
      flush();
      blocks.push({ type: "facts", items: inlineFacts });
      continue;
    }
    const part = classifyLine(line);
    if (part.type === "space") {
      flush();
      continue;
    }
    if (part.type === "heading" || part.type === "employeeProfile") {
      flush();
      blocks.push(part);
      continue;
    }
    if (part.type === "paragraph") {
      // Keep consecutive lines of one paragraph together, but not an entire
      // report of separated lines or a following heading/field/list.
      if (current?.type === "paragraph") current.text += ` ${part.text}`;
      else {
        flush();
        current = { type: "paragraph", text: part.text };
      }
      continue;
    }
    if (part.type === "list") {
      if (part.level > 0 && current?.type === "list" && current.items.length) {
        // Child bullets are only attached to an existing verified parent.
        // Do not turn random indentation into an unsupported new topic.
        const lastIndex = current.items.length - 1;
        const last = current.items[lastIndex];
        const parent = typeof last === "string" ? { text: last, children: [] } : last;
        parent.children.push(part.text);
        current.items[lastIndex] = parent;
      } else if (current?.type === "list") {
        current.items.push(part.text);
      } else {
        flush();
        current = { type: "list", items: [part.text] };
      }
      continue;
    }
    if (part.type === "facts") {
      if (current?.type === "facts") current.items.push({ label: part.label, value: part.value });
      else {
        flush();
        current = { type: "facts", items: [{ label: part.label, value: part.value }] };
      }
    }
  }
  flush();
  return assembleProfileBlocks(blocks);
}
