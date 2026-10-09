import fs from 'fs';
import path from 'path';

const FILES_TO_FIX = [
  'src/components/modals/candidateExperience/CandidateExperienceDetailsModal.jsx',
  'src/components/recruitment/candidateExperience/manual/AddExperienceModal.jsx',
  'src/components/recruitment/candidateExperience/details/CandidateContextPanel.jsx',
  'src/components/recruitment/candidateExperience/details/CandidateJourneyTimeline.jsx',
  'src/components/recruitment/candidateExperience/details/CandidateResponsePanel.jsx',
  'src/components/recruitment/candidateExperience/details/SurveyDeliveryPanel.jsx'
];

const COLOR_MAP = {
  '#042C51': 'sibs-navy',
  '#082E55': 'sibs-navy',
  '#FF5C28': 'sibs-orange',
  '#E94F1F': 'sibs-orange',
  '#E6ECF2': 'sibs-border',
  '#D7DEE8': 'sibs-border',
  '#D7E0EA': 'sibs-border',
  '#D8E1EB': 'sibs-border',
  '#DDE5EE': 'sibs-border',
  '#D6DEE8': 'sibs-border',
  '#F8FAFC': 'sibs-surface',
  '#F7F9FC': 'sibs-surface',
  '#F1F5F9': 'sibs-surface',
  '#F3F6F9': 'sibs-surface',
  '#667085': 'sibs-muted',
  '#475467': 'sibs-muted',
  '#274A6B': 'sibs-muted',
  '#526983': 'sibs-muted',
  '#98A2B3': 'sibs-faint',
  '#8CA0BA': 'sibs-faint',
  '#8A98B8': 'sibs-faint',
  '#B3C0D0': 'sibs-faint',
};

const BASE_DIR = 'C:/Users/ralphvincentd/SiBS-HRIS-CLIENT-V2';

function processFile(filePath) {
  const fullPath = path.resolve(BASE_DIR, filePath);
  if (!fs.existsSync(fullPath)) {
      console.log('Not found:', filePath);
      return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');

  // Replace colors in Tailwind classes (e.g. bg-[#042C51] -> bg-sibs-navy)
  for (const [hex, token] of Object.entries(COLOR_MAP)) {
    const exactHexRegex = new RegExp(`\\[${hex}\\]`, 'gi');
    content = content.replace(exactHexRegex, token);
  }

  // Radii replacements
  // Control elements, inputs, buttons, chips, badges -> rounded-[10px]
  content = content.replace(/rounded-(?:lg|xl|2xl|md|sm)/g, 'rounded-[10px]');
  
  if (filePath.includes('Modal')) {
    // Shell radii
    // Usually the outermost shell might have rounded-[10px] now, let's fix it to [14px]
    // Modal Shells: max-h-[92dvh] / max-h-[90dvh], overflow-hidden, rounded-[14px]
    // Let's replace any `max-h-[` container's `rounded-[10px]` with `rounded-[14px]`
    content = content.replace(/(max-w-[\w-]+.*?)(rounded-\[10px\])/gs, '$1rounded-[14px]');
    content = content.replace(/(bg-white.*?)rounded-\[10px\](.*?)shadow-2xl/g, '$1rounded-[14px]$2shadow-2xl');
    content = content.replace(/rounded-\[10px\](.*?)overflow-hidden(.*?)max-w-/gs, 'rounded-[14px]$1overflow-hidden$2max-w-');
    content = content.replace(/rounded-\[10px\](.*?)max-h-/gs, 'rounded-[14px]$1max-h-');
    
    // Header
    content = content.replace(/rounded-t-\[10px\]/g, 'rounded-t-[14px]');
    // Footer
    content = content.replace(/rounded-b-\[10px\]/g, 'rounded-b-[14px]');
    
    // Close button
    content = content.replace(/(<button[^>]*?onClick=\{onClose\}[^>]*?className=")([^"]*)(")/g, (match, p1, p2, p3) => {
        if (!p2.includes('sibs-modal-close-btn')) {
             return `${p1}${p2} sibs-modal-close-btn${p3}`;
        }
        return match;
    });

    content = content.replace(/(<button[^>]*?className=")([^"]*)("[^>]*?>[^<]*?<X)/g, (match, p1, p2, p3) => {
        if (!p2.includes('sibs-modal-close-btn')) {
             return `${p1}${p2} sibs-modal-close-btn${p3}`;
        }
        return match;
    });
  }
  
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Processed', filePath);
}

FILES_TO_FIX.forEach(processFile);
