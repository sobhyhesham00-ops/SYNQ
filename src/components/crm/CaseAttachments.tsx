import React from "react";
import { Paperclip, Link as LinkIcon, Download, File, Image as ImageIcon } from "lucide-react";
import { normalizeAttachments } from "../../utils";
import { CRMCase } from "./CRMTypes";

interface CaseAttachmentsProps {
  caseData: CRMCase;
}

export const CaseAttachments: React.FC<CaseAttachmentsProps> = ({ caseData }) => {
  // Aggregate all sources of attachments
  const mainPhotos = caseData.raw.photos || [];
  const mainAttachments = caseData.raw.attachments || [];
  const mainLinks = caseData.raw.links || [];

  // Normalize replies
  const replies = caseData.raw.replies || [];
  const replyAttachments: any[] = [];
  const replyLinks: string[] = [];

  replies.forEach((r: any) => {
    if (r.photos) replyAttachments.push(...r.photos);
    if (r.attachments) replyAttachments.push(...r.attachments);
    if (r.links) replyLinks.push(...r.links);
  });

  // Unique lists
  const allAttachedObjects = normalizeAttachments([
    ...mainPhotos,
    ...mainAttachments,
    ...replyAttachments,
  ]);

  const allLinks = Array.from(new Set([...mainLinks, ...replyLinks])).filter(Boolean);

  const isImageMime = (type: string) => {
    return (type || '').toLowerCase().startsWith('image/') || (type || '').toLowerCase().includes('png') || (type || '').toLowerCase().includes('jpg') || (type || '').toLowerCase().includes('jpeg');
  };

  return (
    <div id="case-attachments-vault" className="space-y-5">
      {/* 1. Files & Media Gallery */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Paperclip className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Files & Screenshots ({allAttachedObjects.length})
          </h3>
        </div>

        {allAttachedObjects.length === 0 ? (
          <div className="bg-transparent border border-dashed border-white/5 rounded-xl p-6 text-center">
            <Paperclip className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 text-xs italic">No uploaded media or files.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {allAttachedObjects.map((file, idx) => {
              const isImg = isImageMime(file.type) || file.url.startsWith('data:image/');
              return (
                <div 
                  key={file.id || idx} 
                  className="bg-transparent border border-white/5 rounded-xl p-2.5 flex flex-col justify-between hover:bg-white/[0.06] transition-all group"
                >
                  {isImg ? (
                    <div className="relative aspect-video bg-white/[0.03] rounded-xl overflow-hidden mb-2.5 border border-white/5">
                      <img 
                        src={file.url} 
                        alt={file.name} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-white/[0.03] rounded-xl flex items-center justify-center mb-2.5 border border-white/5">
                      <File className="w-8 h-8 text-slate-500" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-200 truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5 uppercase tracking-wide">
                      {file.type ? file.type.split('/')[1] || file.type : 'Unknown'}
                    </p>
                  </div>

                  <a 
                    href={file.url} 
                    download={file.name}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 w-full bg-white/5 hover:bg-white/10 text-slate-300 font-black text-xs uppercase tracking-wider py-1 rounded-xl text-center flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Download className="w-3 h-3" /> View / Download
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Structured Links List */}
      <div className="pt-2 border-t border-white/5">
        <div className="flex items-center gap-2 mb-3">
          <LinkIcon className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Referenced Links ({allLinks.length})
          </h3>
        </div>

        {allLinks.length === 0 ? (
          <p className="text-xs text-slate-500 italic px-1">No shared web URLs.</p>
        ) : (
          <div className="space-y-2">
            {allLinks.map((link, idx) => (
              <a
                key={idx}
                href={link.startsWith('http') ? link : `https://${link}`}
                target="_blank"
                rel="noreferrer"
                className="block bg-transparent border border-white/5 hover:border-indigo-500/30 rounded-xl p-2.5 text-xs text-indigo-400 hover:text-indigo-300 transition-all font-mono truncate"
              >
                🔗 {link}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
