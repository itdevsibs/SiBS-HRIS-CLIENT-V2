# Talent Pool Candidate PDS Design

## Purpose

Add an authenticated **Generate Resume** action to the Talent Pool candidate profile. The action generates a fresh, SiBS-branded Candidate Personal Data Sheet (PDS) PDF from the latest/current Talent Pool application and opens it for HR to review, print, or download.

The output is inspired by the information hierarchy of CS Form No. 212 (Revised 2017), but it is not a copy of the government form. It must not reproduce declarations or request fields that the SiBS application did not collect.

## Goals

- Generate a professional candidate profile from authoritative Talent Pool data.
- Keep the PDF current by generating it on demand instead of persisting copies.
- Present only submitted or system-recorded information; never infer missing personal data.
- Support long and repeated data without clipping, overlap, or unreadable text.
- Keep candidate personal information behind the existing authenticated Talent Pool boundary.
- Preserve all existing Talent Pool, candidate-profile, and public-application behavior.

## Non-goals

- Reproducing or filling the official CS Form No. 212.
- Changing the public Talent Pool application form.
- Adding new candidate fields or database columns.
- Embedding uploaded audio or supporting documents in the generated PDF.
- Storing generated PDFs, versions, or generation history in the database.
- Generating PDFs in the browser.

## User experience

The candidate profile header gains a **Generate Resume** button immediately to the left of the existing **Status** button.

When HR activates the button:

1. A blank preview tab opens synchronously so normal popup blockers recognize the user gesture.
2. The button changes to **Generating...**, displays a spinner, and rejects duplicate clicks.
3. The client requests the candidate PDF through the authenticated API.
4. On success, the preview tab navigates to a local object URL containing the returned PDF.
5. HR uses the browser PDF viewer to review, print, or download the document.
6. If a preview tab cannot be opened, the client downloads the generated PDF through a temporary anchor and shows an informational status message.
7. On failure, the client closes the unused preview tab and reports the backend message through the existing status modal.

The action is disabled when the candidate has no resolvable Talent Pool application ID or while generation is already running.

## Architecture

### Frontend

`CandidateProfileModal.jsx` owns the action because it already resolves the selected candidate, fetches full Talent Pool details, and renders the **Status** control. It will not build the document or map database aliases.

A focused Axios adapter will request:

```http
GET /api/talent-pool/applications/:id/resume.pdf
Accept: application/pdf
```

The adapter returns the PDF blob and the response filename when present. It uses the repository's shared Axios client and cookie-backed authentication.

### Backend

The authenticated Talent Pool router exposes:

```http
GET /api/talent-pool/applications/:id/resume.pdf
```

The route performs four steps:

1. Validate and resolve the Talent Pool application.
2. Load the latest/current application questions and answers.
3. Build one canonical `candidatePdsModel` through a pure mapper.
4. Pass the model to a PDF generator and return the resulting buffer.

The mapper and PDF renderer are separate utilities. The route must remain orchestration-only so field behavior and rendering can be tested independently.

The backend adds `pdfkit` as the single document-generation dependency. It is preferred over the existing low-level employment-offer PDF writer because the candidate profile needs flowing text, dynamic tables, repeated headers, and automatic page breaks.

No database schema changes are required.

## Canonical document model

The mapper produces a stable object with these top-level properties:

```js
{
  generatedAt,
  candidateSummary,
  personalInformation,
  educationRecords,
  workExperiences,
  professionalDevelopment,
  workReadiness,
  references,
  roleSpecificResponses,
  applicationHistory,
  attachments
}
```

Each value is normalized before rendering:

- Strings are trimmed and control characters removed.
- Dates use a single readable format.
- Arrays exclude empty rows.
- Repeated fields preserve submitted order except application history, which is chronological.
- Missing scalar values become `Not provided` only when the field provides necessary context.
- A section whose meaningful values are all absent is omitted.
- Backend aliases are resolved in the mapper rather than in the renderer.

## PDF content

### Header and candidate summary

- SiBS logo and navy/orange brand treatment
- Document title: **SiBS Candidate Personal Data Sheet**
- Candidate full name and nickname
- Candidate ID
- Applied position and preferred location
- Current Talent Pool status
- Latest application date
- PDF generation date and time

### Personal and contact information

- Date of birth
- Age as of application
- Email address
- Primary phone number
- Secondary phone number
- Physical address

### Education

For each submitted education level:

- Level
- School name
- Course or program
- School address
- Graduation year or submitted school year

### Employment history

For each submitted experience:

- Role
- Company
- Industry or relevant experience
- Length of experience
- Years
- Monthly compensation
- Reason for leaving

The first work-experience fields and additional experiences are normalized into one ordered list without duplicating identical entries.

### Skills and professional development

- Skills and languages
- Affiliations and certifications
- Training attended

### Work-readiness information

- Fully vaccinated response
- Comfortable working on site
- Willing to work graveyard shift
- Full-time or part-time preference
- Remote-work equipment and space access
- Willing to undertake a drug test
- Willing to permit a background check

### Character references

For each submitted reference:

- Name
- Phone number

References with neither a name nor a phone number are omitted.

### Role-specific responses

The document uses the latest/current recruitment application form and answer set. Each entry contains the displayed question followed by the candidate's submitted answer. Empty unanswered optional questions are omitted. Structured answers are converted into readable lists rather than raw JSON.

### Application history

A compact table shows available previous application activity:

- Date
- Position or role
- Status or event
- Source when meaningful

This section provides context only; current profile fields always come from the latest/current application.

### Attachments

The PDF lists the submitted audio and supporting-document filenames. Files are not embedded, linked with private storage paths, or copied into the PDF.

## Visual design and pagination

- Paper size: A4 portrait.
- SiBS colors: `#042C51` navy and `#FF5C28` orange.
- White content surface with light gray rules and section backgrounds.
- Clear hierarchy using a compact document header, section bands, labels, and readable body text.
- Repeated page header with candidate name and candidate ID after page one.
- Footer includes page number and a confidentiality note.
- Tables repeat their column headings after page breaks when feasible.
- Long values wrap; they must never shrink below a readable body size solely to fit one row.
- Sections move to a new page when their heading would otherwise be stranded at the bottom.
- The generated page count is dynamic rather than fixed to four pages.

## API response contract

### Success

```http
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Disposition: inline; filename="Candidate_Name_SiBS_Profile.pdf"
Cache-Control: private, no-store
```

The response body is a valid PDF buffer beginning with `%PDF`.

### Failures

- `400`: malformed or unsupported application ID.
- `401` or `403`: existing authentication or authorization failure.
- `404`: Talent Pool application not found.
- `500`: mapping or PDF generation failure, with a safe user-facing message.

Internal stack traces, database details, local paths, and raw candidate data must not be returned in error responses.

## Security and privacy

- The endpoint is private and follows the same middleware/order as the existing private Talent Pool application endpoints.
- Candidate data is loaded by application ID on the server; the client never sends a candidate profile as generation input.
- Filenames are sanitized and cannot inject header characters or paths.
- Responses are marked `private, no-store`.
- Generated buffers are not written to disk or retained after the response completes.
- Uploaded file paths and internal metadata are excluded from the document.
- The renderer escapes or normalizes control characters before drawing content.

## Error handling

- The frontend keeps one generation request active at a time.
- An absent application ID disables the action instead of issuing an invalid request.
- A non-PDF or empty success response is treated as an error.
- The temporary preview tab is closed when generation fails.
- Blob object URLs are revoked after the preview has been handed off.
- Existing candidate-profile status, move, drop-off, and onboarding actions remain independent of generation state.

## Testing strategy

### Backend unit tests

- Map a complete public application into every document section.
- Map partial applications without invented values.
- Normalize education, experience, training, references, answers, and history.
- Deduplicate the primary and additional work-experience records.
- Sanitize candidate filenames.
- Generate a non-empty buffer beginning with `%PDF`.
- Generate documents containing long values and enough repeated rows to span pages.
- Confirm private file paths and raw JSON are absent from extracted PDF text.

### Backend route tests

- Return `200` and PDF response headers for an authenticated valid candidate.
- Return `400` for an invalid ID.
- Return `404` for a missing application.
- Preserve existing authentication and authorization behavior.
- Return a safe `500` response when generation fails.

### Frontend tests and manual verification

- Render **Generate Resume** immediately left of **Status**.
- Disable the action without a Talent Pool application ID.
- Show and clear the generating state correctly.
- Open the returned PDF in the preview tab.
- Fall back to download when the preview tab is blocked.
- Close the blank preview and show the status modal on failure.
- Confirm layout at compact laptop and mobile modal widths.
- Run focused lint, backend tests, frontend build, and rendered-PDF visual inspection.

## Files expected to change

### Client

- `src/components/modals/talentPool/CandidateProfileModal.jsx`
- `src/lib/axios/getTalentPool.js`
- Focused test files for the new adapter and button behavior where supported by the existing test setup

### Server

- `src/routes/talent-pool.js`
- `src/utils/talentPoolCandidatePdsModel.js`
- `src/utils/talentPoolCandidatePdsPdf.js`
- `src/utils/talentPoolCandidatePdsModel.test.js`
- `src/utils/talentPoolCandidatePdsPdf.test.js`
- `package.json`
- `package-lock.json`

## Acceptance criteria

- The candidate profile shows **Generate Resume** immediately left of **Status**.
- A single activation produces a previewable PDF for the selected candidate.
- The PDF reflects the latest/current Talent Pool application and latest role-specific responses.
- The PDF uses SiBS branding and the approved PDS-style section structure.
- Missing data is never inferred and empty sections do not create blank pages.
- Long and repeated data paginates without clipping or overlap.
- The response is authenticated, not cached, and does not expose storage paths.
- Generation does not mutate candidate data or interfere with other candidate actions.
- Relevant unit checks, route checks, lint, frontend build, and visual PDF inspection pass.
