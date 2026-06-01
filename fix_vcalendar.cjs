const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/"BEGIN:VEVENT\n"/g, '"BEGIN:VEVENT\\\\n"');
content = content.replace(/"END:VEVENT\n"/g, '"END:VEVENT\\\\n"');
content = content.replace(/"END:VCALENDAR\n"/g, '"END:VCALENDAR\\\\n"');
content = content.replace(/"END:VCALENDAR"/g, '"END:VCALENDAR\\\\n"'); // if missing

fs.writeFileSync('src/App.tsx', content);

console.log('Fixed VEVENT');
