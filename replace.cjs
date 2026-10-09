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

  // Catch any remaining random ones inside string templates or other
  // e.g., text-[#98A2B3] might be replaced by text-sibs-faint if brackets were handled. 
  // Our regex replaces the bracket content. Wait, `text-[#042C51]` becomes `text-sibs-navy`. 
  // Wait, `\[#042C51\]` replaced by `sibs-navy` means `text-[#042C51]` becomes `text-sibs-navy`. That is correct!

  // Now replace any remaining hexes in code strings (not tailwind classes).
  // E.g. <span className="text-[#98A2B3]">
  // Wait, what if there's just "#042C51"? The regex `/#042C51/gi` will catch it.
  content = content.replace(/#042C51/gi, 'sibs-navy');
  content = content.replace(/#063866/gi, 'sibs-navy');
  content = content.replace(/#0A3D6C/gi, 'sibs-navy');
  content = content.replace(/#FF5C28/gi, 'sibs-orange');
  content = content.replace(/#E94F1F/gi, 'sibs-orange');
  content = content.replace(/#FF7A50/gi, 'sibs-orange');
  content = content.replace(/#E6ECF2/gi, 'sibs-border');
  content = content.replace(/#D7DEE8/gi, 'sibs-border');
  content = content.replace(/#D6E0EA/gi, 'sibs-border');
  content = content.replace(/#9FB3C8/gi, 'sibs-border');
  content = content.replace(/#DCE6F1/gi, 'sibs-border');
  content = content.replace(/#DDE5EE/gi, 'sibs-border');
  content = content.replace(/#EEF2F6/gi, 'sibs-border');
  content = content.replace(/#F8FAFC/gi, 'sibs-surface');
  content = content.replace(/#F7F9FC/gi, 'sibs-surface');
  content = content.replace(/#F1F5F9/gi, 'sibs-surface');
  content = content.replace(/#F2F4F7/gi, 'sibs-surface-subtle');
  content = content.replace(/#667085/gi, 'sibs-muted');
  content = content.replace(/#475467/gi, 'sibs-muted');
  content = content.replace(/#344054/gi, 'sibs-muted');
  content = content.replace(/#98A2B3/gi, 'sibs-faint');
  content = content.replace(/#8CA0BA/gi, 'sibs-faint');
  content = content.replace(/#D0D5DD/gi, 'sibs-faint');
  content = content.replace(/#FFF0EB/gi, 'sibs-cream-light');
  content = content.replace(/#FFF7F3/gi, 'sibs-cream-light');
  content = content.replace(/#FFF8F5/gi, 'sibs-cream-light');
  content = content.replace(/#EAF2FB/gi, 'sibs-surface');

  // After the above, text-[sibs-navy] might happen. 
  // Let's fix text-[sibs-navy] to text-sibs-navy
  content = content.replace(/-\[sibs-/g, '-sibs-');
  content = content.replace(/sibs-navy\]/g, 'sibs-navy');
  content = content.replace(/sibs-orange\]/g, 'sibs-orange');
  content = content.replace(/sibs-border\]/g, 'sibs-border');
  content = content.replace(/sibs-surface\]/g, 'sibs-surface');
  content = content.replace(/sibs-surface-subtle\]/g, 'sibs-surface-subtle');
  content = content.replace(/sibs-muted\]/g, 'sibs-muted');
  content = content.replace(/sibs-faint\]/g, 'sibs-faint');
  content = content.replace(/sibs-cream-light\]/g, 'sibs-cream-light');

  // Handle rounded shells
  content = content.replace(/max-h-\[84vh\]/g, 'max-h-[92dvh]');
  content = content.replace(/max-h-\[86vh\]/g, 'max-h-[90dvh]');
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
  
  // also handle "inline-flex h-8 w-8 2xl:h-8.5 2xl:w-8.5 shrink-0 items-center justify-center rounded-[10px] bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
  
  fs.writeFileSync(file, content);
});
