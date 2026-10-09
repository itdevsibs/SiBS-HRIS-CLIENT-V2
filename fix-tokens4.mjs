import fs from 'fs';

const file = 'src/components/recruitment/sourcingAnalytics/SourcingAnalyticsCharts.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/text-\[#FFB49B\]/g, 'text-orange-300');
content = content.replace(/"#10B981"/g, '"var(--sibs-emerald)"');
content = content.replace(/"#F59E0B"/g, '"var(--sibs-amber)"');
content = content.replace(/'#10B981'/g, "'var(--sibs-emerald)'");
content = content.replace(/'#F59E0B'/g, "'var(--sibs-amber)'");

fs.writeFileSync(file, content);
