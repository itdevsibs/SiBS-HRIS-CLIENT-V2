import { useRef, useState } from 'react';
import { useHref } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  ClipboardCheck,
  LockKeyhole,
  ShieldCheck,
} from 'lucide-react';
import api from '../../lib/axios/api-template';
import CsrFitModuleJourney from '../../components/assessment/CsrFitModuleJourney';
import PublicAssessmentDesktopOnly from '../../components/assessment/PublicAssessmentDesktopOnly';
import { getPublicCsrFitResumeSession, rememberPublicCsrFitSession, forgetPublicCsrFitResumeSession } from '../../utils/assessment/csrFitResumeStorageClient';

// The public assessment collects candidate identity only. The HRIS server
// creates and begins the attempt, then returns an exam URL for a dedicated tab.
const fields = [
  { key: 'firstName', label: 'First name', required: true, autoComplete: 'given-name' },
  { key: 'middleName', label: 'Middle name', required: false, autoComplete: 'additional-name' },
  { key: 'lastName', label: 'Last name', required: true, autoComplete: 'family-name' },
  { key: 'email', label: 'Email address', type: 'email', required: true, autoComplete: 'email' },
];

const initial = {
  firstName: '', middleName: '', lastName: '', email: '',
  acceptPrivacy: false,
};

// Distinguish a missing server route from an invalid or revoked old token.
// This probe contains no applicant data or token and does not alter a session.
async function publicAssessmentApiMounted() {
  try {
    const response = await api.get('/api/public-assessment/health', {
      withCredentials: false, timeout: 8000,
    });
    return response?.data?.service === 'sibs-public-assessment';
  } catch {
    return false;
  }
}

function PublicCsrFitRegistrationPageContent() {
  const sessionPath = useHref('/public-assessment/session');
  const assessmentTabRef = useRef(null);
  const [launchNotice, setLaunchNotice] = useState('');
  const [form, setForm] = useState(initial);
  const [submitting, setSubmitting] = useState(false);
  const submitLock = useRef(false);
  const [error, setError] = useState('');

  const set = (key, value) => setForm(old => ({ ...old, [key]: value }));

  async function submit(event) {
    event.preventDefault();
    if (submitLock.current) return;
    if (assessmentTabRef.current && !assessmentTabRef.current.closed) {
      try { assessmentTabRef.current.focus(); } catch { /* focus may be restricted */ }
      setLaunchNotice('An assessment tab is already open. Continue in that tab.');
      return;
    }
    submitLock.current = true;
    setError('');
    setLaunchNotice('');
    setSubmitting(true);
    // Create the exam tab during the submit gesture, before any network await.
    // Browsers normally permit script-created tabs to close themselves later.
    let assessmentTab = null;
    try {
      assessmentTab = window.open('about:blank', '_blank');
      if (assessmentTab) {
        assessmentTab.opener = null;
        assessmentTab.document.title = 'SiBS CSR-Fit Public Assessment';
        assessmentTab.document.body.textContent = 'Preparing your SiBS assessment…';
      }
    } catch {
      if (assessmentTab && !assessmentTab.closed) {
        try { assessmentTab.close(); } catch { /* browser controls tab closing */ }
      }
      assessmentTab = null;
    }
    // Do not create or resume an attempt if the required exam tab cannot open.
    // Same-tab navigation would defeat the Close Page workflow.
    if (!assessmentTab || assessmentTab.closed) {
      setError('Allow pop-ups for this website, then click Start or continue assessment again. The assessment must open in its own tab.');
      submitLock.current = false;
      setSubmitting(false);
      return;
    }
    try {
      // The database decides whether this email has a public applicant record.
      // New applicants never need a token or an attempted resume/restore call.
      const { data } = await api.post('/api/public-assessment/register', {
        firstName: form.firstName, middleName: form.middleName,
        lastName: form.lastName, email: form.email,
        acceptPrivacy: form.acceptPrivacy,
      }, { withCredentials: true });
      if (data?.success === false) throw new Error(data.message || 'Unable to begin assessment.');

      let nextToken = '';
      if (data?.existing) {
        // The registered email is not authorization. A returning applicant
        // must present the protected browser cookie or previously issued token.
        const saved = getPublicCsrFitResumeSession(form);
        const { data: recovery } = await api.post('/api/public-assessment/resume', {
          firstName: form.firstName, middleName: form.middleName,
          lastName: form.lastName, email: form.email,
          ...(saved?.token ? { savedToken: saved.token } : {}),
        }, { withCredentials: true });
        if (!recovery?.resumable || !/^[a-f0-9]{64}$/.test(String(recovery?.token || ''))) {
          if (recovery?.reason === 'expired') {
            throw new Error('The original assessment access period has expired. Contact SiBS Recruitment; saved answers are not reset.');
          }
          if (recovery?.reason === 'void') throw new Error('This assessment is void. Please contact HR regarding your assessment and reapplication eligibility.');
          if (recovery?.reason === 'already_submitted') {
            throw new Error('This public assessment has already been submitted. Contact SiBS Recruitment for assistance.');
          }
          throw new Error('An existing public assessment was found, but this browser has no valid recovery credential. Contact SiBS Recruitment for authorized access restoration. Your saved answers and timer are unchanged.');
        }
        nextToken = recovery.token;
        if (saved?.token && saved.token !== nextToken) {
          forgetPublicCsrFitResumeSession(saved.token);
        }
      } else {
        // The newly inserted public applicant now owns a unique public token.
        nextToken = String(data?.token || '');
        if (!/^[a-f0-9]{64}$/.test(nextToken)) {
          throw new Error('The public assessment session could not be created. Contact SiBS Recruitment before retrying.');
        }
      }

      rememberPublicCsrFitSession(nextToken, form);
      const query = `?token=${encodeURIComponent(nextToken)}`;
      if (assessmentTab && !assessmentTab.closed) {
        try {
          assessmentTab.location.replace(new URL(sessionPath + query, window.location.origin).href);
          assessmentTabRef.current = assessmentTab;
          setForm(initial);
          setLaunchNotice('Your assessment opened in a new tab. Continue there and close it when finished.');
          return;
        } catch {
          try { assessmentTab.close(); } catch { /* browser controls tab closing */ }
        }
      }
      // The attempt already exists and its recovery credential has been saved.
      // Retain the form so the applicant can resume without creating another attempt.
      setError('The assessment tab was closed or could not load. Your attempt is saved. Allow pop-ups, then click Start or continue assessment again using the same details.');
    } catch (e) {
      if (assessmentTab && !assessmentTab.closed) {
        try { assessmentTab.close(); } catch { /* browser controls tab closing */ }
      }
      const code = Number(e?.response?.status || 0);
      let message = e?.response?.data?.message || e.message || 'Unable to begin the public assessment.';
      if (code === 404) {
        const mounted = await publicAssessmentApiMounted();
        message = mounted
          ? 'Your public assessment session was not found. Contact SiBS Recruitment to restore the existing attempt.'
          : 'The Public Assessment API is not mounted on the server. IT must enable /api/public-assessment before applicants can continue.';
      }
      setError(message);
    } finally {
      submitLock.current = false;
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
              <p className="mt-1 text-[11px] font-semibold text-white/75">Public registration · 7 modules · Start assessment directly</p>
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
                <p className="mt-2 text-[13px] leading-5 text-[#49647c]">Use a desktop or laptop computer to register and begin your seven-module assessment. Mobile devices are not supported.</p>
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
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#ff5c28]">Pre-assessment verification</p>
                  <h3 className="mt-1 text-lg font-extrabold text-[#082e53]">Verify your information</h3>
                </div>
                <span className="inline-flex items-center gap-2 rounded-lg border border-[#cbdceb] bg-[#f4f9fe] px-3 py-2 text-[11px] font-semibold text-[#082e53]">
                  <ShieldCheck size={14} aria-hidden="true" /> Start here — no email link required
                </span>
              </div>

                <form onSubmit={submit} className="mt-5" aria-label="Public CSR-Fit registration form">
                  <div className="rounded-xl border border-[#cbdceb] bg-[#f4f9fe] p-4 sm:p-5">
                    <div className="flex items-center gap-2 text-[#082e53]">
                      <ClipboardCheck size={17} aria-hidden="true" />
                      <h4 className="text-sm font-extrabold">Your candidate details</h4>
                    </div>
                    <p className="mt-1 text-[11px] leading-5 text-slate-500">Enter your name and email accurately. Returning applicants can enter the same information to continue a saved assessment in this browser. No invitation email is required.</p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {fields.map(field => (
                        <label key={field.key} className="block min-w-0">
                          <span className="mb-1.5 block text-[11px] font-bold text-[#082e53]">
                            {field.label}{field.required ? ' *' : ''}
                          </span>
                          <input
                            name={field.key}
                            type={field.type || 'text'}
                            required={field.required}
                            maxLength={field.key === 'email' ? 254 : 100}
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

                  {launchNotice && (
                    <div role="status" className="mt-4 flex items-start gap-2 rounded-lg border border-[#cbdceb] bg-[#f4f9fe] px-4 py-3 text-xs text-[#082e53]">
                      <ShieldCheck size={16} className="shrink-0" aria-hidden="true" /> {launchNotice}
                    </div>
                  )}
                  {error && (
                    <div role="alert" className="mt-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">
                      <AlertCircle size={16} className="shrink-0" aria-hidden="true" /> {error}
                    </div>
                  )}
                  <footer className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#dbe5ee] pt-5">
                    <p className="max-w-xl text-[11px] leading-5 text-slate-500">Click below to begin or resume your saved attempt in a new tab. Allow pop-ups for this site. Five recorded activity violations permanently void the exam. Reapplication is allowed after six months; an email with an existing record cannot register again. Your original timer continues even after closing the browser.</p>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#ff5c28] px-5 text-xs font-extrabold text-white transition hover:bg-[#e44b20] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff5c28] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting ? 'Checking assessment…' : 'Start or continue assessment'}
                      <ArrowRight size={15} aria-hidden="true" />
                    </button>
                  </footer>
                </form>
          </div>
        </section>
      </div>
    </main>
  );
}

// Also enforce at the page boundary if a custom route mounts this page without
// the shared public assessment router guard.
export default function PublicCsrFitRegistrationPage() {
  return <PublicAssessmentDesktopOnly><PublicCsrFitRegistrationPageContent /></PublicAssessmentDesktopOnly>;
}
