import * as fs from "fs";
const file = "src/App.tsx";
let content = fs.readFileSync(file, "utf8");
content = content.replace(
  /<AttachmentsDisplay\s+photos=\{\[\.\.\.\(inq\.photos[^\}]*?\}\s+attachments=\{inq\.attachments\}\s+links=\{inq\.links\}\s+\/>/gs,
  `<AttachmentsDisplay
                                          photos={[
                                            ...(Array.isArray(inq.photos) ? inq.photos : []),
                                            ...(inq.screenshot ? [inq.screenshot] : []),
                                            ...(inq.imageUrl ? [inq.imageUrl] : []),
                                          ].filter(Boolean)}
                                          attachments={
                                            Array.isArray(inq.attachments)
                                              ? inq.attachments
                                              : Array.isArray(inq.attachmentsObjects)
                                              ? inq.attachmentsObjects
                                              : undefined
                                          }
                                          links={inq.links || []}
                                        />`
);
fs.writeFileSync(file, content);
