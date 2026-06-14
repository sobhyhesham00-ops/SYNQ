const fs = require('fs');

let content = fs.readFileSync('src/components/GlobalDashboard.tsx', 'utf8');

// The replacement for the complaint block from 833 to 1010
// We will replace the <div className="space-y-5"> ... until the end of Complaint
content = content.replace(/\{item\.type === "complaint" && \([\s\S]*?className="flex flex-wrap gap-2 items-center justify-end pt-4 border-t border-white\/5"[\s\S]*?\n\s*\}\n\s*<\/div>\n\s*\)\}/,
`{item.type === "complaint" && (
                      <div className="space-y-4">
                        <div className="bg-black/35 border border-white/5 p-4 rounded-xl text-xs space-y-2 text-slate-300">
                          <p className="flex justify-between items-center bg-white/[0.02] -mx-4 -mt-4 p-3 border-b border-white/5 mb-3 rounded-t-xl">
                             <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black">
                              🚨 Submitted Complaint Details
                            </span>
                            <span className="bg-rose-500/10 text-rose-300 px-2 py-0.5 rounded text-[9px] uppercase font-bold">
                              {item.status}
                            </span>
                          </p>
                          <p className="flex justify-between items-center">
                            <span className="text-slate-400">Patient:</span> 
                            <span className="font-bold text-white text-right">
                              {item.data.patientName || "N/A"} <span className="text-slate-500 font-normal">({item.data.fileNumber || "N/A"})</span>
                            </span>
                          </p>
                          <p className="flex justify-between items-center">
                            <span className="text-slate-400">Phone:</span> 
                            <span className="font-mono text-sky-300">{item.data.phoneNumber}</span>
                          </p>
                          <p className="flex justify-between items-center">
                            <span className="text-slate-400">Customer Type:</span> 
                            <span>{item.data.isOldCustomer ? "Old Customer" : "New Customer"}</span>
                          </p>
                          {!item.data.isOldCustomer && item.data.idNumber && (
                            <p className="flex justify-between items-center gap-2">
                              <span className="text-slate-400">ID ({item.data.idType || "N/A"}):</span> 
                              <span className="font-mono bg-white/5 px-2 py-0.5 rounded cursor-copy flex items-center gap-1.5"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(item.data.idNumber, "ID Copied");
                                }}>
                                {item.data.idNumber} <Copy className="w-3 h-3 text-slate-500" />
                              </span>
                            </p>
                          )}
                          <p className="flex justify-between items-center">
                            <span className="text-slate-400">Clinic:</span> 
                            <span className="text-amber-400">{getClinicLabel(item.clinicName)}</span>
                          </p>
                          <p className="flex justify-between items-center">
                            <span className="text-slate-400">Submitting Agent:</span>
                            <span>👤 {item.data.agentName}</span>
                          </p>
                          
                          <div className="pt-3 mt-3 border-t border-white/5">
                            <p className="whitespace-pre-line leading-relaxed italic text-sm text-slate-200">
                              "{item.data.complaintDetails}"
                            </p>
                          </div>
                        </div>

                        {((item.data.photos && item.data.photos.length > 0) || item.data.imageUrl || item.data.screenshot || (item.data.links && item.data.links.length > 0)) && (
                          <div className="space-y-3 bg-[#1e1e1e]/20 border border-white/5 p-4 rounded-xl">
                            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black block">
                              📎 Uploaded Attachments & Proofs
                            </span>
                            <AttachmentsDisplay
                              photos={[
                                ...(item.data.photos || []),
                                ...(item.data.imageUrl ? [item.data.imageUrl] : []),
                                ...(item.data.screenshot ? [item.data.screenshot] : [])
                              ].filter(Boolean)}
                              links={item.data.links || []}
                            />
                          </div>
                        )}

                        {item.data.tlComment && (
                          <div className="border border-rose-500/20 bg-rose-500/[0.02] p-5 rounded-xl space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-500/10 pb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-rose-400 text-sm font-bold">📋</span>
                                <p className="text-[10px] text-rose-400 uppercase tracking-wider font-extrabold">
                                  Team Leader Answer ({item.data.tlName || "TL"})
                                </p>
                              </div>
                              {item.data.tlResolutionType && (
                                <span className="inline-flex items-center px-2 py-0.5 bg-rose-500/15 border border-rose-500/30 rounded-md text-[9px] font-black uppercase text-rose-300 tracking-wider">
                                  {item.data.tlResolutionType === "refund" ? "💳 Refund" :
                                   item.data.tlResolutionType === "replacement" ? "🔄 Replacement" :
                                   item.data.tlResolutionType === "apology" ? "✉ apology" :
                                   item.data.tlResolutionType === "escalated" ? "⬆ Escalated" :
                                   item.data.tlResolutionType === "no_action" ? "🚫 No Action" :
                                   item.data.tlResolutionType === "follow_up" ? "⏳ Follow Up Required" : item.data.tlResolutionType}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-200 leading-relaxed font-semibold whitespace-pre-line">
                              {item.data.tlComment}
                            </p>
                          </div>
                        )}

                        {activeComplaintHandlingId === item.data.id && isTLOreSupport && (
                          <div className="p-5 bg-rose-500/[0.02] border border-rose-500/20 rounded-xl space-y-4 shadow-xl text-left w-full mt-1">
                            <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
                              <PenTool className="w-3.5 h-3.5" /> TL Resolution Panel
                            </p>

                            <div>
                              <label className="text-[9px] text-slate-400 uppercase tracking-widest font-bold block mb-2">
                                Resolution Type <span className="text-red-400">*</span>
                              </label>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {[
                                  { value: "refund", label: "💳 Refund" },
                                  { value: "replacement", label: "🔄 Replacement" },
                                  { value: "apology", label: "✉ apology" },
                                  { value: "escalated", label: "⬆ Escalated" },
                                  { value: "no_action", label: "🚫 No Action" },
                                  { value: "follow_up", label: "⏳ Follow Up Required" }
                                ].map((opt) => (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setTlComplaintResolutionType(opt.value)}
                                    className={\`px-3 py-2 rounded-lg text-xs font-bold border transition-all text-left cursor-pointer \${
                                      tlComplaintResolutionType === opt.value
                                        ? "bg-rose-500/20 border-rose-500/40 text-rose-300 animate-fade-in"
                                        : "bg-white/[0.02] border-white/10 text-slate-400 hover:border-white/20"
                                    }\`}
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <label className="text-[9px] text-slate-400 uppercase tracking-widest font-bold block mb-2">
                                Resolution Details / Instructions <span className="text-red-400">*</span>
                              </label>
                              <textarea
                                placeholder="Explain the resolution..."
                                value={tlComplaintComment}
                                onChange={(e) => setTlComplaintComment(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-xs text-slate-100 min-h-[100px] resize-none focus:outline-none focus:border-rose-500"
                              />
                            </div>

                            <div className="flex gap-2 justify-end pt-2">
                              <button
                                type="button"
                                onClick={() => setActiveComplaintHandlingId(null)}
                                className="px-4 py-2 hover:bg-white/10 rounded-lg text-xs font-bold text-slate-400 cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                disabled={!tlComplaintComment.trim() || !tlComplaintResolutionType}
                                onClick={() => handleTLCommentComplaint(item.data.id, tlComplaintComment, tlComplaintResolutionType)}
                                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                              >
                                <CheckCircle2 className="w-4 h-4" /> Submit Resolution
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2 justify-end pt-3 border-t border-white/5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyComplaint(e, item.data);
                            }}
                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-300 text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer mr-auto"
                          >
                            <Copy className="w-3.5 h-3.5" /> Copy Details
                          </button>

                          {activeComplaintHandlingId !== item.data.id && isTLOreSupport && !item.data.tlComment && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveComplaintHandlingId(item.data.id);
                                setTlComplaintComment("");
                                setTlComplaintResolutionType("");
                              }}
                              className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg text-rose-300 text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <PenTool className="w-3.5 h-3.5" /> Resolve Complaint
                            </button>
                          )}
                          
                          {canEditItem(item.createdAt) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditItem("tt_complaint", item.data);
                              }}
                              className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg text-emerald-300 text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" /> Edit ({getRemainingEditTime(item.createdAt)})
                            </button>
                          )}

                          {isSuperAdmin && (
                             <button
                               onClick={(e) => {
                                 e.stopPropagation();
                                 handleDeleteComplaint(item.data.id);
                               }}
                               className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-transparent hover:border-rose-500/10 rounded-lg text-rose-400 text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                             >
                               <Trash2 className="w-3.5 h-3.5" /> Delete
                             </button>
                           )}
                        </div>
                      </div>
                    )}`);

// Now replace for tabbyTamara. We will literally just wrap TabbyTamaraCard around space-y-4 and the copy details button container.
content = content.replace(/\{item\.type === "tabbyTamara" && \([\s\S]*?<\/div>\n\s*\)\}/,
`{item.type === "tabbyTamara" && (
                      <div className="space-y-4">
                        <TabbyTamaraCard
                          req={item.data}
                          currentUser={currentUser}
                          isTLOreSupport={isTLOreSupport}
                          isSuperAdmin={isSuperAdmin}
                          activeFintechHandlingId={activeFintechHandlingId}
                          setActiveFintechHandlingId={setActiveFintechHandlingId}
                          tlFintechPaymentLink={tlFintechPaymentLink}
                          setTlFintechPaymentLink={setTlFintechPaymentLink}
                          tlFintechNotes={tlFintechNotes}
                          setTlFintechNotes={setTlFintechNotes}
                          tlFintechLinks={tlFintechLinks}
                          setTlFintechLinks={setTlFintechLinks}
                          handleConfirmTabbyTamara={handleConfirmTabbyTamara}
                          handleMarkPatientContactedTT={handleMarkPatientContactedTT}
                          getElapsedTimerString={getElapsedTimerString}
                          handleDeleteTabbyTamara={handleDeleteTabbyTamara}
                          canEditItem={canEditItem}
                          getRemainingEditTime={getRemainingEditTime}
                          editLimitMs={10 * 60 * 1000}
                          setEditingItem={(editingItem: any) => onEditItem(editingItem.type, editingItem.data)}
                          addSystemNotification={addSystemNotification}
                          isExpanded={true}
                          onToggle={() => {}}
                        />
                        <div className="flex gap-2 justify-end mt-2 pt-3 border-t border-white/5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const text = generateTabbyTamaraCopyText(item.data);
                              copyToClipboard(text);
                            }}
                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-300 text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer mr-auto"
                          >
                            <Copy className="w-3.5 h-3.5" /> Copy Details
                          </button>
                        </div>
                      </div>
                    )}`);

fs.writeFileSync('src/components/GlobalDashboard.tsx', content);
