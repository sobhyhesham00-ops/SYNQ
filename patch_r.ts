import * as fs from "fs";
const file = "src/components/RequestReplyThread.tsx";
let content = fs.readFileSync(file, "utf8");
content = content.replace(
  /<AttachmentsDisplay\s+attachments=\{\[\.\.\.\(r\.attachments[^\}]*?\}\s+photos=\{r\.photos[^\}]*?\}\s+links=\{r\.links[^\}]*?\}\s+\/>/gs,
  `<AttachmentsDisplay
                    photos={[
                      ...(Array.isArray(r.photos) ? r.photos : []),
                      ...(r.screenshot ? [r.screenshot] : []),
                      ...(r.imageUrl ? [r.imageUrl] : []),
                    ].filter(Boolean)}
                    attachments={
                      Array.isArray(r.attachments)
                        ? r.attachments
                        : Array.isArray(r.attachmentsObjects)
                        ? r.attachmentsObjects
                        : undefined
                    }
                    links={r.links || []}
                  />`
);
fs.writeFileSync(file, content);
