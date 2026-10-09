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

  // Any remaining tailwind arbitrary classes
  content = content.replace(/ring-\[#FF5C28\]/g, 'ring-sibs-orange');
  content = content.replace(/ring-\[#E94F1F\]/g, 'ring-sibs-orange');
  content = content.replace(/ring-\[#042C51\]/g, 'ring-sibs-navy');
  content = content.replace(/text-\[#042C51\]/g, 'text-sibs-navy');
  content = content.replace(/text-\[#FF5C28\]/g, 'text-sibs-orange');

  // Variables with fallbacks - remove the fallbacks to satisfy the 0 raw hex rule
  content = content.replace(/, #[0-9A-Fa-f]{3,6}\)/g, ')');
  
  // Any other var fallbacks if without space
  content = content.replace(/,#[0-9A-Fa-f]{3,6}\)/g, ')');

  // I previously replaced "#042C51" with "var(--sibs-navy, #042C51)". Since I removed the fallback above, it becomes "var(--sibs-navy)". 
  // Just to be safe, I'll also do direct replacement for any straggling hexes.
  const hexToVar = {
    '#042C51': 'var(--sibs-navy)',
    '#FF5C28': 'var(--sibs-orange)',
    '#E94F1F': 'var(--sibs-orange)',
    '#E6ECF2': 'var(--sibs-border)',
    '#D7DEE8': 'var(--sibs-border)',
    '#D6E0EA': 'var(--sibs-border)',
    '#EEF2F6': 'var(--sibs-border)',
    '#F8FAFC': 'var(--sibs-surface)',
    '#F7F9FC': 'var(--sibs-surface)',
    '#F2F4F7': 'var(--sibs-surface-subtle)',
    '#667085': 'var(--sibs-muted)',
    '#475467': 'var(--sibs-muted)',
    '#98A2B3': 'var(--sibs-faint)',
    '#8CA0BA': 'var(--sibs-faint)',
    '#EAF2FB': 'var(--sibs-blue-50)',
    '#E9F0FC': 'var(--sibs-blue-50)'
  };

  for (const [hex, cssVar] of Object.entries(hexToVar)) {
    // If it's a string literal like "#D7DEE8", it becomes "var(--sibs-border)"
    const regex = new RegExp(`"${hex}"`, 'gi');
    content = content.replace(regex, `"${cssVar}"`);
    
    const regex2 = new RegExp(`'${hex}'`, 'gi');
    content = content.replace(regex2, `'${cssVar}'`);
  }

  // Fallback for random remaining arbitrary properties like `fill-[#042C51]` which wasn't replaced
  content = content.replace(/fill-\[#042C51\]/g, 'fill-sibs-navy');
  content = content.replace(/fill-\[#FF5C28\]/g, 'fill-sibs-orange');
  content = content.replace(/stroke-\[#042C51\]/g, 'stroke-sibs-navy');
  content = content.replace(/stroke-\[#FF5C28\]/g, 'stroke-sibs-orange');

  fs.writeFileSync(f, content);
});
