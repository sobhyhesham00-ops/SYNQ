import * as fs from "fs";
const file = "src/App.tsx";
let content = fs.readFileSync(file, "utf8");
content = content.replace(
  /<AttachmentsDisplay\s+photos=\{\[\.\.\.\(r\.photos[^\}]*?\}\s+attachments=\{r\.attachments \|\| \[\]\}\s+links=\{\[\]\}\s+\/>/gs,
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
                            links={[]}
                          />`
);

content = content.replace(
  /<AttachmentsDisplay\s+photos=\{\[\s+\.\.\.\(viewingRecord\.data\.photos \|\| \[\]\),\s+\.\.\.\(viewingRecord\.data\.screenshot \? \[viewingRecord\.data\.screenshot\] : \[\]\),\s+\.\.\.\(viewingRecord\.data\.paymentScreenshot \? \[viewingRecord\.data\.paymentScreenshot\] : \[\]\),\s+\.\.\.\(viewingRecord\.data\.imageUrl \? \[viewingRecord\.data\.imageUrl\] : \[\]\)\s+\]\}\s+attachments=\{viewingRecord\.data\.attachments \|\| \[\]\}\s+links=\{viewingRecord\.data\.links \|\| \[\]\}\s+\/>/gs,
  `<AttachmentsDisplay
                    photos={[
                      ...(Array.isArray(viewingRecord.data.photos) ? viewingRecord.data.photos : []),
                      ...(viewingRecord.data.screenshot ? [viewingRecord.data.screenshot] : []),
                      ...(viewingRecord.data.paymentScreenshot ? [viewingRecord.data.paymentScreenshot] : []),
                      ...(viewingRecord.data.imageUrl ? [viewingRecord.data.imageUrl] : [])
                    ].filter(Boolean)}
                    attachments={
                      Array.isArray(viewingRecord.data.attachments)
                        ? viewingRecord.data.attachments
                        : Array.isArray(viewingRecord.data.attachmentsObjects)
                        ? viewingRecord.data.attachmentsObjects
                        : undefined
                    }
                    links={viewingRecord.data.links || []}
                  />`
);

fs.writeFileSync(file, content);
