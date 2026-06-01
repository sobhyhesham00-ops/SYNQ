const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  /"Agent Name,Status,Clock In,Clock Out,Total Break \\(mins\\),Total Lunch \\(mins\\),Total Restroom \\(mins\\),Restroom Sessions,Team Meeting \\(mins\\),1:1 Session \\(mins\\),Personal Break \\(mins\\),Today's Compliance\\n";/g,
  "\"Agent Name,Status,Clock In,Clock Out,Total Break (mins),Total Lunch (mins),Total Restroom (mins),Restroom Sessions,Team Meeting (mins),1:1 Session (mins),Personal Break (mins),Today's Compliance\\\\n\";"
);

fs.writeFileSync('src/App.tsx', content);

console.log('Fixed CSV header');
