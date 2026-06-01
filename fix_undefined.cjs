const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');

c = c.replace(/confirmedAt: undefined,/g, '');
c = c.replace(/confirmedBy: undefined,/g, '');
c = c.replace(/paymentScreenshot: activeScreenshot \|\| undefined,/g, 'paymentScreenshot: activeScreenshot || null,');

c = c.replace(/idNumber: \!ttIsOldCustomer \? ttIdNumber \: undefined,/g, 'idNumber: !ttIsOldCustomer ? ttIdNumber : null,');
c = c.replace(/idNumber: \!tcIsOldCustomer \? tcIdNumber \: undefined,/g, 'idNumber: !tcIsOldCustomer ? tcIdNumber : null,');

c = c.replace(/paymentLink: paymentLink \|\| undefined,/g, 'paymentLink: paymentLink || null,');
c = c.replace(/tlNotes: tlNotes \|\| undefined,/g, 'tlNotes: tlNotes || null,');

// Also add a line to ensure all undefined fields are deleted from newRequest
c = c.replace(/const newRequest: TabbyTamaraRequest = \{/g, 'const newRequest: any = {');
c = c.replace(/const newComplaint: TabbyTamaraComplaint = \{/g, 'const newComplaint: any = {');

let replaceStr1 = `paymentScreenshot: activeScreenshot || null, photos: activePhotos, links: activeLinks
      };
      Object.keys(newRequest).forEach(k => newRequest[k] === undefined && delete newRequest[k]);`;

c = c.replace(/paymentScreenshot: activeScreenshot \|\| null, photos: activePhotos, links: activeLinks\n\s+\};/g, replaceStr1);

let replaceStr2 = `clinicName: tcClinicName
      };
      Object.keys(newComplaint).forEach(k => newComplaint[k] === undefined && delete newComplaint[k]);`;

c = c.replace(/clinicName: tcClinicName\n\s+\};/g, replaceStr2);

// Add the error message to the toast so the user can see what failed
c = c.replace(/toast\.error\("An error occurred while submitting fintech request\. Please try again\."\);/g, 'toast.error("Fintech error: " + (err.message || err));');

fs.writeFileSync('src/App.tsx', c);
console.log('Fixed undefined mapping.');
