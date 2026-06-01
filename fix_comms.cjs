const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');

c = c.replace(/screenshot: activeScreenshot \|\| undefined,/g, 'screenshot: activeScreenshot || null,');

c = c.replace(/const newComm: ClientCommunicationRequest = \{/g, 'const newComm: any = {');
let replaceStr1 = `screenshot: activeScreenshot || null, photos: activePhotos, links: activeLinks
      };
      Object.keys(newComm).forEach(k => newComm[k] === undefined && delete newComm[k]);`;

c = c.replace(/screenshot: activeScreenshot \|\| null, photos: activePhotos, links: activeLinks\n\s+\};/g, replaceStr1);


c = c.replace(/const newCase: CaseRecord = \{/g, 'const newCase: any = {');
let replaceStr2 = `screenshot: activeScreenshot || null, photos: activePhotos, links: activeLinks
      };
      Object.keys(newCase).forEach(k => newCase[k] === undefined && delete newCase[k]);`;

c = c.replace(/screenshot: activeScreenshot \|\| undefined, photos: activePhotos, links: activeLinks\n\s+\};/g, replaceStr2);

fs.writeFileSync('src/App.tsx', c);
console.log('Fixed comms mappings.');
