import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

function money(value) {
  const n = Number(value);
  return Number.isFinite(n)
    ? new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(n)
    : "—";
}

export default function PublicOfferResponsePage() {
  const { token = "" } = useParams();
  const [state, setState] = useState({ loading: true, error: "", data: null, action: "" });
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState("");

  useEffect(() => {
    let active = true;
    fetch(`/api/candidate-pipeline/public/offer-response/${encodeURIComponent(token)}`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || payload?.success === false) throw new Error(payload?.message || "Unable to load offer.");
        if (active) setState({ loading: false, error: "", data: payload.data, action: payload.action });
      })
      .catch((error) => active && setState({ loading: false, error: error.message, data: null, action: "" }));
    return () => { active = false; };
  }, [token]);

  const actionLabel = state.action === "accept" ? "Accept Offer" : "Negotiate Offer";
  const total = useMemo(() => Number(state.data?.basicPay || 0) + Number(state.data?.deminimisDailyRate || 0), [state.data]);

  async function submit() {
    if (state.action === "negotiate" && !message.trim()) return;
    setSubmitting(true);
    try {
      const response = await fetch(`/api/candidate-pipeline/public/offer-response/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: state.action, message: message.trim() }),
      });
      const payload = await response.json();
      if (!response.ok || payload?.success === false) throw new Error(payload?.message || "Unable to submit response.");
      setResult(payload.message || "Your response was submitted.");
    } catch (error) {
      setState((current) => ({ ...current, error: error.message }));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 font-jakarta">
      <section className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <header className="bg-[#042C51] px-6 py-5 text-white">
          <img src="/SiBSLogoNavy.png" alt="SiBS" className="mx-auto max-h-20 max-w-full rounded bg-white p-2" />
          <h1 className="mt-4 text-center text-2xl font-extrabold">Employment Offer Response</h1>
        </header>
        <div className="p-6 sm:p-8">
          {state.loading ? <p className="text-center font-bold text-slate-500">Loading your offer...</p> : null}
          {state.error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 font-semibold text-red-700">{state.error}</div> : null}
          {result ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center font-bold text-emerald-800">{result}</div> : null}
          {!state.loading && !state.error && !result && state.data ? (
            <div className="space-y-5">
              <p className="text-lg font-bold text-[#042C51]">Hi {state.data.candidateName},</p>
              <p className="text-sm leading-6 text-slate-600">Review the approved offer details below before confirming your response.</p>
              <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-5 sm:grid-cols-2">
                <p><b>Final Role:</b><br />{state.data.finalRole}</p>
                <p><b>Final Account:</b><br />{state.data.finalAccount}</p>
                <p><b>Basic Daily Rate:</b><br />{money(state.data.basicPay)}</p>
                <p><b>Daily De Minimis:</b><br />{money(state.data.deminimisDailyRate)}</p>
                <p><b>Total Daily Rate:</b><br />{money(total)}</p>
                <p><b>Offer Version:</b><br />{state.data.offerVersion}</p>
              </div>
              {state.action === "negotiate" ? (
                <label className="block">
                  <span className="text-sm font-extrabold text-[#042C51]">Negotiation message</span>
                  <textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={5} className="mt-2 w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-[#FF5C28]" placeholder="Explain the changes you would like HR to review." />
                </label>
              ) : (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">By accepting, you confirm that you have reviewed and accepted this Employment Offer.</div>
              )}
              <button type="button" disabled={submitting || (state.action === "negotiate" && !message.trim())} onClick={submit} className="w-full rounded-xl bg-[#FF5C28] px-5 py-3 font-extrabold text-white disabled:opacity-50">{submitting ? "Submitting..." : actionLabel}</button>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
