const fs = require('fs');

const files = [
  'src/pages/recruitment/SourcingAnalyticsPage.jsx',
  'src/components/recruitment/sourcingAnalytics/SourcingAnalyticsCharts.jsx',
  'src/components/recruitment/sourcingAnalytics/SourcingAnalyticsTable.jsx',
  'src/components/recruitment/sourcingAnalytics/SourcingAnalyticsMobileCard.jsx',
  'src/components/recruitment/sourcingAnalytics/SourcingSummaryCards.jsx',
  'src/components/recruitment/sourcingAnalytics/SourcingAnalyticsFilters.jsx'
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');

  // Hexes - Classes
  content = content.replace(/text-\\[#042C51\\]/g, 'text-sibs-navy');
  content = content.replace(/bg-\\[#042C51\\]/g, 'bg-sibs-navy');
  content = content.replace(/border-\\[#042C51\\]/g, 'border-sibs-navy');

  content = content.replace(/text-\\[#FF5C28\\]/g, 'text-sibs-orange');
  content = content.replace(/text-\\[#E94F1F\\]/g, 'text-sibs-orange');
  content = content.replace(/bg-\\[#FF5C28\\]/g, 'bg-sibs-orange');
  content = content.replace(/bg-\\[#E94F1F\\]/g, 'bg-sibs-orange');
  content = content.replace(/border-\\[#FF5C28\\]/g, 'border-sibs-orange');
  content = content.replace(/border-\\[#E94F1F\\]/g, 'border-sibs-orange');
  
  content = content.replace(/border-\\[#E6ECF2\\]/g, 'border-sibs-border');
  content = content.replace(/border-\\[#D7DEE8\\]/g, 'border-sibs-border');
  content = content.replace(/border-\\[#D6E0EA\\]/g, 'border-sibs-border');
  content = content.replace(/border-\\[#EEF2F6\\]/g, 'border-sibs-border');
  
  content = content.replace(/divide-\\[#E6ECF2\\]/g, 'divide-sibs-border');
  content = content.replace(/divide-\\[#D7DEE8\\]/g, 'divide-sibs-border');
  
  content = content.replace(/bg-\\[#F8FAFC\\]/g, 'bg-sibs-surface');
  content = content.replace(/bg-\\[#F7F9FC\\]/g, 'bg-sibs-surface');
  
  content = content.replace(/bg-\\[#F2F4F7\\]/g, 'bg-sibs-surface-subtle');
  content = content.replace(/bg-\\[#EEF2F6\\]/g, 'bg-sibs-surface-subtle');
  
  content = content.replace(/text-\\[#667085\\]/g, 'text-sibs-muted');
  content = content.replace(/text-\\[#475467\\]/g, 'text-sibs-muted');
  
  content = content.replace(/text-\\[#98A2B3\\]/g, 'text-sibs-faint');
  content = content.replace(/text-\\[#8CA0BA\\]/g, 'text-sibs-faint');
  
  content = content.replace(/bg-\\[#EAF2FB\\]/g, 'bg-blue-50');
  content = content.replace(/bg-\\[#E9F0FC\\]/g, 'bg-blue-50');

  // Raw hexes for inline SVG or charts
  // #D7DEE8 to currentColor/var depending on context
  content = content.replace(/"#042C51"/gi, '"var(--sibs-navy, #042C51)"');
  content = content.replace(/'#042C51'/gi, "'var(--sibs-navy, #042C51)'");

  content = content.replace(/"#FF5C28"/gi, '"var(--sibs-orange, #FF5C28)"');
  content = content.replace(/'#FF5C28'/gi, "'var(--sibs-orange, #FF5C28)'");

  content = content.replace(/"#E94F1F"/gi, '"var(--sibs-orange, #E94F1F)"');
  content = content.replace(/'#E94F1F'/gi, "'var(--sibs-orange, #E94F1F)'");

  content = content.replace(/"#E6ECF2"/gi, '"var(--sibs-border, #E6ECF2)"');
  content = content.replace(/'#E6ECF2'/gi, "'var(--sibs-border, #E6ECF2)'");

  content = content.replace(/"#D7DEE8"/gi, '"var(--sibs-border, #D7DEE8)"');
  content = content.replace(/'#D7DEE8'/gi, "'var(--sibs-border, #D7DEE8)'");

  content = content.replace(/"#D6E0EA"/gi, '"var(--sibs-border, #D6E0EA)"');
  content = content.replace(/'#D6E0EA'/gi, "'var(--sibs-border, #D6E0EA)'");

  content = content.replace(/"#EEF2F6"/gi, '"var(--sibs-border, #EEF2F6)"');
  content = content.replace(/'#EEF2F6'/gi, "'var(--sibs-border, #EEF2F6)'");

  content = content.replace(/"#F8FAFC"/gi, '"var(--sibs-surface, #F8FAFC)"');
  content = content.replace(/'#F8FAFC'/gi, "'var(--sibs-surface, #F8FAFC)'");

  content = content.replace(/"#F7F9FC"/gi, '"var(--sibs-surface, #F7F9FC)"');
  content = content.replace(/'#F7F9FC'/gi, "'var(--sibs-surface, #F7F9FC)'");

  content = content.replace(/"#F2F4F7"/gi, '"var(--sibs-surface-subtle, #F2F4F7)"');
  content = content.replace(/'#F2F4F7'/gi, "'var(--sibs-surface-subtle, #F2F4F7)'");

  content = content.replace(/"#667085"/gi, '"var(--sibs-muted, #667085)"');
  content = content.replace(/'#667085'/gi, "'var(--sibs-muted, #667085)'");

  content = content.replace(/"#475467"/gi, '"var(--sibs-muted, #475467)"');
  content = content.replace(/'#475467'/gi, "'var(--sibs-muted, #475467)'");

  content = content.replace(/"#98A2B3"/gi, '"var(--sibs-faint, #98A2B3)"');
  content = content.replace(/'#98A2B3'/gi, "'var(--sibs-faint, #98A2B3)'");

  content = content.replace(/"#8CA0BA"/gi, '"var(--sibs-faint, #8CA0BA)"');
  content = content.replace(/'#8CA0BA'/gi, "'var(--sibs-faint, #8CA0BA)'");

  content = content.replace(/"#EAF2FB"/gi, '"var(--sibs-blue-50, #EAF2FB)"');
  content = content.replace(/'#EAF2FB'/gi, "'var(--sibs-blue-50, #EAF2FB)'");

  // Additional catch: string hexes without quotes but in specific properties? 
  // Wait, if it's `#D7DEE8` directly in code, it's either in quotes or template literal.
  // We handled quoted above.
  
  // Radii
  content = content.replace(/rounded-3xl/g, 'rounded-[14px]');
  content = content.replace(/rounded-2xl/g, 'rounded-[14px]');
  content = content.replace(/rounded-xl/g, 'rounded-[14px]');
  // For filters and controls, it's lg, md, sm
  content = content.replace(/rounded-lg/g, 'rounded-[10px]');
  content = content.replace(/rounded-md/g, 'rounded-[10px]');
  content = content.replace(/rounded-sm/g, 'rounded-[10px]');

  fs.writeFileSync(f, content);
});
