const fs = require('fs');
let utilsCode = fs.readFileSync('src/utils.ts', 'utf8');

const additionalCode = `
export const getClinicLabel = (val: string) => {
  const mapping: Record<string, string> = {
    dermadent: "Dermadent",
    onetouch_mo3tred: "One Touch AlMutarid",
    onetouch_merkhnya: "One Touch Markhaniya",
    welltouch: "Well Touch",
    beautyvision: "Beauty Vision",
    rose: "Rose",
    sultan: "Sultan",
    nova: "Nova",
    bnayat: "Bnayat",
  };
  return mapping[val] || val;
};

export const generateInquiryCopyText = (inq: any): string => {
  const resolvedRef = formatCaseRef(inq.id, "inq", inq.createdAt, inq.caseRef);
  const infoArray = [
    \`📝 Inquiry:\`,
    \`Ref: \${resolvedRef}\`,
    \`Clinic: \${getClinicLabel(inq.clinicName)}\`,
    \`Patient: \${inq.patientName} (\${inq.fileNumber})\`,
    \`Phone: \${normalizePhone(inq.phoneNumber)}\`,
    \`Status: \${inq.status}\`,
    \`Details: \${inq.inquiryDetails}\`,
  ];
  if (inq.status === 'closed' && inq.assignedSupportAgent) {
    infoArray.push(\`Replied by: \${inq.assignedSupportAgent}\`);
  }
  return infoArray.join('\\n');
};

export const generateTabbyTamaraCopyText = (req: any): string => {
  const resolvedRef = formatCaseRef(req.id, "tt_request", req.createdAt, req.caseRef);
  const atts = normalizeAttachments(req.attachments);
  const screenshotLabel = req.screenshotUpload ? "Yes" : "No";
  
  const infoArray = [
    req.requestType === 'tabby' ? \`💳 Tabby Request\` : \`💳 Tamara Request\`,
    \`Ref: \${resolvedRef}\`,
    \`Patient: \${req.patientName || 'N/A'}\`,
    \`File/ID: \${req.idNumber || req.fileNumber || 'N/A'}\`,
    \`Phone: \${normalizePhone(req.phoneNumber)}\`,
    \`Amount: \${req.amount}\`,
    \`Clinic: \${getClinicLabel(req.clinicName)}\`,
  ];
  if (req.serviceDetails) infoArray.push(\`Details: \${req.serviceDetails}\`);
  infoArray.push(\`Status: \${req.status}\`);
  if (req.tlComment) infoArray.push(\`Supervisor Note: \${req.tlComment}\`);
  
  infoArray.push(\`Attachments: \${atts.length} photos, Screenshot: \${screenshotLabel}\`);
  const links = extractLinks(req.links);
  if (links.length > 0) infoArray.push(\`Links: \${links.join(', ')}\`);

  return infoArray.join('\\n');
};

export const generateComplaintCopyText = (comp: any): string => {
  const resolvedRef = formatCaseRef(comp.id, "tt_complaint", comp.createdAt, comp.caseRef);
  const atts = normalizeAttachments(comp.attachments);
  const screenshotLabel = comp.screenshotUpload ? "Yes" : "No";
  
  const infoArray = [
    \`🚨 Complaint\`,
    \`Ref: \${resolvedRef}\`,
    \`Patient: \${comp.patientName} (\${comp.fileNumber})\`,
    \`Phone: \${normalizePhone(comp.phoneNumber)}\`,
    \`ID (\${comp.idType}): \${comp.idNumber}\`,
    \`Customer Type: \${comp.customerType || 'N/A'}\`,
    \`Clinic: \${getClinicLabel(comp.clinicName)}\`,
    \`Status: \${comp.status}\`,
    \`Details: \${comp.complaintDetails}\`,
  ];
  
  if (comp.tlComment) infoArray.push(\`Supervisor Note: \${comp.tlComment}\`);
  
  infoArray.push(\`Attachments: \${atts.length} photos, Screenshot: \${screenshotLabel}\`);
  const links = extractLinks(comp.links);
  if (links.length > 0) infoArray.push(\`Links: \${links.join(', ')}\`);

  return infoArray.join('\\n');
};
`;

fs.appendFileSync('src/utils.ts', additionalCode);
