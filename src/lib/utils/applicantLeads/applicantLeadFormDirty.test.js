import assert from "node:assert/strict";
import { test } from "node:test";

import {
  getApplicantLeadEditedFields,
  isApplicantLeadFormEdited,
} from "./applicantLeadFormDirty.js";

const lead = {
  firstName: "Maria",
  lastName: "Santos",
  middleName: "",
  suffix: "",
  cpNum: "0917-889-1234",
  email: "maria@example.com",
  departmentId: 4,
  department: "Human Resource",
  accountId: 12,
  specificAccount: "AHG Inbound/Outbound",
  sourcingId: "",
  source: "",
  preferredSite: "Tagum City",
  status: "New Lead",
  notes: "Initial note",
};

test("isApplicantLeadFormEdited returns false when edit form matches the original lead", () => {
  const formData = {
    firstName: "Maria",
    lastName: "Santos",
    middleName: "",
    suffix: "",
    cpNum: "0917-889-1234",
    email: "maria@example.com",
    departmentId: "4",
    department: "Human Resource",
    accountId: "12",
    specificAccount: "AHG Inbound/Outbound",
    sourcingId: "",
    source: "",
    preferredSite: "Tagum City",
    status: "New Lead",
    notes: "Initial note",
  };

  assert.equal(isApplicantLeadFormEdited(formData, lead), false);
  assert.deepEqual(getApplicantLeadEditedFields(formData, lead), {});
});

test("getApplicantLeadEditedFields identifies changed frontend values", () => {
  const formData = {
    firstName: "Maria",
    lastName: "Reyes",
    middleName: "",
    suffix: "",
    cpNum: "0917-889-1234",
    email: "maria@example.com",
    departmentId: "4",
    department: "Human Resource",
    accountId: "12",
    specificAccount: "AHG Inbound/Outbound",
    sourcingId: "",
    source: "",
    preferredSite: "Davao City",
    status: "Contacted",
    notes: "Initial note",
  };

  assert.equal(isApplicantLeadFormEdited(formData, lead), true);
  assert.deepEqual(getApplicantLeadEditedFields(formData, lead), {
    lastName: true,
    preferredSite: true,
    status: true,
  });
});
