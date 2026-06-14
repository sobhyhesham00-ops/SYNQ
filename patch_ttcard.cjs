const fs = require('fs');
let tc = fs.readFileSync('src/components/TabbyTamaraCard.tsx', 'utf8');

tc = tc.replace(/const handleCopyTextOnly = async[\s\S]*?\{[\s\S]*?copyToClipboard[\s\S]*?\n  \};/ms,
    `const handleCopyTextOnly = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const text = req.requestType === 'tabby' || req.requestType === 'tamara' 
            ? generateTabbyTamaraCopyText(req)
            : generateComplaintCopyText(req);
        const success = await copyToClipboard(text, "Report details copied successfully!");
        if (!success) {
          toast.error("Failed to copy request details.");
        }
      };`);
fs.writeFileSync('src/components/TabbyTamaraCard.tsx', tc);
