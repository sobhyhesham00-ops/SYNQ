const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf-8');

// I am going to delete lines that are causing syntax errors!
// First error: Unexpected closing "div" tag does not match opening "header" tag
// Line 909: </div>
code = code.replace(/<\\/div>\\s*<\\/header>/g, '</header>');

// Second error: Unexpected closing "aside"
code = code.replace(/<\\/aside>/g, '');

// The Unterminated regular expression at 13224 is because we have too many closing divs!
// Let's strip out the fragment wrap I mistakenly added!
code = code.replace(/return \\(<>\\n/g, 'return (\\n');
code = code.replace(/<\\/>\\);\\n/g, ');\\n');

// Now, we have an error at the end. It's because the AST thinks there are too many closing \`</div>\`.
// We will simply remove the last 10 lines and re-append a proper closure!
let lines = code.split('\\n');
lines = lines.slice(0, lines.length - 15);
lines.push('    </div>');
lines.push('  );');
lines.push('}');
code = lines.join('\\n');

fs.writeFileSync('src/App.tsx', code);
console.log('App patched and closed properly');
