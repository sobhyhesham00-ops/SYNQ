const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Use regex to catch patterns where .toLowerCase() is called on something that might be undefined

// Example: currentUser.name.toLowerCase() -> currentUser?.name?.toLowerCase()
content = content.replace(/currentUser\?\.name\.toLowerCase\(\)/g, "currentUser?.name?.toLowerCase()");
content = content.replace(/currentUser\.name\.toLowerCase\(\)/g, "currentUser?.name?.toLowerCase()");

// c.agentName.toLowerCase() -> c.agentName?.toLowerCase()
content = content.replace(/c\.agentName\.toLowerCase\(\)/g, "c.agentName?.toLowerCase()");

// s.agentName.toLowerCase() -> s.agentName?.toLowerCase()
content = content.replace(/s\.agentName\.toLowerCase\(\)/g, "s.agentName?.toLowerCase()");

// c.callCenterAgentName.toLowerCase() -> c.callCenterAgentName?.toLowerCase()
content = content.replace(/c\.callCenterAgentName\.toLowerCase\(\)/g, "c.callCenterAgentName?.toLowerCase()");

// i.agentName.toLowerCase()
content = content.replace(/i\.agentName\.toLowerCase\(\)/g, "i.agentName?.toLowerCase()");

// r.agentName.toLowerCase()
content = content.replace(/r\.agentName\.toLowerCase\(\)/g, "r.agentName?.toLowerCase()");

// l.agentName.toLowerCase()
content = content.replace(/l\.agentName\.toLowerCase\(\)/g, "l.agentName?.toLowerCase()");

// log.agentName.toLowerCase()
content = content.replace(/log\.agentName\.toLowerCase\(\)/g, "log.agentName?.toLowerCase()");

// a.toLowerCase() -> a?.toLowerCase()
content = content.replace(/a\.toLowerCase\(\)/g, "a?.toLowerCase()");
content = content.replace(/aName\.toLowerCase\(\)/g, "aName?.toLowerCase()");

// agentName.toLowerCase() -> agentName?.toLowerCase()
content = content.replace(/agentName\.toLowerCase\(\)/g, "agentName?.toLowerCase()");
content = content.replace(/n\.toLowerCase\(\)/g, "n?.toLowerCase()");

// c.clinicName.toLowerCase() -> c.clinicName?.toLowerCase()
content = content.replace(/c\.clinicName\.toLowerCase\(\)/g, "c.clinicName?.toLowerCase()");

// tcFilterClinic.toLowerCase() -> tcFilterClinic?.toLowerCase()
content = content.replace(/tcFilterClinic\.toLowerCase\(\)/g, "tcFilterClinic?.toLowerCase()");

// ttSearchQuery.toLowerCase() -> ttSearchQuery?.toLowerCase()
content = content.replace(/ttSearchQuery\.toLowerCase\(\)/g, "ttSearchQuery?.toLowerCase()");

// inquirySearchQuery.toLowerCase() -> inquirySearchQuery?.toLowerCase()
content = content.replace(/inquirySearchQuery\.toLowerCase\(\)/g, "inquirySearchQuery?.toLowerCase()");

content = content.replace(/u\.name\.toLowerCase\(\)/g, "u?.name?.toLowerCase()");
content = content.replace(/item\.agent\.toLowerCase\(\)/g, "item.agent?.toLowerCase()");
content = content.replace(/item\.type\.toLowerCase\(\)/g, "item.type?.toLowerCase()");
content = content.replace(/item\.patient\.toLowerCase\(\)/g, "item.patient?.toLowerCase()");
content = content.replace(/item\.clinic\.toLowerCase\(\)/g, "item.clinic?.toLowerCase()");
content = content.replace(/item\.details\.toLowerCase\(\)/g, "item.details?.toLowerCase()");
content = content.replace(/String\(c\.patientName \|\| ''\)\.toLowerCase\(\)/g, "String(c.patientName || '').toLowerCase()");

fs.writeFileSync('src/App.tsx', content);
console.log('Replacements done');
