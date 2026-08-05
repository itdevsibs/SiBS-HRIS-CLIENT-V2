import api from "../../lib/axios/api-template.js";

function getApiErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

export async function sendActionItemsReport(payload) {
  try {
    const response = await api.post(
      "/api/recruitment/reports/action-items/send",
      payload,
    );

    if (!response?.data?.success) {
      throw new Error(
        response?.data?.message ||
          "The report email was not accepted by the server.",
      );
    }

    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Unable to send the recruitment report."),
    );
  }
}

export async function downloadActionItemsReportPdf(payload) {
  try {
    const response = await api.post(
      "/api/recruitment/reports/action-items/export-pdf",
      payload,
      { responseType: "blob" },
    );

    const blob = response?.data;
    if (!(blob instanceof Blob) || blob.size === 0) {
      throw new Error("The server returned an empty PDF file.");
    }

    const contentType = String(blob.type || "").toLowerCase();
    if (contentType && !contentType.includes("pdf")) {
      throw new Error("The server response is not a PDF file.");
    }

    return blob;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(
        error,
        "Unable to generate the recruitment report PDF.",
      ),
    );
  }
}
