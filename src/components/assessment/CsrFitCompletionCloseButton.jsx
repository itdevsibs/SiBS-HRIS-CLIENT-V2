import { useState } from 'react';
import { X } from 'lucide-react';

export default function CsrFitCompletionCloseButton({ status = 'SUBMITTED' }) {
  const [closeRequested, setCloseRequested] = useState(false);

  function closePage() {
    // Browsers may refuse to close tabs that were not opened by script.
    // Public assessments can leave the exam even when the browser denies closing.
    setCloseRequested(true);
    try {
      window.close();
    } catch {
      // The manual-close instructions below remain available.
    }

  }

  return <div className="mt-6">
    <button type="button" onClick={closePage}
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-sibs-orange px-5 py-2.5 text-xs font-extrabold text-white transition hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sibs-orange">
      <X size={16} aria-hidden="true"/> Close Page
    </button>
    {closeRequested && <p role="status" className="mt-3 text-xs leading-relaxed text-sibs-muted">
      {status === 'VOID' ? 'Your assessment is void and remains locked.' : 'Your assessment is submitted.'} If the tab stays open, use Ctrl+W (Windows) or Command+W (Mac) to close it.
    </p>}
  </div>;
}
