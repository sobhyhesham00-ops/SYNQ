import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Replace all occurrences of multiline navigator.clipboard.writeText((inq.phoneNumber ... ))
content = content.replace(/navigator\.clipboard\.writeText\([\s\S]*?inq\.phoneNumber[\s\S]*?\);\s*toast\.success\([\s\S]*?"Phone copied \(no leading zero\)"[\s\S]*?\);/g, "copyToClipboard((inq.phoneNumber || \"\").replace(/^0+/, \"\"), \"Phone copied (no leading zero)\");");

fs.writeFileSync('src/App.tsx', content);
console.log('App.tsx updated');
