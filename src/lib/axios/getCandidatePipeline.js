// src/lib/axios/getCandidatePipeline.js
import api from "./api";

/* =========================================
   CANDIDATE PIPELINE API
========================================= */

/**
 * Get all candidate pipeline records
 */
export async function getCandidatePipeline(params = {}) {
  try {
    const response = await api.get("/api/candidate-pipeline", {
      params,
    });

    return response.data;
  } catch (error) {
    console.error("Get candidate pipeline error:", error);

    throw (
      error?.response?.data || {
        success: false,
        message: "Failed to fetch candidate pipeline.",
      }
    );
  }
}

/**
 * Get one candidate pipeline record by ID
 */
export async function getCandidatePipelineById(id) {
  try {
    const response = await api.get(`/api/candidate-pipeline/${id}`);

    return response.data;
  } catch (error) {
    console.error("Get candidate pipeline by ID error:", error);

    throw (
      error?.response?.data || {
        success: false,
        message: "Failed to fetch candidate pipeline record.",
      }
    );
  }
}

/**
 * Create candidate pipeline record
 */
export async function createCandidatePipeline(payload) {
  try {
    const response = await api.post("/api/candidate-pipeline", payload);

    return response.data;
  } catch (error) {
    console.error("Create candidate pipeline error:", error);

    throw (
      error?.response?.data || {
        success: false,
        message: "Failed to create candidate pipeline record.",
      }
    );
  }
}

/**
 * Update candidate pipeline record
 */
export async function updateCandidatePipeline(id, payload) {
  try {
    const response = await api.put(`/api/candidate-pipeline/${id}`, payload);

    return response.data;
  } catch (error) {
    console.error("Update candidate pipeline error:", error);

    throw (
      error?.response?.data || {
        success: false,
        message: "Failed to update candidate pipeline record.",
      }
    );
  }
}

/**
 * Delete candidate pipeline record
 */
export async function deleteCandidatePipeline(id) {
  try {
    const response = await api.delete(`/api/candidate-pipeline/${id}`);

    return response.data;
  } catch (error) {
    console.error("Delete candidate pipeline error:", error);

    throw (
      error?.response?.data || {
        success: false,
        message: "Failed to delete candidate pipeline record.",
      }
    );
  }
}

/* =========================================
   PIPELINE MOVEMENT
========================================= */

/**
 * Move candidate to next pipeline stage
 */
export async function moveCandidatePipelineStage(id, payload) {
  try {
    const response = await api.patch(
      `/api/candidate-pipeline/${id}/move-stage`,
      payload
    );

    return response.data;
  } catch (error) {
    console.error("Move candidate pipeline stage error:", error);

    throw (
      error?.response?.data || {
        success: false,
        message: "Failed to move candidate pipeline stage.",
      }
    );
  }
}

/**
 * Update PRF status
 */
export async function updateCandidatePrfStatus(id, payload) {
  try {
    const response = await api.patch(
      `/api/candidate-pipeline/${id}/prf-status`,
      payload
    );

    return response.data;
  } catch (error) {
    console.error("Update candidate PRF status error:", error);

    throw (
      error?.response?.data || {
        success: false,
        message: "Failed to update PRF status.",
      }
    );
  }
}

/**
 * Schedule interview
 */
export async function scheduleCandidateInterview(id, payload) {
  try {
    const response = await api.patch(
      `/api/candidate-pipeline/${id}/schedule-interview`,
      payload
    );

    return response.data;
  } catch (error) {
    console.error("Schedule candidate interview error:", error);

    throw (
      error?.response?.data || {
        success: false,
        message: "Failed to schedule interview.",
      }
    );
  }
}

/**
 * Complete interview
 */
export async function completeCandidateInterview(id, payload = {}) {
  try {
    const response = await api.patch(
      `/api/candidate-pipeline/${id}/complete-interview`,
      payload
    );

    return response.data;
  } catch (error) {
    console.error("Complete candidate interview error:", error);

    throw (
      error?.response?.data || {
        success: false,
        message: "Failed to complete interview.",
      }
    );
  }
}

/**
 * Cancel interview
 */
export async function cancelCandidateInterview(id, payload = {}) {
  try {
    const response = await api.patch(
      `/api/candidate-pipeline/${id}/cancel-interview`,
      payload
    );

    return response.data;
  } catch (error) {
    console.error("Cancel candidate interview error:", error);

    throw (
      error?.response?.data || {
        success: false,
        message: "Failed to cancel interview.",
      }
    );
  }
}

/* =========================================
   ONLINE ASSESSMENT
========================================= */

/**
 * Move candidate to Online Assessment and trigger assessment email
 */
export async function moveCandidateToOnlineAssessment(id, payload = {}) {
  try {
    const response = await api.patch(
      `/api/candidate-pipeline/${id}/move-online-assessment`,
      payload
    );

    return response.data;
  } catch (error) {
    console.error("Move candidate to online assessment error:", error);

    throw (
      error?.response?.data || {
        success: false,
        message: "Failed to move candidate to Online Assessment.",
      }
    );
  }
}

/**
 * Send or resend online assessment email
 */
export async function sendCandidateAssessmentEmail(payload) {
  try {
    const response = await api.post("/api/assessment/send-invite", payload);

    return response.data;
  } catch (error) {
    console.error("Send candidate assessment email error:", error);

    throw (
      error?.response?.data || {
        success: false,
        message: "Failed to send assessment email.",
      }
    );
  }
}

/**
 * Update assessment status:
 * Assessment: Not Take / Taken
 * Result: Assessment Fit / Assessment Not Fit
 */
export async function updateCandidateAssessment(id, payload) {
  try {
    const response = await api.patch(
      `/api/candidate-pipeline/${id}/assessment`,
      payload
    );

    return response.data;
  } catch (error) {
    console.error("Update candidate assessment error:", error);

    throw (
      error?.response?.data || {
        success: false,
        message: "Failed to update assessment.",
      }
    );
  }
}

/**
 * Mark assessment as Not Take
 */
export async function markAssessmentNotTake(id, payload = {}) {
  return updateCandidateAssessment(id, {
    assessmentStatus: "Not Take",
    assessmentResult: "",
    ...payload,
  });
}

/**
 * Mark assessment as Taken and tag result
 */
export async function markAssessmentTaken(id, assessmentResult, payload = {}) {
  return updateCandidateAssessment(id, {
    assessmentStatus: "Taken",
    assessmentResult,
    ...payload,
  });
}

/**
 * Tag candidate as Assessment Fit
 */
export async function tagAssessmentFit(id, payload = {}) {
  return markAssessmentTaken(id, "Assessment Fit", payload);
}

/**
 * Tag candidate as Assessment Not Fit
 */
export async function tagAssessmentNotFit(id, payload = {}) {
  return markAssessmentTaken(id, "Assessment Not Fit", payload);
}

/* =========================================
   DROP-OFF
========================================= */

/**
 * Mark candidate as drop-off
 */
export async function markCandidateDropOff(id, payload) {
  try {
    const response = await api.patch(
      `/api/candidate-pipeline/${id}/drop-off`,
      payload
    );

    return response.data;
  } catch (error) {
    console.error("Mark candidate drop-off error:", error);

    throw (
      error?.response?.data || {
        success: false,
        message: "Failed to mark candidate as drop-off.",
      }
    );
  }
}

/* =========================================
   DEFAULT EXPORT
========================================= */

const candidatePipelineApi = {
  getCandidatePipeline,
  getCandidatePipelineById,
  createCandidatePipeline,
  updateCandidatePipeline,
  deleteCandidatePipeline,

  moveCandidatePipelineStage,
  updateCandidatePrfStatus,
  scheduleCandidateInterview,
  completeCandidateInterview,
  cancelCandidateInterview,

  moveCandidateToOnlineAssessment,
  sendCandidateAssessmentEmail,
  updateCandidateAssessment,
  markAssessmentNotTake,
  markAssessmentTaken,
  tagAssessmentFit,
  tagAssessmentNotFit,

  markCandidateDropOff,
};

export default candidatePipelineApi;