import fs from 'fs';

const files = [
  'src/App.tsx',
  'src/components/NotificationDrawer.tsx',
  'src/components/RequestReplyThread.tsx',
  'src/components/TabbyTamaraCard.tsx',
  'src/components/InquiryRepliesViewer.tsx',
  'src/components/ProfessionalAttachmentUploader.tsx',
  'src/components/MultiAttachmentUpload.tsx',
  'src/components/EditModal.tsx',
  'src/components/AttachmentsDisplay.tsx',
  'src/utils.ts'
];

const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u2B50\u2705\u274C\u26A0\uFE0F]/gu;

for (const file of files) {
  if (fs.existsSync(file)) {
    let data = fs.readFileSync(file, 'utf8');
    data = data.replace(emojiRegex, '');
    data = data.replace(/addSystemNotification\(\s*['"\`] /g, str => str.slice(0, -1));
    fs.writeFileSync(file, data, 'utf8');
  }
}
