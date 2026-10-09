import fs from 'fs';

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

  // Hexes - Classes. Need correct escaping for regex literals: \[
  content = content.replace(/text-\[#042C51\]/g, 'text-sibs-navy');
  content = content.replace(/bg-\[#042C51\]/g, 'bg-sibs-navy');
  content = content.replace(/border-\[#042C51\]/g, 'border-sibs-navy');

  content = content.replace(/text-\[#FF5C28\]/g, 'text-sibs-orange');
  content = content.replace(/text-\[#E94F1F\]/g, 'text-sibs-orange');
  content = content.replace(/bg-\[#FF5C28\]/g, 'bg-sibs-orange');
  content = content.replace(/bg-\[#E94F1F\]/g, 'bg-sibs-orange');
  content = content.replace(/border-\[#FF5C28\]/g, 'border-sibs-orange');
  content = content.replace(/border-\[#E94F1F\]/g, 'border-sibs-orange');
  
  content = content.replace(/border-\[#E6ECF2\]/g, 'border-sibs-border');
  content = content.replace(/border-\[#D7DEE8\]/g, 'border-sibs-border');
  content = content.replace(/border-\[#D6E0EA\]/g, 'border-sibs-border');
  content = content.replace(/border-\[#EEF2F6\]/g, 'border-sibs-border');
  
  content = content.replace(/divide-\[#E6ECF2\]/g, 'divide-sibs-border');
  content = content.replace(/divide-\[#D7DEE8\]/g, 'divide-sibs-border');
  
  content = content.replace(/bg-\[#F8FAFC\]/g, 'bg-sibs-surface');
  content = content.replace(/bg-\[#F7F9FC\]/g, 'bg-sibs-surface');
  
  content = content.replace(/bg-\[#F2F4F7\]/g, 'bg-sibs-surface-subtle');
  content = content.replace(/bg-\[#EEF2F6\]/g, 'bg-sibs-surface-subtle');
  
  content = content.replace(/text-\[#667085\]/g, 'text-sibs-muted');
  content = content.replace(/text-\[#475467\]/g, 'text-sibs-muted');
  
  content = content.replace(/text-\[#98A2B3\]/g, 'text-sibs-faint');
  content = content.replace(/text-\[#8CA0BA\]/g, 'text-sibs-faint');
  
  content = content.replace(/bg-\[#EAF2FB\]/g, 'bg-blue-50');
  content = content.replace(/bg-\[#E9F0FC\]/g, 'bg-blue-50');

  // Chart ones
  content = content.replace(/"#042C51"/gi, '"var(--sibs-navy, #042C51)"');
  content = content.replace(/'#042C51'/gi, "'var(--sibs-navy, #042C51)'");

  fs.writeFileSync(f, content);
});
