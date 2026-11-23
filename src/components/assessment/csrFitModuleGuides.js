// Candidate-facing instructions grounded in the SiBS CSR-Fit test bank (Modules 1-2)
// and SiBS CSR-Fit assessment proposal (Modules 3-7).
// These are display instructions only. The Server remains authoritative for timers,
// question selection, response validation, playback restrictions, and progression.
const guideDefinitions = [
  {
    heading: 'Welcome to Module 1: Cognitive & Logic Abilities',
    welcome: 'Hi! Welcome to Module 1: Cognitive & Logic Abilities.',
    description: 'This assessment measures key factors of general cognitive capability, including logical reasoning, numerical and mathematical skills, verbal and language comprehension, spatial relations, and novel problem-solving ability.',
    note: 'Please note that this module evaluates analytical and intellectual potential rather than emotional intelligence.',
    format: '70 multiple-choice questions',
    sections: [{
      title: 'Candidate Instructions & Rules',
      items: [
        { label: 'Time Limit', text: 'This test is designed to measure your analytical potential rather than your speed under pressure. Candidates typically complete all {moduleOneCount} items within 50 to 60 minutes. You have up to 60 minutes in this online module; follow the live countdown.' },
        { label: 'Allowed Tools', text: 'You may use a standard calculator, scratch paper, and a pencil to work through calculations and spatial diagrams.' },
        { label: 'Prohibited Tools', text: 'Do not use external software, automated solvers, artificial intelligence, or search engines.' },
        { label: 'Work Independently', text: 'You must complete this assessment alone without assistance from other individuals.' },
        { label: 'Answer Every Question', text: 'Read each question carefully and select the single best response from the choices provided. Questions are randomized and cannot be skipped.' },
      ],
    }],
    example: {
      prompt: 'Practice only: What number comes next? 2, 4, 6, 8, ___',
      choices: [
        { key: 'A', text: '10' }, { key: 'B', text: '12' },
        { key: 'C', text: '16' }, { key: 'D', text: '20' },
      ],
      note: 'This example is not part of your assessment.',
    },
  },
  {
    heading: 'Welcome to Work Attitudes, Habits & Behavioral-Cognitive Abilities',
    welcome: 'Hi! Welcome to the Work Attitudes, Habits & Behavioral-Cognitive Abilities evaluation module.',
    description: 'This assessment is designed to measure key competencies that predict success in a fast-paced customer service environment. It evaluates your everyday work style, organizational habits, emotional resilience under pressure, and core analytical problem-solving abilities.',
    format: '50 self-assessment and scenario items',
    sections: [
      {
        title: 'Assessment Overview',
        items: [
          { label: 'Total Questions', text: '50 items.' },
          { label: 'Estimated Time', text: 'The test bank estimates 20 to 25 minutes for these 50 items. Follow the module timer shown for your assessment attempt.' },
          { label: 'Format', text: 'Multi-part questionnaire featuring scenarios, self-assessments, and cognitive exercises.' },
          { label: 'Primary Objective', text: 'Measure overall job readiness, logic skills, and workplace communication style.' },
        ],
      },
      {
        title: 'Instructions for Candidates',
        intro: 'Please read each section carefully before submitting your answers.',
        items: [
          { label: 'Scenarios (Situational Judgment)', text: 'Read each scenario and choose the response that best describes how you would most likely react or behave in that situation.' },
          { label: 'Self-Assessment Questions', text: 'Indicate how strongly you agree or how frequently a given statement applies to your daily work habits, communication style, and attitude.' },
          { label: 'Tip for Candidates', text: 'Answer all questions thoughtfully, consistently, and honestly. Take your time on the cognitive exercises, but trust your first instinct on self-assessment items.' },
          { label: 'Answer Every Question', text: 'Complete each required item in sequence. The response scale can change between questions, and questions cannot be skipped.' },
        ],
      },
    ],
    example: {
      prompt: 'Practice only: I review my work before submitting it.',
      choices: [
        { key: 'A', text: 'Always' }, { key: 'B', text: 'Often' },
        { key: 'C', text: 'Sometimes' }, { key: 'D', text: 'Rarely' },
        { key: 'E', text: 'Never' },
      ],
      note: 'There is no correct answer to this practice statement.',
    },
  },
  {
    heading: 'Welcome to Module 3: Real-Time Coaching & Active Listening Challenge',
    welcome: 'Welcome to Module 3!',
    description: 'This practical section evaluates your active listening skills, empathy, and ability to apply real-time supervisory feedback when handling challenging customer scenarios.',
    format: '1 video scenario + 1 multi-select question',
    sections: [
      {
        title: 'Before You Begin',
        items: [
          { label: 'Format', text: '1 video scenario and 1 multiple-selection question.' },
          { label: 'Target Time', text: '3 minutes; maximum module limit is 4 minutes.' },
          { label: 'Hardware Requirement', text: 'Ensure your audio and video playback are working properly before clicking Start.' },
        ],
      },
      {
        title: 'What Is Being Evaluated?',
        items: [
          { label: 'Active Listening', text: 'Catch key details, customer sentiment, and core guidance from the video.' },
          { label: 'Coaching Adaptability', text: 'Select response options that follow the supervisor’s real-time instructions.' },
          { label: 'Empathy & Professionalism', text: 'Identify professional, supportive language that de-escalates customer frustration.' },
        ],
      },
      {
        title: 'Tips for Success',
        items: [
          { label: 'Watch the Full Clip', text: 'Do not skip ahead. Listen carefully to the entire video before selecting answers.' },
          { label: 'Select All Correct Answers', text: 'Check every option that represents an appropriate, empathetic response.' },
          { label: 'Focus on Solutions', text: 'Address the customer’s core concern directly while following the supervisor’s coaching guidance.' },
        ],
      },
      {
        title: 'Pre-Test Instructions',
        items: [
          { label: 'Play the Video', text: 'Watch the supervisor’s scenario briefing.' },
          { label: 'Review the Question', text: 'Read the multi-select prompt after playback completes.' },
          { label: 'Evaluate the Statements', text: 'Review every statement carefully.' },
          { label: 'Select Valid Responses', text: 'Select all statements showing active listening, empathy, and correct use of coaching.' },
          { label: 'Double-Check Choices', text: 'Leave unhelpful or non-compliant statements unselected.' },
          { label: 'Submit Task', text: 'Save the response before the module timer expires.' },
        ],
      },
    ],
    media: 'video',
  },
  {
    heading: 'Welcome to Module 4: Administrative & Data Entry Tasks',
    welcome: 'Welcome to Module 4!',
    description: 'This practical section evaluates your speed, accuracy, and clerical skills when managing desktop files and completing structured data entry tasks under a short time limit.',
    format: '2 micro-tasks: file management and data entry',
    sections: [
      {
        title: 'Before You Begin',
        items: [
          { label: 'Format', text: '2 micro-tasks: 1 file management task and 1 data entry task.' },
          { label: 'Target Time', text: '3 minutes; maximum module limit is 4 minutes.' },
          { label: 'Environment', text: 'Interactive desktop and form simulation. These tasks do not change real files or customer records.' },
        ],
      },
      {
        title: 'What Is Being Evaluated?',
        items: [
          { label: 'Task 1 — File & Folder Management', text: 'Open This PC and File Explorer, create the requested destination folder, rename the document accurately, and move it into the new folder.' },
          { label: 'Task 2 — Data Entry', text: 'Enter customer names, account numbers, callback information, and interaction notes accurately from the simulated support inbox.' },
          { label: 'Speed & Detail', text: 'Maintain accuracy and minimize errors while working under time pressure.' },
        ],
      },
      {
        title: 'Tips for Success',
        items: [
          { label: 'Focus on Accuracy First', text: 'Double-check spelling, dates, and account numbers before proceeding.' },
          { label: 'Follow Instructions Exactly', text: 'Use the required filename, destination, formats, and naming conventions.' },
          { label: 'Keyboard Navigation', text: 'You can use Tab to move between compatible form fields.' },
        ],
      },
      {
        title: 'Data Entry Instructions',
        items: [
          { label: 'Read the Source Information', text: 'Open the customer request and read the displayed details.' },
          { label: 'Fill in Customer Name', text: 'Enter the full name accurately, including capitalization.' },
          { label: 'Enter Account & Phone Numbers', text: 'Copy the numbers accurately without introducing spaces or extra characters.' },
          { label: 'Select Category', text: 'Choose the appropriate issue category based on the customer’s request.' },
          { label: 'Type Short Notes', text: 'Write a concise summary of the customer’s concern.' },
          { label: 'Save Task', text: 'Review the fields for errors, then save the task before proceeding.' },
        ],
      },
    ],
  },
  {
    heading: 'Welcome to Module 5: Typing & Keyboarding Skills Test',
    welcome: 'Hi! Welcome to the SiBS Typing & Keyboarding Skills Module.',
    description: 'In this section, you will demonstrate your keyboarding speed, accuracy, and typing rhythm. For customer service work, accurate typing supports documenting account notes, handling live chats, and maintaining efficient call handling.',
    format: '2 typing passages, 60 seconds each',
    sections: [
      {
        title: 'Module Overview & Benchmark Target',
        items: [
          { label: 'Test Duration', text: 'Two separate 60-second typing rounds. Each countdown begins only when you start typing that passage.' },
          { label: 'Target Passing Standard', text: '40 words per minute (WPM).' },
          { label: 'Required Accuracy Rate', text: '90% or higher.' },
          { label: 'Format', text: 'Real-time interactive typing test.' },
        ],
      },
      {
        title: 'Instructions for Candidates',
        items: [
          { label: 'Read and Type', text: 'Type the displayed passage exactly as shown in the input area.' },
          { label: 'Timer Starts on First Keystroke', text: 'Passage 1 and Passage 2 have separate one-minute clocks. Reading and preparation before the first keystroke do not consume passage time; the overall assessment countdown continues.' },
          { label: 'Punctuation & Capitalization Count', text: 'Spaces, capital letters, periods, and commas matter. Uncorrected errors reduce accuracy.' },
          { label: 'Do Not Stop', text: 'Keep typing smoothly until each passage timer ends.' },
          { label: 'Copy & Paste', text: 'Copying and pasting are disabled.' },
        ],
      },
      {
        title: 'Practice & Setup Checklist',
        items: [
          { label: 'Keyboard Position', text: 'Rest your fingers comfortably on the home row keys (A–S–D–F and J–K–L–;).' },
          { label: 'Physical Keyboard', text: 'Ensure your keyboard is connected and functioning correctly.' },
          { label: 'Focus', text: 'Stay relaxed and prioritize accuracy before speed.' },
        ],
      },
    ],
    media: 'keyboard',
  },
  {
    heading: 'Welcome to Module 6: Audio Comprehension & Logging',
    welcome: 'Welcome to Module 6!',
    description: 'This section measures your active listening skills, note-taking accuracy, and ability to extract key details from customer audio messages under a tight time limit.',
    format: '1 customer audio recording + 1 response form',
    sections: [
      {
        title: 'Before You Begin',
        items: [
          { label: 'Format', text: '1 audio recording and 1 structured data-entry form.' },
          { label: 'Target Time', text: '2 minutes; maximum module limit is 3 minutes.' },
          { label: 'Hardware Requirement', text: 'Ensure headphones or speakers are on and at a clear volume before clicking Start.' },
        ],
      },
      {
        title: 'What Is Being Evaluated?',
        items: [
          { label: 'Auditory Comprehension', text: 'Extract customer names, account numbers, and callback details accurately during the first listen.' },
          { label: 'Accuracy & Detail', text: 'Identify the affected product, issue, and requested action.' },
          { label: 'Speed & Focus', text: 'Complete all required fields accurately within the module limit.' },
        ],
      },
      {
        title: 'Pre-Test Instructions',
        items: [
          { label: 'Get Ready', text: 'Place your hands on the keyboard and be ready to enter information before playing the voicemail.' },
          { label: 'Listen Once', text: 'The customer voicemail can be played only once. It cannot be replayed, rewound, or restarted after a page refresh.' },
          { label: 'Focus on Facts', text: 'Listen closely for names, numerical digits, and the customer’s main request.' },
          { label: 'Double-Check', text: 'Review spelling, numbers, and selections before saving the form once.' },
        ],
      },
    ],
    media: 'audio',
  },
  {
    heading: 'Welcome to Module 7: Computer Literacy & Essential Tools',
    welcome: 'Welcome to Module 7!',
    description: 'This section assesses your familiarity with everyday desktop navigation, operating system utilities, keyboard shortcuts, email workflows, and basic digital troubleshooting.',
    format: '15 multiple-choice questions',
    sections: [
      {
        title: 'Before You Begin',
        items: [
          { label: 'Format', text: '15 multiple-choice questions.' },
          { label: 'Estimated Time', text: 'The proposal suggests 5 to 7 minutes. The current online module enforces a 5-minute timer.' },
          { label: 'Navigation', text: 'Select the single best answer for each question, then choose Next.' },
        ],
      },
      {
        title: 'What Is Being Evaluated?',
        items: [
          { label: 'Keyboard & Navigation Shortcuts', text: 'Common shortcuts such as Ctrl+C, Ctrl+V, Alt+Tab, and Ctrl+F.' },
          { label: 'Operating System & Troubleshooting', text: 'File management, unresponsive applications, and peripheral setup.' },
          { label: 'Email & Digital Communication', text: 'Email fields, attachments, and auto-responders.' },
          { label: 'Web & Data Literacy', text: 'Browser navigation, tab management, and basic spreadsheet functions.' },
        ],
      },
      {
        title: 'Pre-Test Instructions',
        items: [
          { label: 'Read Carefully', text: 'Read the full question and all available choices before selecting a response.' },
          { label: 'Pacing', text: 'Aim for approximately 20–30 seconds per question while watching the live timer.' },
          { label: 'Desktop Readiness', text: 'Answer based on standard Windows/PC environments and common email/CRM tools.' },
          { label: 'Answer Every Question', text: 'Complete the questions in sequence; skipping ahead is disabled.' },
        ],
      },
    ],
    example: {
      prompt: 'Practice only: Which keyboard shortcut copies selected text on Windows?',
      choices: [
        { key: 'A', text: 'Ctrl + C' }, { key: 'B', text: 'Ctrl + V' },
        { key: 'C', text: 'Ctrl + Z' },
      ],
      note: 'This example is not scored.',
    },
  },
];

// Preserve the original flat `instructions` API for older assessment components.
export const CSR_FIT_MODULE_GUIDES = guideDefinitions.map(guide => ({
  ...guide,
  instructions: guide.sections.flatMap(section => section.items.map(item =>
    item.label ? `${item.label}: ${item.text}` : item.text
  )),
}));

export function csrFitGuideText(text, moduleOneCount = 70) {
  return String(text ?? '').replaceAll('{moduleOneCount}', String(moduleOneCount));
}

export const CSR_FIT_MODULE_NAMES = [
  'Cognitive & Logic Abilities',
  'Work Attitudes, Habits & Behavioral-Cognitive',
  'Real-Time Coaching & Active Listening Challenge',
  'Administrative Task Simulation',
  'Typing & Data Entry Test',
  'Audio Comprehension & Logging',
  'Computer Literacy & Essential Tools',
];

// Display only; Server validation and deadlines take precedence.
export const CSR_FIT_MODULE_LIMITS = [60, 25, 4, 4, 2, 3, 5];

export const CSR_FIT_OVERALL_LIMIT_MINUTES = 117;
