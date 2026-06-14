const fs = require('fs');
const path = require('path');

const filesToProcess = [
  'src/components/AgentRequestsLogs.tsx',
  'src/components/AllAgentSubmissionsLog.tsx',
  'src/components/crm/CaseDetailDrawer.tsx',
  'src/components/ComplaintsWorkspace.tsx',
  'src/components/TabbyTamaraCard.tsx',
  'src/utils.ts',
  'src/App.tsx'
];

for (const filePath of filesToProcess) {
  const fullPath = path.join(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) continue;
  
  let content = fs.readFileSync(fullPath, 'utf8');

  const prefixes = ['comp', 'inq', 'req', 'item', 'selectedRequest', 'selectedInquiry', 'caseData', 'request'];

  for (const p of prefixes) {
     // replace ${p.clinicName} -> ${getClinicLabel(p.clinicName)}
     content = content.replace(new RegExp(`\\$\\{${p}\\.clinicName\\}`, 'g'), `\${getClinicLabel(${p}.clinicName)}`);
     
     // replace ${p.clinicName || 'N/A'} -> ${getClinicLabel(p.clinicName)}
     content = content.replace(new RegExp(`\\$\\{${p}\\.clinicName\\s*\\|\\|\\s*['"]N/A['"]\\}`, 'g'), `\${getClinicLabel(${p}.clinicName)}`);

     // replace {p.clinicName} -> {getClinicLabel(p.clinicName)}
     // regex avoiding replacing if it is already {getClinicLabel(p.clinicName)}
     // we only replace if it's strictly {p.clinicName}
     content = content.replace(new RegExp(`\\{${p}\\.clinicName\\}`, 'g'), `{getClinicLabel(${p}.clinicName)}`);

     // replace {p.clinicName || "N/A"} -> {getClinicLabel(p.clinicName)}
     content = content.replace(new RegExp(`\\{${p}\\.clinicName\\s*\\|\\|\\s*['"]N/A['"]\\}`, 'g'), `{getClinicLabel(${p}.clinicName)}`);
     
     // replace title={p.clinicName} -> title={getClinicLabel(p.clinicName)}
     content = content.replace(new RegExp(`title=\\{${p}\\.clinicName\\}`, 'g'), `title={getClinicLabel(${p}.clinicName)}`);
  }

  // Ensure import is there
  const relativePath = filePath === 'src/App.tsx' || filePath === 'src/utils.ts' ? './utils' : '../utils';
  if (filePath !== 'src/utils.ts' && content.includes('getClinicLabel') && !content.includes('getClinicLabel } from') && !content.includes('getClinicLabel} from')) {
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
