import * as fs from "fs";
const file = "src/components/AgentRequestsLogs.tsx";
let content = fs.readFileSync(file, "utf8");
content = content.replace(
  /<AttachmentsDisplay\s+photos=\{\[\.\.\.\(req\.photos[^\}]*?\}\s+attachments=\{\(req as any\)\.attachments\}\s+links=\{extractedLinks\}\s+\/>/gs,
  `<AttachmentsDisplay
                      photos={[
                        ...(Array.isArray(req.photos) ? req.photos : []),
                        ...((req as any).screenshot ? [(req as any).screenshot] : []),
                        ...((req as any).imageUrl ? [(req as any).imageUrl] : []),
                        ...((req as any).paymentScreenshot ? [(req as any).paymentScreenshot] : [])
                      ].filter(Boolean)}
                      attachments={
                        Array.isArray((req as any).attachments)
                          ? (req as any).attachments
                          : Array.isArray((req as any).attachmentsObjects)
                          ? (req as any).attachmentsObjects
                          : undefined
                      }
                      links={extractedLinks || []}
                   />`
);
fs.writeFileSync(file, content);
