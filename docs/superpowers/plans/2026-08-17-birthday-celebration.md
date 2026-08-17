# Birthday Celebration Easter Egg Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a cute SiBS-themed, rainbow-confetti birthday celebration after interactive login, at most once per employee per birthday year across browsers and devices.

**Architecture:** Preserve the existing login and redirect path, emit an explicit interactive-login event from `UserContext`, and let a global gate prepare the celebration after the first private-route paint. A separate authenticated server endpoint verifies the authoritative DOB in Asia/Manila time and atomically claims a unique employee/year database record before a lazy client overlay is shown.

**Tech Stack:** React 19, React Router, Axios, Vite 8, Tailwind CSS 4, HTML Canvas, Node.js ESM, Express 5, MySQL 8/mysql2, Node’s built-in `node:test`.

## Global Constraints

- Work in isolated worktrees at execution time because the current client checkout contains unrelated user changes.
- Do not add a confetti or animation dependency.
- Do not change the login request, login response timing, redirect destination, or authentication error handling.
- Use the existing authenticated user DOB; never add another client profile request.
- The server’s `Asia/Manila` calendar date is authoritative.
- Celebrate February 29 birthdays on February 28 in non-leap years.
- Show at most one successful claim per `(employee_id, celebration_year)` across tabs and devices.
- Start preparation 300–500 ms after the first private destination paint.
- Run moving confetti for no more than three seconds and close the complete celebration within five seconds.
- Use approximately 80 particles on desktop and 40 on mobile, subject to profiling; cap canvas DPR at 1.5.
- Do not instantiate or download moving-confetti code when `prefers-reduced-motion: reduce` is active.
- Keep the celebration JavaScript target below approximately 15 KB gzip.
- Do not log or persist DOB, age, employee name, birthday eligibility, or raw employee identity in telemetry.
- Missing data, disabled flags, network errors, chunk failures, and rendering errors must render nothing and leave the authenticated route usable.
- Use `npm.cmd` for client commands on PowerShell.
- Client repository: `C:/Users/ralphvincentd/SiBS-HRIS-CLIENT-V2`.
- Server repository: `C:/Users/ralphvincentd/SiBS-HRIS-Server`.

## File map

### Server repository

- Create `src/utils/birthdayCelebration.js`: date-only normalization, Asia/Manila calendar conversion, leap-day policy, and runtime-flag parsing.
- Create `src/utils/birthdayCelebration.test.js`: deterministic date and flag tests.
- Create `src/scripts/migrateBirthdayCelebrations.js`: idempotent claim-table migration.
- Modify `src/config/db.js`: add `hrisTables.birthdayCelebrationClaims`.
- Create `src/services/birthdayCelebrationService.js`: authoritative employee lookup and atomic claim.
- Create `src/services/birthdayCelebrationService.test.js`: injected-database service tests, including duplicate claims.
- Create `src/routes/birthday-celebration.js`: authenticated claim route and fail-closed response contract.
- Create `src/routes/birthday-celebration.test.js`: handler tests with request/response doubles.
- Modify `src/server.js`: mount the new route under `/api/users/me/birthday-celebration`.
- Modify `src/routes/users.js`: normalize the existing login and `/me` `birthdate` response to `YYYY-MM-DD`.
- Modify `package.json`: add focused migration and test scripts.

### Client repository

- Create `src/lib/utils/birthdayCelebration.js`: canonical DOB parsing, Asia/Manila precheck, February 29 behavior, and route eligibility.
- Create `src/lib/utils/birthdayCelebration.test.js`: deterministic eligibility tests.
- Create `src/lib/axios/claimBirthdayCelebration.js`: non-critical abortable claim adapter.
- Create `src/lib/axios/claimBirthdayCelebration.test.js`: adapter contract tests with an injected API client.
- Create `src/services/context/birthdayLoginEvent.js`: pure event creation and identity helpers.
- Create `src/services/context/birthdayLoginEvent.test.js`: event tests.
- Modify `src/services/context/UserContext.jsx`: expose `completeInteractiveLogin`, `postLoginCelebrationEvent`, and `consumePostLoginCelebrationEvent`.
- Modify `src/pages/login/LoginPage.jsx`: use `completeInteractiveLogin` only after successful credential login.
- Create `src/hooks/usePrefersReducedMotion.js`: media-query subscription.
- Create `src/components/birthday/BirthdayCelebrationErrorBoundary.jsx`: fail-closed component boundary.
- Create `src/components/birthday/birthdayCelebrationGatePolicy.js`: pure gate policy.
- Create `src/components/birthday/birthdayCelebrationGatePolicy.test.js`: trigger-policy tests.
- Create `src/components/birthday/BirthdayCelebrationGate.jsx`: post-navigation orchestration and lazy loading.
- Create `src/components/birthday/BirthdayCelebrationOverlay.jsx`: portal, copy, dismissal, timer, and accessibility behavior.
- Create `src/components/birthday/birthdayConfetti.js`: deterministic particle creation and bounded physics.
- Create `src/components/birthday/birthdayConfetti.test.js`: palette, count, and lifetime tests.
- Create `src/components/birthday/RainbowConfettiCanvas.jsx`: finite canvas renderer.
- Modify `src/services/providers.jsx`: mount the global gate below `UserProvider`.
- Modify `src/index.css`: SiBS birthday entrance, exit, static-confetti, and reduced-motion styles.

---

### Task 1: Server date policy and canonical DOB response

**Working directory:** `C:/Users/ralphvincentd/SiBS-HRIS-Server`

**Files:**
- Create: `src/utils/birthdayCelebration.js`
- Create: `src/utils/birthdayCelebration.test.js`
- Modify: `src/routes/users.js:404-446`

**Interfaces:**
- Produces: `toDateOnlyString(value, timeZone?) -> string`.
- Produces: `getBusinessDateParts(now?, timeZone?) -> { year, month, day }`.
- Produces: `isBirthdayOnDate(birthdate, businessDate) -> boolean`.
- Produces: `isBirthdayCelebrationEnabled(value?) -> boolean`.
- Consumed by: Tasks 2 and 3, plus `buildUserResponse` in `users.js`.

- [ ] **Step 1: Write failing date-policy tests**

```js
import assert from "node:assert/strict";
import test from "node:test";

import {
  getBusinessDateParts,
  isBirthdayCelebrationEnabled,
  isBirthdayOnDate,
  toDateOnlyString,
} from "./birthdayCelebration.js";

test("normalizes date-only strings without UTC shifting", () => {
  assert.equal(toDateOnlyString("1994-08-17"), "1994-08-17");
  assert.equal(toDateOnlyString("1994-08-17T00:00:00.000Z"), "1994-08-17");
  assert.equal(toDateOnlyString("0000-00-00"), "");
  assert.equal(toDateOnlyString("not-a-date"), "");
});

test("reads the Asia/Manila calendar across a UTC date boundary", () => {
  assert.deepEqual(
    getBusinessDateParts(new Date("2026-08-16T16:30:00.000Z")),
    { year: 2026, month: 8, day: 17 },
  );
});

test("matches ordinary birthdays and applies the February 29 policy", () => {
  assert.equal(
    isBirthdayOnDate("1990-08-17", { year: 2026, month: 8, day: 17 }),
    true,
  );
  assert.equal(
    isBirthdayOnDate("1992-02-29", { year: 2026, month: 2, day: 28 }),
    true,
  );
  assert.equal(
    isBirthdayOnDate("1992-02-29", { year: 2024, month: 2, day: 28 }),
    false,
  );
});

test("enables the runtime flag only for explicit true values", () => {
  assert.equal(isBirthdayCelebrationEnabled("true"), true);
  assert.equal(isBirthdayCelebrationEnabled("TRUE"), true);
  assert.equal(isBirthdayCelebrationEnabled("false"), false);
  assert.equal(isBirthdayCelebrationEnabled(undefined), false);
});
```

- [ ] **Step 2: Run the focused test and verify the missing module failure**

Run: `node --test src/utils/birthdayCelebration.test.js`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `birthdayCelebration.js`.

- [ ] **Step 3: Implement the pure date policy**

```js
const DEFAULT_TIME_ZONE = "Asia/Manila";
const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/;

function isLeapYear(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

export function toDateOnlyString(value, timeZone = DEFAULT_TIME_ZONE) {
  if (!value) return "";

  if (typeof value === "string") {
    const match = value.match(DATE_ONLY_PATTERN);
    if (!match || match[1] === "0000") return "";
    const [, year, month, day] = match;
    const probe = new Date(`${year}-${month}-${day}T12:00:00.000Z`);
    if (
      Number.isNaN(probe.getTime()) ||
      probe.getUTCFullYear() !== Number(year) ||
      probe.getUTCMonth() + 1 !== Number(month) ||
      probe.getUTCDate() !== Number(day)
    ) return "";
    return `${year}-${month}-${day}`;
  }

  if (!(value instanceof Date) || Number.isNaN(value.getTime())) return "";
  const { year, month, day } = getBusinessDateParts(value, timeZone);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function getBusinessDateParts(
  now = new Date(),
  timeZone = DEFAULT_TIME_ZONE,
) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
  };
}

export function isBirthdayOnDate(birthdate, businessDate) {
  const normalized = toDateOnlyString(birthdate);
  if (!normalized) return false;
  const month = Number(normalized.slice(5, 7));
  const day = Number(normalized.slice(8, 10));
  if (month === 2 && day === 29 && !isLeapYear(businessDate.year)) {
    return businessDate.month === 2 && businessDate.day === 28;
  }
  return month === businessDate.month && day === businessDate.day;
}

export function isBirthdayCelebrationEnabled(
  value = process.env.BIRTHDAY_CELEBRATION_ENABLED,
) {
  return String(value || "").trim().toLowerCase() === "true";
}
```

- [ ] **Step 4: Normalize the existing user response**

Import `toDateOnlyString` into `src/routes/users.js` and replace:

```js
birthdate: user.gy_dob || "",
```

with:

```js
birthdate: toDateOnlyString(user.gy_dob),
```

- [ ] **Step 5: Run the date tests and focused syntax check**

Run: `node --test src/utils/birthdayCelebration.test.js`

Expected: 4 tests PASS.

Run: `node --check src/routes/users.js`

Expected: exit code 0.

- [ ] **Step 6: Commit Task 1 in the server repository**

```powershell
git add src/utils/birthdayCelebration.js src/utils/birthdayCelebration.test.js src/routes/users.js
git commit -m "feat: add birthday date policy"
```

### Task 2: Server migration and atomic claim service

**Working directory:** `C:/Users/ralphvincentd/SiBS-HRIS-Server`

**Files:**
- Create: `src/scripts/migrateBirthdayCelebrations.js`
- Modify: `src/config/db.js:90-130`
- Create: `src/services/birthdayCelebrationService.js`
- Create: `src/services/birthdayCelebrationService.test.js`
- Modify: `package.json`

**Interfaces:**
- Consumes: Task 1 date helpers.
- Produces: `claimBirthdayCelebration(options) -> Promise<{ show: boolean, reason: string }>`.
- Produces: `hrisTables.birthdayCelebrationClaims`.
- Consumed by: Task 3 route.

- [ ] **Step 1: Write failing service tests with injected database clients**

```js
import assert from "node:assert/strict";
import test from "node:test";

import { claimBirthdayCelebration } from "./birthdayCelebrationService.js";

function dbWithResults(results) {
  const calls = [];
  return {
    calls,
    async query(sql, params) {
      calls.push({ sql, params });
      const result = results.shift();
      if (result instanceof Error) throw result;
      return result;
    },
  };
}

test("returns disabled without querying either database", async () => {
  const kronosDbClient = dbWithResults([]);
  const hrisDbClient = dbWithResults([]);
  const result = await claimBirthdayCelebration({
    employeeCode: "SIBS-1",
    enabled: false,
    kronosDbClient,
    hrisDbClient,
  });
  assert.deepEqual(result, { show: false, reason: "disabled" });
  assert.equal(kronosDbClient.calls.length, 0);
  assert.equal(hrisDbClient.calls.length, 0);
});

test("atomically claims an eligible birthday", async () => {
  const kronosDbClient = dbWithResults([[
    [{ employee_id: "42", birthdate: "1990-08-17" }],
    [],
  ]]);
  const hrisDbClient = dbWithResults([[{ affectedRows: 1 }, []]]);
  const result = await claimBirthdayCelebration({
    employeeCode: "SIBS-1",
    enabled: true,
    now: new Date("2026-08-16T16:30:00.000Z"),
    kronosDbClient,
    hrisDbClient,
  });
  assert.deepEqual(result, { show: true, reason: "claimed" });
  assert.deepEqual(hrisDbClient.calls[0].params, ["42", 2026]);
});

test("returns already_claimed for a duplicate unique key", async () => {
  const duplicate = Object.assign(new Error("duplicate"), { code: "ER_DUP_ENTRY" });
  const kronosDbClient = dbWithResults([[
    [{ employee_id: "42", birthdate: "1990-08-17" }],
    [],
  ]]);
  const hrisDbClient = dbWithResults([duplicate]);
  const result = await claimBirthdayCelebration({
    employeeCode: "SIBS-1",
    enabled: true,
    now: new Date("2026-08-16T16:30:00.000Z"),
    kronosDbClient,
    hrisDbClient,
  });
  assert.deepEqual(result, { show: false, reason: "already_claimed" });
});
```

- [ ] **Step 2: Run the service test and verify the missing module failure**

Run: `node --test src/services/birthdayCelebrationService.test.js`

Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Add the configured HRIS table identifier**

Add to `hrisTables` in `src/config/db.js`:

```js
birthdayCelebrationClaims: dbTable(
  HRIS_DB_NAME,
  "birthday_celebration_claims",
),
```

- [ ] **Step 4: Create the idempotent migration**

```js
import "dotenv/config";
import { hrisDb } from "../config/db.js";

async function migrate() {
  const connection = await hrisDb.getConnection();
  try {
    await connection.query("SET time_zone = '+08:00'");
    await connection.query(`
      CREATE TABLE IF NOT EXISTS birthday_celebration_claims (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        employee_id VARCHAR(64) NOT NULL,
        celebration_year SMALLINT UNSIGNED NOT NULL,
        claimed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_birthday_employee_year (employee_id, celebration_year)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("Birthday celebration migration completed.");
  } finally {
    connection.release();
    await hrisDb.end();
  }
}

migrate().catch((error) => {
  console.error("Birthday celebration migration failed:", error.message);
  process.exitCode = 1;
});
```

Add the package script:

```json
"migrate:birthday-celebrations": "node src/scripts/migrateBirthdayCelebrations.js"
```

- [ ] **Step 5: Implement the atomic claim service**

```js
import {
  getBusinessDateParts,
  isBirthdayOnDate,
} from "../utils/birthdayCelebration.js";
import {
  hrisDb,
  hrisTables,
  kronosDb,
  kronosTables,
} from "../config/db.js";

export async function claimBirthdayCelebration({
  employeeCode,
  enabled,
  now = new Date(),
  kronosDbClient = kronosDb,
  hrisDbClient = hrisDb,
}) {
  if (!enabled) return { show: false, reason: "disabled" };
  const normalizedCode = String(employeeCode || "").trim();
  if (!normalizedCode) return { show: false, reason: "missing_identity" };

  const [rows] = await kronosDbClient.query(
    `SELECT gy_emp_id AS employee_id,
            DATE_FORMAT(gy_dob, '%Y-%m-%d') AS birthdate
       FROM ${kronosTables.employee}
      WHERE TRIM(gy_emp_code) = TRIM(?)
      LIMIT 1`,
    [normalizedCode],
  );
  const employee = rows[0];
  if (!employee?.employee_id || !employee?.birthdate) {
    return { show: false, reason: "missing_profile" };
  }

  const businessDate = getBusinessDateParts(now);
  if (!isBirthdayOnDate(employee.birthdate, businessDate)) {
    return { show: false, reason: "not_birthday" };
  }

  try {
    await hrisDbClient.query(
      `INSERT INTO ${hrisTables.birthdayCelebrationClaims}
         (employee_id, celebration_year)
       VALUES (?, ?)`,
      [String(employee.employee_id), businessDate.year],
    );
    return { show: true, reason: "claimed" };
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY") {
      return { show: false, reason: "already_claimed" };
    }
    throw error;
  }
}
```

- [ ] **Step 6: Add the remaining service cases and run them**

Append these concrete cases to `birthdayCelebrationService.test.js`:

```js
test("rejects missing identity without querying", async () => {
  const kronosDbClient = dbWithResults([]);
  const result = await claimBirthdayCelebration({
    employeeCode: "",
    enabled: true,
    kronosDbClient,
    hrisDbClient: dbWithResults([]),
  });
  assert.deepEqual(result, { show: false, reason: "missing_identity" });
  assert.equal(kronosDbClient.calls.length, 0);
});

test("rejects missing profiles and non-birthdays without inserting", async () => {
  const missingProfileDb = dbWithResults([[[], []]]);
  const missingProfileResult = await claimBirthdayCelebration({
    employeeCode: "SIBS-1",
    enabled: true,
    kronosDbClient: missingProfileDb,
    hrisDbClient: dbWithResults([]),
  });
  assert.deepEqual(missingProfileResult, { show: false, reason: "missing_profile" });

  const nonBirthdayHris = dbWithResults([]);
  const nonBirthdayResult = await claimBirthdayCelebration({
    employeeCode: "SIBS-1",
    enabled: true,
    now: new Date("2026-08-16T16:30:00.000Z"),
    kronosDbClient: dbWithResults([[[{ employee_id: "42", birthdate: "1990-08-18" }], []]]),
    hrisDbClient: nonBirthdayHris,
  });
  assert.deepEqual(nonBirthdayResult, { show: false, reason: "not_birthday" });
  assert.equal(nonBirthdayHris.calls.length, 0);
});

test("claims February 29 birthdays on February 28 in a non-leap year", async () => {
  const result = await claimBirthdayCelebration({
    employeeCode: "SIBS-1",
    enabled: true,
    now: new Date("2026-02-27T16:30:00.000Z"),
    kronosDbClient: dbWithResults([[[{ employee_id: "42", birthdate: "1992-02-29" }], []]]),
    hrisDbClient: dbWithResults([[{ affectedRows: 1 }, []]]),
  });
  assert.deepEqual(result, { show: true, reason: "claimed" });
});

test("rethrows non-duplicate database failures", async () => {
  await assert.rejects(
    claimBirthdayCelebration({
      employeeCode: "SIBS-1",
      enabled: true,
      now: new Date("2026-08-16T16:30:00.000Z"),
      kronosDbClient: dbWithResults([[[{ employee_id: "42", birthdate: "1990-08-17" }], []]]),
      hrisDbClient: dbWithResults([Object.assign(new Error("offline"), { code: "ECONNREFUSED" })]),
    }),
    /offline/,
  );
});
```

Run: `node --test src/utils/birthdayCelebration.test.js src/services/birthdayCelebrationService.test.js`

Expected: all date and service tests PASS.

- [ ] **Step 7: Commit Task 2 in the server repository**

```powershell
git add package.json src/config/db.js src/scripts/migrateBirthdayCelebrations.js src/services/birthdayCelebrationService.js src/services/birthdayCelebrationService.test.js
git commit -m "feat: persist annual birthday claims"
```

### Task 3: Authenticated birthday claim endpoint

**Working directory:** `C:/Users/ralphvincentd/SiBS-HRIS-Server`

**Files:**
- Create: `src/routes/birthday-celebration.js`
- Create: `src/routes/birthday-celebration.test.js`
- Modify: `src/server.js:16-20,254-258`
- Modify: `package.json`

**Interfaces:**
- Consumes: `claimBirthdayCelebration` from Task 2.
- Produces: `POST /api/users/me/birthday-celebration/claim` returning `{ success: true, show: boolean }`.
- Consumed by: Task 4 client adapter.

- [ ] **Step 1: Write failing handler tests**

```js
import assert from "node:assert/strict";
import test from "node:test";

import { createBirthdayClaimHandler } from "./birthday-celebration.js";

function responseDouble() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test("returns only success and show for an eligible first claim", async () => {
  const res = responseDouble();
  const handler = createBirthdayClaimHandler({
    enabled: true,
    claim: async ({ employeeCode }) => {
      assert.equal(employeeCode, "SIBS-1");
      return { show: true, reason: "claimed" };
    },
  });
  await handler({ user: { username: "SIBS-1" } }, res);
  assert.deepEqual(res.body, { success: true, show: true });
});

test("fails closed when the service throws", async () => {
  const res = responseDouble();
  const handler = createBirthdayClaimHandler({
    enabled: true,
    claim: async () => { throw new Error("db unavailable"); },
  });
  await handler({ user: { username: "SIBS-1" } }, res);
  assert.equal(res.statusCode, 503);
  assert.deepEqual(res.body, { success: false, show: false });
});
```

- [ ] **Step 2: Run the route test and verify the missing module failure**

Run: `node --test src/routes/birthday-celebration.test.js`

Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implement the route and handler factory**

```js
import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { claimBirthdayCelebration } from "../services/birthdayCelebrationService.js";
import { isBirthdayCelebrationEnabled } from "../utils/birthdayCelebration.js";

export function createBirthdayClaimHandler({
  claim = claimBirthdayCelebration,
  enabled = isBirthdayCelebrationEnabled(),
} = {}) {
  return async function birthdayClaimHandler(req, res) {
    try {
      const result = await claim({
        employeeCode: req.user?.username,
        enabled,
      });
      return res.json({ success: true, show: result.show === true });
    } catch {
      return res.status(503).json({ success: false, show: false });
    }
  };
}

const router = express.Router();
router.post("/claim", authMiddleware, createBirthdayClaimHandler());
export default router;
```

Do not log employee identity, DOB, eligibility, or the service’s internal reason.

- [ ] **Step 4: Mount the endpoint without touching the existing users router**

Add to `src/server.js` imports:

```js
import birthdayCelebrationRoutes from "./routes/birthday-celebration.js";
```

Mount immediately after the current users route:

```js
app.use(
  "/api/users/me/birthday-celebration",
  birthdayCelebrationRoutes,
);
```

- [ ] **Step 5: Add the focused server test script and run it**

Add to `package.json`:

```json
"test:birthday-celebrations": "node --test src/utils/birthdayCelebration.test.js src/services/birthdayCelebrationService.test.js src/routes/birthday-celebration.test.js"
```

Run: `npm.cmd run test:birthday-celebrations`

Expected: all tests PASS.

Run: `node --check src/server.js`

Expected: exit code 0.

- [ ] **Step 6: Run the migration against the intended development database**

Run: `npm.cmd run migrate:birthday-celebrations`

Expected: `Birthday celebration migration completed.`

Before running this command, verify `DB2_NAME` targets the development HRIS database. Do not run it against production during implementation.

- [ ] **Step 7: Commit Task 3 in the server repository**

```powershell
git add package.json src/routes/birthday-celebration.js src/routes/birthday-celebration.test.js src/server.js
git commit -m "feat: expose birthday celebration claim"
```

### Task 4: Client eligibility and claim adapter

**Working directory:** `C:/Users/ralphvincentd/SiBS-HRIS-CLIENT-V2`

**Files:**
- Create: `src/lib/utils/birthdayCelebration.js`
- Create: `src/lib/utils/birthdayCelebration.test.js`
- Create: `src/lib/axios/claimBirthdayCelebration.js`
- Create: `src/lib/axios/claimBirthdayCelebration.test.js`

**Interfaces:**
- Produces: `isPossibleBirthday(birthdate, now?) -> boolean`.
- Produces: `isBirthdayCelebrationRoute(pathname) -> boolean`.
- Produces: `claimBirthdayCelebration({ signal }?) -> Promise<{ success: boolean, show: boolean }>`.
- Consumed by: Task 6 gate.

- [ ] **Step 1: Write failing eligibility tests**

```js
import assert from "node:assert/strict";
import test from "node:test";
import {
  isBirthdayCelebrationRoute,
  isPossibleBirthday,
} from "./birthdayCelebration.js";

test("prechecks against the Asia/Manila date", () => {
  assert.equal(
    isPossibleBirthday("1990-08-17", new Date("2026-08-16T16:30:00.000Z")),
    true,
  );
  assert.equal(
    isPossibleBirthday("1990-08-18", new Date("2026-08-16T16:30:00.000Z")),
    false,
  );
});

test("uses February 28 for leap-day birthdays in non-leap years", () => {
  assert.equal(
    isPossibleBirthday("1992-02-29", new Date("2026-02-27T16:30:00.000Z")),
    true,
  );
});

test("rejects login and public paths", () => {
  assert.equal(isBirthdayCelebrationRoute("/login"), false);
  assert.equal(isBirthdayCelebrationRoute("/public/offer-response/token"), false);
  assert.equal(isBirthdayCelebrationRoute("/dashboard/employee"), true);
  assert.equal(isBirthdayCelebrationRoute("/recruitment/candidate-pipeline"), true);
});
```

- [ ] **Step 2: Run the eligibility test and verify the missing module failure**

Run: `node --test src/lib/utils/birthdayCelebration.test.js`

Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implement canonical parsing, timezone conversion, and route denial**

```js
const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const PUBLIC_PATH_PREFIXES = Object.freeze([
  "/login",
  "/online-assessment",
  "/apply",
  "/job-description",
  "/public",
  "/recruitment/talent-pool/apply",
  "/recruitment/candidate-experience/survey",
]);

function parseDateOnly(value) {
  const match = String(value || "").match(DATE_ONLY_PATTERN);
  if (!match || match[1] === "0000") return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const probe = new Date(Date.UTC(year, month - 1, day, 12));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() + 1 !== month ||
    probe.getUTCDate() !== day
  ) return null;
  return { year, month, day };
}

function businessDateParts(now) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return { year: Number(values.year), month: Number(values.month), day: Number(values.day) };
}

function isLeapYear(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

export function isPossibleBirthday(birthdate, now = new Date()) {
  const birth = parseDateOnly(birthdate);
  if (!birth) return false;
  const today = businessDateParts(now);
  if (birth.month === 2 && birth.day === 29 && !isLeapYear(today.year)) {
    return today.month === 2 && today.day === 28;
  }
  return birth.month === today.month && birth.day === today.day;
}

export function isBirthdayCelebrationRoute(pathname = "") {
  if (pathname === "/") return false;
  return !PUBLIC_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
```

This canonical client parser intentionally accepts only the normalized `YYYY-MM-DD` contract produced by Task 1.

- [ ] **Step 4: Write the failing API adapter tests**

```js
import assert from "node:assert/strict";
import test from "node:test";
import { createBirthdayCelebrationClaimer } from "./claimBirthdayCelebration.js";

test("returns the server show decision with non-critical request options", async () => {
  const calls = [];
  const claim = createBirthdayCelebrationClaimer({
    async post(url, body, config) {
      calls.push({ url, body, config });
      return { data: { success: true, show: true } };
    },
  });
  assert.deepEqual(await claim(), { success: true, show: true });
  assert.equal(calls[0].url, "/api/users/me/birthday-celebration/claim");
  assert.equal(calls[0].config.skipAuthRedirect, true);
  assert.equal(calls[0].config.timeout, 3500);
});

test("fails closed when the request fails", async () => {
  const claim = createBirthdayCelebrationClaimer({
    async post() { throw new Error("offline"); },
  });
  assert.deepEqual(await claim(), { success: false, show: false });
});
```

- [ ] **Step 5: Implement the injected API adapter**

```js
import api from "./api-template";

export function createBirthdayCelebrationClaimer(apiClient = api) {
  return async function claimBirthdayCelebration({ signal } = {}) {
    try {
      const response = await apiClient.post(
        "/api/users/me/birthday-celebration/claim",
        {},
        {
          signal,
          timeout: 3500,
          skipAuthRedirect: true,
          withCredentials: true,
        },
      );
      return {
        success: response.data?.success === true,
        show: response.data?.show === true,
      };
    } catch {
      return { success: false, show: false };
    }
  };
}

export const claimBirthdayCelebration = createBirthdayCelebrationClaimer();
```

- [ ] **Step 6: Run all Task 4 tests**

Run: `node --test src/lib/utils/birthdayCelebration.test.js src/lib/axios/claimBirthdayCelebration.test.js`

Expected: all tests PASS.

- [ ] **Step 7: Commit Task 4 in the client repository**

```powershell
git add src/lib/utils/birthdayCelebration.js src/lib/utils/birthdayCelebration.test.js src/lib/axios/claimBirthdayCelebration.js src/lib/axios/claimBirthdayCelebration.test.js
git commit -m "feat: add birthday eligibility client"
```

### Task 5: Explicit interactive-login event

**Working directory:** `C:/Users/ralphvincentd/SiBS-HRIS-CLIENT-V2`

**Files:**
- Create: `src/services/context/birthdayLoginEvent.js`
- Create: `src/services/context/birthdayLoginEvent.test.js`
- Modify: `src/services/context/UserContext.jsx:182-228,944-1007`
- Modify: `src/pages/login/LoginPage.jsx:99-165`

**Interfaces:**
- Produces context fields: `postLoginCelebrationEvent` and `consumePostLoginCelebrationEvent(eventId)`.
- Produces context action: `completeInteractiveLogin(user, serverExpiresAt, expiresInMs)`.
- Consumed by: Task 6 gate.

- [ ] **Step 1: Write failing event-helper tests**

```js
import assert from "node:assert/strict";
import test from "node:test";
import { createBirthdayLoginEvent } from "./birthdayLoginEvent.js";

test("creates an opaque event without DOB or employee name", () => {
  const event = createBirthdayLoginEvent({
    sequence: 3,
    user: { gy_emp_id: 42, firstName: "Ana", birthdate: "1990-08-17" },
    issuedAt: 1000,
  });
  assert.deepEqual(event, { id: "birthday-login-3", userId: "42", issuedAt: 1000 });
  assert.equal("birthdate" in event, false);
  assert.equal("firstName" in event, false);
});
```

- [ ] **Step 2: Run the helper test and verify the missing module failure**

Run: `node --test src/services/context/birthdayLoginEvent.test.js`

Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implement the event helper**

```js
export function createBirthdayLoginEvent({ sequence, user, issuedAt = Date.now() }) {
  const userId = String(user?.gy_emp_id || user?.sibs_id || "").trim();
  if (!userId) return null;
  return {
    id: `birthday-login-${sequence}`,
    userId,
    issuedAt,
  };
}
```

- [ ] **Step 4: Add the event state and explicit context action**

In `UserProvider`:

```js
const [postLoginCelebrationEvent, setPostLoginCelebrationEvent] = useState(null);
const birthdayLoginSequenceRef = useRef(0);
```

Keep `updateUser` unchanged for cached refreshes, admin login, and account-mode switches. Add:

```js
const completeInteractiveLogin = useCallback(
  (newUser, serverExpiresAt = null, expiresInMs = null) => {
    updateUser(newUser, serverExpiresAt, expiresInMs);
    birthdayLoginSequenceRef.current += 1;
    setPostLoginCelebrationEvent(
      createBirthdayLoginEvent({
        sequence: birthdayLoginSequenceRef.current,
        user: newUser,
      }),
    );
  },
  [updateUser],
);

const consumePostLoginCelebrationEvent = useCallback((eventId) => {
  setPostLoginCelebrationEvent((current) =>
    current?.id === eventId ? null : current,
  );
}, []);
```

Clear `postLoginCelebrationEvent` inside `clearLocalAuthState`. Expose all three values from the context provider.

- [ ] **Step 5: Mark only credential login as interactive**

In `LoginPage.jsx`, replace the `setUser` destructure and call with:

```js
const { completeInteractiveLogin } = useUser();
```

```js
completeInteractiveLogin(user, expiresAt, expiresInMs);
```

Do not modify `AdminLoginModal.jsx` or `UserDropdown.jsx`; those flows continue using `setUser` and must not trigger the birthday event.

- [ ] **Step 6: Run focused tests, lint, and build**

Run: `node --test src/services/context/birthdayLoginEvent.test.js`

Expected: PASS.

Run: `npx eslint src/services/context/UserContext.jsx src/pages/login/LoginPage.jsx src/services/context/birthdayLoginEvent.js`

Expected: no new lint errors.

Run: `npm.cmd run build`

Expected: production build succeeds; the existing large-chunk warning may remain.

- [ ] **Step 7: Commit Task 5 in the client repository**

```powershell
git add src/services/context/UserContext.jsx src/services/context/birthdayLoginEvent.js src/services/context/birthdayLoginEvent.test.js src/pages/login/LoginPage.jsx
git commit -m "feat: signal interactive birthday login"
```

### Task 6: Global preparation gate and fail-closed boundary

**Working directory:** `C:/Users/ralphvincentd/SiBS-HRIS-CLIENT-V2`

**Files:**
- Create: `src/components/birthday/birthdayCelebrationGatePolicy.js`
- Create: `src/components/birthday/birthdayCelebrationGatePolicy.test.js`
- Create: `src/components/birthday/BirthdayCelebrationErrorBoundary.jsx`
- Create: `src/components/birthday/BirthdayCelebrationGate.jsx`
- Modify: `src/services/providers.jsx:1-58`

**Interfaces:**
- Consumes: Task 4 eligibility/claim functions and Task 5 context event.
- Produces: lazy overlay invocation with `{ firstName, onDismiss, reducedMotion }`.
- Consumed by: Task 7 overlay.

- [ ] **Step 1: Write failing gate-policy tests**

```js
import assert from "node:assert/strict";
import test from "node:test";
import { shouldPrepareBirthdayCelebration } from "./birthdayCelebrationGatePolicy.js";

const event = { id: "birthday-login-1", userId: "42", issuedAt: 1 };
const user = { gy_emp_id: 42, birthdate: "1990-08-17" };
const now = new Date("2026-08-16T16:30:00.000Z");

test("prepares only an enabled matching interactive login on a private route", () => {
  assert.equal(shouldPrepareBirthdayCelebration({ enabled: true, event, user, pathname: "/dashboard/employee", now }), true);
  assert.equal(shouldPrepareBirthdayCelebration({ enabled: false, event, user, pathname: "/dashboard/employee", now }), false);
  assert.equal(shouldPrepareBirthdayCelebration({ enabled: true, event: null, user, pathname: "/dashboard/employee", now }), false);
  assert.equal(shouldPrepareBirthdayCelebration({ enabled: true, event, user, pathname: "/login", now }), false);
});

test("rejects an event for a different authenticated identity", () => {
  assert.equal(shouldPrepareBirthdayCelebration({ enabled: true, event, user: { ...user, gy_emp_id: 99 }, pathname: "/dashboard/employee", now }), false);
});
```

- [ ] **Step 2: Run the policy test and verify the missing module failure**

Run: `node --test src/components/birthday/birthdayCelebrationGatePolicy.test.js`

Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implement the pure gate policy**

```js
import {
  isBirthdayCelebrationRoute,
  isPossibleBirthday,
} from "../../lib/utils/birthdayCelebration.js";

export function shouldPrepareBirthdayCelebration({
  enabled,
  event,
  user,
  pathname,
  now = new Date(),
}) {
  if (!enabled || !event || !user) return false;
  const userId = String(user.gy_emp_id || user.sibs_id || "").trim();
  if (!userId || userId !== event.userId) return false;
  if (!isBirthdayCelebrationRoute(pathname)) return false;
  return isPossibleBirthday(user.birthdate, now);
}
```

- [ ] **Step 4: Implement the fail-closed error boundary**

```jsx
import { Component } from "react";

export default class BirthdayCelebrationErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}
```

Do not log the component error with user/DOB context.

- [ ] **Step 5: Implement the post-navigation gate**

The gate must:

1. Read `user`, `postLoginCelebrationEvent`, and `consumePostLoginCelebrationEvent` from `useUser()`.
2. Read `location.pathname`.
3. Reject when `VITE_BIRTHDAY_CELEBRATION_ENABLED !== "true"`.
4. Keep a `Set` of handled event IDs in a ref to withstand Strict Mode effect replay.
5. Wait 400 ms using `window.setTimeout` only after the policy returns true.
6. Import `BirthdayCelebrationOverlay.jsx` before issuing the claim.
7. Call `claimBirthdayCelebration({ signal })` with an `AbortController`.
8. Set `{ Component, firstName }` only when `show === true`.
9. Consume the context event in `finally` and on cancellation.
10. Keep timer/controller cleanup in refs so private-route redirects do not restart the same event, while unmount/logout aborts pending work.

Use this state shape:

```js
const [celebration, setCelebration] = useState(null);
// null or { Component: BirthdayCelebrationOverlay, firstName: string }
```

Render:

```jsx
if (!celebration) return null;
const { Component: Overlay, firstName } = celebration;
return (
  <BirthdayCelebrationErrorBoundary>
    <Overlay
      firstName={firstName}
      onDismiss={() => setCelebration(null)}
    />
  </BirthdayCelebrationErrorBoundary>
);
```

- [ ] **Step 6: Mount the gate directly beneath `UserProvider`**

In `src/services/providers.jsx`, import the gate and render it as a sibling before `SidebarNotificationProvider`:

```jsx
<UserProvider>
  <BirthdayCelebrationGate />
  <SidebarNotificationProvider>
    {/* existing provider tree */}
  </SidebarNotificationProvider>
</UserProvider>
```

- [ ] **Step 7: Run policy tests, focused lint, and build**

Run: `node --test src/components/birthday/birthdayCelebrationGatePolicy.test.js`

Expected: PASS.

Run: `npx eslint src/components/birthday/BirthdayCelebrationGate.jsx src/components/birthday/BirthdayCelebrationErrorBoundary.jsx src/components/birthday/birthdayCelebrationGatePolicy.js src/services/providers.jsx`

Expected: no new lint errors.

Run: `npm.cmd run build`

Expected: build succeeds and emits a separate birthday overlay chunk only when the dynamic import is present.

- [ ] **Step 8: Commit Task 6 in the client repository**

```powershell
git add src/components/birthday src/services/providers.jsx
git commit -m "feat: orchestrate birthday celebration"
```

### Task 7: Accessible overlay and finite rainbow confetti

**Working directory:** `C:/Users/ralphvincentd/SiBS-HRIS-CLIENT-V2`

**Files:**
- Create: `src/hooks/usePrefersReducedMotion.js`
- Create: `src/components/birthday/birthdayConfetti.js`
- Create: `src/components/birthday/birthdayConfetti.test.js`
- Create: `src/components/birthday/RainbowConfettiCanvas.jsx`
- Create: `src/components/birthday/BirthdayCelebrationOverlay.jsx`
- Modify: `src/index.css`

**Interfaces:**
- Consumes: `{ firstName: string, onDismiss: () => void }` from Task 6.
- Produces: an accessible portal overlay and a separately lazy-loaded moving-confetti subchunk.

- [ ] **Step 1: Write failing particle-model tests**

```js
import assert from "node:assert/strict";
import test from "node:test";
import {
  BIRTHDAY_CONFETTI_COLORS,
  createBirthdayParticles,
} from "./birthdayConfetti.js";

test("creates the requested bounded particle count from the rainbow palette", () => {
  const particles = createBirthdayParticles({ count: 80, width: 1366, height: 768, random: () => 0.5 });
  assert.equal(particles.length, 80);
  assert.equal(particles.every((particle) => BIRTHDAY_CONFETTI_COLORS.includes(particle.color)), true);
  assert.equal(particles.every((particle) => particle.lifeMs <= 3000), true);
});

test("originates particles from side rails and leaves the center less dense", () => {
  const particles = createBirthdayParticles({ count: 40, width: 390, height: 844, random: () => 0.25 });
  assert.equal(particles.every((particle) => particle.x <= 78 || particle.x >= 312), true);
});
```

- [ ] **Step 2: Run the particle test and verify the missing module failure**

Run: `node --test src/components/birthday/birthdayConfetti.test.js`

Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implement the bounded particle factory**

Export the exact rainbow palette and a `createBirthdayParticles` function. Each particle must contain:

```js
{
  x,
  y,
  vx,
  vy,
  gravity,
  rotation,
  rotationSpeed,
  width,
  height,
  color,
  shape,
  lifeMs,
}
```

Use `shape` values from `"rect"`, `"circle"`, `"star"`, and `"heart"`; keep stars/hearts below 15% of particles. Clamp `lifeMs` between 1800 and 3000. Choose left or right side rails within 20% of viewport width and launch velocity inward.

- [ ] **Step 4: Implement reduced-motion subscription**

`usePrefersReducedMotion` must initialize from `window.matchMedia("(prefers-reduced-motion: reduce)")`, subscribe with `addEventListener("change", handler)`, support the legacy `addListener` fallback, and detach the matching listener on cleanup. Return `true` during non-browser rendering.

- [ ] **Step 5: Implement the finite canvas renderer**

`RainbowConfettiCanvas` must:

- Render a fixed, `aria-hidden`, `pointer-events-none` canvas.
- Size using `Math.min(window.devicePixelRatio || 1, 1.5)`.
- Use 80 particles at widths `>= 768` and 40 below.
- Clear and redraw within one `requestAnimationFrame` loop.
- Stop at `Math.min(3000, max particle life)`.
- Cancel on `visibilitychange` when hidden, on prop close, and on unmount.
- Throttle resize work through one animation frame.
- Draw rectangles/circles directly and small stars/hearts with short canvas paths.
- Never schedule another frame after completion.

- [ ] **Step 6: Implement the portal overlay**

Use `createPortal(..., document.body)`. Required behavior:

- Main layer: fixed viewport, solid `#042C51`, application toast z-index token, centered content.
- Copy: `HAPPY BIRTHDAY,`, then the sanitized first name plus `!`; if blank, render `HAPPY BIRTHDAY!` only.
- Supporting text: `Wishing you the happiest day from everyone at SiBS!`.
- A native upper-right `Skip` button, minimum 44×44 pixels, with visible focus state.
- `role="status"`, `aria-live="polite"`, and one concise screen-reader string.
- Decorative sparkles and confetti marked `aria-hidden="true"`.
- Window Escape listener.
- Background dismissal only when `event.target === event.currentTarget`.
- A 5000 ms auto-dismiss timer.
- A 220 ms exit state before unmount callback.
- Pause auto-dismiss while the message region or Skip button is hovered/focused.
- Do not focus the overlay automatically and do not lock body scroll.
- On `document.hidden`, dismiss instead of resuming later.
- If reduced motion is false, dynamically import `RainbowConfettiCanvas.jsx`; otherwise render only static edge pieces.

- [ ] **Step 7: Add SiBS birthday styles**

Add named classes in `src/index.css` using existing theme tokens where available:

```css
@keyframes sibs-birthday-overlay-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes sibs-birthday-message-in {
  0% { opacity: 0; transform: translateY(12px) scale(.94); }
  72% { opacity: 1; transform: translateY(-2px) scale(1.015); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes sibs-birthday-overlay-out { to { opacity: 0; } }

.sibs-birthday-overlay-in { animation: sibs-birthday-overlay-in 180ms ease-out both; }
.sibs-birthday-message-in { animation: sibs-birthday-message-in 520ms cubic-bezier(.2,.8,.2,1) both; }
.sibs-birthday-overlay-out { animation: sibs-birthday-overlay-out 220ms ease-in both; }

@media (prefers-reduced-motion: reduce) {
  .sibs-birthday-overlay-in,
  .sibs-birthday-message-in,
  .sibs-birthday-overlay-out {
    animation-duration: 1ms;
    animation-iteration-count: 1;
  }
}
```

Use responsive Tailwind classes for the message rather than adding fixed desktop-only dimensions.

- [ ] **Step 8: Run particle tests, focused lint, and build**

Run: `node --test src/components/birthday/birthdayConfetti.test.js`

Expected: PASS.

Run: `npx eslint src/hooks/usePrefersReducedMotion.js src/components/birthday/BirthdayCelebrationOverlay.jsx src/components/birthday/RainbowConfettiCanvas.jsx src/components/birthday/birthdayConfetti.js`

Expected: no new lint errors.

Run: `npm.cmd run build`

Expected: build succeeds; inspect output to confirm separate overlay and confetti chunks.

- [ ] **Step 9: Commit Task 7 in the client repository**

```powershell
git add src/hooks/usePrefersReducedMotion.js src/components/birthday src/index.css
git commit -m "feat: render birthday celebration overlay"
```

### Task 8: Integrated verification and rollout readiness

**Working directories:** both repositories

**Files:**
- Modify only files required to fix failures discovered by the checks below.

**Interfaces:**
- Consumes all previous tasks.
- Produces a verified, default-off feature ready for staged enablement.

- [ ] **Step 1: Run all focused server tests**

Working directory: `C:/Users/ralphvincentd/SiBS-HRIS-Server`

Run: `npm.cmd run test:birthday-celebrations`

Expected: all tests PASS.

- [ ] **Step 2: Run all focused client tests**

Working directory: `C:/Users/ralphvincentd/SiBS-HRIS-CLIENT-V2`

Run:

```powershell
node --test src/lib/utils/birthdayCelebration.test.js src/lib/axios/claimBirthdayCelebration.test.js src/services/context/birthdayLoginEvent.test.js src/components/birthday/birthdayCelebrationGatePolicy.test.js src/components/birthday/birthdayConfetti.test.js
```

Expected: all tests PASS.

- [ ] **Step 3: Run focused client lint**

```powershell
npx eslint src/pages/login/LoginPage.jsx src/services/context/UserContext.jsx src/services/providers.jsx src/services/context/birthdayLoginEvent.js src/lib/utils/birthdayCelebration.js src/lib/axios/claimBirthdayCelebration.js src/hooks/usePrefersReducedMotion.js src/components/birthday
```

Expected: no new lint errors. Do not claim the repository-wide lint backlog is resolved.

- [ ] **Step 4: Run the production client build**

Run: `npm.cmd run build`

Expected: production build succeeds. Record the existing large-chunk warning separately from birthday feature output. Confirm the birthday overlay and moving-confetti code are lazy chunks and note their gzip sizes.

- [ ] **Step 5: Verify the database constraint in development**

Run this read-only query after the migration:

```sql
SHOW CREATE TABLE birthday_celebration_claims;
```

Expected: `UNIQUE KEY uq_birthday_employee_year (employee_id, celebration_year)`.

- [ ] **Step 6: Exercise endpoint concurrency**

With a controlled development employee whose DOB is today and the server flag enabled, issue two authenticated POST requests concurrently from separate browser tabs.

Expected: exactly one response has `{ "success": true, "show": true }`; the other has `{ "success": true, "show": false }`; the table contains one employee/year row.

- [ ] **Step 7: Exercise trigger and failure paths manually**

Verify each case:

- Successful credential login on birthday: destination paints, then one celebration.
- Refresh after login: no celebration.
- Logout and login again in the same year: no celebration.
- Admin modal login and employee/admin mode switch: no celebration event.
- Non-birthday, missing DOB, malformed DOB: no claim UI and no error UI.
- Endpoint disabled, offline, 3.5-second timeout, 503, and aborted request: dashboard remains usable.
- Dynamic overlay import failure: no claim request is issued.
- Hidden tab during preparation or animation: work is canceled and does not resume unexpectedly.

- [ ] **Step 8: Exercise UX and accessibility states manually**

Verify at 1366×768, 1920×1080, and 390×844:

- Centered copy is readable and long names wrap.
- Rainbow confetti leaves the message clear.
- Skip is visible immediately and at least 44×44 pixels.
- Skip, Escape, empty-background click, and five-second timeout dismiss correctly.
- No sound, repeated background text, cake, gift, people, Next, or Replay controls appear.
- Keyboard focus is not stolen; the Skip button has a visible focus ring when tabbed to.
- A screen reader announces one polite greeting and ignores decorative pieces.
- Reduced motion shows static edge confetti, loads no moving-confetti chunk, and performs no particle animation.

- [ ] **Step 9: Profile runtime performance**

Using browser Performance tools on the compact laptop target:

- Record from destination paint through overlay exit.
- Confirm no birthday-attributable long task exceeds 50 ms.
- Confirm the canvas loop ends within three seconds.
- Confirm no animation frames continue after dismissal or tab hiding.
- Confirm destination LCP and interaction availability do not meaningfully regress with the feature enabled versus disabled.

- [ ] **Step 10: Verify default-off rollout controls**

- Client: absent or non-`true` `VITE_BIRTHDAY_CELEBRATION_ENABLED` prevents preparation.
- Server: absent or non-`true` `BIRTHDAY_CELEBRATION_ENABLED` returns `show: false` and writes no row.
- Enable server first, then client for the controlled cohort.
- Disable server to validate the operational kill switch without rebuilding the client.

- [ ] **Step 11: Commit any verification-only fixes separately**

If verification required code fixes, stage only those files and commit:

```powershell
git commit -m "fix: harden birthday celebration rollout"
```

If no files changed, do not create an empty commit.
