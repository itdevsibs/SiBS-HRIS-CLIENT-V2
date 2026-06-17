import api from "./api-template";

const ONBOARDING_STORAGE_KEY = "ta_onboarding_records";

// READ
export const getOnboardingRecords = async () => {
  try {
    const raw = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : [];
    
    if (data.length > 0) {
       return { success: true, data };
    }

    // Fallback data if localStorage is empty
    const fallbackData = [
      {
        id: 1,
        onboardingId: "ONB-001",
        offerId: "OFF-001",
        candidateName: "Juan Dela Cruz",
        candidateEmail: "juan.delacruz@email.com",
        roleTitle: "Customer Service Representative",
        account: "SIBS Operations",
        acceptedOfferDate: "2026-05-03",
        expectedStartDate: "2026-05-10",
        actualStartDate: "2026-05-10",
        showStatus: "Show",
        finalOutcome: "True Hire",
        owner: "Maria Reyes",
        location: "Davao",
        remarks: "Candidate showed up on expected start date."
      },
      {
        id: 2,
        onboardingId: "ONB-002",
        offerId: "OFF-002",
        candidateName: "Maria Santos",
        candidateEmail: "maria.santos@email.com",
        roleTitle: "QA Specialist",
        account: "SIBS Operations",
        acceptedOfferDate: "2026-05-05",
        expectedStartDate: "2026-05-14",
        actualStartDate: null,
        showStatus: "Pending",
        finalOutcome: "Pending Start",
        owner: "John Dela Cruz",
        location: "Tagum",
        remarks: "Waiting for candidate start date."
      },
      {
        id: 3,
        onboardingId: "ONB-003",
        offerId: "OFF-003",
        candidateName: "Alex Gonzaga",
        candidateEmail: "alex.gonzaga@email.com",
        roleTitle: "Software Engineer",
        account: "SIBS IT",
        acceptedOfferDate: "2026-05-01",
        expectedStartDate: "2026-05-08",
        actualStartDate: null,
        showStatus: "No Show",
        finalOutcome: "No Show",
        owner: "Kim Domingo",
        location: "Remote",
        withdrawalReason: "Did not respond to calls on start date.",
        reasonCategory: "No Response",
        remarks: "Candidate ghosted on day one."
      },
      {
        id: 4,
        onboardingId: "ONB-004",
        offerId: "OFF-004",
        candidateName: "Peter Parker",
        candidateEmail: "peter.parker@email.com",
        roleTitle: "RCM Analyst",
        account: "SIBS RCM",
        acceptedOfferDate: "2026-05-06",
        expectedStartDate: "2026-05-20",
        actualStartDate: null,
        showStatus: "Withdrawn",
        finalOutcome: "Pre-start Withdrawal",
        owner: "Paul Garcia",
        location: "Davao",
        withdrawalReason: "Accepted a counter-offer from current employer.",
        reasonCategory: "Accepted Other Offer",
        remarks: "Withdrew 3 days before start date."
      }
    ];

    return { success: true, data: fallbackData };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// CREATE
export const createOnboardingRecord = async (recordData) => {
  try {
    const raw = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    const current = raw ? JSON.parse(raw) : [];
    const newRecord = { 
        ...recordData, 
        id: Date.now(), 
        onboardingId: `ONB-${String(current.length + 1).padStart(3, '0')}` 
    };
    const updated = [newRecord, ...current];
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(updated));
    return { success: true, data: newRecord };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// UPDATE
export const updateOnboardingOutcome = async (id, outcomeData) => {
  try {
    const raw = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    const current = raw ? JSON.parse(raw) : [];
    const updated = current.map(item => 
      item.id === id ? { ...item, ...outcomeData } : item
    );
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(updated));
    return { success: true, data: updated.find(i => i.id === id) };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const getAcceptedOffers = async () => {
  try {
    const OFFER_RECORDS_KEY = "ta_offer_records";
    const raw = localStorage.getItem(OFFER_RECORDS_KEY);
    const storedOffers = raw ? JSON.parse(raw) : [];

    // Filter for candidates who have 'Accepted' but haven't started onboarding
    const accepted = storedOffers.filter(offer => offer.status === "Accepted");

    return { success: true, data: accepted };
  } catch (error) {
    return { success: false, message: error.message };
  }
};