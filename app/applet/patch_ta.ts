const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetExact = code.indexOf('placeholder="Write comment/resolution details');
if (targetExact !== -1) {
    const end = code.indexOf('/>', targetExact) + 2;
    const block = code.substring(code.lastIndexOf('<textarea', targetExact), end);
    const replacement = block + `
                                                        {comp.tlHandledAt && (
                                                          <p className='text-[10px] text-slate-500 mt-1 font-mono'>
                                                            Last updated by {comp.tlHandledBy || 'TL'} at {new Date(comp.tlHandledAt).toLocaleString()}
                                                          </p>
                                                        )}`;
    code = code.replace(block, replacement);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Replaced block");
} else {
    console.log("Not found");
}
