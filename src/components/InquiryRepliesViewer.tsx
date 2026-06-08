import React from "react";
import { CheckCircle2 } from "lucide-react";
import { AttachmentsDisplay } from "./AttachmentsDisplay";

interface InquiryRepliesViewerProps {
  inquiry: any;
}

export const InquiryRepliesViewer: React.FC<InquiryRepliesViewerProps> = ({ inquiry }) => {
  const hasLegacyAnswer = inquiry.status === "answered" && inquiry.answer;
  const hasReplies = inquiry.replies && inquiry.replies.length > 0;

  if (!hasLegacyAnswer && !hasReplies) return null;

  return (
    <div className="space-y-3 mt-3">
      {hasReplies ? (
         <div className="space-y-3">
           {inquiry.replies.map((reply: any, idx: number) => (
              <div key={reply.id || idx} className="p-3 bg-emerald-500/10 border-l-2 border-emerald-500/50 rounded-r-xl space-y-2 text-left animate-fade-in">
                 <div className="flex justify-between items-start gap-2">
                    <p className="text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1 uppercase">
                      <CheckCircle2 className="w-3 h-3" /> Reply from {reply.senderName}
                    </p>
                    <span className="text-[9px] text-slate-500 font-mono whitespace-nowrap">
                      {new Date(reply.createdAt).toLocaleString()}
                    </span>
                 </div>
                 {reply.text && (
                   <div className="text-xs text-emerald-100/90 whitespace-pre-wrap leading-relaxed font-sans">
                     {reply.text}
                   </div>
                 )}
                 {/* Display Attachments for this reply */}
                 <AttachmentsDisplay 
                   attachments={reply.attachments} 
                   links={reply.links} 
                 />
              </div>
           ))}
         </div>
      ) : (
         <div className="p-3 bg-emerald-500/10 border-l-2 border-emerald-500/50 rounded-r-xl space-y-1 text-left animate-fade-in">
            <div className="flex justify-between items-start gap-2">
               <p className="text-[10px] font-mono font-bold text-emerald-400 mb-1 flex items-center gap-1 uppercase">
                 <CheckCircle2 className="w-3 h-3" /> TL RESOLUTION: {inquiry.answeredBy || "Leader"}
               </p>
               {inquiry.answeredAt && (
                 <span className="text-[9px] text-slate-500 font-mono">
                   {new Date(inquiry.answeredAt).toLocaleString()}
                 </span>
               )}
            </div>
            <p className="text-xs text-emerald-200">
              {inquiry.answer}
            </p>
         </div>
      )}
    </div>
  );
};
