import React, { useState } from 'react';
import { User } from '../types';
import { MessageSquare, Paperclip, Send, Download, X } from 'lucide-react';
import { doc, arrayUnion } from 'firebase/firestore';
import { db, wrappedSetDoc as setDoc, wrappedUpdateDoc as updateDoc } from '../firebase';
import { toast } from 'sonner';

interface BaseRequest {
  id: string;
  replies?: { id: string; senderName: string; text: string; createdAt: string; screenshot?: string }[];
  [key: string]: any;
}

export function RequestReplyThread({ 
  request, 
  currentUser, 
  collectionName,
  addSystemNotification,
  requestType,
  requestAgentName
}: { 
  request: BaseRequest, 
  currentUser: User,
  collectionName: string,
  addSystemNotification?: (title: string, message: string, type: any, target: string, stableId?: string, entityType?: any, entityId?: string) => void,
  requestType?: string,
  requestAgentName?: string
}) {
  const [text, setText] = useState('');
  const [screenshotPreview, setScreenshotPreview] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const newReplies = (request.replies || []).filter(r => r.senderName !== currentUser.name).length;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        setScreenshotPreview(event.target?.result as string);
        toast.success("Screenshot loaded");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!String(text || '').trim() && !screenshotPreview) return;

    const newReply = {
      id: `rpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      senderName: currentUser.name,
      text,
      createdAt: new Date().toISOString(),
      screenshot: screenshotPreview || undefined
    };

    // Fallbacks for notifications if props were not provided
    const computedRequestType = requestType || (
      collectionName === 'requests' ? 'Scheduling' :
      collectionName === 'tabby_tamara' ? 'Tabby/Tamara' :
      collectionName === 'tabby_tamara_complaints' ? 'Complaint' :
      collectionName === 'client_comms' ? 'Client Comm' :
      'Request'
    );
    const computedRequestAgentName = requestAgentName || request.agentName || request.callCenterAgentName || request.openedBy;

    try {
      await updateDoc(doc(db, collectionName, request.id), {
        replies: arrayUnion(newReply)
      });

      if (addSystemNotification) {
        const isAgentReplying = currentUser.role === 'agent';
        const target = isAgentReplying ? 'tl' : (computedRequestAgentName || 'tl');
        const title = isAgentReplying
          ? `💬 Agent Reply on ${computedRequestType || 'Request'}`
          : `📩 TL Reply on Your ${computedRequestType || 'Request'}`;
        const message = isAgentReplying
          ? `${currentUser.name} replied to a ${computedRequestType || 'Request'}: "${text.substring(0, 80)}"`
          : `${currentUser.name} replied to your ${computedRequestType || 'Request'}: "${text.substring(0, 80)}"`;
          
        const eType = collectionName === 'inquiries' ? 'inquiry' :
                     collectionName === 'scheduling_requests' ? 'scheduling_request' :
                     collectionName === 'tt_requests' ? 'tt_request' :
                     collectionName === 'tt_complaints' ? 'tt_complaint' :
                     collectionName === 'client_comms' ? 'client_comm' :
                     collectionName === 'cases' ? 'case' : undefined;
                     
        addSystemNotification(title, message, 'general', target, undefined, eType, request.id);
      }

      toast.success("Reply added!");
      setText('');
      setScreenshotPreview('');
    } catch(err) {
      console.error(err);
      toast.error("Failed to add reply");
    }
  };

  const triggerDownload = (url: string) => {
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = `attachment_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch(err) {
      window.open(url, '_blank');
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="mt-2 text-[10px] uppercase font-bold tracking-widest text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-indigo-500/20 transition-colors cursor-pointer select-none"
      >
        <MessageSquare className="w-3.5 h-3.5" />
        Thread ({(request.replies || []).length})
        {newReplies > 0 && !isOpen && (
          <span className="ml-1 w-4 h-4 bg-indigo-500 text-white rounded-full text-[9px] flex items-center justify-center font-bold animate-pulse">
            {newReplies}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="mt-4 bg-black/40 border border-white/10 rounded-2xl p-4 space-y-4">
      <div className="flex justify-between items-center mb-2">
         <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
           <MessageSquare className="w-3.5 h-3.5" /> Thread Notes
         </h4>
         <button onClick={() => setIsOpen(false)} className="p-1 text-slate-500 hover:text-slate-300 transition-colors bg-white/5 rounded-full"><X className="w-3 h-3" /></button>
      </div>

      <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
         {(!request.replies || request.replies.length === 0) ? (
           <p className="text-xs text-slate-500 italic text-center py-4">No replies yet. Start the thread.</p>
         ) : (
           request.replies.map(r => (
             <div key={r.id} className={`p-3 rounded-xl border max-w-[85%] ${r.senderName === currentUser.name ? 'ml-auto bg-indigo-500/10 border-indigo-500/20 text-right' : 'mr-auto bg-white/5 border-white/10 text-left'}`}>
                <div className={`flex items-baseline gap-2 mb-1 ${r.senderName === currentUser.name ? 'justify-end' : 'justify-start'}`}>
                  <span className="font-bold text-xs text-slate-200">{r.senderName}</span>
                  <span className="text-[9px] text-slate-500 font-mono">{new Date(r.createdAt).toLocaleTimeString()}</span>
                </div>
                {r.text && <p className="text-xs text-slate-300 leading-relaxed font-sans">{r.text}</p>}
                
                {r.screenshot && (
                  <div className={`mt-2 ${r.senderName === currentUser.name ? 'flex justify-end' : 'flex justify-start'}`}>
                    <div className="relative group rounded-lg overflow-hidden border border-white/10 max-w-[200px]">
                      <img src={r.screenshot} alt="Attachment" className="w-full h-auto object-contain" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                        <button onClick={() => triggerDownload(r.screenshot!)} className="bg-emerald-500/20 text-emerald-300 p-2 rounded-full hover:bg-emerald-500/40 transition-colors" title="Download">
                           <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
             </div>
           ))
         )}
      </div>

      <form onSubmit={handleReply} className="pt-2 border-t border-white/10 flex flex-col gap-2 relative">
         {screenshotPreview && (
           <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-white/20 mb-2">
             <img src={screenshotPreview} alt="Preview" className="w-full h-full object-cover" />
             <button type="button" onClick={() => setScreenshotPreview('')} className="absolute top-1 right-1 bg-black/70 p-1 rounded-full text-white hover:text-rose-400"><X className="w-3 h-3" /></button>
           </div>
         )}
         
         <div className="flex items-center gap-2">
           <label className="flex shrink-0 items-center justify-center w-10 h-10 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/10 transition-colors cursor-pointer" title="Attach screenshot">
             <Paperclip className="w-4 h-4" />
             <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
           </label>
           
           <input 
             id={`reply-input-${request.id}`}
             value={text}
             onChange={e => setText(e.target.value)}
             className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
             placeholder="Reply or add notes..."
           />
           
           <button type="submit" disabled={!String(text || '').trim() && !screenshotPreview} className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white flex items-center justify-center transition-colors">
             <Send className="w-4 h-4" />
           </button>
         </div>
      </form>
    </div>
  );
}
