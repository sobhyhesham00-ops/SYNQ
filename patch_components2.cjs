const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
    if(!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const fullPath = path.join(dir, item);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceInDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let code = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            if (code.match(/currentUser\.role === 'agent'/)) {
                code = code.replace(/currentUser\.role === 'agent'/g, "['agent', 'sme'].includes(currentUser.role as string)");
                modified = true;
            }
            if (code.match(/currentUser\?\.role === 'agent'/)) {
                code = code.replace(/currentUser\?\.role === 'agent'/g, "['agent', 'sme'].includes(currentUser?.role as string)");
                modified = true;
            }
            
            if (modified) {
                fs.writeFileSync(fullPath, code);
                console.log("Patched", fullPath);
            }
        }
    }
}

replaceInDir('src');
