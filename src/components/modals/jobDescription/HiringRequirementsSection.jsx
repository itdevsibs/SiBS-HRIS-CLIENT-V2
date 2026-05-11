import StatusGuide from "../../../lib/utils/react-utils/StatusGuide";
import SearchDropdown from "../../layout/dropdown/SearchDropdown";
import SingleSelectDropdown from "../../layout/dropdown/SingleSelectDropdown";
import { useJobDescription } from "../../../services/context/JobDescriptionContext";

export default function HiringRequirementSection({
  refs,
  dropdownState,
  searchState,
  handleLinkedRequirementChange,
}) {
  const {
    form,
    setForm,
    accounts,
    departments,
    requestedByUsers,
    dropdownLoading,
    dropdownError,
    jdStatusOptions,
    linkedRequirementOptions,
    hasLinkedHiringRequirement,
    selectedLinkedRequirement,
    selectedJdStatus,
  } = useJobDescription();

  const {
    linkedRequirementRef,
    accountSearchRef,
    departmentSearchRef,
    jdStatusRef,
    preparedByRef,
  } = refs;

  const {
    linkedRequirementOpen,
    setLinkedRequirementOpen,
    accountOpen,
    setAccountOpen,
    departmentOpen,
    setDepartmentOpen,
    jdStatusOpen,
    setJdStatusOpen,
    requestedByOpen,
    setRequestedByOpen,
  } = dropdownState;

  const {
    accountSearch,
    setAccountSearch,
    departmentSearch,
    setDepartmentSearch,
    requestedBySearch,
    setRequestedBySearch,
  } = searchState;

  return (
    <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-bold text-[#101828]">
        Hiring Requirement Link
      </h3>

      {dropdownError && (
        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">
          {dropdownError}
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <SingleSelectDropdown
            refBox={linkedRequirementRef}
            label="Linked Hiring Requirement"
            value={selectedLinkedRequirement}
            placeholder="Select hiring requirement"
            open={linkedRequirementOpen}
            setOpen={setLinkedRequirementOpen}
            disabled={false}
            options={linkedRequirementOptions}
            selectedValue={form.linkedHiringRequirement}
            zIndex="z-50"
            onBeforeOpen={() => {
              setAccountOpen(false);
              setDepartmentOpen(false);
              setJdStatusOpen(false);
              setRequestedByOpen(false);
            }}
            onSelect={() => {
              handleLinkedRequirementChange();
              setLinkedRequirementOpen(false);
            }}
          />

          <div className="mt-2 self-start">
            <label className="mb-1 block text-sm font-medium text-sibs-primary-1">
              Document Title <span className="text-red-500">*</span>
            </label>

            <input
              required
              value={form.documentTitle}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  documentTitle: e.target.value,
                }))
              }
              placeholder="New Document Title"
              className="w-full rounded-xl border border-sibs-tertiary-8 bg-white px-4 py-3 text-sm text-sibs-primary-1 outline-none focus:border-[var(--sibs-primary-1)]"
            />
          </div>
        </div>

        <div className="self-start">
          <label className="mb-1 block text-sm font-medium text-sibs-primary-1">
            Position <span className="text-red-500">*</span>
          </label>

          <input
            required
            value={form.roleTitle}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                roleTitle: e.target.value,
              }))
            }
            placeholder="New Position"
            className="w-full rounded-xl border border-sibs-tertiary-8 bg-white px-4 py-3 text-sm text-sibs-primary-1 outline-none focus:border-[var(--sibs-primary-1)]"
          />
        </div>

        <SearchDropdown
          refBox={accountSearchRef}
          label="Prepared For"
          required
          value={form.account}
          searchValue={accountSearch}
          setSearchValue={setAccountSearch}
          placeholder="Search account"
          open={accountOpen}
          setOpen={setAccountOpen}
          disabled={false}
          loading={dropdownLoading}
          loadingText="Loading accounts..."
          options={accounts}
          selectedValue={form.accountId}
          getOptionValue={(item) => item.gy_acc_id}
          getOptionLabel={(item) => item.gy_acc_name}
          onBeforeOpen={() => {
            setLinkedRequirementOpen(false);
            setDepartmentOpen(false);
            setJdStatusOpen(false);
            setRequestedByOpen(false);
          }}
          onSelect={(selectedAccount) => {
            setForm((prev) => ({
              ...prev,
              accountId: selectedAccount ? selectedAccount.gy_acc_id : "",
              account: selectedAccount ? selectedAccount.gy_acc_name : "",
            }));
          }}
          zIndex="z-40"
        />

        <SearchDropdown
          refBox={departmentSearchRef}
          label="Department"
          required
          value={form.department}
          searchValue={departmentSearch}
          setSearchValue={setDepartmentSearch}
          placeholder="Search department"
          open={departmentOpen}
          setOpen={setDepartmentOpen}
          disabled={false}
          loading={dropdownLoading}
          loadingText="Loading departments..."
          options={departments}
          selectedValue={form.departmentId}
          getOptionValue={(item) => item.id_department}
          getOptionLabel={(item) => item.name_department}
          onBeforeOpen={() => {
            setLinkedRequirementOpen(false);
            setAccountOpen(false);
            setJdStatusOpen(false);
            setRequestedByOpen(false);
          }}
          onSelect={(selectedDepartment) => {
            setForm((prev) => ({
              ...prev,
              departmentId: selectedDepartment
                ? selectedDepartment.id_department
                : "",
              department: selectedDepartment
                ? selectedDepartment.name_department
                : "",
            }));
          }}
          zIndex="z-30"
        />

        {/* <div className="self-start">
          <label className="mb-1 block text-sm font-medium text-sibs-primary-1">
            Effectivity Date <span className="text-red-500">*</span>
          </label>

          <input
            value={form.owner || ""}
            placeholder="Logged-in user account"
            className="w-full cursor-not-allowed rounded-xl border border-sibs-tertiary-8 bg-gray-50 px-4 py-3 text-sm font-semibold uppercase text-sibs-primary-1 outline-none"
          />
        </div> */}

        <div className="self-start">
          <label className="mb-1 block text-sm font-medium text-sibs-primary-1">
            Created by <span className="text-red-500">*</span>
          </label>

          <input
            readOnly
            value={form.owner || ""}
            placeholder="Logged-in user account"
            className="w-full cursor-not-allowed rounded-xl border border-sibs-tertiary-8 bg-gray-50 px-4 py-3 text-sm font-semibold uppercase text-sibs-primary-1 outline-none"
          />

          <p className="mt-2 text-xs font-semibold text-sibs-tertiary-5">
            Owner is automatically set based on the logged-in user account.
          </p>
        </div>
      </div>
      {hasLinkedHiringRequirement ? (
        <SingleSelectDropdown
          refBox={jdStatusRef}
          label="Job Description Status"
          required
          value={selectedJdStatus}
          placeholder="Select Job Description status"
          open={jdStatusOpen}
          setOpen={setJdStatusOpen}
          disabled={false}
          options={jdStatusOptions}
          selectedValue={form.jdStatus}
          zIndex="z-20"
          onBeforeOpen={() => {
            setLinkedRequirementOpen(false);
            setAccountOpen(false);
            setDepartmentOpen(false);
            setRequestedByOpen(false);
          }}
          onSelect={(value) => {
            setForm((prev) => ({
              ...prev,
              jdStatus: value,
            }));

            setJdStatusOpen(false);
          }}
        />
      ) : (
        <div className="self-start">
          <label className="mb-1 block text-sm font-medium text-sibs-primary-1">
            Job Description Status <span className="text-red-500">*</span>
          </label>

          <input
            readOnly
            value="New Job Description"
            className="w-full cursor-not-allowed rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 outline-none"
          />

          <p className="mt-2 text-xs font-semibold text-blue-700">
            Since this Job Description has no linked hiring requirement, the
            only valid status is New Job Description.
          </p>
        </div>
      )}
    </div>
  );
}
