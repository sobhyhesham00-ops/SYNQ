import React, { useState } from 'react';
import { User, FileAttachment } from '../types';
import { MessageSquare, Paperclip, Send, Download, X, Link as LinkIcon, File, Image as ImageIcon, Plus, Loader2 } from 'lucide-react';
import { doc, arrayUnion } from 'firebase/firestore';
import { db, wrappedUpdateDoc as updateDoc } from '../firebase';
import { toast } from 'sonner';
import { compressImage } from '../utils';
import { processAttachments } from '../services/attachmentService';
import { AttachmentsDisplay } from './AttachmentsDisplay';

interface ThreadReply {
  id: string;
  authorId?: string;
  senderName: string;
  authorRole?: string;
  text: string;
  createdAt: string;
  attachments?: FileAttachment[];
  links?: string[];
  screenshot?: string;
  photos?: string[];
  imageUrl?: string;
  [key: string]: any;
}

interface BaseRequest {
  id: string;
  replies?: ThreadReply[];
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
  currentUser: User | null,
  collectionName: string,
  addSystemNotification?: (title: string, message: string, type: any, target: string, stableId?: string, entityType?: any, entityId?: string) => void,
  requestType?: string,
  requestAgentName?: string
}) {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [links, setLinks] = useState<string[]>([]);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const newReplies = (request.replies || []).filter(r => r.senderName !== currentUser.name).length;

  const handleMultipleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    const filesArray = Array.from(files);
    const newAttachments: FileAttachment[] = [];

    for (let i = 0; i < filesArray.length; i++) {
      const file = filesArray[i];
      
      // Size limit (Max 10MB per file)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File "${file.name}" is too large. Max size is 10MB.`);
        continue;
      }

      try {
        const previewUrl = URL.createObjectURL(file);
        
        newAttachments.push({
          id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          url: previewUrl,
          file: file
        });
      } catch (err) {
        console.error('File load error', err);
        toast.error(`Failed to load "${file.name}"`);
      }
    }

    if (newAttachments.length > 0) {
      setAttachments(prev => [...prev, ...newAttachments]);
      toast.success(`Successfully loaded ${newAttachments.length} file(s)`);
    }
    
    setIsUploading(false);
  };

  const handleAddLink = () => {
    if (!String(linkInput || '').trim()) return;
    let url = String(linkInput || '').trim();
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    if (links.includes(url)) {
      toast.error('Link already added');
      return;
    }
    setLinks([...links, url]);
    setLinkInput('');
    setShowLinkInput(false);
  };

  const handleRemoveLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!String(text || '').trim() && attachments.length === 0 && links.length === 0) return;

    try {
      const eType = collectionName === 'inquiries' ? 'inquiry' :
                    collectionName === 'scheduling_requests' ? 'scheduling' :
                    collectionName === 'tt_complaints' ? 'tt_complaint' :
                    collectionName === 'client_comms' ? 'client_comm' : 'tt_request';

      const processedAttachments = await processAttachments(
        attachments,
        eType,
        request.id,
        "reply"
      );

      const newReply: ThreadReply = {
        id: `rpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        authorId: currentUser.id,
        senderName: currentUser.name,
        authorRole: currentUser.role,
        text,
        createdAt: new Date().toISOString(),
        attachments: processedAttachments,
        links
      };

      // Fallbacks for notifications if props were not provided
      const computedRequestType = requestType || (
        collectionName === 'scheduling_requests' ? 'Scheduling' :
        collectionName === 'tt_requests' ? 'Tabby/Tamara' :
        collectionName === 'tt_complaints' ? 'Complaint' :
        collectionName === 'client_comms' ? 'Client Comm' :
        'Request'
      );
      const computedRequestAgentName = requestAgentName || request.agentName || request.callCenterAgentName || request.openedBy;

      await updateDoc(doc(db, collectionName, request.id), {
        replies: arrayUnion(newReply)
      });

      if (addSystemNotification) {
        const isAgentReplying = currentUser.role === 'agent';
        const target = isAgentReplying ? 'tl' : (computedRequestAgentName || 'tl');
        const title = isAgentReplying
          ? `Agent Reply on ${computedRequestType || 'Request'}`
          : `TL Reply on Your ${computedRequestType || 'Request'}`;
        const summaryText = text ? `"${text.substring(0, 80)}"` : `with ${attachments.length} attachment(s)`;
        const message = isAgentReplying
          ? `${currentUser.name} replied to a ${computedRequestType || 'Request'}: ${summaryText}`
          : `${currentUser.name} replied to your ${computedRequestType || 'Request'}: ${summaryText}`;
          
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
      setAttachments([]);
      setLinks([]);
    } catch(err) {
      console.error(err);
      toast.error("Failed to add reply");
    }
  };

  const triggerDownload = (url: string, filename?: string) => {
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `attachment_${Date.now()}.png`;
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

  // Display replies in chronological order (oldest first as they are saved in arrayUnion or historically ordered)
  const sortedReplies = [...(request.replies || [])];

  return (
    <div className="mt-4 bg-black/40 border border-white/10 rounded-2xl p-4 space-y-4 text-left">
      <div className="flex justify-between items-center mb-2">
         <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
           <MessageSquare className="w-3.5 h-3.5" /> Thread Notes
         </h4>
         <button onClick={() => setIsOpen(false)} className="p-1 text-slate-500 hover:text-slate-300 transition-colors bg-white/5 rounded-full cursor-pointer"><X className="w-3 h-3" /></button>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
         {(sortedReplies.length === 0) ? (
           <p className="text-xs text-slate-500 italic text-center py-4">No replies yet. Start the thread.</p>
         ) : (
           sortedReplies.map(r => (
             <div key={r.id} className={`p-3 rounded-xl border max-w-[85%] ${r.senderName === currentUser.name ? 'ml-auto bg-indigo-500/10 border-indigo-500/20 text-right' : 'mr-auto bg-white/5 border-white/10 text-left'}`}>
                <div className={`flex flex-wrap items-baseline gap-1.5 mb-1 ${r.senderName === currentUser.name ? 'justify-end' : 'justify-start'}`}>
                  <span className="font-bold text-xs text-slate-200">{r.senderName}</span>
                  {r.authorRole && (
                    <span className="text-[8px] font-extrabold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-1 py-0.2 rounded border border-indigo-500/10">
                      {r.authorRole}
                    </span>
                  )}
                  <span className="text-[9px] text-slate-500 font-mono">{new Date(r.createdAt).toLocaleTimeString()}</span>
                </div>
                {r.text && <p className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-line text-left">{r.text}</p>}
                
                {/* Unified Attachments Display */}
                <div className={`${r.senderName === currentUser.name ? 'flex justify-end' : 'flex justify-start'}`}>
                  <AttachmentsDisplay
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
                  />
                </div>
             </div>
           ))
         )}
      </div>

      <form onSubmit={handleReply} className="pt-2 border-t border-white/10 flex flex-col gap-2 relative text-left">
          {/* Active file attachments queue */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-1.5">
              {attachments.map((att, idx) => {
                const isImage = att.type?.startsWith('image/');
                return (
                  <div key={att.id} className="relative group w-16 h-16 rounded-xl border border-white/20 overflow-hidden bg-slate-900 shadow">
                    {isImage ? (
                      <img referrerPolicy="no-referrer" src={att.url} alt="Screenshot queue" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800">
                        <File className="w-5 h-5 text-slate-400" />
                        <span className="text-[7px] text-slate-400 font-extrabold truncate max-w-[50px] uppercase mt-0.5">{att.name}</span>
                      </div>
                    )}
                    <button 
                      type="button" 
                      onClick={() => handleRemoveAttachment(idx)} 
                      className="absolute top-1 right-1 bg-black/85 p-1 rounded-full text-white hover:text-rose-400 cursor-pointer active:scale-95"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Active links queue */}
          {links.length > 0 && (
            <div className="flex flex-col gap-1 mb-1.5">
              {links.map((linkStr, idx) => (
                <div key={idx} className="flex justify-between items-center bg-white/5 border border-white/10 rounded-lg p-1.5 text-[10px] text-indigo-300">
                   <span className="truncate max-w-[240px] font-mono">{linkStr}</span>
                   <button type="button" onClick={() => handleRemoveLink(idx)} className="text-red-400 hover:text-red-300 bg-red-400/10 hover:bg-red-400/20 rounded p-1"><X className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
          )}

          {/* Expandable Link Input */}
          {showLinkInput && (
            <div className="flex items-center gap-1.5 p-1.5 bg-white/5 border border-white/10 rounded-xl mb-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
              <input 
                type="text" 
                value={linkInput} 
                onChange={e => setLinkInput(e.target.value)}
                placeholder="Paste URL..." 
                className="flex-grow bg-transparent text-xs text-white placeholder-slate-500 border-none outline-none focus:ring-0" 
              />
              <button type="button" onClick={handleAddLink} className="text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded px-2.5 py-1.5 active:scale-95">Add Link</button>
              <button type="button" onClick={() => setShowLinkInput(false)} className="text-slate-400 hover:text-rose-400 p-1"><X className="w-3.5 h-3.5" /></button>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <div className="flex gap-1 shrink-0">
              <label className={`flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/10 transition-colors cursor-pointer ${isUploading ? 'opacity-50 pointer-events-none' : ''}`} title="Attach files/images">
                {isUploading ? (
                  <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                ) : (
                  <Paperclip className="w-4 h-4" />
                )}
                <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" onChange={e => handleMultipleFiles(e.target.files)} className="hidden" disabled={isUploading} />
              </label>

              <button 
                type="button" 
                onClick={() => setShowLinkInput(!showLinkInput)} 
                className={`flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/10 transition-colors cursor-pointer ${showLinkInput ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' : ''}`} 
                title="Attach hyperlink"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            <input 
              id={`reply-input-${request.id}`}
              value={text}
              onChange={e => setText(e.target.value)}
              className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              placeholder="Reply or add notes..."
            />
            
            <button type="submit" disabled={isUploading || (!String(text || '').trim() && attachments.length === 0 && links.length === 0)} className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white flex items-center justify-center transition-colors shrink-0">
              <Send className="w-4 h-4" />
            </button>
          </div>
      </form>
    </div>
  );
}
