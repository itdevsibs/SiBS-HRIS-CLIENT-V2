import assert from "node:assert/strict";
import test from "node:test";

async function loadSubject() {
  try {
    return await import("./departmentDirectory.js");
  } catch (error) {
    assert.fail(`department directory normalizer is not implemented: ${error.message}`);
  }
}

test("normalizes the department directory API response for the reporting UI", async () => {
  const { normalizeDepartmentDirectoryResponse } = await loadSubject();

  const result = normalizeDepartmentDirectoryResponse({
    summary: {
      totalDepartments: "12",
      totalAccounts: "81",
      activeAccounts: "54",
      inactiveAccounts: "27",
      activeRate: "67",
    },
    data: [
      {
        id: "5",
        code: "DEP-005",
        name: "Finance & Accounting",
        status: "active",
        totalAccounts: "4",
        activeAccounts: "3",
        inactiveAccounts: "1",
        description: "28 active staff across 2 locations supporting 4 linked accounts.",
        totalStaff: "35",
        activeStaff: "28",
        staffCoverage: "80",
        locations: ["SiBS Tagum", "SiBS Davao"],
        primaryLocation: "SiBS Tagum",
        lead: {
          sibsId: "SIBS-101",
          name: "Mark Gregory Sarmiento",
          email: "mark@example.com",
          title: "Primary Department Supervisor",
          supervisedStaff: "19",
        },
        accounts: [
          { id: 7, code: "ACC-007", name: "Finance", longName: null, status: "active", statusCode: 0 },
        ],
        budget: null,
      },
    ],
    pagination: { page: "1", limit: "6", total: "12", totalPages: "2" },
  });

  assert.deepEqual(result.summary, {
    totalDepartments: 12,
    totalAccounts: 81,
    activeAccounts: 54,
    inactiveAccounts: 27,
    activeRate: 67,
  });
  assert.deepEqual(result.departments[0], {
    id: "5",
    code: "DEP-005",
    name: "Finance & Accounting",
    status: "active",
    totalAccounts: 4,
    activeAccounts: 3,
    inactiveAccounts: 1,
    description: "28 active staff across 2 locations supporting 4 linked accounts.",
    totalStaff: 35,
    activeStaff: 28,
    staffCoverage: 80,
    locations: ["SiBS Tagum", "SiBS Davao"],
    primaryLocation: "SiBS Tagum",
    lead: {
      sibsId: "SIBS-101",
      name: "Mark Gregory Sarmiento",
      email: "mark@example.com",
      title: "Primary Department Supervisor",
      supervisedStaff: 19,
    },
    accounts: [
      { id: "7", code: "ACC-007", name: "Finance", longName: "", status: "active", statusCode: 0 },
    ],
    budget: null,
  });
  assert.deepEqual(result.pagination, {
    page: 1,
    limit: 6,
    total: 12,
    totalPages: 2,
  });
});

test("normalizes department details and marks unknown statuses inactive", async () => {
  const { normalizeDepartmentDetailsResponse } = await loadSubject();

  const result = normalizeDepartmentDetailsResponse({
    data: {
      id: 4,
      code: "DEP-004",
      name: "Facility Management",
      status: "unknown",
      totalAccounts: "2",
      activeAccounts: "1",
      inactiveAccounts: "1",
      accounts: [
        { id: 8, code: "ACC-008", name: "FST", longName: null, status: "active" },
        { id: 9, code: "ACC-009", name: "Old Site", status: "disabled" },
      ],
    },
  });

  assert.equal(result.status, "inactive");
  assert.equal(result.accounts[0].longName, "");
  assert.equal(result.accounts[1].status, "inactive");
});
