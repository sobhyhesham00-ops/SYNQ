import fs from 'fs';
let content = fs.readFileSync('src/main.tsx', 'utf8');

const patchCode = `
import React from 'react';
const originalCreateElement = React.createElement;
(React as any).createElement = function(...args) {
    if (args[2] !== undefined) {
        // recursively check children
        const cleanChildren = (child) => {
            if (typeof child === 'number' && isNaN(child)) return 0;
            if (Array.isArray(child)) return child.map(cleanChildren);
            return child;
        };
        for (let i = 2; i < args.length; i++) {
            args[i] = cleanChildren(args[i]);
        }
    }
    return originalCreateElement.apply(null, args);
};
`;

if (!content.includes('originalCreateElement')) {
   content = content.replace("import {createRoot} from 'react-dom/client';", "import {createRoot} from 'react-dom/client';\n" + patchCode);
   fs.writeFileSync('src/main.tsx', content);
   console.log('Patched React.createElement');
}
