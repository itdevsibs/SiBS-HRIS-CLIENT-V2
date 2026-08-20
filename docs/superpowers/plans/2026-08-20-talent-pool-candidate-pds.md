# Talent Pool Candidate PDS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a protected **Generate Resume** action to the Talent Pool candidate profile that creates and previews a current SiBS-branded Candidate Personal Data Sheet PDF.

**Architecture:** The server owns candidate loading, field normalization, PDF rendering, and response headers. The client adds one blob-returning Axios adapter plus a modal action that opens the generated PDF in a preview tab. The mapper, renderer, route handler, response-header parser, and UI integration remain separate so each behavior can be tested without duplicating candidate-field aliases.

**Tech Stack:** React 19, Vite 8, Axios, Express 5, Node.js test runner, PDFKit, Tailwind CSS, Poppler for rendered-PDF verification

**Spec:** `docs/superpowers/specs/2026-08-20-talent-pool-candidate-pds-design.md`

## Global Constraints

- Work in both `C:\Users\ralphvincentd\SiBS-HRIS-CLIENT-V2` and `C:\Users\ralphvincentd\SiBS-HRIS-Server`; create isolated worktrees at execution time because the current client workspace contains unrelated edits.
- Preserve the public application, candidate-profile, Talent Pool status, move-to-pipeline, drop-off, and onboarding behavior.
- Generate from the latest/current Talent Pool application and its latest application-count answer set.
- Do not add database columns, persist generated PDFs, or mutate candidate records.
- Do not reproduce CS Form No. 212 declarations or fields that SiBS did not collect.
- Never infer candidate data; use `Not provided` only for contextual scalar fields and omit wholly empty sections.
- Keep the endpoint private even though several legacy Talent Pool administration endpoints currently lack route-level middleware; do not broaden this task into a security refactor of existing routes.
- Use `Cache-Control: private, no-store`, sanitize response filenames, and exclude internal storage paths.
- Preserve the SiBS palette: navy `#042C51` and orange `#FF5C28`.
- Use the server logo at `src/logos/SiBSLogoNavy.png`.
- Use `npm.cmd` in PowerShell for npm commands.
- Stage and commit only task-owned files; never stage unrelated dirty-worktree changes.

---

### Task 1: Build the canonical candidate PDS model

**Files:**
- Create: `C:\Users\ralphvincentd\SiBS-HRIS-Server\src\utils\talentPoolCandidatePdsModel.js`
- Create: `C:\Users\ralphvincentd\SiBS-HRIS-Server\src\utils\talentPoolCandidatePdsModel.test.js`

**Interfaces:**
- Consumes: `{ application, applicationAnswers, generatedAt }`, where `application` is the normalized result of `normalizeApplication()` and `applicationAnswers` is the result of `getRecruitmentApplicationAnswersForTalentPoolApplication()`.
- Produces: `buildTalentPoolCandidatePdsModel(input): CandidatePdsModel`.
- Produces: `buildTalentPoolCandidatePdsFilename(model): string`.
- Produces: normalized arrays named `educationRecords`, `workExperiences`, `trainingEntries`, `references`, `roleSpecificResponses`, and `applicationHistory`.

- [ ] **Step 1: Write failing mapper tests for a complete current application**

Create a fixture using the actual Talent Pool response names and assert the canonical shape:

```js
import test from "node:test";
import assert from "node:assert/strict";
import {
  buildTalentPoolCandidatePdsFilename,
  buildTalentPoolCandidatePdsModel,
} from "./talentPoolCandidatePdsModel.js";

test("maps the current Talent Pool application into the candidate PDS model", () => {
  const model = buildTalentPoolCandidatePdsModel({
    generatedAt: new Date("2026-08-20T04:00:00.000Z"),
    application: {
      id: 91,
      candidateId: "PUB-20260819-ABC123",
      firstName: "Cyndaquil",
      middleName: "Quilava",
      lastName: "Typhlosion",
      nickname: "Cyndaquil",
      dateOfBirth: "2009-06-10",
      ageAsOfApplication: 17,
      email: "candidate@example.com",
      phone1: "09171234567",
      phone2: "09981234567",
      physicalAddress: "Davao City",
      openPosition: "FST Trainer",
      applyingLocation: "Davao Site",
      status: "New Applicant",
      submittedAt: "2026-08-19",
      educationDetails: {
        elementary: {
          schoolName: "Davao Elementary School",
          address: "Davao City",
          course: "",
          schoolYearGraduated: "2018-2019",
        },
        college: {
          schoolName: "SiBS College",
          address: "Davao City",
          course: "BS Information Technology",
          schoolYearGraduated: "2024-2025",
        },
      },
      workExperiences: [{
        role: "Support Associate",
        company: "Example Services",
        industryRelevantExperience: "BPO",
        lengthOfWorkExperience: "1 year to 2 years",
        years: "2",
        monthlyCompensation: "22000",
        reasonForLeaving: "Career growth",
      }],
      trainingAttendedItems: ["Leadership 101", "Data Privacy"],
      affiliations: ["Civil Service Eligible"],
      skillsLanguage: "English, Customer Support",
      fullyVaccinated: "Yes",
      comfortableOnSite: "Yes",
      willingGraveyard: "Yes",
      employmentInterest: "Full Time",
      remoteWorkAccess: "Yes",
      willingDrugTest: "Yes",
      willingBackgroundCheck: "Yes",
      references: [{ name: "Maria Santos", phone: "09170000000" }],
      applicationHistory: [{
        date: "2026-08-19",
        position: "FST Trainer",
        status: "New Applicant",
        source: "Public Application",
      }],
      audioFileName: "response.m4a",
      attachmentFileName: "resume.pdf",
    },
    applicationAnswers: {
      applicationCount: 1,
      answers: [{
        questionText: "Why should we hire you?",
        textAnswer: "I have relevant training experience.",
        sortOrder: 1,
      }],
    },
  });

  assert.equal(model.candidateSummary.fullName, "Cyndaquil Quilava Typhlosion");
  assert.equal(model.candidateSummary.candidateId, "PUB-20260819-ABC123");
  assert.equal(model.educationRecords.length, 2);
  assert.equal(model.workExperiences.length, 1);
  assert.deepEqual(model.professionalDevelopment.trainingEntries, [
    "Leadership 101",
    "Data Privacy",
  ]);
  assert.equal(model.roleSpecificResponses[0].question, "Why should we hire you?");
  assert.equal(model.roleSpecificResponses[0].answer, "I have relevant training experience.");
  assert.deepEqual(model.attachments, ["response.m4a", "resume.pdf"]);
});

test("creates a header-safe candidate PDF filename", () => {
  assert.equal(
    buildTalentPoolCandidatePdsFilename({
      candidateSummary: { fullName: 'Ana / Santos\r\n"Test"' },
    }),
    "Ana_Santos_Test_SiBS_Profile.pdf",
  );
});
```

- [ ] **Step 2: Run the mapper tests and verify they fail**

Run:

```powershell
node --test src\utils\talentPoolCandidatePdsModel.test.js
```

Expected: FAIL because `talentPoolCandidatePdsModel.js` does not exist.

- [ ] **Step 3: Implement normalization helpers and the canonical mapper**

Implement these exact exports:

```js
export function buildTalentPoolCandidatePdsModel({
  application = {},
  applicationAnswers = {},
  generatedAt = new Date(),
} = {}) {
  return {
    generatedAt: formatIsoDateTime(generatedAt),
    candidateSummary: buildCandidateSummary(application),
    personalInformation: buildPersonalInformation(application),
    educationRecords: buildEducationRecords(application.educationDetails),
    workExperiences: buildWorkExperiences(application),
    professionalDevelopment: buildProfessionalDevelopment(application),
    workReadiness: buildWorkReadiness(application),
    references: buildReferences(application.references),
    roleSpecificResponses: buildRoleSpecificResponses(
      applicationAnswers.answers,
    ),
    applicationHistory: buildApplicationHistory(
      application.applicationHistory,
    ),
    attachments: buildAttachmentNames(application),
  };
}

export function buildTalentPoolCandidatePdsFilename(model = {}) {
  const safeName = cleanText(model.candidateSummary?.fullName)
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120) || "Candidate";

  return `${safeName}_SiBS_Profile.pdf`;
}
```

Implementation requirements:

- Build the full name from `firstName`, `middleName`, `lastName`, and `suffix` when `application.name` is absent.
- Map education keys in this display order: elementary, highSchool, seniorHighSchool, vocational, college, lawSchool, masters, doctorate.
- Treat an education row as empty when school name, course, address, and graduation year are all empty.
- Combine `workExperiences` and `otherExperiences`; use the primary scalar work fields only when no equivalent list row exists.
- Deduplicate work rows through a case-insensitive key of role, company, industry, length, years, compensation, and reason.
- Preserve answer sort order and omit answers whose normalized answer is empty.
- Convert array or object answers into readable comma-separated text; never emit raw JSON.
- Sort history by parseable date ascending while preserving source order for equal or missing dates.
- Include attachment filenames only, never paths or URLs.

- [ ] **Step 4: Add partial-data and deduplication tests**

Add concrete tests asserting:

```js
test("omits empty sections and does not invent unsubmitted PDS fields", () => {
  const model = buildTalentPoolCandidatePdsModel({
    application: {
      firstName: "Ana",
      lastName: "Santos",
      email: "ana@example.com",
      attachmentFileName: "resume.pdf",
      attachmentFilePath: "C:/private/talent-pool/91/resume.pdf",
      sssNo: "must-not-be-read",
      workExperiences: [],
      educationDetails: {},
      references: [{ name: "", phone: "" }],
    },
  });

  assert.equal(model.candidateSummary.fullName, "Ana Santos");
  assert.deepEqual(model.educationRecords, []);
  assert.deepEqual(model.workExperiences, []);
  assert.deepEqual(model.references, []);
  assert.equal("gender" in model.personalInformation, false);
  assert.equal("civilStatus" in model.personalInformation, false);
  assert.equal("governmentIds" in model.personalInformation, false);
  assert.equal(JSON.stringify(model).includes("C:/private"), false);
  assert.equal(JSON.stringify(model).includes("must-not-be-read"), false);
});

test("deduplicates scalar and array versions of the same work experience", () => {
  const repeated = {
    role: "Agent",
    company: "Example BPO",
    industryRelevantExperience: "BPO",
    lengthOfWorkExperience: "1 year to 2 years",
    years: "2",
    monthlyCompensation: "20000",
    reasonForLeaving: "Growth",
  };
  const model = buildTalentPoolCandidatePdsModel({
    application: { ...repeated, workExperiences: [repeated] },
  });
  assert.equal(model.workExperiences.length, 1);
});
```

- [ ] **Step 5: Run the mapper tests**

Run:

```powershell
node --test src\utils\talentPoolCandidatePdsModel.test.js
```

Expected: all mapper and filename tests PASS.

- [ ] **Step 6: Commit the mapper**

```powershell
git add src\utils\talentPoolCandidatePdsModel.js src\utils\talentPoolCandidatePdsModel.test.js
git commit -m "feat: map talent pool candidate PDS data"
```

---

### Task 2: Render the SiBS Candidate Personal Data Sheet PDF

**Files:**
- Modify: `C:\Users\ralphvincentd\SiBS-HRIS-Server\package.json`
- Modify: `C:\Users\ralphvincentd\SiBS-HRIS-Server\package-lock.json`
- Create: `C:\Users\ralphvincentd\SiBS-HRIS-Server\src\utils\talentPoolCandidatePdsPdf.js`
- Create: `C:\Users\ralphvincentd\SiBS-HRIS-Server\src\utils\talentPoolCandidatePdsPdf.test.js`
- Read: `C:\Users\ralphvincentd\SiBS-HRIS-Server\src\logos\SiBSLogoNavy.png`

**Interfaces:**
- Consumes: the exact `CandidatePdsModel` produced by Task 1 and `{ logoPath }`.
- Produces: `generateTalentPoolCandidatePdsPdf(model, { logoPath }): Promise<Buffer>`.
- Produces: an A4 PDF with metadata title, dynamic pages, repeating headers, page numbers, and no disk writes.

- [ ] **Step 1: Install PDFKit in the server repository**

Run:

```powershell
npm.cmd install pdfkit
```

Expected: `pdfkit` appears in `dependencies`; `package-lock.json` records the resolved dependency tree.

- [ ] **Step 2: Write the failing PDF signature and pagination tests**

Use the mapper from Task 1 and the real logo path:

```js
import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildTalentPoolCandidatePdsModel } from "./talentPoolCandidatePdsModel.js";
import { generateTalentPoolCandidatePdsPdf } from "./talentPoolCandidatePdsPdf.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const logoPath = path.resolve(currentDir, "../logos/SiBSLogoNavy.png");

test("generates a valid SiBS candidate PDS PDF buffer", async () => {
  const model = buildTalentPoolCandidatePdsModel({
    application: {
      candidateId: "PUB-001",
      firstName: "Ana",
      lastName: "Santos",
      email: "ana@example.com",
      openPosition: "Customer Service Representative",
    },
  });

  const buffer = await generateTalentPoolCandidatePdsPdf(model, { logoPath });
  assert.equal(buffer.subarray(0, 4).toString("ascii"), "%PDF");
  assert.ok(buffer.length > 5_000);
});

test("paginates long repeated candidate data", async () => {
  const repeatedWork = Array.from({ length: 35 }, (_, index) => ({
    role: `Support Role ${index + 1}`,
    company: `Company ${index + 1}`,
    industryRelevantExperience: "Business process outsourcing and customer support",
    lengthOfWorkExperience: "1 year to 2 years",
    years: "2",
    monthlyCompensation: "22000",
    reasonForLeaving: "Career growth and professional development",
  }));
  const model = buildTalentPoolCandidatePdsModel({
    application: {
      candidateId: "PUB-LONG",
      firstName: "Long",
      lastName: "Candidate",
      workExperiences: repeatedWork,
    },
  });

  const buffer = await generateTalentPoolCandidatePdsPdf(model, { logoPath });
  const pageObjects = buffer.toString("latin1").match(/\/Type\s*\/Page\b/g) || [];
  assert.ok(pageObjects.length > 1);
});
```

- [ ] **Step 3: Run the PDF tests and verify they fail**

Run:

```powershell
node --test src\utils\talentPoolCandidatePdsPdf.test.js
```

Expected: FAIL because `talentPoolCandidatePdsPdf.js` does not exist.

- [ ] **Step 4: Implement buffered PDFKit generation and page primitives**

Implement the public entry point with deterministic stream collection:

```js
import fs from "node:fs";
import PDFDocument from "pdfkit";

export async function generateTalentPoolCandidatePdsPdf(
  model,
  { logoPath } = {},
) {
  if (!model?.candidateSummary) {
    throw new Error("Candidate PDS model is required.");
  }
  if (!logoPath || !fs.existsSync(logoPath)) {
    throw new Error("SiBS candidate PDS logo was not found.");
  }

  return new Promise((resolve, reject) => {
    const document = new PDFDocument({
      size: "A4",
      margins: { top: 54, right: 42, bottom: 48, left: 42 },
      bufferPages: true,
      compress: false,
      info: {
        Title: `SiBS Candidate Personal Data Sheet - ${model.candidateSummary.fullName}`,
        Author: "SiBS Outsourcing Solutions",
        Subject: "Talent Pool candidate profile",
      },
    });
    const chunks = [];
    document.on("data", (chunk) => chunks.push(chunk));
    document.on("error", reject);
    document.on("end", () => resolve(Buffer.concat(chunks)));

    renderCandidatePds(document, model, logoPath);
    addPageNumbers(document, model.candidateSummary);
    document.end();
  });
}
```

Add focused internal helpers with these responsibilities:

- `ensureSpace(document, requiredHeight, summary)`: adds a page and repeated header when the remaining height is insufficient.
- `drawDocumentHeader(document, model, logoPath)`: logo, title, candidate identity, role, location, status, application date, generated date.
- `drawRepeatedHeader(document, candidateSummary)`: candidate name and ID on pages after page one.
- `drawSectionHeading(document, title)`: navy section band with orange accent.
- `drawFieldGrid(document, fields, columns)`: label/value grid with wrapped text.
- `drawTable(document, { columns, rows, summary })`: calculated row heights, repeated headings after page breaks, no clipped cells.
- `drawList(document, values)`: wrapped bullet list.
- `addPageNumbers(document, candidateSummary)`: `Page X of Y` and `Confidential - SiBS Talent Acquisition`.

Render sections in this order: Candidate Summary, Personal and Contact Information, Education, Employment History, Skills and Professional Development, Work Readiness, Character References, Role-Specific Responses, Application History, Attachments.

Use only these core colors:

```js
const COLORS = {
  navy: "#042C51",
  orange: "#FF5C28",
  text: "#101828",
  muted: "#667085",
  rule: "#DCE6F1",
  surface: "#F8FAFC",
  white: "#FFFFFF",
};
```

- [ ] **Step 5: Add invalid-input and missing-logo assertions**

Add renderer boundary tests:

```js
test("rejects an invalid candidate PDS model", async () => {
  await assert.rejects(
    generateTalentPoolCandidatePdsPdf({}, { logoPath }),
    /Candidate PDS model is required/,
  );
});

test("rejects a missing SiBS logo", async () => {
  await assert.rejects(
    generateTalentPoolCandidatePdsPdf(
      { candidateSummary: { fullName: "Ana Santos" } },
      { logoPath: "missing-logo.png" },
    ),
    /SiBS candidate PDS logo was not found/,
  );
});
```

- [ ] **Step 6: Run mapper and renderer tests together**

Run:

```powershell
node --test src\utils\talentPoolCandidatePdsModel.test.js src\utils\talentPoolCandidatePdsPdf.test.js
```

Expected: all tests PASS.

- [ ] **Step 7: Commit the PDF renderer and dependency**

```powershell
git add package.json package-lock.json src\utils\talentPoolCandidatePdsPdf.js src\utils\talentPoolCandidatePdsPdf.test.js
git commit -m "feat: render SiBS candidate PDS PDF"
```

---

### Task 3: Add the protected Talent Pool resume endpoint

**Files:**
- Modify: `C:\Users\ralphvincentd\SiBS-HRIS-Server\src\routes\talent-pool.js`
- Create: `C:\Users\ralphvincentd\SiBS-HRIS-Server\src\routes\talent-pool-candidate-pds.test.js`

**Interfaces:**
- Consumes: `getApplicationById(id)`, `getRecruitmentApplicationAnswersForTalentPoolApplication(hrisDb, input)`, Task 1 mapper, Task 2 renderer, and `authMiddleware`.
- Produces: `createTalentPoolCandidatePdsHandler(dependencies): ExpressHandler` for isolated route tests.
- Produces: `GET /api/talent-pool/applications/:id/resume.pdf` protected by `authMiddleware`.

- [ ] **Step 1: Write failing handler-contract tests**

Create small request/response fakes and cover success, malformed ID, missing candidate, and generation failure:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { createTalentPoolCandidatePdsHandler } from "./talent-pool.js";

function createResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) { this.statusCode = code; return this; },
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    json(value) { this.body = value; return this; },
    send(value) { this.body = value; return this; },
  };
}

test("returns the generated candidate PDF with private response headers", async () => {
  const handler = createTalentPoolCandidatePdsHandler({
    loadApplication: async () => ({
      id: 91,
      candidate_id: "PUB-001",
      first_name: "Ana",
      last_name: "Santos",
      application_count: 2,
    }),
    normalizeApplicationRecord: (row) => ({
      id: row.id,
      candidateId: row.candidate_id,
      firstName: row.first_name,
      lastName: row.last_name,
      applicationCount: row.application_count,
    }),
    loadApplicationAnswers: async (_db, input) => {
      assert.equal(input.applicationCount, 2);
      return { applicationCount: 2, answers: [] };
    },
    mapCandidatePds: () => ({ candidateSummary: { fullName: "Ana Santos" } }),
    renderCandidatePds: async () => Buffer.from("%PDF-test"),
    buildFilename: () => "Ana_Santos_SiBS_Profile.pdf",
    database: {},
    logoPath: "ignored-by-renderer-stub.png",
  });
  const response = createResponse();

  await handler({ params: { id: "91" } }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.headers["content-type"], "application/pdf");
  assert.equal(response.headers["cache-control"], "private, no-store");
  assert.match(response.headers["content-disposition"], /inline/);
  assert.equal(response.body.subarray(0, 4).toString("ascii"), "%PDF");
});
```

Add assertions for:

- ID `"abc"` returns `400` with `Invalid Talent Pool application ID.`.
- Missing application returns `404` with `Talent Pool application not found.`.
- Renderer exception returns `500` with `Unable to generate the candidate resume.` and no stack trace.

- [ ] **Step 2: Run the route tests and verify they fail**

Run:

```powershell
node --test src\routes\talent-pool-candidate-pds.test.js
```

Expected: FAIL because `createTalentPoolCandidatePdsHandler` is not exported.

- [ ] **Step 3: Add imports and implement the injectable handler**

Add these imports to `talent-pool.js`:

```js
import { fileURLToPath } from "node:url";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  buildTalentPoolCandidatePdsFilename,
  buildTalentPoolCandidatePdsModel,
} from "../utils/talentPoolCandidatePdsModel.js";
import { generateTalentPoolCandidatePdsPdf } from "../utils/talentPoolCandidatePdsPdf.js";
```

Export the handler factory with explicit dependencies:

```js
export function createTalentPoolCandidatePdsHandler({
  loadApplication,
  normalizeApplicationRecord,
  loadApplicationAnswers,
  mapCandidatePds,
  renderCandidatePds,
  buildFilename,
  database,
  logoPath,
}) {
  return async function talentPoolCandidatePdsHandler(req, res) {
    const applicationId = Number(req.params.id);
    if (!Number.isSafeInteger(applicationId) || applicationId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid Talent Pool application ID.",
      });
    }

    try {
      const row = await loadApplication(applicationId);
      if (!row) {
        return res.status(404).json({
          success: false,
          message: "Talent Pool application not found.",
        });
      }
      const application = normalizeApplicationRecord(row);
      const applicationAnswers = await loadApplicationAnswers(database, {
        talentPoolApplicationId: applicationId,
        applicationCount: Math.max(Number(application.applicationCount || 1), 1),
      });
      const model = mapCandidatePds({ application, applicationAnswers });
      const pdf = await renderCandidatePds(model, { logoPath });
      const filename = buildFilename(model);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${filename}"`,
      );
      res.setHeader("Cache-Control", "private, no-store");
      return res.send(pdf);
    } catch (error) {
      console.error("Generate Talent Pool candidate PDS error:", error);
      return res.status(500).json({
        success: false,
        message: "Unable to generate the candidate resume.",
      });
    }
  };
}
```

- [ ] **Step 4: Register only the new route behind authentication**

Create the concrete handler after `getApplicationById()` is defined, using a robust logo path:

```js
const talentPoolCandidatePdsLogoPath = fileURLToPath(
  new URL("../logos/SiBSLogoNavy.png", import.meta.url),
);

const talentPoolCandidatePdsHandler = createTalentPoolCandidatePdsHandler({
  loadApplication: getApplicationById,
  normalizeApplicationRecord: normalizeApplication,
  loadApplicationAnswers:
    getRecruitmentApplicationAnswersForTalentPoolApplication,
  mapCandidatePds: buildTalentPoolCandidatePdsModel,
  renderCandidatePds: generateTalentPoolCandidatePdsPdf,
  buildFilename: buildTalentPoolCandidatePdsFilename,
  database: hrisDb,
  logoPath: talentPoolCandidatePdsLogoPath,
});

router.get(
  "/applications/:id/resume.pdf",
  authMiddleware,
  talentPoolCandidatePdsHandler,
);
```

Register this route before `router.get("/applications/:id", ...)`. Do not add a router-wide middleware in this task because doing so would alter all existing Talent Pool endpoints.

- [ ] **Step 5: Run all server PDS tests**

Run:

```powershell
node --test src\utils\talentPoolCandidatePdsModel.test.js src\utils\talentPoolCandidatePdsPdf.test.js src\routes\talent-pool-candidate-pds.test.js
```

Expected: all tests PASS.

- [ ] **Step 6: Commit the protected endpoint**

```powershell
git add src\routes\talent-pool.js src\routes\talent-pool-candidate-pds.test.js
git commit -m "feat: expose protected talent pool resume PDF"
```

---

### Task 4: Add the client PDF response adapter

**Files:**
- Modify: `C:\Users\ralphvincentd\SiBS-HRIS-CLIENT-V2\src\lib\axios\getTalentPool.js`
- Create: `C:\Users\ralphvincentd\SiBS-HRIS-CLIENT-V2\src\lib\utils\talentPool\talentPoolResume.js`
- Create: `C:\Users\ralphvincentd\SiBS-HRIS-CLIENT-V2\src\lib\utils\talentPool\talentPoolResume.test.js`

**Interfaces:**
- Produces: `parseTalentPoolResumeFilename(contentDisposition, fallback): string`.
- Produces: `getTalentPoolResumePdf(applicationId): Promise<{ success, data, filename, message, status }>` where `data` is a PDF `Blob` on success.
- Consumes: the shared Axios client and authenticated server endpoint from Task 3.

- [ ] **Step 1: Write failing response-filename tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { parseTalentPoolResumeFilename } from "./talentPoolResume.js";

test("parses a quoted PDF response filename", () => {
  assert.equal(
    parseTalentPoolResumeFilename(
      'inline; filename="Ana_Santos_SiBS_Profile.pdf"',
      "Candidate_SiBS_Profile.pdf",
    ),
    "Ana_Santos_SiBS_Profile.pdf",
  );
});

test("uses a safe fallback for missing or invalid response filenames", () => {
  assert.equal(
    parseTalentPoolResumeFilename("", "Candidate_SiBS_Profile.pdf"),
    "Candidate_SiBS_Profile.pdf",
  );
  assert.equal(
    parseTalentPoolResumeFilename(
      'inline; filename="../../bad.txt"',
      "Candidate_SiBS_Profile.pdf",
    ),
    "Candidate_SiBS_Profile.pdf",
  );
});
```

- [ ] **Step 2: Run the utility tests and verify they fail**

Run:

```powershell
node --test src\lib\utils\talentPool\talentPoolResume.test.js
```

Expected: FAIL because `talentPoolResume.js` does not exist.

- [ ] **Step 3: Implement strict response-filename parsing**

```js
export function parseTalentPoolResumeFilename(
  contentDisposition = "",
  fallback = "Candidate_SiBS_Profile.pdf",
) {
  const match = String(contentDisposition).match(
    /filename\*?=(?:UTF-8''|"?)([^";]+)/i,
  );
  let candidate = match?.[1] || "";
  try {
    candidate = decodeURIComponent(candidate);
  } catch {
    candidate = "";
  }
  candidate = candidate.replace(/[\\/\r\n]/g, "").trim();
  return /^[a-zA-Z0-9][a-zA-Z0-9._ -]*\.pdf$/i.test(candidate)
    ? candidate
    : fallback;
}
```

- [ ] **Step 4: Add the blob-returning Axios adapter**

Import the filename parser into `getTalentPool.js` and add:

```js
export async function getTalentPoolResumePdf(applicationId) {
  const safeId = String(applicationId || "").trim();
  if (!/^\d+$/.test(safeId)) {
    return {
      success: false,
      data: null,
      filename: "",
      status: 400,
      message: "A valid Talent Pool application ID is required.",
    };
  }

  try {
    const response = await api.get(
      `/api/talent-pool/applications/${encodeURIComponent(safeId)}/resume.pdf`,
      { withCredentials: true, responseType: "blob" },
    );
    const contentType = String(response.headers?.["content-type"] || "");
    if (!contentType.toLowerCase().includes("application/pdf") || !response.data?.size) {
      throw new Error("The server did not return a valid PDF.");
    }
    return {
      success: true,
      data: response.data,
      filename: parseTalentPoolResumeFilename(
        response.headers?.["content-disposition"],
        "Candidate_SiBS_Profile.pdf",
      ),
      status: response.status,
      message: "Candidate resume generated.",
    };
  } catch (error) {
    let responseMessage = "";
    const errorBlob = error?.response?.data;
    if (errorBlob instanceof Blob) {
      try {
        const parsed = JSON.parse(await errorBlob.text());
        responseMessage = parsed?.message || parsed?.error || "";
      } catch {
        responseMessage = "";
      }
    }
    return {
      success: false,
      data: null,
      filename: "",
      status: error?.response?.status || 500,
      message:
        responseMessage ||
        error?.response?.data?.message ||
        error?.message ||
        "Unable to generate the candidate resume.",
    };
  }
}
```

Also add `getTalentPoolResumePdf` to the module's default export.

- [ ] **Step 5: Run the utility test and focused lint**

Run:

```powershell
node --test src\lib\utils\talentPool\talentPoolResume.test.js
.\node_modules\.bin\eslint.cmd src\lib\axios\getTalentPool.js src\lib\utils\talentPool\talentPoolResume.js src\lib\utils\talentPool\talentPoolResume.test.js
```

Expected: utility tests PASS and focused ESLint exits successfully.

- [ ] **Step 6: Commit the client adapter**

```powershell
git add src\lib\axios\getTalentPool.js src\lib\utils\talentPool\talentPoolResume.js src\lib\utils\talentPool\talentPoolResume.test.js
git commit -m "feat: request talent pool resume PDF"
```

---

### Task 5: Add Generate Resume to the candidate profile header

**Files:**
- Modify: `C:\Users\ralphvincentd\SiBS-HRIS-CLIENT-V2\src\components\modals\talentPool\CandidateProfileModal.jsx`
- Create: `C:\Users\ralphvincentd\SiBS-HRIS-CLIENT-V2\scripts\verify-talent-pool-resume-ui.mjs`

**Interfaces:**
- Consumes: `talentPoolApplicationId` already resolved by `CandidateProfileModal` and `getTalentPoolResumePdf()` from Task 4.
- Produces: `handleGenerateResume(): Promise<void>`.
- Produces: **Generate Resume** immediately before **Status** in the candidate summary action group.

- [ ] **Step 1: Write a failing focused UI contract script**

Create a source-level contract check because this client repository has no React component test harness:

```js
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(
  "src/components/modals/talentPool/CandidateProfileModal.jsx",
  "utf8",
);

assert.match(source, /getTalentPoolResumePdf/);
assert.match(source, /isGeneratingResume/);
assert.match(source, /handleGenerateResume/);
assert.match(source, />\s*Generate Resume\s*</);
assert.match(source, /Generating\.\.\./);

const generateIndex = source.indexOf("Generate Resume");
const statusButtonIndex = source.indexOf("handleUpdateCandidateStatus", generateIndex);
assert.ok(generateIndex >= 0 && statusButtonIndex > generateIndex);

console.log("PASS: Talent Pool resume action UI contract");
```

- [ ] **Step 2: Run the UI contract and verify it fails**

Run:

```powershell
node scripts\verify-talent-pool-resume-ui.mjs
```

Expected: FAIL because the modal has no generation action.

- [ ] **Step 3: Add modal state, reset behavior, and the generation handler**

Import `FileDown` from Lucide and `getTalentPoolResumePdf` from `getTalentPool.js`. Add:

```js
const [isGeneratingResume, setIsGeneratingResume] = useState(false);
```

Reset it when `selectedCandidate` changes. Implement:

```js
async function handleGenerateResume() {
  if (!talentPoolApplicationId || isGeneratingResume) return;

  const previewWindow = window.open("", "_blank");
  if (previewWindow) {
    previewWindow.opener = null;
    previewWindow.document.title = "Generating SiBS Candidate Resume";
    previewWindow.document.body.textContent = "Generating candidate resume...";
  }

  setIsGeneratingResume(true);
  try {
    const result = await getTalentPoolResumePdf(talentPoolApplicationId);
    if (!result.success || !result.data) {
      throw new Error(result.message || "Unable to generate the candidate resume.");
    }

    const objectUrl = URL.createObjectURL(result.data);
    if (previewWindow) {
      previewWindow.location.replace(objectUrl);
    } else {
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setStatusModal({
        open: true,
        type: "success",
        title: "Resume generated",
        message: "The PDF preview was blocked, so the candidate resume was downloaded instead.",
        closeProfileOnClose: false,
      });
    }
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  } catch (error) {
    if (previewWindow && !previewWindow.closed) previewWindow.close();
    setStatusModal({
      open: true,
      type: "error",
      title: "Resume generation failed",
      message: getApiErrorMessage(
        error,
        "Unable to generate the candidate resume.",
      ),
      closeProfileOnClose: false,
    });
  } finally {
    setIsGeneratingResume(false);
  }
}
```

Do not close the candidate modal during generation.

- [ ] **Step 4: Insert the action immediately left of Status**

In the candidate summary action group, place this button directly before the existing Status button:

```jsx
<button
  type="button"
  onClick={handleGenerateResume}
  disabled={!talentPoolApplicationId || isGeneratingResume}
  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#D6E0EA] bg-white px-3 text-xs font-black text-[#042C51] shadow-sm transition hover:border-[#FF5C28]/50 hover:bg-[#FFF9F6] hover:text-[#C9360A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C28]/30 disabled:cursor-not-allowed disabled:opacity-60"
>
  {isGeneratingResume ? (
    <Loader2 size={15} className="animate-spin text-[#FF5C28]" />
  ) : (
    <FileDown size={15} className="text-[#FF5C28]" />
  )}
  {isGeneratingResume ? "Generating..." : "Generate Resume"}
</button>
```

Keep the action group responsive: full-width stacked buttons below the large breakpoint and natural-width horizontal buttons at the candidate-header breakpoint. Do not alter the Status handler or styling beyond any flex wrapping needed to fit both controls.

- [ ] **Step 5: Run the UI contract and focused lint**

Run:

```powershell
node scripts\verify-talent-pool-resume-ui.mjs
.\node_modules\.bin\eslint.cmd src\components\modals\talentPool\CandidateProfileModal.jsx src\lib\axios\getTalentPool.js src\lib\utils\talentPool\talentPoolResume.js src\lib\utils\talentPool\talentPoolResume.test.js scripts\verify-talent-pool-resume-ui.mjs
```

Expected: contract script and focused ESLint PASS.

- [ ] **Step 6: Build the frontend**

Run:

```powershell
npm.cmd run build
```

Expected: production build succeeds; report the repository's existing large-chunk warning without treating it as a new failure.

- [ ] **Step 7: Commit the modal action**

```powershell
git add src\components\modals\talentPool\CandidateProfileModal.jsx scripts\verify-talent-pool-resume-ui.mjs
git commit -m "feat: add candidate resume action to talent pool"
```

---

### Task 6: Verify PDF fidelity, privacy, and end-to-end behavior

**Files:**
- Verify: `C:\Users\ralphvincentd\SiBS-HRIS-Server\src\utils\talentPoolCandidatePdsModel.js`
- Verify: `C:\Users\ralphvincentd\SiBS-HRIS-Server\src\utils\talentPoolCandidatePdsPdf.js`
- Verify: `C:\Users\ralphvincentd\SiBS-HRIS-Server\src\routes\talent-pool.js`
- Verify: `C:\Users\ralphvincentd\SiBS-HRIS-CLIENT-V2\src\components\modals\talentPool\CandidateProfileModal.jsx`
- Temporary render output: `C:\Users\ralphvincentd\SiBS-HRIS-Server\tmp\pdfs\talent-pool-candidate-pds\`

**Interfaces:**
- Consumes: the completed endpoint and client action.
- Produces: verification evidence only; no production artifact or database mutation.

- [ ] **Step 1: Run the full focused server verification**

Run from `SiBS-HRIS-Server`:

```powershell
node --test src\utils\talentPoolCandidatePdsModel.test.js src\utils\talentPoolCandidatePdsPdf.test.js src\routes\talent-pool-candidate-pds.test.js
```

Expected: all PDS tests PASS.

- [ ] **Step 2: Run the full focused client verification**

Run from `SiBS-HRIS-CLIENT-V2`:

```powershell
node --test src\lib\utils\talentPool\talentPoolResume.test.js
node scripts\verify-talent-pool-resume-ui.mjs
.\node_modules\.bin\eslint.cmd src\components\modals\talentPool\CandidateProfileModal.jsx src\lib\axios\getTalentPool.js src\lib\utils\talentPool\talentPoolResume.js src\lib\utils\talentPool\talentPoolResume.test.js scripts\verify-talent-pool-resume-ui.mjs
npm.cmd run build
```

Expected: tests, UI contract, focused lint, and build PASS.

- [ ] **Step 3: Exercise endpoint security and response headers**

With the local server running, request the endpoint without an authenticated cookie and confirm it returns `401`. Then use the signed-in local application to generate a candidate PDF and confirm the successful response contains:

```text
Content-Type: application/pdf
Content-Disposition: inline; filename="<Candidate_Name>_SiBS_Profile.pdf"
Cache-Control: private, no-store
```

Do not copy authentication cookies or candidate payloads into logs or plan artifacts.

- [ ] **Step 4: Render the generated PDF for visual QA**

Save one generated test PDF under the temporary server directory, then render every page:

```powershell
New-Item -ItemType Directory -Force tmp\pdfs\talent-pool-candidate-pds | Out-Null
& 'C:\Users\ralphvincentd\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\poppler\Library\bin\pdftoppm.exe' -png -r 144 tmp\pdfs\talent-pool-candidate-pds\candidate-profile.pdf tmp\pdfs\talent-pool-candidate-pds\page
```

Inspect every PNG and confirm:

- No clipped, overlapping, or missing text.
- Section headings are never stranded at the bottom of a page.
- Table headers and rows remain aligned after page breaks.
- SiBS logo, navy/orange colors, footer, and page numbers render correctly.
- Candidate name and ID repeat after page one.
- Long question answers and work histories wrap at readable sizes.
- Empty sections create no blank pages.
- No internal paths, JSON syntax, or uncollected government fields appear.

Extract the rendered document text with the bundled PDF runtime and enforce the privacy assertions:

```powershell
& 'C:\Users\ralphvincentd\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -c "import pdfplumber; p=r'tmp\pdfs\talent-pool-candidate-pds\candidate-profile.pdf'; t='\n'.join((x.extract_text() or '') for x in pdfplumber.open(p).pages); assert 'C:/private' not in t; assert 'attachment_file_path' not in t; assert 'SSS NO.' not in t; print('PASS: extracted PDF text contains no private paths or uncollected government fields')"
```

- [ ] **Step 5: Verify the candidate-profile interaction in the browser**

At `/recruitment/talent-pool`:

1. Open a candidate profile.
2. Confirm **Generate Resume** is immediately left of **Status**.
3. Confirm the action remains legible at 1366x768 and a narrow modal viewport.
4. Generate a resume and confirm one PDF preview tab opens.
5. Confirm repeated clicks are disabled while the request is active.
6. Confirm the PDF matches the latest/current application and latest role-specific answers.
7. Simulate a server failure and confirm the blank preview closes and the existing status modal reports the failure.
8. Simulate a blocked popup and confirm the named PDF downloads instead.
9. Confirm Status, Close, Drop Off, Move to Pipeline, and Onboarding actions still behave normally.

- [ ] **Step 6: Review final diffs in both repositories**

Run in each repository:

```powershell
git status --short
git diff --check
git diff --stat
```

Expected: only the planned files are part of the feature commits; unrelated pre-existing changes remain untouched.

- [ ] **Step 7: Create any final verification-only commit if required**

If visual verification required a server production correction, repeat the affected focused tests and commit only the PDS server files:

```powershell
git add src\utils\talentPoolCandidatePdsModel.js src\utils\talentPoolCandidatePdsModel.test.js src\utils\talentPoolCandidatePdsPdf.js src\utils\talentPoolCandidatePdsPdf.test.js src\routes\talent-pool.js src\routes\talent-pool-candidate-pds.test.js
git commit -m "fix: polish talent pool candidate PDS output"
```

If visual verification required a client production correction, repeat the affected focused checks and commit only the resume client files:

```powershell
git add src\components\modals\talentPool\CandidateProfileModal.jsx src\lib\axios\getTalentPool.js src\lib\utils\talentPool\talentPoolResume.js src\lib\utils\talentPool\talentPoolResume.test.js scripts\verify-talent-pool-resume-ui.mjs
git commit -m "fix: polish talent pool resume preview"
```

If verification required no production correction, do not create an empty commit.
