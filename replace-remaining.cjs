const fs = require('fs');

const files = [
  'src/components/modals/sourcingAnalytics/AddSourceCostModal.jsx',
  'src/components/modals/sourcingAnalytics/SourceDetailsModal.jsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  content = content.replace(/\[#FF855F\]/gi, 'sibs-orange');
  content = content.replace(/#FF855F/gi, 'sibs-orange');

  fs.writeFileSync(file, content);
});
