import { formatDate, formatDateTime } from "../../../lib/axios/dateFormatter";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

function getUploadedFileUrl(item) {
  if (!item?.uploadedFile || !item?.sibsId) return "#";

  return `${API_URL}/api/resignation/file/${encodeURIComponent(
    item.sibsId
  )}/${encodeURIComponent(item.uploadedFile)}`;
}

function FileTypeIcon({ filename }) {
  const ext = filename?.split(".").pop()?.toLowerCase() || "";

  const typeMap = {
    doc: "word",
    docx: "word",
    xls: "excel",
    xlsx: "excel",
    csv: "excel",
    pdf: "pdf",
    jpg: "image",
    jpeg: "image",
    png: "image",
    gif: "image",
    webp: "image",
    svg: "image",
  };

  const type = typeMap[ext] || "file";

  const labelMap = {
    word: "W",
    excel: "X",
    pdf: "PDF",
    image: "IMG",
    file: "FILE",
  };

  const badgeClassMap = {
    word: "bg-blue-600",
    excel: "bg-green-600",
    pdf: "bg-red-600",
    image: "bg-purple-600",
    file: "bg-gray-600",
  };

  return (
    <div className="relative h-12 w-10 shrink-0">
      <div className="absolute inset-0 rounded-md border-2 border-gray-300 bg-white" />
      <div className="absolute right-0 top-0 h-3 w-3 border-b-2 border-l-2 border-gray-300 bg-gray-100" />
      <div className="absolute left-1 top-1/2 h-0.5 w-6 -translate-y-1/2 bg-gray-300" />
      <div className="absolute left-1 top-[60%] h-0.5 w-5 bg-gray-300" />

      <div
        className={`absolute bottom-1 left-[-8px] rounded-md px-2 py-1 text-[10px] font-bold leading-none text-white shadow-sm ${
          badgeClassMap[type] || badgeClassMap.file
        }`}
      >
        {labelMap[type]}
      </div>
    </div>
  );
}

function UploadedFileCell({ item }) {
  if (!item?.uploadedFile || !item?.sibsId) {
    return <span className="text-sm text-gray-400">N/A</span>;
  }

  return (
    <a
      href={getUploadedFileUrl(item)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-w-[320px] max-w-[360px] items-center gap-3 rounded-lg p-1 text-sm text-gray-700 no-underline transition hover:bg-slate-50 hover:text-sibs-primary-1"
      title={`Open ${item.uploadedFile}`}
    >
      <FileTypeIcon filename={item.uploadedFile} />

      <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
        {item.uploadedFile}
      </span>
    </a>
  );
}

function getStatusClass(status) {
  const value = String(status || "").toLowerCase();

  if (value === "approved") {
    return "bg-green-100 text-green-700";
  }

  if (value === "declined" || value === "rejected") {
    return "bg-red-100 text-red-600";
  }

  return "bg-amber-100 text-amber-700";
}

export default function EmployeeAttritionTable({ data = [], loading = false }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-xl bg-white">
      <div className="border-b border-[#e6ecf2] bg-[#f3f4f6] px-4 py-3">
        <h2 className="m-0 text-[15px] font-semibold text-sibs-primary-1">
          Attrition Table
        </h2>
      </div>

      <div className="max-h-[670px] overflow-auto">
        <table className="w-full min-w-[1600px] border-collapse bg-white text-sm text-sibs-primary-1">
          <thead className="sticky top-0 z-10 bg-[#f3f4f6]">
            <tr>
              <th className="h-12 whitespace-nowrap px-3 text-left text-sm font-semibold text-sibs-primary-1">
                ID
              </th>
              <th className="h-12 whitespace-nowrap px-3 text-left text-sm font-semibold text-sibs-primary-1">
                Resignation ID
              </th>
              <th className="h-12 whitespace-nowrap px-3 text-left text-sm font-semibold text-sibs-primary-1">
                SiBS ID
              </th>
              <th className="h-12 whitespace-nowrap px-3 text-left text-sm font-semibold text-sibs-primary-1">
                Reason
              </th>
              <th className="h-12 whitespace-nowrap px-3 text-left text-sm font-semibold text-sibs-primary-1">
                Specify Others
              </th>
              <th className="h-12 whitespace-nowrap px-3 text-left text-sm font-semibold text-sibs-primary-1">
                Uploaded File
              </th>
              <th className="h-12 whitespace-nowrap px-3 text-left text-sm font-semibold text-sibs-primary-1">
                Attrition Date
              </th>
              <th className="h-12 whitespace-nowrap px-3 text-left text-sm font-semibold text-sibs-primary-1">
                Last Working Date
              </th>
              <th className="h-12 whitespace-nowrap px-3 text-left text-sm font-semibold text-sibs-primary-1">
                Submitted At
              </th>
              <th className="h-12 whitespace-nowrap px-3 text-left text-sm font-semibold text-sibs-primary-1">
                Status
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan="10"
                  className="h-24 text-center text-sm text-sibs-tertiary-5"
                >
                  Loading...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan="10"
                  className="h-24 text-center text-sm text-sibs-tertiary-5"
                >
                  No attrition records found
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id} className="transition hover:bg-slate-50">
                  <td className="h-14 whitespace-nowrap border-t border-[#e6ecf2] px-3 text-sm text-sibs-primary-1">
                    {item.id || "N/A"}
                  </td>

                  <td className="h-14 whitespace-nowrap border-t border-[#e6ecf2] px-3 text-sm text-sibs-primary-1">
                    {item.resignationId || "N/A"}
                  </td>

                  <td className="h-14 whitespace-nowrap border-t border-[#e6ecf2] px-3 text-sm text-sibs-primary-1">
                    {item.sibsId || "N/A"}
                  </td>

                  <td className="h-14 whitespace-nowrap border-t border-[#e6ecf2] px-3 text-sm text-sibs-primary-1">
                    {item.reason || "N/A"}
                  </td>

                  <td className="h-14 whitespace-nowrap border-t border-[#e6ecf2] px-3 text-sm text-sibs-primary-1">
                    {item.specifyOthers || "N/A"}
                  </td>

                  <td className="h-14 whitespace-nowrap border-t border-[#e6ecf2] px-3 text-sm text-sibs-primary-1">
                    <UploadedFileCell item={item} />
                  </td>

                  <td className="h-14 whitespace-nowrap border-t border-[#e6ecf2] px-3 text-sm text-sibs-primary-1">
                    {formatDate(item.attritionDate)}
                  </td>

                  <td className="h-14 whitespace-nowrap border-t border-[#e6ecf2] px-3 text-sm text-sibs-primary-1">
                    {formatDate(item.lastWorkingDate)}
                  </td>

                  <td className="h-14 whitespace-nowrap border-t border-[#e6ecf2] px-3 text-sm text-sibs-primary-1">
                    {formatDateTime(item.createdAt)}
                  </td>

                  <td className="h-14 whitespace-nowrap border-t border-[#e6ecf2] px-3 text-sm">
                    <span
                      className={`inline-flex items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusClass(
                        item.status
                      )}`}
                    >
                      {item.status || "Pending"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}