import assert from "node:assert/strict";
import { test } from "node:test";

import { isApplicantLeadApplicationLinkSent } from "./applicantLeadEmailStatus.js";

test("isApplicantLeadApplicationLinkSent returns true only for sent application link status", () => {
  assert.equal(
    isApplicantLeadApplicationLinkSent({ status: "Application Link Sent" }),
    true,
  );
  assert.equal(isApplicantLeadApplicationLinkSent({ status: "New Lead" }), false);
  assert.equal(isApplicantLeadApplicationLinkSent({ status: "" }), false);
});
