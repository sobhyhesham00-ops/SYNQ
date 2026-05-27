const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');
code = code.replace(/{([\s]*)/*.*?*/([\s]*)}/gs, '');
let tags = [];
let idx = 0;
while (idx < code.length) {
    if (code.startsWith('return (', idx) || code.startsWith('return(', idx)) break;
    idx++;
}
let inString = false, strChar = '';
let htmlStack = [];
for (let i = idx; i < code.length; i++) {
    if (code[i] === '<' && !inString) {
        let isClose = code[i+1] === '/';
        let j = i + (isClose ? 2 : 1);
        let tagName = '';
        while (j < code.length && /[a-zA-Z0-9_.-]/.test(code[j])) {
            tagName += code[j]; j++;
        }
        if (tagName === '' && code[j] === '>') tagName = '<>';
        
        let selfClose = false;
        let inTagStr = false;
        let tchar = '';
        while (j < code.length && code[j] !== '>') {
            if (code[j] === '"' || code[j] === '\'' || code[j] === '`') {
                if (!inTagStr) { inTagStr = true; tchar = code[j]; }
                else if (code[j] === tchar) { inTagStr = false; }
            }
            if (code[j] === '/' && code[j+1] === '>' && !inTagStr) {
                selfClose = true; j++; break;
            }
            j++;
        }
        if (code[j] === '>') {
            let line = code.substring(0, i).split('
').length;
            if (!selfClose) {
                if (isClose) {
                    let matched = false;
                    for (let k = htmlStack.length - 1; k >= 0; k--) {
                        if (htmlStack[k].name === tagName) {
                            if (k !== htmlStack.length - 1) {
                                console.log('Mismatch at line', line, 'closing', tagName, 'but unclosed:', htmlStack.slice(k+1).map(x=>x.name+':'+x.line));
                            }
                            htmlStack.splice(k, htmlStack.length - k);
                            matched = true; break;
                        }
                    }
                    if (!matched) console.log('Extra close', tagName, 'at', line);
                } else {
                    htmlStack.push({name: tagName, line: line});
                }
            }
            i = j;
        }
    }
}
console.log('Unclosed:', htmlStack.map(x=>x.name+':'+x.line));
