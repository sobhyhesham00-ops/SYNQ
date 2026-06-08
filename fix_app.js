const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// replace imports
content = content.replace(/formatCaseRef,\n\s*normalizePhone,/g, "formatCaseRef,\n  normalizePhone,\n  copyToClipboard,");

// line 6596: navigator.clipboard.writeText(csv); toast.success("Master Agent Attendance CSV report compiled and copied to clipboard successfully! You can directly paste it (Ctrl+V) into Excel or Google Sheets.");
content = content.replace(/navigator\.clipboard\.writeText\(csv\);\s*toast\.success\(\s*"Master Agent Attendance CSV report compiled and copied to clipboard successfully! You can directly paste it \(Ctrl\+V\) into Excel or Google Sheets\.",\s*\);/g, "copyToClipboard(csv, \"Master Agent Attendance CSV report compiled and copied to clipboard successfully! You can directly paste it (Ctrl+V) into Excel or Google Sheets.\");");

// 12815
content = content.replace(/navigator\.clipboard\.writeText\(text\);\s*toast\.success\('Request copied to clipboard!'\);/g, "copyToClipboard(text, 'Request copied to clipboard!');");

// 14585
content = content.replace(/navigator\.clipboard\.writeText\(\s*inq\.clinicName \|\| "",\s*\);\s*toast\.success\(\s*"Clinic name copied!",\s*\);/g, "copyToClipboard(inq.clinicName || \"\", \"Clinic name copied!\");");

// 14601
content = content.replace(/navigator\.clipboard\.writeText\(\s*\(\s*inq\.phoneNumber \|\| ""\s*\)\.replace\(\/\^0\+\/,\s*""\),\s*\);\s*toast\.success\(\s*"Phone copied!",\s*\);/g, "copyToClipboard((inq.phoneNumber || \"\").replace(/^0+/, \"\"), \"Phone copied!\");");

// 14897
content = content.replace(/navigator\.clipboard\.writeText\(\s*inq\.agentName \|\| "",\s*\);\s*toast\.success\(\s*"Agent name copied!",\s*\);/g, "copyToClipboard(inq.agentName || \"\", \"Agent name copied!\");");

// 14912
content = content.replace(/navigator\.clipboard\.writeText\(\s*inq\.clinicName \|\| "",\s*\);\s*toast\.success\(\s*"Clinic name copied!",\s*\);/g, "copyToClipboard(inq.clinicName || \"\", \"Clinic name copied!\");");

// 14928
content = content.replace(/navigator\.clipboard\.writeText\(\s*\(\s*inq\.phoneNumber \|\| ""\s*\)\.replace\(\/\^0\+\/,\s*""\),\s*\);\s*toast\.success\(\s*"Phone copied!",\s*\);/g, "copyToClipboard((inq.phoneNumber || \"\").replace(/^0+/, \"\"), \"Phone copied!\");");

// 16094 (same as 14897? Agent name copied)
content = content.replace(/navigator\.clipboard\.writeText\(\s*inq\.agentName \|\| "",\s*\);\s*toast\.success\(\s*"Agent name copied!",\s*\);/g, "copyToClipboard(inq.agentName || \"\", \"Agent name copied!\");");

content = content.replace(/navigator\.clipboard\.writeText\(\s*details,\s*\);\s*toast\.success\(\s*"Inquiry details copied!",\s*\);/g, 'copyToClipboard(details, "Inquiry details copied!");');

content = content.replace(/navigator\.clipboard\.writeText\(text\);\s*toast\.success\('Complaint details copied — including attachments info!'\);/g, "copyToClipboard(text, 'Complaint details copied — including attachments info!');");

content = content.replace(/navigator\.clipboard\.writeText\(\s*text,\s*\);\s*toast\.success\(\s*"Complaint details copied — including attachments info!",\s*\);/g, "copyToClipboard(text, \"Complaint details copied — including attachments info!\");");

content = content.replace(/navigator\.clipboard\.writeText\(\s*details,\s*\);\s*toast\.success\(\s*"Client communication details copied!",\s*\);/g, "copyToClipboard(details, \"Client communication details copied!\");");

// ensure all other occurrences are also handled just in case
content = content.replace(/navigator\.clipboard\.writeText\((\w+)\);\s*toast\.success\(([^)]+)\);/g, "copyToClipboard($1, $2);");


fs.writeFileSync('src/App.tsx', content);
console.log('App.tsx updated');
