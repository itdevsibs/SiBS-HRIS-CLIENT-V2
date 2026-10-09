const fs = require('fs');
const path = require('path');

const files = [
  'src/components/modals/workforceHiringPlan/ViewPlanModal.jsx',
  'src/components/recruitment/workforceHiringPlan/AIInsightModal.jsx',
  'src/components/modals/workforceHiringPlan/KPISnapshotModal.jsx',
  'src/components/modals/workforceHiringPlan/ActionItemModal.jsx',
  'src/components/tables/WorkforceHiringPlan/PercentageRiskGraphTable.jsx',
  'src/components/tables/WorkforceHiringPlan/WeeklyVersionTable.jsx',
  'src/components/tables/WorkforceHiringPlan/WorkforceHiringAccountsTable.jsx'
];

const colorMap = {
  // Navy
  '#042C51': 'sibs-navy',
  '#0B315F': 'sibs-navy',
  '#0A3C6B': 'sibs-navy',
  '#174A7C': 'sibs-navy',
  '#19496F': 'sibs-navy',
  
  // Orange
  '#FF5C28': 'sibs-orange',
  '#E94F1F': 'sibs-orange',
  '#F47C0B': 'sibs-orange',
  
  // Border
  '#E6ECF2': 'sibs-border',
  '#D7DEE8': 'sibs-border',
  '#D6DEE8': 'sibs-border',
  '#D0D5DD': 'sibs-border',
  '#E8DAC3': 'sibs-border',
  '#D8EEF4': 'sibs-border',
  '#C8E3EE': 'sibs-border',
  '#E9EEF5': 'sibs-border',
  '#E1E7EF': 'sibs-border',
  '#D9E2EC': 'sibs-border',
  '#DDE7F2': 'sibs-border',
  
  // Surface
  '#F8FAFC': 'sibs-surface',
  '#F7F9FC': 'sibs-surface',
  '#F5F7FA': 'sibs-surface',
  '#FAFBFC': 'sibs-surface',
  
  // Surface Subtle
  '#F2F4F7': 'sibs-surface-subtle',
  '#EEF2F6': 'sibs-surface-subtle',
  '#F5EFE5': 'sibs-surface-subtle',
  '#EDF1F5': 'sibs-surface-subtle',
  '#F2F6FA': 'sibs-surface-subtle',
  
  // Muted
  '#667085': 'sibs-muted',
  '#475467': 'sibs-muted',
  '#344054': 'sibs-muted',
  '#101828': 'sibs-muted',
  
  // Faint
  '#98A2B3': 'sibs-faint',
  '#8CA0BA': 'sibs-faint',
  '#A7B4C4': 'sibs-faint',
  '#64748B': 'sibs-faint',
  
  // Blue
  '#EAF2FB': 'blue-50',
  '#E9F0FC': 'blue-50',
  '#155EEF': 'blue-600',
  '#1F5FDA': 'blue-600',
  
  // Others based on test failures
  '#6A48A8': 'purple-600',
  '#078C96': 'teal-600',
  '#4B9229': 'green-600',
  '#DC2626': 'red-600',
  '#6938EF': 'indigo-600',
  '#FFF8F5': 'orange-50',
  '#FFF0EB': 'orange-50',
  '#FFF7F3': 'orange-50'
};

const regexClassColor = /([a-z]+)-\[\s*(#[0-9a-fA-F]{3,8})\s*\]/g;
const regexArbitraryHex = /#[0-9a-fA-F]{3,8}/gi;

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace colors in classNames like text-[#...] or bg-[#...]
  content = content.replace(regexClassColor, (match, prefix, hexCode) => {
    const upperHex = hexCode.toUpperCase();
    if (colorMap[upperHex]) {
      return `${prefix}-${colorMap[upperHex]}`;
    }
    // Also try matching 6 character versions if 8 characters
    if (upperHex.length === 9) { // #RRGGBBAA
      const rgb = upperHex.substring(0, 7);
      if (colorMap[rgb]) {
        return `${prefix}-${colorMap[rgb]}/40`; // Fallback approximation if there's alpha
      }
    }
    return match;
  });

  // Then replace any remaining raw string hexes
  content = content.replace(regexArbitraryHex, (match) => {
    const upperHex = match.toUpperCase();
    if (colorMap[upperHex]) {
      return `var(--${colorMap[upperHex]})`; 
    }
    return match;
  });

  // Modal specific replacements
  if (file.includes('Modal')) {
    // Modal Shell
    content = content.replace(/rounded-lg|rounded-xl|rounded-2xl|rounded-md/g, 'rounded-[14px]');
    content = content.replace(/max-h-\[.*?\]/g, 'max-h-[92dvh]');
    
    // Header
    // Let's just find headers. Typically they have flex items-center justify-between border-b etc.
    content = content.replace(/bg-white border-b border-sibs-border|bg-white border-b border-\[\#.*?\]/g, 'bg-sibs-navy rounded-t-[14px] text-white border-b-0');
    
    // Close btn
    content = content.replace(/(<button[^>]*?)text-sibs-muted([^>]*?>\s*<[A-Za-z]+[^>]*?X[^>]*?>|<[A-Za-z]+[^>]*?Close[^>]*?>|<X[^>]*?>)/g, '$1 text-white sibs-modal-close-btn $2');
    content = content.replace(/(<button[^>]*onClick=\{[^}]*(?:close|Close)[^}]*\}[^>]*className=")([^"]*)(")/g, (match, p1, p2, p3) => {
      if (!p2.includes('sibs-modal-close-btn')) {
        return `${p1}${p2} sibs-modal-close-btn${p3}`;
      }
      return match;
    });
  }

  // Radii standardizations
  content = content.replace(/rounded-md|rounded-lg/g, 'rounded-[10px]');
  // Make sure to not mess up modal rounded-[14px]
  content = content.replace(/rounded-\[10px\]/g, 'rounded-[10px]');
  
  if (file.includes('Table') || file.includes('Graph')) {
    // Wrapper radii
    content = content.replace(/rounded-xl|rounded-2xl/g, 'rounded-[14px]');
  }

  // Re-read and write
  fs.writeFileSync(filePath, content, 'utf8');
});

console.log("Replacements complete");
