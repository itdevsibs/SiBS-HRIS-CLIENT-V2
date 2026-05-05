import { formatDate, formatDateTime } from "../../../lib/axios/dateFormatter";

function getUploadedFileUrl(item) {
  if (!item?.uploadedFile || !item?.sibsId) return "#";

  return `${process.env.NEXT_PUBLIC_API_URL}/api/resignation/file/${encodeURIComponent(item.sibsId)}/${encodeURIComponent(item.uploadedFile)}`;
}

function FileTypeIcon({ filename }) {
  const ext = filename?.split(".").pop()?.toLowerCase() || "";

  const config = {
    doc: { label: "W", color: "bg-blue-600" },
    docx: { label: "W", color: "bg-blue-600" },
    xls: { label: "X", color: "bg-green-600" },
    xlsx: { label: "X", color: "bg-green-600" },
    csv: { label: "X", color: "bg-green-600" },
    pdf: { label: "PDF", color: "bg-red-600" },
    jpg: { label: "IMG", color: "bg-purple-600" },
    jpeg: { label: "IMG", color: "bg-purple-600" },
    png: { label: "IMG", color: "bg-purple-600" },
    gif: { label: "IMG", color: "bg-purple-600" },
    webp: { label: "IMG", color: "bg-purple-600" },
    svg: { label: "IMG", color: "bg-purple-600" },
  };

  const file = config[ext] || { label: "FILE", color: "bg-gray-600" };

  return (
    <div className="relative h-12 w-10 shrink-0">
      <div className="absolute inset-0 rounded-md border-2 border-gray-300 bg-white" />
      <div className="absolute right-0 top-0 h-3 w-3 border-l-2 border-b-2 border-gray-300 bg-gray-100" />
      <div className="absolute left-1 top-1/2 h-[2px] w-6 -translate-y-1/2 bg-gray-300" />
      <div className="absolute left-1 top-[60%] h-[2px] w-5 bg-gray-300" />
      <div
        className={`absolute -left-2 bottom-1 rounded-md px-2 py-1 text-[10px] font-bold text-white shadow ${file.color}`}
      >
        {file.label}
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
      className="flex min-w-[320px] items-center gap-3 rounded-lg p-1 transition hover:bg-gray-50"
      title={`Open ${item.uploadedFile}`}
    >
      <FileTypeIcon filename={item.uploadedFile} />
      <span className="truncate text-sm text-gray-700 hover:text-[var(--sibs-primary-1)]">
        {item.uploadedFile}
      </span>
    </a>
  );
}

export default function EmployeeAttritionTable({ data = [], loading = false }) {
  return (
    <>
      <div className="border-b bg-gray-100 px-4 py-3">
        <h2 className="font-semibold text-sibs-primary-1">Attrition Table</h2>
      </div>

      <div className="overflow-auto">
        <table className="w-full min-w-[1600px] text-sm">
          <thead className="sticky top-0 z-10 bg-gray-100">
            <tr>
              <th className="p-3 text-left">ID</th>
              <th className="p-3 text-left">Resignation ID</th>
              <th className="p-3 text-left">SiBS ID</th>
              <th className="p-3 text-left">Reason</th>
              <th className="p-3 text-left">Specify Others</th>
              <th className="p-3 text-left">Uploaded File</th>
              <th className="p-3 text-left">Attrition Date</th>
              <th className="p-3 text-left">Last Working Date</th>
              <th className="p-3 text-left">Submitted At</th>
              <th className="p-3 text-left">Status</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="10" className="p-6 text-center">
                  Loading...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan="10" className="p-6 text-center">
                  No attrition records found
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{item.id}</td>
                  <td className="p-3">{item.resignationId || "N/A"}</td>
                  <td className="p-3">{item.sibsId || "N/A"}</td>
                  <td className="p-3">{item.reason || "N/A"}</td>
                  <td className="p-3">{item.specifyOthers || "N/A"}</td>
                  <td className="px-4 py-3">
                    <UploadedFileCell item={item} />
                  </td>
                  <td className="p-3">{formatDate(item.attritionDate)}</td>
                  <td className="p-3">{formatDate(item.lastWorkingDate)}</td>
                  <td className="p-3">{formatDateTime(item.createdAt)}</td>
                  <td className="p-3">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        item.status === "Approved"
                          ? "bg-green-100 text-green-700"
                          : item.status === "Declined"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                      }`}
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
    </>
  );
}