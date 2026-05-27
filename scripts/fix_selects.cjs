const fs = require('fs');
const code = fs.readFileSync('src/App.tsx', 'utf8');

// The <option> tags usually lack classes or have bg-slate-950, etc.
// Let's replace <option> or <option value="..."> with <option className="bg-slate-800 text-slate-100">
// Also for <select>, make sure they have a proper text color.

let res = code.replace(/<option\b(?![^>]*\bclassName=)/g, '<option className="bg-slate-800 text-slate-100" ');
// And just in case they already have className:
res = res.replace(/<option([^>]+)className="([^"]*)"([^>]*)>/g, (match, p1, p2, p3) => {
   // remove any bg- and text-
   let newClasses = p2.replace(/\bbg-\S+/g, '').replace(/\btext-\S+/g, '');
   newClasses = 'bg-slate-800 text-slate-100 ' + newClasses.trim();
   return `<option${p1}className="${newClasses}"${p3}>`;
});

// For <select>, add text-slate-100 if missing
res = res.replace(/<select([^>]+)className="([^"]*)"([^>]*)>/g, (match, p1, p2, p3) => {
   let newClasses = p2.replace(/\btext-\S+/g, '');
   newClasses = 'text-slate-100 ' + newClasses.trim();
   
   // Also maybe replace bg-white/5 with bg-slate-800 because standard selects don't deal well with transparency across options, 
   // but bg-white/5 is fine for the select ITSELF, the options are the issue.
   // Let's also add 'bg-slate-800' if they have a non-transparent bg.
   return `<select${p1}className="${newClasses}"${p3}>`;
});

fs.writeFileSync('src/App.tsx', res);
console.log('Fixed options and selects.');
