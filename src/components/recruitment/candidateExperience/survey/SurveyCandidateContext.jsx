import { Briefcase, Building2, Mail, UserRound } from "lucide-react";

function pick(survey, keys) {
  for (const key of keys) {
    const value = survey?.[key];
    if (value) return value;
  }
  return "";
}

export default function SurveyCandidateContext({ survey }) {
  const name = pick(survey, ["candidateName", "candidate_name", "name"]) || "Candidate";
  const email = pick(survey, ["candidateEmail", "candidate_email", "email"]);
  const role = pick(survey, ["roleTitle", "role_title", "role", "openPosition", "open_position"]);
  const account = pick(survey, ["account", "finalAccount", "final_account"]);
  const outcome = pick(survey, ["outcome", "finalStatus", "final_status"]);

  return (
    <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#042C51] text-white">
            <UserRound size={18} />
          </span>
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
              Candidate Profile
            </p>
            <h3 className="truncate text-sm font-black text-[#042C51]">{name}</h3>
            <p className="mt-0.5 flex items-center gap-1 truncate text-[10px] text-slate-500">
              <Mail size={11} />
              {email || "Email on file"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-right sm:min-w-[320px]">
          <Fact icon={Briefcase} label="Role" value={role || "—"} />
          <Fact icon={Building2} label="Account" value={account || "—"} />
        </div>
      </div>

      {outcome ? (
        <div className="mt-3 border-t border-slate-100 pt-3 text-[10px] font-bold text-slate-500">
          Recruitment outcome: <span className="text-[#042C51]">{outcome}</span>
        </div>
      ) : null}
    </section>
  );
}

function Fact({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl bg-[#F8FAFC] p-3">
      <p className="flex items-center justify-end gap-1 text-[9px] font-black uppercase text-slate-400">
        <Icon size={11} />
        {label}
      </p>
      <p className="mt-1 truncate text-xs font-black text-[#042C51]">{value}</p>
    </div>
  );
}
