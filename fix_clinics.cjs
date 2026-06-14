const fs = require('fs');
const path = require('path');

const replacementNoClass = `{CLINIC_OPTIONS.map(c => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}`;

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
  let originalContent = content;

  // Add import if not present
  const importString = filePath === 'src/App.tsx' ? 'import { CLINIC_OPTIONS, getClinicLabel } from "./utils";\n' : 'import { CLINIC_OPTIONS, getClinicLabel } from "../utils";\n';
  
  if (!content.includes('CLINIC_OPTIONS')) {
    // find last import
    const lastImportIndex = content.lastIndexOf('import ');
    if (lastImportIndex !== -1) {
      const newLineIndex = content.indexOf('\n', lastImportIndex);
      content = content.slice(0, newLineIndex + 1) + importString + content.slice(newLineIndex + 1);
    } else {
      content = importString + content;
    }
  } else if (!content.includes('getClinicLabel')) {
     content = content.replace(/import {([^}]*)CLINIC_OPTIONS/, 'import {$1CLINIC_OPTIONS, getClinicLabel');
  }

  // Handle generic replacements
  const regex1 = /<option\s+value="dermadent"[^>]*>[\s\S]*?<option\s+value="newage"[^>]*>[\s\S]*?<\/option>/g;
  
  content = content.replace(regex1, (match) => {
    // Extract className if any
    const classMatch = match.match(/className="([^"]+)"/);
    const classNameStr = classMatch ? ` className="${classMatch[1]}"` : '';
    
    // Check if we already have it
    return `{CLINIC_OPTIONS.map(c => (
<option key={c.value} value={c.value}${classNameStr}>{c.label}</option>
))}`;
  });

  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}
