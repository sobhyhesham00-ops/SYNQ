import * as fs from "fs";
const file = "src/components/InquiryRepliesViewer.tsx";
let content = fs.readFileSync(file, "utf8");
content = content.replace(
  /<AttachmentsDisplay\s+attachments=\{\[\.\.\.\(reply\.attachments[^\}]*?\}\s+photos=\{reply\.photos\}\s+links=\{reply\.links\}\s+\/>/gs,
  `<AttachmentsDisplay
                    photos={[
                      ...(Array.isArray(reply.photos) ? reply.photos : []),
                      ...(reply.screenshot ? [reply.screenshot] : []),
                      ...(reply.imageUrl ? [reply.imageUrl] : []),
                    ].filter(Boolean)}
                    attachments={
                      Array.isArray(reply.attachments)
                        ? reply.attachments
                        : Array.isArray(reply.attachmentsObjects)
                        ? reply.attachmentsObjects
                        : undefined
                    }
                    links={reply.links || []}
                  />`
);
fs.writeFileSync(file, content);
