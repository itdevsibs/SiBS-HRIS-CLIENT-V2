// Simple in-memory store for recruitment entities.
// NOTE: This is intended for local development and prototyping only.

let hiringNeeds = [];
let nextHiringNeedId = 1;

export function listHiringNeeds() {
  return hiringNeeds.slice().sort((a, b) => b.id - a.id);
}

export function getHiringNeed(id) {
  return hiringNeeds.find((h) => h.id === Number(id)) || null;
}

export function createHiringNeed(payload) {
  const now = new Date().toISOString();
  const item = {
    id: nextHiringNeedId++,
    account: payload.account || "",
    department: payload.department || "",
    roleTitle: payload.roleTitle || "",
    approvedRequirement: Number(payload.approvedRequirement) || 0,
    reason: payload.reason || "",
    jdStatus: payload.jdStatus || "",
    requestedStartDate: payload.requestedStartDate || null,
    dueDate: payload.dueDate || null,
    hiringManager: payload.hiringManager || "",
    priority: payload.priority || "Medium",
    approvalStatus: payload.approvalStatus || "Pending",
    createdAt: now,
    updatedAt: now,
  };

  hiringNeeds.push(item);
  return item;
}

export function updateHiringNeed(id, patch) {
  const item = getHiringNeed(id);
  if (!item) return null;
  Object.assign(item, patch, { updatedAt: new Date().toISOString() });
  return item;
}

export function deleteHiringNeed(id) {
  const idx = hiringNeeds.findIndex((h) => h.id === Number(id));
  if (idx === -1) return false;
  hiringNeeds.splice(idx, 1);
  return true;
}

// seed example
createHiringNeed({
  account: "SIBS",
  department: "Operations",
  roleTitle: "CSR",
  approvedRequirement: 20,
  reason: "Expansion",
  jdStatus: "Existing",
  requestedStartDate: "2026-05-01",
  dueDate: "2026-05-15",
  hiringManager: "Juan Manager",
  priority: "High",
  approvalStatus: "Approved",
});

createHiringNeed({
  account: "SIBS",
  department: "Marketing",
  roleTitle: "QA",
  approvedRequirement: 5,
  reason: "Replacement",
  jdStatus: "New",
  requestedStartDate: "2026-05-01",
  dueDate: "2026-05-10",
  hiringManager: "Ana Manager",
  priority: "Medium",
  approvalStatus: "Pending",
});
