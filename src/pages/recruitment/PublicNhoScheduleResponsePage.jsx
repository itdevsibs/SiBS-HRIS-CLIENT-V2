
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Loader2, RotateCcw } from "lucide-react";
import { useParams } from "react-router-dom";

function getPublicApiBaseUrl() {
  const rawBaseUrl =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "https://sibs-hris-server.getleadsource.com";

  return String(rawBaseUrl)
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/api$/, "");
}

const PUBLIC_API_BASE_URL = getPublicApiBaseUrl();

function getResponseUrl(token = "") {
  return `${PUBLIC_API_BASE_URL}/api/candidate-pipeline/public/nho-response/${encodeURIComponent(
    token,
  )}`;
}

function parseDateOnly(value = "") {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;

  return new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );
}

function toDateOnly(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatFriday(value = "") {
  const date = parseDateOnly(value);
  if (!date) return value || "—";

  return date.toLocaleDateString("en-PH", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function buildFridayOptions(earliestFriday = "", count = 16) {
  const first = parseDateOnly(earliestFriday);
  if (!first) return [];

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(first);
    date.setDate(date.getDate() + index * 7);

    return {
      value: toDateOnly(date),
      label: formatFriday(toDateOnly(date)),
    };
  });
}

export default function PublicNhoScheduleResponsePage() {
  const { token = "" } = useParams();
  const [state, setState] = useState({
    loading: true,
    error: "",
    data: null,
  });
  const [action, setAction] = useState("accept");
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState("");

  useEffect(() => {
    let active = true;

    fetch(getResponseUrl(token))
      .then(async (response) => {
        const payload = await response.json();

        if (!response.ok || payload?.success === false) {
          throw new Error(
            payload?.message || "Unable to load the NHO schedule.",
          );
        }

        if (!active) return;

        setState({
          loading: false,
          error: "",
          data: payload.data,
        });

        setRescheduleDate(payload.data?.earliestFriday || "");
      })
      .catch((error) => {
        if (!active) return;

        setState({
          loading: false,
          error: error?.message || "Unable to load the NHO schedule.",
          data: null,
        });
      });

    return () => {
      active = false;
    };
  }, [token]);

  const fridayOptions = useMemo(
    () => buildFridayOptions(state.data?.earliestFriday, 20),
    [state.data?.earliestFriday],
  );

  async function submitResponse() {
    if (submitting) return;

    if (action === "reschedule" && !rescheduleDate) {
      setState((current) => ({
        ...current,
        error: "Please select another Friday.",
      }));
      return;
    }

    setSubmitting(true);
    setState((current) => ({ ...current, error: "" }));

    try {
      const response = await fetch(getResponseUrl(token), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          date: action === "reschedule" ? rescheduleDate : undefined,
        }),
      });

      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        throw new Error(
          payload?.message || "Unable to save your NHO schedule response.",
        );
      }

      setResult(
        payload?.message ||
          "Your NHO schedule response was saved successfully.",
      );
    } catch (error) {
      setState((current) => ({
        ...current,
        error:
          error?.message || "Unable to save your NHO schedule response.",
      }));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 font-jakarta">
      <section className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <header className="bg-[#042C51] px-6 py-6 text-white">
          <img
            src="/SiBSLogoNavy.png"
            alt="SiBS"
            className="mx-auto max-h-20 max-w-full rounded bg-white p-2"
          />
          <h1 className="mt-4 text-center text-2xl font-extrabold">
            NHO Schedule Response
          </h1>
        </header>

        <div className="p-6 sm:p-8">
          {state.loading && (
            <div className="flex items-center justify-center gap-2 py-12 font-bold text-slate-500">
              <Loader2 size={18} className="animate-spin" />
              Loading NHO schedule...
            </div>
          )}

          {state.error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 font-semibold text-red-700">
              {state.error}
            </div>
          )}

          {result && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
              <CheckCircle2 className="mx-auto text-emerald-600" size={38} />
              <p className="mt-3 font-extrabold text-emerald-800">{result}</p>
            </div>
          )}

          {!state.loading && !result && state.data && (
            <div className="space-y-6">
              <div>
                <p className="text-lg font-extrabold text-[#042C51]">
                  Hi {state.data.candidateName},
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  Your New Hire Orientation has been scheduled. You may accept
                  the proposed schedule or choose another available Friday.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
                  Proposed NHO Schedule
                </p>
                <p className="mt-2 text-xl font-extrabold text-[#042C51]">
                  {formatFriday(state.data.scheduledDate)}
                </p>
                <p className="mt-3 text-sm font-semibold text-slate-600">
                  {state.data.roleTitle || "Position"}
                  {state.data.account ? ` · ${state.data.account}` : ""}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setAction("accept")}
                  className={`rounded-2xl border p-5 text-left transition ${
                    action === "accept"
                      ? "border-[#042C51] bg-blue-50"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <CheckCircle2 size={22} className="text-[#042C51]" />
                  <p className="mt-3 font-extrabold text-[#042C51]">
                    Accept Schedule
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Confirm the proposed Friday.
                  </p>
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setAction("reschedule")}
                  className={`rounded-2xl border p-5 text-left transition ${
                    action === "reschedule"
                      ? "border-[#042C51] bg-blue-50"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <RotateCcw size={22} className="text-[#042C51]" />
                  <p className="mt-3 font-extrabold text-[#042C51]">
                    Reschedule
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Choose another Friday only.
                  </p>
                </button>
              </div>

              {action === "reschedule" && (
                <label className="block">
                  <span className="text-xs font-extrabold uppercase tracking-wide text-[#042C51]">
                    Select another Friday
                  </span>
                  <select
                    value={rescheduleDate}
                    disabled={submitting}
                    onChange={(event) => setRescheduleDate(event.target.value)}
                    className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-[#042C51] outline-none focus:border-[#042C51]"
                  >
                    {fridayOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    NHO scheduling is available on Fridays only.
                  </p>
                </label>
              )}

              <button
                type="button"
                disabled={submitting}
                onClick={submitResponse}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#042C51] px-5 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <CalendarDays size={17} />
                )}
                {submitting
                  ? "Saving Response..."
                  : action === "accept"
                    ? "Confirm NHO Schedule"
                    : "Confirm Reschedule"}
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
