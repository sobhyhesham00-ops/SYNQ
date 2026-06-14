const fs = require('fs');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace getClinicLabel imports if needed, or remove local getClinicLabel
  // It's mostly defined locally inside files... Let's use a regex to just strip local getClinicLabel declarations
  content = content.replace(/const getClinicLabel = \(val: string\) => \{[\s\S]*?return mapping\[val\] \|\| val;\n\};\n\n?/g, '');
  content = content.replace(/const getClinicLabel = \(val: string\) => \{[\s\S]*?return mapping\[val\](?: \|\| val)?[\s\S]*?\}\n/g, '');

  fs.writeFileSync(filePath, content);
}

replaceInFile('src/components/GlobalDashboard.tsx');
replaceInFile('src/components/AgentSubmissionsDashboard.tsx');
replaceInFile('src/components/MySubmissionsDashboard.tsx');

// Now update the layout of GlobalDashboard 
let gbContent = fs.readFileSync('src/components/GlobalDashboard.tsx', 'utf8');

// Replace handleCopyInquiry
gbContent = gbContent.replace(/const handleCopyInquiry.*?(?:const infoArray.*?)copyToClipboard[\s\S]*?\n  \};/ms,
`const handleCopyInquiry = (e: React.MouseEvent, inq: Inquiry) => {
    e.stopPropagation();
    const text = generateInquiryCopyText(inq);
    copyToClipboard(text);
  };`);

// Replace handleCopyComplaint
gbContent = gbContent.replace(/const handleCopyComplaint =.*?\(?[^)]*\)? => \{[\s\S]*?copyToClipboard[\s\S]*?\n  \};/ms, 
`const handleCopyComplaint = (e: React.MouseEvent, comp: TabbyTamaraComplaint) => {
    e.stopPropagation();
    const text = generateComplaintCopyText(comp);
    copyToClipboard(text);
  };`);
  
// Replace getClinicLabel with import in GlobalDashboard
if (!gbContent.includes('getClinicLabel')) {
    gbContent = gbContent.replace('import { formatCaseRef', 'import { formatCaseRef, getClinicLabel, generateInquiryCopyText, generateComplaintCopyText, generateTabbyTamaraCopyText');
} else {
    // If it's already there or not removed correctly, just ensure import
    gbContent = gbContent.replace('formatCaseRef, normalizePhone, copyToClipboard', 'formatCaseRef, normalizePhone, copyToClipboard, getClinicLabel, generateInquiryCopyText, generateComplaintCopyText, generateTabbyTamaraCopyText');
}

fs.writeFileSync('src/components/GlobalDashboard.tsx', gbContent);
console.log("Replaced copies and stripped local getClinicLabel");
