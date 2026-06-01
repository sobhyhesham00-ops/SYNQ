const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Add Import
content = content.replace(
  "import { MultiAttachmentUpload } from './components/MultiAttachmentUpload';",
  "import { MultiAttachmentUpload } from './components/MultiAttachmentUpload';\\nimport { AttachmentsDisplay } from './components/AttachmentsDisplay';"
);

// We want to insert `<AttachmentsDisplay photos={req.photos} links={req.links} />` near the other attachments.

// For TabbyTamaraRequest:
content = content.split("{req.paymentScreenshot && (").join("<AttachmentsDisplay photos={req.photos} links={req.links} />\\n{req.paymentScreenshot && (");

// For TabbyTamaraComplaint: (It was {comp.imageUrl ? ()
content = content.split("{comp.imageUrl ? (").join("<AttachmentsDisplay photos={comp.photos} links={comp.links} />\\n{comp.imageUrl ? (");

// For Client Communications:
content = content.split("{req.screenshot && (").join("<AttachmentsDisplay photos={req.photos} links={req.links} />\\n{req.screenshot && (");

// For Scheduling Requests (Swap / Annual). The variable is \`req\`.
// We found {req.screenshot && (
content = content.replace(
  /{req\.screenshot && \(/g,
  '<AttachmentsDisplay photos={req.photos} links={req.links} />\\n{req.screenshot && ('
);

// For Cases
content = content.split("{c.screenshot && (").join("<AttachmentsDisplay photos={c.photos} links={c.links} />\\n{c.screenshot && (");


// I also want to make sure PatientSearchHub displays it correctly. We will do PatientSearchHub next.
fs.writeFileSync('src/App.tsx', content);

console.log('Done Display Replacement');
