const fs = require('fs');

const files = [
  'src/components/modals/sourcingAnalytics/AddSourceCostModal.jsx',
  'src/components/modals/sourcingAnalytics/SourceDetailsModal.jsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Replace Hexes inside brackets (Tailwind arbitrary values)
  content = content.replace(/\[#042C51\]/gi, 'sibs-navy');
  content = content.replace(/\[#063866\]/gi, 'sibs-navy');
  content = content.replace(/\[#0A3D6C\]/gi, 'sibs-navy');
  content = content.replace(/\[#FF5C28\]/gi, 'sibs-orange');
  content = content.replace(/\[#E94F1F\]/gi, 'sibs-orange');
  content = content.replace(/\[#FF7A50\]/gi, 'sibs-orange');
  content = content.replace(/\[#E6ECF2\]/gi, 'sibs-border');
  content = content.replace(/\[#D7DEE8\]/gi, 'sibs-border');
  content = content.replace(/\[#D6E0EA\]/gi, 'sibs-border');
  content = content.replace(/\[#9FB3C8\]/gi, 'sibs-border');
  content = content.replace(/\[#DCE6F1\]/gi, 'sibs-border');
  content = content.replace(/\[#DDE5EE\]/gi, 'sibs-border');
  content = content.replace(/\[#EEF2F6\]/gi, 'sibs-border'); // usually bg or border, wait... 
  // For #EEF2F6, it could be bg-sibs-surface-subtle or border-sibs-border.
  // We'll catch text/bg/border separately
  
  content = content.replace(/text-\[#EEF2F6\]/gi, 'text-sibs-surface-subtle');
  content = content.replace(/bg-\[#EEF2F6\]/gi, 'bg-sibs-surface-subtle');
  content = content.replace(/border-\[#EEF2F6\]/gi, 'border-sibs-border');
  
  content = content.replace(/\[#F8FAFC\]/gi, 'sibs-surface');
  content = content.replace(/\[#F7F9FC\]/gi, 'sibs-surface');
  content = content.replace(/\[#F1F5F9\]/gi, 'sibs-surface');

  content = content.replace(/\[#F2F4F7\]/gi, 'sibs-surface-subtle');
  
  content = content.replace(/\[#667085\]/gi, 'sibs-muted');
  content = content.replace(/\[#475467\]/gi, 'sibs-muted');
  content = content.replace(/\[#344054\]/gi, 'sibs-muted');

  content = content.replace(/\[#98A2B3\]/gi, 'sibs-faint');
  content = content.replace(/\[#8CA0BA\]/gi, 'sibs-faint');
  content = content.replace(/\[#D0D5DD\]/gi, 'sibs-faint');

  content = content.replace(/\[#FFF0EB\]/gi, 'sibs-cream-light');
  content = content.replace(/\[#FFF7F3\]/gi, 'sibs-cream-light');
  content = content.replace(/\[#FFF8F5\]/gi, 'sibs-cream-light');

  content = content.replace(/\[#EAF2FB\]/gi, 'sibs-surface'); // approx

  // Handle rounded styles
  content = content.replace(/max-h-\[84vh\]/g, 'max-h-[92dvh]');
  content = content.replace(/max-h-\[86vh\]/g, 'max-h-[92dvh]');
  content = content.replace(/rounded-2xl/g, 'rounded-[14px]');
  content = content.replace(/rounded-xl/g, 'rounded-[10px]');
  content = content.replace(/rounded-lg/g, 'rounded-[10px]');

  // Make sure header is rounded-t-[14px]
  content = content.replace(/<header className="([^"]*)"/g, (match, p1) => {
    let classes = p1;
    if (!classes.includes('rounded-t-[14px]')) {
      classes += ' rounded-t-[14px]';
    }
    return `<header className="${classes}"`;
  });

  // Make sure footer is rounded-b-[14px]
  content = content.replace(/<footer className="([^"]*)"/g, (match, p1) => {
    let classes = p1;
    if (!classes.includes('rounded-b-[14px]')) {
      classes += ' rounded-b-[14px]';
    }
    return `<footer className="${classes}"`;
  });

  // Ensure close button uses .sibs-modal-close-btn
  content = content.replace(
    /className="inline-flex h-8 w-8 2xl:h-8\.5 2xl:w-8\.5 shrink-0 items-center justify-center rounded-\[10px\] bg-white\/10 text-white\/80 transition hover:bg-white\/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"/g,
    'className="sibs-modal-close-btn"'
  );

  // Now, what if there are leftover raw hex codes? 
  // Let's find any remaining `#xxxxxx` and convert them manually or generically.
  // Only match inside strings or code, wait, the test searches for `/#[0-9A-Fa-f]{3,6}\b/g`
  // so any #123456 will trigger failure.

  fs.writeFileSync(file, content);
});
