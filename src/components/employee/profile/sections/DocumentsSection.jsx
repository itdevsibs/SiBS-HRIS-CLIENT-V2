import { useEffect, useMemo, useState } from "react";
import { FolderLock, Grid, List, Upload } from "lucide-react";

import { usePagination } from "../../../../services/context/PaginationContext";
import PaginationTable from "../../../../services/pagination/PaginationTable";
import {
  cleanText,
  getCurrentDateKey,
} from "../../../../lib/utils/employees/employeeProfileHelpers.js";
import ProfileEmptyState from "../shared/ProfileEmptyState.jsx";
import DocumentGrid from "./documents/DocumentGrid.jsx";
import DocumentPreviewModal from "./documents/DocumentPreviewModal.jsx";
import DocumentTable from "./documents/DocumentTable.jsx";
import DocumentUploadModal from "./documents/DocumentUploadModal.jsx";

const EMPLOYEE_DOCUMENTS_ENTITY = "employee-profile-documents";
const DOCUMENTS_PER_PAGE = 8;
const DOCUMENT_CATEGORIES = [
  "All",
  "Resume",
  "Government ID",
  "Contract",
  "Certificate",
  "Training Record",
  "Other",
];

export default function DocumentsSection({
  employee,
  onDocumentsChange,
  onFeedback,
}) {
  const documents = Array.isArray(employee?.documents) ? employee.documents : [];
  const [layout, setLayout] = useState("table");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [preview, setPreview] = useState(null);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("Certificate");

  const {
    page,
    setPage,
    setPagination,
    search,
    searchInput,
    setSearchInput,
    handleSearchKeyDown,
    filterValues,
    setFilter,
    resetFilters,
    resetPagination,
  } = usePagination(EMPLOYEE_DOCUMENTS_ENTITY);

  const category = filterValues?.category || "All";

  const filteredDocuments = useMemo(() => {
    const query = cleanText(search).toLowerCase();

    return documents.filter((document) => {
      const searchMatch =
        !query ||
        cleanText(document?.name).toLowerCase().includes(query) ||
        cleanText(document?.uploadedBy).toLowerCase().includes(query);
      const categoryMatch = category === "All" || document?.category === category;
      return searchMatch && categoryMatch;
    });
  }, [category, documents, search]);

  const totalPages = Math.max(
    Math.ceil(filteredDocuments.length / DOCUMENTS_PER_PAGE),
    1,
  );
  const safeCurrentPage = Math.min(Math.max(Number(page) || 1, 1), totalPages);
  const paginatedDocuments = useMemo(() => {
    const start = (safeCurrentPage - 1) * DOCUMENTS_PER_PAGE;
    return filteredDocuments.slice(start, start + DOCUMENTS_PER_PAGE);
  }, [filteredDocuments, safeCurrentPage]);

  useEffect(() => {
    setPagination({
      total: filteredDocuments.length,
      totalPages,
      currentPage: safeCurrentPage,
      limit: DOCUMENTS_PER_PAGE,
    });
  }, [filteredDocuments.length, safeCurrentPage, setPagination, totalPages]);

  useEffect(() => {
    if (Number(page) !== safeCurrentPage) setPage(safeCurrentPage);
  }, [page, safeCurrentPage, setPage]);

  useEffect(() => () => resetPagination(), [resetPagination]);

  function handleClearFilters() {
    setSearchInput("");
    resetFilters();
    setPage(1);
  }

  function addDocument(event) {
    event.preventDefault();
    if (!cleanText(newName)) return;

    const next = {
      id: `doc_${Date.now()}`,
      name: cleanText(newName),
      category: newCategory,
      fileSize: "1.4 MB",
      uploadedAt: getCurrentDateKey(),
      uploadedBy: "Current HR User",
    };

    onDocumentsChange([next, ...documents]);
    setUploadOpen(false);
    setNewName("");
    onFeedback?.("Document added locally.", "success");
  }

  function removeDocument(document) {
    if (!window.confirm(`Delete ${document.name}?`)) return;
    onDocumentsChange(documents.filter((item) => item?.id !== document?.id));
    onFeedback?.("Document deleted locally.", "success");
  }

  function downloadDocument(document) {
    onFeedback?.(`Downloading ${document?.name}...`, "success");
  }

  return (
    <div className="space-y-4">
      <div className="mb-5 flex flex-col gap-3 border-b border-[#E6ECF2] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E9F0FC] text-[#042C51]">
              <FolderLock size={18} />
            </span>
            <h2 className="text-base font-extrabold text-[#042C51]">
              Document Vault Manager
            </h2>
          </div>
          <p className="mt-1 text-xs font-medium text-[#667085]">
            Store, filter, preview, and audit employee documents.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setUploadOpen(true)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#042C51] px-4 text-xs font-extrabold text-white"
        >
          <Upload size={15} className="text-[#FF5C28]" />
          Upload Document
        </button>
      </div>

      <button
        type="button"
        onClick={() => setUploadOpen(true)}
        className="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#C8D3DF] bg-[#F8FAFC] px-5 py-8 text-center hover:border-[#042C51]/40 hover:bg-white"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E9F0FC] text-[#042C51]">
          <Upload size={22} />
        </span>
        <span className="mt-3 text-sm font-extrabold text-[#042C51]">
          Drag and drop files here or click to upload
        </span>
        <span className="mt-1 text-xs font-medium text-[#667085]">
          PDF, XLSX, DOCX, JPG up to 10 MB
        </span>
      </button>

      <PaginationTable
        className="border-0 bg-transparent p-0 shadow-none"
        filterLayout="ta-inline"
        showPagination={false}
        searchValue={searchInput}
        searchPlaceholder="Search documents, uploader, or filename..."
        onSearchChange={setSearchInput}
        onSearchKeyDown={handleSearchKeyDown}
        filters={[
          {
            key: "category",
            label: "Category",
            value: category,
            options: DOCUMENT_CATEGORIES.map((value) => ({
              label: value === "All" ? "All Categories" : value,
              value,
            })),
            onChange: (value) => setFilter("category", value),
            searchable: true,
            includeAll: false,
            placeholder: "Search categories...",
          },
        ]}
        onReset={handleClearFilters}
        resetLabel="Reset filters"
        rightContent={
          <div className="flex items-center gap-1 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-1">
            <button
              type="button"
              onClick={() => setLayout("table")}
              className={`rounded-lg p-2 ${
                layout === "table"
                  ? "bg-[#E9F0FC] text-[#042C51]"
                  : "text-[#98A2B3]"
              }`}
              aria-label="Table layout"
            >
              <List size={16} />
            </button>
            <button
              type="button"
              onClick={() => setLayout("grid")}
              className={`rounded-lg p-2 ${
                layout === "grid"
                  ? "bg-[#E9F0FC] text-[#042C51]"
                  : "text-[#98A2B3]"
              }`}
              aria-label="Grid layout"
            >
              <Grid size={16} />
            </button>
          </div>
        }
      />

      {paginatedDocuments.length === 0 ? (
        <ProfileEmptyState message="No matching documents found." />
      ) : layout === "table" ? (
        <DocumentTable
          documents={paginatedDocuments}
          onPreview={setPreview}
          onDownload={downloadDocument}
          onDelete={removeDocument}
        />
      ) : (
        <DocumentGrid
          documents={paginatedDocuments}
          onPreview={setPreview}
          onDelete={removeDocument}
        />
      )}

      <PaginationTable
        className="border-0 bg-transparent p-0 shadow-none"
        showSearch={false}
        showPagination
        showCount
        loading={false}
        currentPage={safeCurrentPage}
        totalPages={totalPages}
        loadedCount={paginatedDocuments.length}
        totalRecords={filteredDocuments.length}
        recordLabel="employee documents"
        onPrevious={() => setPage(Math.max(safeCurrentPage - 1, 1))}
        onNext={() => setPage(Math.min(safeCurrentPage + 1, totalPages))}
      />

      <DocumentUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSubmit={addDocument}
        name={newName}
        onNameChange={setNewName}
        category={newCategory}
        onCategoryChange={setNewCategory}
        categories={DOCUMENT_CATEGORIES.filter((value) => value !== "All")}
      />

      <DocumentPreviewModal
        document={preview}
        onClose={() => setPreview(null)}
      />
    </div>
  );
}
