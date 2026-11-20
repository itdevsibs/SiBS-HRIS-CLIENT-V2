import { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import api from '../../lib/axios/api-template';
import CsrFitModuleJourney from '../../components/assessment/CsrFitModuleJourney';

// Use the same seven-module roadmap and instructions as the invitation-based
// CSR-Fit welcome page. This page only registers a public applicant and sends
// their secure assessment link; it never creates or advances an exam locally.
const fields = [
  { key: 'firstName', label: 'First name', required: true, autoComplete: 'given-name' },
  { key: 'middleName', label: 'Middle name', required: false, autoComplete: 'additional-name' },
  { key: 'lastName', label: 'Last name', required: true, autoComplete: 'family-name' },
  { key: 'email', label: 'Email address', type: 'email', required: true, autoComplete: 'email' },
  { key: 'desiredRole', label: 'Position applying for', required: true, autoComplete: 'organization-title' },
  { key: 'location', label: 'Preferred work location', required: false, autoComplete: 'address-level2' },
];

const initial = {
  firstName: '', middleName: '', lastName: '', email: '',
  desiredRole: '', location: '', acceptPrivacy: false,
};

export default function PublicCsrFitRegistrationPage() {
  const [form, setForm] = useState(initial);
  const [submitting, setSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const set = (key, value) => setForm(old => ({ ...old, [key]: value }));

  async function submit(event) {
    event.preventDefault();
    if (submitting || complete) return;
    setError('');
    setSubmitting(true);
    try {
      const { data } = await api.post('/api/assessment/public-register', form, {
        withCredentials: false,
      });
      if (data?.success === false) throw Error(data.message || 'Unable to register.');
      setMessage(data?.message || 'Please check your email for your assessment link.');
      setComplete(true);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Unable to send your assessment link.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-[100dvh] w-full bg-[#f3f7fb] px-3 py-4 font-['Plus_Jakarta_Sans'] sm:px-5 lg:px-6 lg:py-5">
      <div className="mx-auto flex w-full min-w-0 flex-col gap-3">
        {/* Mirror the navy SiBS logo header from the invitation assessment. */}
        <header className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-xl bg-[#082e53] px-5 py-4 text-white shadow-sm sm:px-6">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="flex h-14 w-28 shrink-0 items-center justify-center rounded-xl bg-white px-2 py-1 shadow-sm sm:h-16 sm:w-36">
              <img
                src={`${import.meta.env.BASE_URL}SiBSLogoNavy.png`}
                alt="SiBS — Human Expertise. Technology Forward."
                className="h-full w-full object-contain"
                decoding="async"
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-extrabold leading-tight sm:text-xl">SiBS CSR-Fit Public Assessment</h1>
              <p className="mt-1 text-[11px] font-semibold text-white/75">Public registration · 7 modules · Secure assessment link by email</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 px-3 py-1.5 text-[11px] font-semibold text-white/90">
            <ShieldCheck size={14} aria-hidden="true" /> Secure assessment
          </span>
        </header>

        <section className="min-w-0 overflow-hidden rounded-2xl border border-[#cbdceb] bg-white shadow-sm"
          aria-labelledby="public-assessment-heading">
          {/* The same introduction and orange header border used by Online Assessment. */}
          <header className="border-b border-[#cbdceb] border-t-[5px] border-t-[#ff5c28] bg-[#f6faff] px-5 py-5 sm:px-7 sm:py-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#ff5c28]">Before you begin</p>
                <h2 id="public-assessment-heading" className="mt-1 text-xl font-extrabold tracking-tight text-[#082e53] sm:text-2xl">Prepare for your assessment</h2>
                <p className="mt-2 text-[13px] leading-5 text-[#49647c]">Review the seven-module assessment and register to receive your private assessment link.</p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-[#bad2e8] bg-white px-3 py-2 text-[11px] font-extrabold text-[#082e53]">
                <LockKeyhole size={15} aria-hidden="true" /> Public registration
              </span>
            </div>
          </header>

          {/* Single shared presentation component: arrow progress + first-module overview. */}
          <div className="bg-[#eff6fd] px-4 py-5 sm:px-7 sm:py-6">
            <CsrFitModuleJourney preview showDetails compact />
          </div>

          {/* Registration matches the candidate-verification section of the online welcome. */}
          <div className="border-t border-[#cbdceb] px-5 py-6 sm:px-7">
            {complete ? (
              <div role="status" className="mx-auto max-w-xl py-7 text-center">
                <CheckCircle2 size={48} className="mx-auto text-emerald-600" aria-hidden="true" />
                <h3 className="mt-4 text-xl font-extrabold text-[#082e53]">Check your email</h3>
                <p className="mt-2 text-sm leading-6 text-[#49647c]">{message}</p>
                <div className="mt-4 break-all rounded-lg border border-[#cbdceb] bg-[#f4f9fe] px-4 py-3 text-sm font-bold text-[#082e53]">{form.email}</div>
                <p className="mt-3 text-xs leading-5 text-slate-500">Open your private link to complete candidate verification and begin the seven-module assessment. Check your spam folder if you do not see the email.</p>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#ff5c28]">Pre-assessment verification</p>
                    <h3 className="mt-1 text-lg font-extrabold text-[#082e53]">Verify your information</h3>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-lg border border-[#cbdceb] bg-[#f4f9fe] px-3 py-2 text-[11px] font-semibold text-[#082e53]">
                    <Mail size={14} aria-hidden="true" /> Private link sent by email
                  </span>
                </div>

                <form onSubmit={submit} className="mt-5" aria-label="Public CSR-Fit registration form">
                  <div className="rounded-xl border border-[#cbdceb] bg-[#f4f9fe] p-4 sm:p-5">
                    <div className="flex items-center gap-2 text-[#082e53]">
                      <ClipboardCheck size={17} aria-hidden="true" />
                      <h4 className="text-sm font-extrabold">Your candidate details</h4>
                    </div>
                    <p className="mt-1 text-[11px] leading-5 text-slate-500">Enter your information accurately. The assessment link will be sent to the email below.</p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {fields.map(field => (
                        <label key={field.key} className="block min-w-0">
                          <span className="mb-1.5 block text-[11px] font-bold text-[#082e53]">
                            {field.label}{field.required ? ' *' : ''}
                          </span>
                          <input
                            name={field.key}
                            type={field.type || 'text'}
                            required={field.required}
                            maxLength={field.key === 'email' ? 254 : field.key === 'desiredRole' ? 150 : 100}
                            autoComplete={field.autoComplete}
                            value={form[field.key]}
                            onChange={event => set(field.key, event.target.value)}
                            className="h-11 w-full min-w-0 rounded-lg border border-[#cbdceb] bg-white px-3 text-[13px] font-medium text-[#082e53] outline-none transition focus:border-[#ff5c28] focus:ring-1 focus:ring-[#ff5c28]"
                          />
                        </label>
                      ))}
                    </div>
                    <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-lg border border-[#d5e3ef] bg-white p-3.5 text-xs leading-5 text-[#49647c]">
                      <input
                        name="acceptPrivacy"
                        type="checkbox"
                        required
                        checked={form.acceptPrivacy}
                        onChange={event => set('acceptPrivacy', event.target.checked)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-[#ff5c28]"
                      />
                      <span>I consent to SiBS processing my registration details and assessment responses for recruitment evaluation by authorized HR personnel.</span>
                    </label>
                  </div>

                  {error && (
                    <div role="alert" className="mt-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">
                      <AlertCircle size={16} className="shrink-0" aria-hidden="true" /> {error}
                    </div>
                  )}
                  <footer className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#dbe5ee] pt-5">
                    <p className="max-w-xl text-[11px] leading-5 text-slate-500">Your assessment does not start during registration. The timed exam begins only when you open your secure link and follow its start instructions.</p>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#ff5c28] px-5 text-xs font-extrabold text-white transition hover:bg-[#e44b20] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff5c28] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting ? 'Sending your link…' : 'Send my assessment link'}
                      <ArrowRight size={15} aria-hidden="true" />
                    </button>
                  </footer>
                </form>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
