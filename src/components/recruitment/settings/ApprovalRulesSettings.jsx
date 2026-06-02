import React, { useEffect, useState } from "react";
import { Plus, Save, Trash2, UserCheck } from "lucide-react";
import {
  getOfferApprovalUsers,
  saveOfferApprovalUsers,
} from "../../../lib/utils/offers/offerApprovalSettings";

export default function ApprovalRulesSettings() {
  const [approvalUsers, setApprovalUsers] = useState([]);
  const [newUserName, setNewUserName] = useState("");

  useEffect(() => {
    setApprovalUsers(getOfferApprovalUsers());
  }, []);

  function handleAddUser() {
    const cleanedName = newUserName.trim();

    if (!cleanedName) return;

    const exists = approvalUsers.some(
      (name) => name.toLowerCase() === cleanedName.toLowerCase(),
    );

    if (exists) {
      setNewUserName("");
      return;
    }

    setApprovalUsers((prev) => [...prev, cleanedName]);
    setNewUserName("");
  }

  function handleRemoveUser(name) {
    setApprovalUsers((prev) => prev.filter((item) => item !== name));
  }

  function handleSave() {
    saveOfferApprovalUsers(approvalUsers);
    alert("Approval rules saved.");
  }

  return (
    <section className="rounded-2xl border border-[#E6ECF2] bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F2F6FA] text-sibs-primary-1">
            <UserCheck size={22} />
          </div>

          <h3 className="mt-4 text-xl font-extrabold text-[#101828]">
            Offer Approval Rules
          </h3>

          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-sibs-tertiary-5">
            Add the users who are allowed to approve or reject offers. The
            Offers page will show only one Approve and one Reject button, and
            the action will be recorded under the logged-in user.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <Save size={17} />
          Save Approval Rules
        </button>
      </div>

      <div className="mt-6 rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
        <label className="text-sm font-extrabold text-[#101828]">
          Add Approval User
        </label>

        <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
          <input
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddUser();
              }
            }}
            placeholder="Example: Kim Domingo"
            className="h-11 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
          />

          <button
            type="button"
            onClick={handleAddUser}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-5 text-sm font-extrabold text-blue-700 transition hover:bg-blue-100"
          >
            <Plus size={17} />
            Add User
          </button>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-[#E6ECF2]">
        <div className="grid grid-cols-[1fr_auto] bg-[#F5F7FA] px-5 py-3 text-xs font-extrabold uppercase tracking-wide text-[#174A7C]">
          <span>Approval User</span>
          <span>Action</span>
        </div>

        {approvalUsers.length > 0 ? (
          approvalUsers.map((name) => (
            <div
              key={name}
              className="grid grid-cols-[1fr_auto] items-center border-t border-[#E6ECF2] bg-white px-5 py-4"
            >
              <div>
                <p className="text-sm font-extrabold text-[#101828]">{name}</p>
                <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                  Can approve or reject offers from the Offers page.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleRemoveUser(name)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-100"
                title="Remove"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        ) : (
          <div className="bg-white px-5 py-10 text-center text-sm font-bold text-sibs-tertiary-5">
            No approval users added yet.
          </div>
        )}
      </div>
    </section>
  );
}
