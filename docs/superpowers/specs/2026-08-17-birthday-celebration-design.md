# Birthday Celebration Easter Egg Design

**Status:** Approved design

**Date:** 2026-08-17

**Systems:** SiBS HRIS Client and SiBS HRIS Server

## Summary

SiBS HRIS will show an authenticated employee a brief full-screen birthday celebration after a successful interactive login on their birthday. The destination dashboard must finish navigating and become usable before eligibility work begins. The celebration uses centered SiBS-themed copy and finite rainbow confetti, can be dismissed immediately, honors reduced-motion preferences, and appears at most once per employee per birthday year across browsers and devices.

The experience is decorative and must never become part of the authentication critical path. Failures are silent and leave the authenticated destination usable.

## Goals

- Give employees a cute, warm, branded birthday moment after login.
- Guarantee at-most-once display per employee per birthday year across devices and tabs.
- Preserve current login latency, redirect behavior, and destination availability.
- Keep animation work finite, lazy-loaded, and safe for compact laptops, mobile devices, and reduced-motion users.
- Avoid expanding exposure of employee birth dates.
- Provide a server-side kill switch and a gradual rollout path.

## Non-goals

- Birthday reminders for managers or coworkers.
- Displaying age, complete birth date, role, department, or other personal details.
- Email, push, or chat notifications.
- Sound, music, replay, multi-step greetings, or a “Next” flow.
- A general-purpose campaign, announcement, or animation platform.
- Celebrating cached-session restoration, refreshes, or ordinary route navigation.

## Existing-system evidence

- `src/pages/login/LoginPage.jsx` commits the login user and immediately navigates to the safe redirect or role dashboard. The celebration must not alter this sequence.
- `src/services/context/UserContext.jsx` owns interactive login state, cached-session restoration, `/api/users/me`, and session lifecycle. An explicit interactive-login event is required because `user && !loading` also occurs for restored sessions.
- `src/services/providers.jsx` mounts `UserProvider` around authenticated feature providers and is the appropriate global location for a celebration gate.
- `src/AppShell.jsx` surrounds the routed application and already hosts global authenticated UI.
- `SiBS-HRIS-Server/src/routes/users.js` includes canonical `birthdate` in both login and `/me` user responses through `buildUserResponse`; the client does not need another profile request.
- `framer-motion` already exists, but the production bundle is large. This design does not add another animation dependency and does not require Framer Motion for confetti.
- `src/index.css` defines SiBS brand tokens and partial reduced-motion coverage. The new experience needs explicit reduced-motion handling.

## Product behavior

### Trigger

The trigger is a successful interactive login performed in the current mounted application. Cached users, page refreshes, background `/me` validation, admin-mode changes, and route transitions do not create a trigger.

After login navigation completes and the first private destination paints, the client waits 300–500 milliseconds, performs a cheap local date-only precheck, loads the celebration module, and requests an authoritative server claim. The local check is only an optimization; the server makes the eligibility decision.

### Timeline

1. The existing login request succeeds.
2. The existing user state update and redirect run unchanged.
3. The destination renders and is usable underneath the celebration layer.
4. The celebration gate performs the local birth-month/day precheck.
5. For a possible birthday, the client loads the small celebration module.
6. After the module loads, the client calls the server claim endpoint.
7. A successful first claim opens the celebration.
8. Rainbow confetti runs for 2.5–3 seconds.
9. The complete celebration remains visible for no more than 4–5 seconds and then exits.
10. Skip, Escape, or an empty-background click exits immediately.

Loading the module before making the claim prevents a chunk-load failure from consuming the employee’s yearly celebration.

### Visual specification

- Full-viewport solid SiBS navy surface: `#042C51`.
- No people, photographs, characters, repeated background words, scenery, dashboard imagery, birthday cake, gift, sound control, replay control, or Next button.
- Centered message:
  - `HAPPY BIRTHDAY,`
  - `[FIRST NAME]!`
  - `Wishing you the happiest day from everyone at SiBS!`
- Plus Jakarta Sans, bold upright type, warm-white headline, and SiBS orange `#FF5C28` employee name.
- Cute details are limited to a gentle text overshoot, a restrained underline/highlight, small sparkles, and confetti-derived party-popper shapes.
- Rainbow confetti may use red, coral, orange, gold, lime, emerald, teal, sky blue, royal blue, violet, pink, and white.
- Confetti shapes may include rounded rectangles, circles, curled streamers, small stars, short ribbons, and a few tiny hearts.
- Particle density stays lighter behind the message to protect readability.
- A `Skip` control is visible immediately in the upper-right with a minimum 44-by-44 CSS-pixel target.

### Responsive behavior

- The primary compact target is 1366×768; the full target is 1920×1080.
- Typography scales fluidly and preserves the same hierarchy rather than becoming oversized at 1920×1080.
- Long first names wrap naturally and remain readable.
- Mobile uses approximately half the desktop particle count, respects safe areas, and never creates horizontal overflow.
- The message remains vertically centered on desktop and mobile.

### Reduced motion

When `prefers-reduced-motion: reduce` is active:

- Do not instantiate or download animation-only confetti code.
- Do not launch, fall, rotate, or continuously animate particles.
- Show a sparse static rainbow-confetti arrangement around the viewport edges.
- Reveal and dismiss the text with a simple, short opacity transition or no transition when required by the user agent.

## Architecture

### Client components

#### `BirthdayCelebrationGate`

Mounted globally beneath `UserProvider`, outside individual dashboards. It:

- Consumes an explicit interactive-login event/nonce exposed by `UserContext`.
- Ignores cached-session restoration and subsequent user-object refreshes.
- Waits for a private destination and the initial post-navigation paint.
- Parses the existing canonical `user.birthdate` as date-only data.
- Performs only the month/day precheck and never treats the browser result as authoritative.
- Dynamically loads `BirthdayCelebrationOverlay` only for a possible birthday.
- Calls the claim endpoint only after the module loads.
- Uses an effect/ref guard so React Strict Mode and rerenders cannot issue duplicate work for one login event.
- Cancels pending work during logout, public-route navigation, or unmount.
- Fails closed without affecting authentication or routed content.

#### `BirthdayCelebrationOverlay`

Rendered through a portal at the application overlay layer. It:

- Owns the centered greeting, Skip control, Escape handler, empty-background dismissal, timer, and exit lifecycle.
- Does not trap focus or lock body scrolling because the experience must remain easy to leave.
- Moves focus only when the user tabs into it; it does not steal focus on mount.
- Restores no focus unless focus was inside the overlay at dismissal.
- Uses `role="status"` with `aria-live="polite"` for one concise announcement rather than dialog or alert semantics.
- Hides all decorative content from assistive technology.
- Removes all listeners and timers on exit.

#### `RainbowConfettiCanvas`

A small custom canvas renderer dynamically imported by the overlay only after reduced-motion detection returns false. It:

- Uses a deterministic palette and bounded shape set.
- Targets approximately 80 particles on desktop and 40 on mobile, subject to profiling.
- Caps canvas device-pixel ratio at 1.5.
- Uses one finite `requestAnimationFrame` loop lasting no more than three seconds.
- Cancels immediately when the overlay closes, the component unmounts, or the document becomes hidden.
- Releases its canvas references after completion.
- Is never instantiated for reduced-motion users.

### User-context event

`UserContext` will expose a short-lived post-login celebration event containing an opaque event identifier and the authenticated user reference needed by the gate. `updateUser` creates it only for the successful interactive-login path. Consuming the event prevents route redirects, user refreshes, and Strict Mode effect replay from treating the same login as new.

The event does not contain a birth date, age, or telemetry payload. DOB remains part of the existing authenticated user object only.

### Server endpoint

Add this authenticated endpoint:

`POST /api/users/me/birthday-celebration/claim`

The endpoint:

1. Reads the employee identity from the authenticated request, never from a client-supplied identifier.
2. Fetches the authoritative employee birth date.
3. Evaluates eligibility using the `Asia/Manila` business timezone.
4. Applies the February 29 rule described below.
5. Atomically inserts the employee/year claim.
6. Returns `show: true` only when the insert creates the first claim.

Example responses:

```json
{ "success": true, "show": true }
```

```json
{ "success": true, "show": false }
```

The response does not include DOB, age, employee name, or claim history. Authentication errors follow the existing user-route contract. Ineligible and already-claimed outcomes are normal successful responses.

### Persistence

Create a `birthday_celebration_claims` table in the server-owned HRIS database with:

- `employee_id`: the existing stable internal employee identifier
- `celebration_year`: the four-digit birthday year
- `claimed_at`: the server timestamp at which the claim succeeded
- Unique constraint on `(employee_id, celebration_year)`

The endpoint uses a single atomic insert protected by the unique constraint. A duplicate-key result returns `show: false`. Simultaneous requests from multiple tabs or devices therefore yield exactly one `show: true` response.

No DOB is copied into the claim table. Claim rows are operational state, not analytics events.

## Date and identity rules

- Parse DOB as date-only components; never use `new Date("YYYY-MM-DD")` for month/day eligibility.
- The server’s `Asia/Manila` calendar date is authoritative. This is UTC+8 without daylight-saving transitions and matches the current operating timezone assumption.
- Ignore the birth year for ordinary eligibility.
- A February 29 birthday is eligible on February 29 during leap years and February 28 during non-leap years.
- Missing, malformed, zero, or impossible dates are ineligible and produce no celebration.
- Use the employee’s available first name. If it is blank, use `HAPPY BIRTHDAY!` without an invented name.

## Accessibility and interaction safety

- No audio, rapid flashing, or continuous motion.
- Decorative canvas and static confetti use `aria-hidden="true"` and do not receive focus.
- Announce one polite greeting; do not announce every decorative element.
- Skip is a native button with a visible focus state and accessible label.
- Escape dismisses the overlay.
- Clicking the empty overlay background dismisses it; clicking the centered message does not.
- The effect does not alter authentication, route state, dashboard data, or browser history.
- The design intentionally covers the viewport briefly. Immediate dismissal and the 4–5 second maximum are the accepted safeguards for rushed employees.

## Privacy and security

- The server revalidates birthday eligibility; it does not trust the client precheck.
- Do not add DOB, age, birthday eligibility, or employee identity to client logs, server logs, analytics payloads, DOM data attributes, or error-reporting context.
- Do not create another browser-storage copy of DOB.
- The claim endpoint derives identity from the authenticated cookie/token and uses existing backend authorization middleware.
- Frontend checks are optimization and presentation controls, not a security boundary.
- Aggregate operational measurements must not include names, DOB, or raw employee identifiers.

## Performance budgets

- No additional work in the login request or redirect critical path.
- No claim request and no celebration chunk for obvious non-birthday users.
- No new third-party animation or confetti package.
- Target celebration JavaScript under approximately 15 KB gzip.
- No main-thread task longer than 50 ms attributable to the effect on supported compact hardware.
- No meaningful regression to destination LCP or time-to-interaction.
- No animation CPU work after three seconds, after dismissal, or while the document is hidden.
- Resize work is throttled and detached on cleanup.

## Failure handling

- Missing or malformed DOB: omit the experience.
- Dynamic import failure: omit the experience and do not claim it.
- Claim timeout, server error, or offline state: omit the experience for that login.
- Claim succeeds but render fails: authentication and the destination remain usable; the server retains the at-most-once claim.
- Logout or public navigation during preparation: abort the request and discard the event.
- Rendering exceptions are isolated from the authenticated application through a dedicated `BirthdayCelebrationErrorBoundary` that renders nothing after an error.
- All errors remain non-blocking. Do not show a birthday-specific error toast.

## Feature control and rollout

- A server-side runtime flag gates the claim endpoint and fails off.
- The client uses a default-off build/config guard for staged releases, but the server-side runtime flag remains the operational kill switch.
- Rollout sequence:
  1. Internal test employees with controlled DOB fixtures
  2. Small employee cohort
  3. Broader rollout after performance and support review
  4. Full rollout
- The runtime flag can stop new claims without a frontend redeploy.
- Track only aggregate attempted, shown, dismissed, reduced-motion, error, and performance counts. Avoid employee-level event streams because timing can reveal a birthday.

## Verification strategy

### Client unit coverage

- Date-only parsing for supported backend shapes.
- Birthday match and non-match cases.
- Month/year boundaries and invalid dates.
- February 29 behavior.
- Interactive-login event creation and one-time consumption.
- Strict Mode/rerender idempotence.
- Reduced-motion branching.
- Timer, visibility, Escape, Skip, and background dismissal cleanup.

### Server coverage

- Authenticated identity is required and client-supplied employee identifiers are ignored/rejected.
- Birthday and non-birthday responses.
- Missing/malformed DOB.
- Asia/Manila date boundaries.
- February 29 policy.
- First claim versus existing claim.
- Concurrent claims produce one `show: true` response.
- Disabled feature returns `show: false` without writing a claim.

### Integration and manual checks

- Successful login navigation timing and redirect destination are unchanged.
- Cached session, refresh, route change, and background user refresh do not trigger the celebration.
- Multiple tabs/devices honor the server claim.
- 1366×768, 1920×1080, and 390×844 layouts.
- Long and missing first names.
- Keyboard-only dismissal and focus visibility.
- Screen-reader announcement occurs once.
- Reduced-motion has no moving particles and does not load animation-only code.
- Slow network, offline state, endpoint failure, and chunk-load failure leave the dashboard usable.
- Performance profiling confirms the particle budget, finite CPU work, and no long task over 50 ms.
- Run the client production build and focused linting of changed files. Run relevant server verification available in the server repository.

## Acceptance criteria

- Login request duration, navigation, and redirects are unchanged by the feature.
- The destination is rendered before celebration eligibility work starts.
- Only an interactive successful login can initiate the feature.
- The server is authoritative for date and at-most-once eligibility.
- One employee receives at most one successful birthday claim per birthday year across tabs and devices.
- The overlay matches the approved cute SiBS navy, centered-copy, rainbow-confetti direction.
- It exits automatically within five seconds and immediately through Skip, Escape, or empty-background click.
- It contains no sound, people, repeated background text, age, or complete DOB.
- Reduced-motion users receive a static, accessible variant.
- Missing data and all incidental failures leave authentication and the dashboard unaffected.
- Animation work is lazy, bounded, cleaned up, and within the stated performance budgets.
- A server-side operational flag can disable new celebrations without a frontend rebuild.
- No DOB or raw employee identity is added to client storage or telemetry.
