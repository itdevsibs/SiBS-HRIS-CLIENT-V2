import {
  PUBLIC_SUBMISSIONS_KEY,
  SOURCE_COST_ENTRIES_KEY,
  samplePublicSubmissions,
  sampleSourceCostEntries,
} from "../utils/sourcing/sourcingConstants";
import {
  readLocalStorage,
  writeLocalStorage,
} from "../utils/sourcing/sourcingStorage";
import { getTodayISO } from "../utils/sourcing/sourcingFormatter";

export async function getSourcingAnalyticsData() {
  const publicSubmissions = readLocalStorage(PUBLIC_SUBMISSIONS_KEY, []);
  const sourceCostEntries = readLocalStorage(SOURCE_COST_ENTRIES_KEY, []);

  return {
    success: true,
    publicSubmissions: Array.isArray(publicSubmissions)
      ? publicSubmissions
      : [],
    sourceCostEntries: Array.isArray(sourceCostEntries)
      ? sourceCostEntries
      : [],
  };
}

export async function createSourceCostEntry(payload) {
  const currentEntries = readLocalStorage(SOURCE_COST_ENTRIES_KEY, []);

  const newEntry = {
    id: Date.now(),
    source: payload.source,
    description: payload.description,
    amount: Number(payload.amount || 0),
    dateSpent: payload.dateSpent,
    createdAt: getTodayISO(),
  };

  const updatedEntries = [newEntry, ...currentEntries];

  writeLocalStorage(SOURCE_COST_ENTRIES_KEY, updatedEntries);

  return {
    success: true,
    data: newEntry,
  };
}

export async function loadSourcingSampleData() {
  writeLocalStorage(PUBLIC_SUBMISSIONS_KEY, samplePublicSubmissions);
  writeLocalStorage(SOURCE_COST_ENTRIES_KEY, sampleSourceCostEntries);

  return {
    success: true,
    publicSubmissions: samplePublicSubmissions,
    sourceCostEntries: sampleSourceCostEntries,
  };
}

export async function clearSourcingCostEntries() {
  writeLocalStorage(SOURCE_COST_ENTRIES_KEY, []);

  return {
    success: true,
  };
}