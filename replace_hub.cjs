const fs = require('fs');

let content = fs.readFileSync('src/components/PatientSearchHub.tsx', 'utf8');

// For Inquiries - already handles photos and links in App.tsx but wait, here it renders photos:
// {inq.photos && inq.photos.length > 0 && (
// It already handles inq.photos!
// I'll add links to inq:
content = content.replace(
  /{inq\.photos && inq\.photos\.length > 0 && \([\\s\\S]*?\}\)\\s*<\/div>\\s*\)\\s*\}/,
  \`$&
                    {inq.links && inq.links.length > 0 && (
                      <div className="flex gap-2 flex-wrap mt-1">
                        {inq.links.map((link, idx) => (
                           <a key={idx} href={link} target="_blank" rel="noreferrer" className="text-[10px] text-cyan-400 underline truncate max-w-[150px]">{link}</a>
                        ))}
                      </div>
                    )}\`
);

// For Client Comms
content = content.replace(
  "{cc.screenshot && (",
  \`{((cc.photos && cc.photos.length > 0) || cc.screenshot) && (
                        <div className="flex gap-2 flex-wrap mt-2">
                          {cc.screenshot && (
                            <button onClick={() => setViewerImage(cc.screenshot!)} className="focus:outline-none">
                              <img src={cc.screenshot} alt="Attached" className="h-16 w-16 md:h-20 md:w-20 rounded-lg border border-sky-500/30 object-cover shadow-sm hover:scale-105 transition hover:opacity-80" />
                            </button>
                          )}
                          {cc.photos?.map((p, idx) => (
                            <button key={idx} onClick={() => setViewerImage(p)} className="focus:outline-none">
                              <img src={p} alt="Attached" className="h-16 w-16 md:h-20 md:w-20 rounded-lg border border-sky-500/30 object-cover shadow-sm hover:scale-105 transition hover:opacity-80" />
                            </button>
                          ))}
                        </div>
                      )}
                      {cc.links && cc.links.length > 0 && (
                        <div className="flex gap-2 flex-wrap mt-1">
                          {cc.links.map((link, idx) => (
                            <a key={idx} href={link} target="_blank" rel="noreferrer" className="text-[10px] text-sky-400 underline truncate max-w-[150px]">{link}</a>
                          ))}
                        </div>
                      )}\`
);
content = content.replace(
  /<div className="mt-2">\\s*<button onClick=\{\(\) => setViewerImage\(cc\.screenshot!\)\} className="focus:outline-none">\\s*<img src=\{cc\.screenshot\} alt="Attached" className="h-16 w-16 md:h-20 md:w-20 rounded-lg border border-sky-500\/30 object-cover shadow-sm hover:scale-105 transition hover:opacity-80" \/>\\s*<\/button>\\s*<\/div>/,
  ""
); // Clean up the old CC screenshot

// For Tabby Requests
content = content.replace(
  "{tt.paymentScreenshot && (",
  \`{((tt.photos && tt.photos.length > 0) || tt.paymentScreenshot) && (
                        <div className="flex gap-2 flex-wrap mt-2">
                          {tt.paymentScreenshot && (
                            <button onClick={() => setViewerImage(tt.paymentScreenshot!)} className="focus:outline-none">
                              <img src={tt.paymentScreenshot} alt="Attached" className="h-16 w-16 md:h-20 md:w-20 rounded-lg border border-rose-500/30 object-cover shadow-sm hover:scale-105 transition hover:opacity-80" />
                            </button>
                          )}
                          {tt.photos?.map((p, idx) => (
                            <button key={idx} onClick={() => setViewerImage(p)} className="focus:outline-none">
                              <img src={p} alt="Attached" className="h-16 w-16 md:h-20 md:w-20 rounded-lg border border-rose-500/30 object-cover shadow-sm hover:scale-105 transition hover:opacity-80" />
                            </button>
                          ))}
                        </div>
                      )}
                      {tt.links && tt.links.length > 0 && (
                        <div className="flex gap-2 flex-wrap mt-1">
                          {tt.links.map((link, idx) => (
                            <a key={idx} href={link} target="_blank" rel="noreferrer" className="text-[10px] text-rose-400 underline truncate max-w-[150px]">{link}</a>
                          ))}
                        </div>
                      )}\`
);
content = content.replace(
  /<div className="mt-2">\\s*<button onClick=\{\(\) => setViewerImage\(tt\.paymentScreenshot!\)\} className="focus:outline-none">\\s*<img src=\{tt\.paymentScreenshot\} alt="Attached" className="h-16 w-16 md:h-20 md:w-20 rounded-lg border border-rose-500\/30 object-cover shadow-sm hover:scale-105 transition hover:opacity-80" \/>\\s*<\/button>\\s*<\/div>/,
  ""
);

// For Cases
content = content.replace(
  "{c.screenshot && (",
  \`{((c.photos && c.photos.length > 0) || c.screenshot) && (
                        <div className="flex gap-2 flex-wrap mt-2">
                          {c.screenshot && (
                            <button onClick={() => setViewerImage(c.screenshot!)} className="focus:outline-none">
                              <img src={c.screenshot} alt="Attached" className="h-16 w-16 md:h-20 md:w-20 rounded-lg border border-orange-500/30 object-cover shadow-sm hover:scale-105 transition hover:opacity-80" />
                            </button>
                          )}
                          {c.photos?.map((p, idx) => (
                            <button key={idx} onClick={() => setViewerImage(p)} className="focus:outline-none">
                              <img src={p} alt="Attached" className="h-16 w-16 md:h-20 md:w-20 rounded-lg border border-orange-500/30 object-cover shadow-sm hover:scale-105 transition hover:opacity-80" />
                            </button>
                          ))}
                        </div>
                      )}
                      {c.links && c.links.length > 0 && (
                        <div className="flex gap-2 flex-wrap mt-1">
                          {c.links.map((link, idx) => (
                            <a key={idx} href={link} target="_blank" rel="noreferrer" className="text-[10px] text-orange-400 underline truncate max-w-[150px]">{link}</a>
                          ))}
                        </div>
                      )}\`
);
content = content.replace(
  /<div className="mt-2">\\s*<button onClick=\{\(\) => setViewerImage\(c\.screenshot!\)\} className="focus:outline-none">\\s*<img src=\{c\.screenshot\} alt="Attached" className="h-16 w-16 md:h-20 md:w-20 rounded-lg border border-orange-500\/30 object-cover shadow-sm hover:scale-105 transition hover:opacity-80" \/>\\s*<\/button>\\s*<\/div>/,
  ""
);

// For Complaints
content = content.replace(
  "{c.imageUrl && (",
  \`{((c.photos && c.photos.length > 0) || c.imageUrl) && (
                        <div className="flex gap-2 flex-wrap mt-2">
                          {c.imageUrl && (
                            <button onClick={() => setViewerImage(c.imageUrl!)} className="focus:outline-none">
                              <img src={c.imageUrl} alt="Attached" className="h-16 w-16 md:h-20 md:w-20 rounded-lg border border-red-500/30 object-cover shadow-sm hover:scale-105 transition hover:opacity-80" />
                            </button>
                          )}
                          {c.photos?.map((p, idx) => (
                            <button key={idx} onClick={() => setViewerImage(p)} className="focus:outline-none">
                              <img src={p} alt="Attached" className="h-16 w-16 md:h-20 md:w-20 rounded-lg border border-red-500/30 object-cover shadow-sm hover:scale-105 transition hover:opacity-80" />
                            </button>
                          ))}
                        </div>
                      )}
                      {c.links && c.links.length > 0 && (
                        <div className="flex gap-2 flex-wrap mt-1">
                          {c.links.map((link, idx) => (
                            <a key={idx} href={link} target="_blank" rel="noreferrer" className="text-[10px] text-red-400 underline truncate max-w-[150px]">{link}</a>
                          ))}
                        </div>
                      )}\`
);
content = content.replace(
  /<div className="mt-2">\\s*<button onClick=\{\(\) => setViewerImage\(c\.imageUrl!\)\} className="focus:outline-none">\\s*<img src=\{c\.imageUrl\} alt="Attached" className="h-16 w-16 md:h-20 md:w-20 rounded-lg border border-red-500\/30 object-cover shadow-sm hover:scale-105 transition hover:opacity-80" \/>\\s*<\/button>\\s*<\/div>/,
  ""
);

fs.writeFileSync('src/components/PatientSearchHub.tsx', content);

console.log('Hub replaced');
