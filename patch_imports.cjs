const fs = require('fs');

const filesToPatch = [
    'src/components/AgentSubmissionsDashboard.tsx',
    'src/components/MySubmissionsDashboard.tsx',
    'src/components/ComplaintsWorkspace.tsx',
    'src/components/TabbyTamaraCard.tsx',
    'src/components/AllAgentSubmissionsLog.tsx',
    'src/components/AgentRequestsLogs.tsx',
    'src/App.tsx'
];

for (const f of filesToPatch) {
    if (!fs.existsSync(f)) continue;
    let content = fs.readFileSync(f, 'utf8');
    
    let importMatch = content.match(/import \{([^}]+)\} from [\"\'](\.\.\/utils|\.\/utils)[\"\']/);
    if (importMatch) {
       let imports = importMatch[1];
       if (!imports.includes('generateInquiryCopyText')) {
           let updated = imports + ", getClinicLabel, generateInquiryCopyText, generateComplaintCopyText, generateTabbyTamaraCopyText";
           content = content.replace(importMatch[0], `import {${updated}} from "${importMatch[2]}"`);
           fs.writeFileSync(f, content);
       }
    }
}
