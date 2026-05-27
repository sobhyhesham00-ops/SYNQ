import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// If sonner isn't imported, add it alongside 'lucide-react'
if (!content.includes("from 'sonner'")) {
  content = content.replace("import {\n  isTLName,", "import { Toaster, toast } from 'sonner';\nimport {\n  isTLName,");
}

// Add <Toaster theme="dark" position="bottom-right" /> right after <div id="scheduling-root" ...>
if (!content.includes("<Toaster")) {
  content = content.replace(
    /(<div id="scheduling-root" .*?>)/,
    "$1\n      <Toaster theme=\"dark\" position=\"bottom-right\" />"
  );
}

// Map alerts to toast
content = content.replace(/alert\((.*?(?:successfully|success|updated|submitted|cleared).*?)\)/gi, 'toast.success($1)');
content = content.replace(/alert\((.*?)\)/g, 'toast.error($1)');

fs.writeFileSync('src/App.tsx', content);
