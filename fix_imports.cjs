const fs = require('fs');
const path = require('path');

const filesToProcess = [
  'src/components/AgentRequestsLogs.tsx',
  'src/components/AllAgentSubmissionsLog.tsx',
  'src/components/MySubmissionsDashboard.tsx',
  'src/components/AgentSubmissionsDashboard.tsx',
  'src/components/GlobalDashboard.tsx',
  'src/components/AnnouncementsTab.tsx',
  'src/App.tsx'
];

for (const filePath of filesToProcess) {
  const fullPath = path.join(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) continue;
  
  let content = fs.readFileSync(fullPath, 'utf8');

  // Remove the bad imports added by previous run
  content = content.replace(/import \{ CLINIC_OPTIONS, getClinicLabel \} from "\.\/utils";\n/g, '');
  content = content.replace(/import \{ CLINIC_OPTIONS, getClinicLabel \} from "\.\.\/utils";\n/g, '');
  
  // Also remove it if it was injected weirdly:
  content = content.replace(/import \{ CLINIC_OPTIONS, getClinicLabel \} from "\.\/utils";/g, '');
  content = content.replace(/import \{ CLINIC_OPTIONS, getClinicLabel \} from "\.\.\/utils";/g, '');

  // Now properly add it at the top
  const relativePath = filePath === 'src/App.tsx' ? './utils' : '../utils';
  
  // First, check if CLINIC_OPTIONS is already exported/imported from utils
  if (content.includes(`} from "${relativePath}"`)) {
     if (!content.includes('CLINIC_OPTIONS,')) {
         content = content.replace(new RegExp(`import \\{([^\}]*)\\} from "${relativePath}";`), (match, p1) => {
             return `import { CLINIC_OPTIONS, ${p1}} from "${relativePath}";`;
         });
     }
  } else {
     content = `import { CLINIC_OPTIONS } from "${relativePath}";\n` + content;
  }
  
  // Add getClinicLabel if not there
  if (!content.includes('getClinicLabel')) {
     if (content.includes(`} from "${relativePath}"`)) {
         content = content.replace(new RegExp(`import \\{([^\}]*)\\} from "${relativePath}";`), (match, p1) => {
             return `import { getClinicLabel, ${p1}} from "${relativePath}";`;
         });
     } else {
         content = `import { getClinicLabel } from "${relativePath}";\n` + content;
     }
  }

  fs.writeFileSync(fullPath, content, 'utf8');
}
