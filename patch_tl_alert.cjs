const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  `onClick={() => setActiveTab('tabby_tamara')}>{staleSLA.ttPending}`,
  `onClick={() => setActiveTab('tabby-tamara')}>{staleSLA.ttPending}`
).replace(
  `onClick={() => setActiveTab('tabby_tamara')}>{staleSLA.ttOverdue}`,
  `onClick={() => setActiveTab('tabby-tamara')}>{staleSLA.ttOverdue}`
).replace(
  `onClick={() => setActiveTab('client_comms')}>{staleSLA.comms}`,
  `onClick={() => setActiveTab('client-comms')}>{staleSLA.comms}`
);

fs.writeFileSync('src/App.tsx', code);
