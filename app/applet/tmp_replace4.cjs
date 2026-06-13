const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// The replacement2 happened at inquiries.
content = content.replace(
  `            if (isNaN(t)) return true;
            return t >= cutoff;
          });
          console.log("[complaints] after cutoff filter:", filtered.length, "cutoff was:", new Date(cutoff).toISOString());
          filtered.sort(`,
  `            if (isNaN(t)) return true;
            return t >= cutoff;
          });
          filtered.sort(`
);

// Now do the correct replacement for complaints
let parts = content.split('collection(db, "tabby_tamara_complaints")');
let complaintsBlock = parts[1];
complaintsBlock = complaintsBlock.replace(
  `            if (isNaN(t)) return true;
            return t >= cutoff;
          });
          filtered.sort(`,
  `            if (isNaN(t)) return true;
            return t >= cutoff;
          });
          console.log("[complaints] after cutoff filter:", filtered.length, "cutoff was:", new Date(cutoff).toISOString());
          filtered.sort(`
);

parts[1] = complaintsBlock;
content = parts.join('collection(db, "tabby_tamara_complaints")');

fs.writeFileSync('src/App.tsx', content);
