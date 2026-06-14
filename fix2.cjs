const fs = require('fs');
let c = fs.readFileSync('src/components/GlobalDashboard.tsx', 'utf8');

c = c.replace(/const handleCopyInquiry = \([^)]*\) => \{[\s\S]*?copyToClipboard[\s\S]*?\n  \};/ms,
`const handleCopyInquiry = (e: React.MouseEvent, inq: Inquiry) => {
    e.stopPropagation();
    const text = generateInquiryCopyText(inq);
    copyToClipboard(text);
  };`);

c = c.replace(/handleCopyInquiry\(item\.data\)/g, 'handleCopyInquiry(e, item.data as any)');

fs.writeFileSync('src/components/GlobalDashboard.tsx', c);
