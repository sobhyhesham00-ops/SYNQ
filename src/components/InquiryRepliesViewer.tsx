import React from "react";
import { CheckCircle2, MessageSquare, Clock, Shield } from "lucide-react";
import { AttachmentsDisplay } from "./AttachmentsDisplay";

interface InquiryRepliesViewerProps {
  inquiry: any;
}

export const InquiryRepliesViewer: React.FC<InquiryRepliesViewerProps> = ({ inquiry }) => {
  const hasLegacyAnswer = !!inquiry.answer;
  const hasReplies = inquiry.replies && inquiry.replies.length > 0;

  if (!hasLegacyAnswer && !hasReplies) return null;

  return (
    <div className="mt-4 p-4 bg-transparent border border-emerald-500/15 rounded-xl space-y-4 text-left">
      <div className="flex items-center gap-2 pb-2.5 border-b border-emerald-500/10">
        <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <div>
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest block font-sans">Solutions & Activity Logs</span>
          <span className="text-[11px] text-slate-400">Recorded client resolutions and correspondence</span>
        </div>
      </div>

      <div className="relative border-l border-transparent ml-4 pl-6 space-y-5 py-1">
        {hasReplies ? (
          inquiry.replies.map((reply: any, idx: number) => {
            const isTL = reply.authorRole === 'tl' || reply.authorRole?.toUpperCase() === 'TEAM LEADER';
            return (
              <div key={reply.id || idx} className="relative group text-left animate-fade-in font-sans">
                {/* Timeline Dot */}
                <div className={`absolute -left-[33px] top-1 rounded-full w-6 h-6 flex items-center justify-center border ${isTL ? 'bg-amber-500/10 border-transparent text-amber-400' : 'bg-emerald-500/10 border-transparent text-emerald-400'}`}>
                  {isTL ? <Shield className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                </div>

                <div className="p-3 bg-white/[0.04] border border-white/8 rounded-xl space-y-2 hover:bg-white/[0.05] duration-150">
                  <div className="flex justify-between items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-slate-200">{reply.senderName}</span>
                      <span className={`text-[11px] font-bold uppercase tracking-widest px-1.5 py-0.2 rounded border ${isTL ? 'text-amber-400 bg-amber-500/5 border-transparent' : 'text-emerald-400 bg-transparent border border-white/12 text-white border-transparent'}`}>
                        {reply.authorRole || "Leader"}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-sans flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(reply.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {reply.text && (
                    <p className="text-[11px] text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                      {reply.text}
                    </p>
                  )}
                  {/* Display Attachments for this reply */}
                  <div className="pt-1.5 border-t border-white/8">
                    <AttachmentsDisplay 
                      attachments={[...(reply.attachments || []), ...(reply.attachmentsObjects || []), reply.imageUrl, reply.screenshot].filter(Boolean)} 
                      photos={reply.photos}
                      links={reply.links} 
                    />
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          /* Legacy single answer fallback styled beautifully */
          <div className="relative group text-left animate-fade-in font-sans">
            {/* Timeline Dot */}
            <div className="absolute -left-[33px] top-1 rounded-full w-6 h-6 flex items-center justify-center border bg-emerald-500/10 border-transparent text-emerald-400">
              <Shield className="w-3 h-3" />
            </div>

            <div className="p-3 bg-white/[0.04] border border-white/8 rounded-xl space-y-2 hover:bg-white/[0.05] duration-150">
              <div className="flex justify-between items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-200">{inquiry.answeredBy || "Leader"}</span>
                  <span className="text-[11px] font-bold uppercase tracking-widest px-1.5 py-0.2 rounded border text-emerald-400 bg-transparent border border-white/12 text-white border-transparent">
                    TEAM LEADER
                  </span>
                </div>
                {inquiry.answeredAt && (
                  <span className="text-[11px] text-slate-500 font-sans flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(inquiry.answeredAt).toLocaleString()}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                {inquiry.answer}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
