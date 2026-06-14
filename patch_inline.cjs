const fs = require('fs');

function replaceInlineCopy(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Replace handleCopyInquiry generic pattern
    content = content.replace(/handleCopyInquiry = \([^)]*\) => \{[\s\S]*?copyToClipboard[\s\S]*?\n  \};/ms,
    `handleCopyInquiry = (e: React.MouseEvent, inq: any) => {
        e.stopPropagation();
        const text = generateInquiryCopyText(inq);
        copyToClipboard(text);
      };`);

    // Replace handleCopyComplaint generic pattern (AgentSubmissionsDashboard & MySubmissionsDashboard)
    content = content.replace(/handleCopyComplaint = \([^)]*\) => \{[\s\S]*?copyToClipboard[\s\S]*?\n  \};/ms,
    `handleCopyComplaint = (e: React.MouseEvent, comp: any) => {
        e.stopPropagation();
        const text = generateComplaintCopyText(comp);
        copyToClipboard(text);
      };`);

    fs.writeFileSync(filePath, content);
}

replaceInlineCopy('src/components/AgentSubmissionsDashboard.tsx');
replaceInlineCopy('src/components/MySubmissionsDashboard.tsx');

// ComplaintsWorkspace has a specific copyToClipboard
let cw = fs.readFileSync('src/components/ComplaintsWorkspace.tsx', 'utf8');
cw = cw.replace(/copyToClipboard\(\s*\[[\s\S]*?\]\.filter\(Boolean\)\.join\(\"\\n\"\),\n\s*"Complaint details copied.*"\n\s*\);/ms,
    `copyToClipboard(generateComplaintCopyText(comp), "Complaint details copied — including attachments info!");`);
fs.writeFileSync('src/components/ComplaintsWorkspace.tsx', cw);

// TabbyTamaraCard handleCopyRequest
let tc = fs.readFileSync('src/components/TabbyTamaraCard.tsx', 'utf8');
tc = tc.replace(/const handleCopyRequest = \([^)]*\) => \{[\s\S]*?copyToClipboard[\s\S]*?\n  \};/ms,
    `const handleCopyRequest = (e: React.MouseEvent, req: any) => {
        e.stopPropagation();
        const text = req.requestType === 'tabby' || req.requestType === 'tamara' 
            ? generateTabbyTamaraCopyText(req)
            : generateComplaintCopyText(req);
        copyToClipboard(text);
      };`);
fs.writeFileSync('src/components/TabbyTamaraCard.tsx', tc);

// AllAgentSubmissionsLog
let al = fs.readFileSync('src/components/AllAgentSubmissionsLog.tsx', 'utf8');
al = al.replace(/const handleCopyRequest = \([^)]*\) => \{[\s\S]*?copyToClipboard[\s\S]*?\n  \};/ms,
    `const handleCopyRequest = (e: React.MouseEvent, req: any) => {
        e.stopPropagation();
        const text = generateTabbyTamaraCopyText(req);
        copyToClipboard(text);
      };`);
fs.writeFileSync('src/components/AllAgentSubmissionsLog.tsx', al);

// AgentRequestsLogs
if (fs.existsSync('src/components/AgentRequestsLogs.tsx')) {
    let arl = fs.readFileSync('src/components/AgentRequestsLogs.tsx', 'utf8');
    arl = arl.replace(/const handleCopyRequest = \([^)]*\) => \{[\s\S]*?copyToClipboard[\s\S]*?\n  \};/ms,
        `const handleCopyRequest = (e: React.MouseEvent, req: any) => {
            e.stopPropagation();
            const text = generateTabbyTamaraCopyText(req);
            copyToClipboard(text);
          };`);
    fs.writeFileSync('src/components/AgentRequestsLogs.tsx', arl);
}
