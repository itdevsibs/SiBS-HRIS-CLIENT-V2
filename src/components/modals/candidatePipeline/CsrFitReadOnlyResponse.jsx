import {
  CheckCircle2, ClipboardList, FileText, FolderOpen, Headphones,
  Keyboard, ListChecks, MoveRight, Pencil, UserRound,
} from 'lucide-react';

/** Human-readable, read-only renderers for submitted practical assessment records.
 * Do not display internal event JSON, bank grading keys, or editable controls.
 */
const FIELD_LABELS = {
  filename: 'Saved filename', folder: 'Destination folder', customerName: 'Customer full name',
  accountNumber: 'Account number', callbackNumber: 'Callback phone number',
  category: 'Issue category', notes: 'Interaction notes', product: 'Product / service affected',
  issue: 'Reported issue', action: 'Customer requested action', text: 'Typed passage',
};

function labelFor(field) {
  return FIELD_LABELS[field] || String(field).replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ').replace(/^./, (letter) => letter.toUpperCase());
}

function printable(value) {
  if (value === null || value === undefined || value === '') return 'Not provided';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'string') return /^[A-E]$/.test(value) ? `Option ${value}` : value;
  return String(value);
}

function ReadOnlyField({ label, value, wide = false }) {
  return (
    <div className={`min-w-0 rounded-lg border border-sibs-border bg-white px-3.5 py-3 ${wide ? 'sm:col-span-2' : ''}`}>
      <dt className="text-[10px] font-extrabold uppercase tracking-wide text-sibs-muted">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap break-words text-xs font-semibold leading-5 text-sibs-navy">
        {printable(value)}
      </dd>
    </div>
  );
}

function ReadOnlyFields({ fields }) {
  return (
    <dl className="grid gap-2.5 sm:grid-cols-2">
      {fields.map(({ key, label, value, wide }) => (
        <ReadOnlyField key={key} label={label} value={value} wide={wide} />
      ))}
    </dl>
  );
}

function EventHistory({ actions }) {
  if (!Array.isArray(actions) || !actions.length) return null;
  const meaningful = actions.filter((action) => action && typeof action === 'object' &&
    ['rename', 'move', 'open_request'].includes(action.type));
  if (!meaningful.length) return null;
  return (
    <div className="mt-3 rounded-lg border border-sibs-border bg-white px-3.5 py-3">
      <p className="flex items-center gap-2 text-xs font-extrabold text-sibs-navy">
        <ListChecks size={15} aria-hidden="true" /> Recorded task actions
      </p>
      <ol className="mt-2 space-y-2">
        {meaningful.map((action, index) => {
          const description = action.type === 'rename'
            ? `Renamed file to ${printable(action.filename)}`
            : action.type === 'move' ? `Moved file to ${printable(action.folder)}`
              : 'Opened customer request in the simulated inbox';
          const Icon = action.type === 'rename' ? Pencil : action.type === 'move' ? MoveRight : ClipboardList;
          return (
            <li key={`${action.type}-${index}`} className="flex items-start gap-2.5 text-xs leading-5 text-sibs-secondary">
              <span className="mt-0.5 shrink-0 rounded-md bg-blue-50 p-1.5 text-sibs-navy">
                <Icon size={13} aria-hidden="true" />
              </span>
              <span className="min-w-0 break-words">{description}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function GenericFields({ response }) {
  const fields = Object.entries(response).filter(([key, value]) =>
    !['simulation', 'startedAtMs', 'version'].includes(key) && value !== undefined);
  if (!fields.length) return <p className="text-xs text-sibs-muted">No saved detail fields were returned.</p>;
  return (
    <div className="space-y-2.5">
      {fields.map(([key, value]) => {
        if (Array.isArray(value)) {
          return <div key={key} className="rounded-lg border border-sibs-border bg-white p-3">
            <p className="text-[10px] font-extrabold uppercase text-sibs-muted">{labelFor(key)}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">{value.length ? value.map((v, i) => (
              <span key={i} className="rounded-md border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-bold text-sibs-navy">
                {typeof v === 'object' && v !== null ? 'Recorded item' : printable(v)}
              </span>
            )) : <span className="text-xs text-sibs-muted">None recorded</span>}</div>
          </div>;
        }
        if (value && typeof value === 'object') {
          return <div key={key} className="rounded-lg border border-sibs-border bg-white p-3">
            <p className="mb-2 text-[10px] font-extrabold uppercase text-sibs-muted">{labelFor(key)}</p>
            <ReadOnlyFields fields={Object.entries(value).filter(([nested]) => nested !== 'version')
              .map(([nested, nestedValue]) => ({key:nested,label:labelFor(nested),value:typeof nestedValue === 'object' ? 'Recorded' : nestedValue}))}/>
          </div>;
        }
        return <ReadOnlyField key={key} label={labelFor(key)} value={value} wide={key==='notes'||key==='text'} />;
      })}
    </div>
  );
}

export default function CsrFitReadOnlyResponse({ module, question, typingMetrics }) {
  const response = question?.recordedResponse;
  if (response === undefined || response === null) return null;

  if (module === 'module3' && Array.isArray(response)) {
    return <div className="mt-3 rounded-xl border border-sibs-border bg-sibs-surface p-3.5">
      <p className="flex items-center gap-2 text-xs font-extrabold text-sibs-navy"><CheckCircle2 size={15} /> Selected responses</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {response.length ? response.map((item, index) => <span key={`${item}-${index}`}
          className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-sibs-navy">Option {printable(item).replace(/^Option /, '')}</span>)
          : <span className="text-xs text-sibs-muted">None recorded</span>}
      </div>
    </div>;
  }

  if (typeof response !== 'object' || Array.isArray(response)) {
    return <div className="mt-3 rounded-xl border border-sibs-border bg-sibs-surface p-3.5">
      <p className="text-[10px] font-extrabold uppercase text-sibs-muted">Saved candidate response · Read only</p>
      <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-sibs-navy">
        {Array.isArray(response) ? response.map(printable).join(', ') : printable(response)}
      </p>
    </div>;
  }

  if (module === 'module4' && question.number === 1) {
    return <section aria-label="Saved file management task" className="mt-3 rounded-xl border border-sibs-border bg-sibs-surface p-3.5">
      <h5 className="mb-3 flex items-center gap-2 text-xs font-extrabold text-sibs-navy"><FolderOpen size={16} /> File management result <span className="ml-auto rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] text-emerald-700">Read only</span></h5>
      <ReadOnlyFields fields={[
        {key:'filename',label:'Saved filename',value:response.filename},
        {key:'folder',label:'Destination folder',value:response.folder},
      ]}/>
      <EventHistory actions={response.simulation?.actions}/>
    </section>;
  }

  if (module === 'module4' && question.number === 2) {
    return <section aria-label="Saved customer case entry" className="mt-3 rounded-xl border border-sibs-border bg-sibs-surface p-3.5">
      <h5 className="mb-3 flex items-center gap-2 text-xs font-extrabold text-sibs-navy"><UserRound size={16} /> Customer case record <span className="ml-auto rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] text-emerald-700">Read only</span></h5>
      <ReadOnlyFields fields={[
        {key:'customerName',label:'Customer full name',value:response.customerName},
        {key:'accountNumber',label:'Account number',value:response.accountNumber},
        {key:'callbackNumber',label:'Callback phone number',value:response.callbackNumber},
        {key:'category',label:'Issue category',value:response.category},
        {key:'notes',label:'Interaction notes',value:response.notes,wide:true},
      ]}/>
      <EventHistory actions={response.simulation?.actions}/>
    </section>;
  }

  if (module === 'module5') {
    const metric = Array.isArray(typingMetrics) ? typingMetrics[question.number - 1] : null;
    return <section aria-label="Saved typing test response" className="mt-3 rounded-xl border border-sibs-border bg-sibs-surface p-3.5">
      <h5 className="mb-3 flex items-center gap-2 text-xs font-extrabold text-sibs-navy"><Keyboard size={16}/> Saved typing passage <span className="ml-auto text-[10px] font-bold text-sibs-muted">Read only</span></h5>
      {metric && <div className="mb-3 grid gap-2 sm:grid-cols-2">
        <ReadOnlyField label="Typing speed" value={metric.wpm == null ? 'Not recorded' : `${metric.wpm} WPM`}/>
        <ReadOnlyField label="Accuracy" value={metric.accuracy == null ? 'Not recorded' : `${metric.accuracy}%`}/>
      </div>}
      <div className="rounded-lg border border-sibs-border bg-white px-3.5 py-3">
        <p className="mb-1 text-[10px] font-extrabold uppercase text-sibs-muted">Text entered by candidate</p>
        <p className="whitespace-pre-wrap break-words text-xs leading-6 text-sibs-navy">{printable(response.text)}</p>
      </div>
    </section>;
  }

  if (module === 'module6') {
    const entries = ['customerName','accountNumber','callbackNumber','product','issue','action']
      .filter(key => Object.prototype.hasOwnProperty.call(response,key))
      .map(key => ({key,label:labelFor(key),value:response[key]}));
    return <section aria-label="Saved voicemail logging response" className="mt-3 rounded-xl border border-sibs-border bg-sibs-surface p-3.5">
      <h5 className="mb-3 flex items-center gap-2 text-xs font-extrabold text-sibs-navy"><Headphones size={16}/> Voicemail logging result <span className="ml-auto text-[10px] font-bold text-sibs-muted">Read only</span></h5>
      <ReadOnlyFields fields={entries}/>
    </section>;
  }

  return <section className="mt-3 rounded-xl border border-sibs-border bg-sibs-surface p-3.5">
    <h5 className="mb-3 flex items-center gap-2 text-xs font-extrabold text-sibs-navy"><FileText size={15}/> Saved candidate response <span className="ml-auto text-[10px] font-bold text-sibs-muted">Read only</span></h5>
    <GenericFields response={response}/>
  </section>;
}
