import React, { useState } from 'react';
import { User, FileAttachment } from '../types';
import { 
  MessageSquare, 
  Paperclip, 
  Send, 
  Download, 
  X, 
  Link as LinkIcon, 
  File, 
  Image as ImageIcon, 
  Plus, 
  Loader2,
  ChevronDown,
  ChevronUp,
  Shield,
  UserCheck,
  UserPlus,
  ExternalLink,
  Activity,
  CheckCircle,
  MessageCircle,
  Clock,
  User as UserIcon
} from 'lucide-react';
import { doc, arrayUnion } from 'firebase/firestore';
import { db, wrappedUpdateDoc as updateDoc } from '../firebase';
import { toast } from 'sonner';
import { compressImage } from '../utils';
import { processAttachments } from '../services/attachmentService';
import { AttachmentsDisplay } from './AttachmentsDisplay';
import { MultiAttachmentUpload } from './MultiAttachmentUpload';

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
  currentUser: User,
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
  const [isOpen, setIsOpen] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [replyPhotos, setReplyPhotos] = useState<string[]>([]);

  const newReplies = (request.replies || []).filter(r => r.senderName !== currentUser.name).length;

  const handleMultipleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const limit = 4;
    if (attachments.length >= limit) {
      toast.error(`You can only upload up to ${limit} attachments.`);
      return;
    }
    
    setIsUploading(true);
    const filesArray = Array.from(files);
    const newAttachments: FileAttachment[] = [];

    for (let i = 0; i < filesArray.length; i++) {
      if (attachments.length + newAttachments.length >= limit) {
        toast.error(`Attachment limit of ${limit} reached. Skipped remaining files.`);
        break;
      }
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

    if (collectionName === "inquiries") {
      if (!String(text || "").trim()) {
        toast.error("Reply text cannot be empty.");
        return;
      }
      if (text.length > 500) {
        toast.error("Reply details cannot exceed 500 characters.");
        return;
      }
    }

    if (!String(text || '').trim() && attachments.length === 0 && links.length === 0 && replyPhotos.length === 0) return;

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
        links,
        screenshot: replyPhotos[0] || undefined,  // backward compat
        photos: replyPhotos,                       // new field
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
        const isAgentReplying = ['agent', 'sme'].includes(currentUser.role as string);
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
      setReplyPhotos([]);
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
        className="w-full mt-3 px-4 py-3 bg-indigo-600/10 border border-indigo-500/20 hover:border-indigo-500/40 rounded-xl flex items-center justify-between group transition-all duration-200 cursor-pointer text-left shadow-sm select-none"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/15 text-indigo-400 group-hover:scale-105 transition-transform duration-200">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-widest block">CRM Activity & Notes Timeline</span>
            <span className="text-xs text-slate-400">Total events recorded: {(request.replies || []).length}</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          {newReplies > 0 && (
            <span className="bg-indigo-500 text-white rounded-full text-[10px] font-bold px-2.2 py-0.5 animate-pulse shadow-md shadow-indigo-500/20">
              {newReplies} new
            </span>
          )}
          <span className="text-[10px] uppercase tracking-wider text-indigo-400 group-hover:text-indigo-300 font-bold flex items-center gap-1.5 bg-indigo-500/10 px-2.5 py-1 rounded-lg">
            Open Timeline
            <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-y-0.5" />
          </span>
        </div>
      </button>
    );
  }

  // Display replies in chronological order (oldest first as they are saved in arrayUnion or historically ordered)
  const sortedReplies = [...(request.replies || [])];

  const getTimelineEventInfo = (reply: ThreadReply) => {
    const isSystem = reply.authorRole === 'system' || reply.senderName === 'System' || reply.authorId === 'system';
    const textLower = String(reply.text || '').toLowerCase();
    
    if (isSystem) {
      if (textLower.includes('claimed')) {
        return {
          icon: <UserCheck className="w-4 h-4" />,
          colorClass: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
          title: 'Case Claimed',
          isSystem: true
        };
      }
      if (textLower.includes('assigned')) {
        return {
          icon: <UserPlus className="w-4 h-4" />,
          colorClass: 'text-indigo-400 bg-indigo-500/15 border-indigo-500/30',
          title: 'Case Assigned',
          isSystem: true
        };
      }
      if (textLower.includes('sent to partner') || textLower.includes('partner')) {
        return {
          icon: <ExternalLink className="w-4 h-4" />,
          colorClass: 'text-rose-400 bg-rose-500/15 border-rose-500/30',
          title: 'Sent to Partner',
          isSystem: true
        };
      }
      return {
        icon: <Activity className="w-4 h-4" />,
        colorClass: 'text-slate-400 bg-slate-800 border-slate-700/50',
        title: 'System Activity',
        isSystem: true
      };
    }
    
    const isTL = reply.authorRole === 'tl' || reply.authorRole?.toUpperCase() === 'TEAM LEADER';
    if (isTL) {
      return {
        icon: <Shield className="w-4 h-4" />,
        colorClass: 'text-amber-400 bg-amber-500/15 border-amber-500/40',
        title: 'Team Leader Note',
        isSystem: false
      };
    }
    
    return {
      icon: <UserIcon className="w-4 h-4" />,
      colorClass: 'text-indigo-400 bg-indigo-500/15 border-indigo-500/30',
      title: 'Agent Comment',
      isSystem: false
    };
  };

  return (
    <div className="mt-4 bg-slate-950/40 border border-white/10 rounded-2xl p-5 space-y-5 text-left shadow-xl">
      <div className="flex justify-between items-center pb-3 border-b border-white/5">
         <div className="flex items-center gap-2.5">
           <div className="p-2 bg-indigo-500/15 text-indigo-400 rounded-xl">
             <MessageSquare className="w-4 h-4" />
           </div>
           <div>
             <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest">
               Enterprise Timeline Feed
             </h4>
             <p className="text-[10px] text-slate-400 mt-0.5">Chronological audit stream & correspondence logs</p>
           </div>
         </div>
         <button 
           onClick={() => setIsOpen(false)} 
           className="px-2.5 py-1.5 text-slate-400 hover:text-slate-200 transition-colors bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 border border-white/5"
         >
           Collapse <ChevronUp className="w-3.5 h-3.5" />
         </button>
      </div>

      <div className="relative border-l border-slate-700/60 ml-5 pl-8 pr-1 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar py-2 text-left">
         {(sortedReplies.length === 0) ? (
            <div className="relative group text-left py-4">
              <div className="absolute -left-[45px] top-4.5 bg-white/[0.04] border border-dashed border-slate-600 rounded-full w-8 h-8 flex items-center justify-center text-slate-500">
                <Clock className="w-4 h-4 animate-pulse" />
              </div>
              <div className="p-4 rounded-xl border border-dashed border-white/5 bg-white/2 text-center text-xs text-slate-500">
                No CRM logs or replies recorded yet. Start of audit stream.
              </div>
            </div>
         ) : (
            sortedReplies.map(r => {
              const eventInfo = getTimelineEventInfo(r);
              return (
                <div key={r.id} className="relative group text-left animate-fade-in">
                  {/* Connected Timeline Dot/Icon */}
                  <div className={`absolute -left-[49px] top-1.5 rounded-full w-8 h-8 flex items-center justify-center border shadow-md transition-transform duration-200 group-hover:scale-105 z-10 ${eventInfo.colorClass}`}>
                     {eventInfo.icon}
                  </div>

                  {eventInfo.isSystem ? (
                    /* Timeline Activity Log */
                    <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3.5 flex items-center justify-between text-left hover:bg-white/[0.05] transition-colors shadow-sm">
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-slate-400 font-mono tracking-wider uppercase block">{eventInfo.title}</span>
                        <p className="text-sm text-slate-200 leading-relaxed font-sans">{r.text}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono self-start mt-0.5 shrink-0 ml-4 bg-slate-950/40 px-2.5 py-1 rounded-md border border-white/5">{new Date(r.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                  ) : (
                    /* User correspondency bubble / note */
                    <div className={`p-4 rounded-xl border transition-all hover:bg-white/[0.05] duration-200 hover:shadow-md ${r.senderName === currentUser.name ? 'bg-indigo-500/[0.06] border-indigo-500/20' : 'bg-white/[0.03] border-white/[0.06]'}`}>
                       <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-2.5 mb-2.5 flex-wrap">
                         <div className="flex items-center gap-2">
                           <span className={`font-bold text-sm ${r.senderName === currentUser.name ? 'text-indigo-300' : 'text-slate-200'}`}>{r.senderName}</span>
                           {r.authorRole && (
                             <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-md border ${r.authorRole === 'tl' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'}`}>
                               {r.authorRole === 'tl' ? 'TEAM LEADER' : r.authorRole.toUpperCase()}
                             </span>
                           )}
                         </div>
                         <span className="text-[11px] text-slate-400 font-mono bg-slate-950/30 px-2.5 py-1 rounded border border-white/5">{new Date(r.createdAt).toLocaleString()}</span>
                       </div>
                       
                       {r.text && <p className="text-sm text-slate-100 leading-relaxed font-sans whitespace-pre-line break-words text-left">{r.text}</p>}
                       
                       {/* Unique CRM multi-attachments area */}
                       <div className="mt-3 pt-2.5 border-t border-white/5">
                         <AttachmentsDisplay 
                           photos={[
                             ...(r.screenshot ? [r.screenshot] : []),
                             ...(r.photos || []),
                           ]}
                           attachments={r.attachments || []}
                           links={r.links || []}
                         />
                       </div>
                    </div>
                  )}
                </div>
              );
            })
         )}
      </div>

      <form onSubmit={handleReply} className="pt-4 border-t border-white/10 flex flex-col gap-3 relative text-left">
          {/* MultiAttachmentUpload for reply screenshots */}
          <div className="bg-white/[0.03] p-4 border border-white/[0.06] rounded-xl">
            <MultiAttachmentUpload
              photos={replyPhotos}
              links={[]}
              onPhotosChange={setReplyPhotos}
              onLinksChange={() => {}}
              photosLabel='Attach screenshots & files to this timeline correspondence'
            />
          </div>

          {/* Active file attachments queue */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2.5 p-2 bg-white/[0.03] rounded-xl border border-white/5">
              {attachments.map((att, idx) => {
                const isImage = att.type?.startsWith('image/');
                return (
                  <div key={att.id} className="relative group w-16 h-16 rounded-xl border border-white/20 overflow-hidden bg-white/[0.04] shadow-md">
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
                      className="absolute top-1 right-1 bg-black/90 p-1 rounded-full text-white hover:text-rose-400 cursor-pointer active:scale-95 transition-all"
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
            <div className="flex flex-col gap-1.5">
              {links.map((linkStr, idx) => (
                <div key={idx} className="flex justify-between items-center bg-white/5 border border-white/10 rounded-lg p-2 text-[10px] text-indigo-300 font-mono">
                   <span className="truncate max-w-[400px]">{linkStr}</span>
                   <button type="button" onClick={() => handleRemoveLink(idx)} className="text-red-400 hover:text-red-300 bg-red-400/10 hover:bg-red-400/20 rounded p-1 transition-all"><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          )}

          {/* Expandable Link Input */}
          {showLinkInput && (
            <div className="flex items-center gap-2 p-2 bg-slate-950/60 border border-white/10 rounded-xl">
              <LinkIcon className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
              <input 
                type="text" 
                value={linkInput} 
                onChange={e => setLinkInput(e.target.value)}
                placeholder="Paste URL (e.g. Google Docs, Loom, Sheets, drive link...)" 
                className="flex-grow bg-transparent text-xs text-white placeholder-slate-500 border-none outline-none focus:ring-0" 
              />
              <button type="button" onClick={handleAddLink} className="text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg px-3 py-1.5 active:scale-95 transition-all">Add Link</button>
              <button type="button" onClick={() => setShowLinkInput(false)} className="text-slate-400 hover:text-rose-400 p-1.5 transition-all"><X className="w-3.5 h-3.5" /></button>
            </div>
          )}
          
          {/* CRM Compound Action Composer */}
          <div className="bg-white/[0.02] border border-white/10 rounded-xl p-3 flex flex-col gap-3 shadow-inner">
            <textarea 
              id={`reply-input-${request.id}`}
              value={text}
              onChange={e => {
                const val = e.target.value;
                const isInquiry = collectionName === "inquiries";
                if (isInquiry && val.length > 500) {
                  return;
                }
                setText(val);
              }}
              maxLength={collectionName === "inquiries" ? 500 : undefined}
              rows={2}
              className="w-full bg-transparent border-none rounded-xl p-1 text-xs text-slate-100 placeholder-slate-500 focus:ring-0 focus:outline-none font-sans resize-none custom-scrollbar leading-relaxed text-left"
              placeholder="Record calling status, client correspondence, or submit Team Leader/Agent notes..."
            />
            
            {collectionName === "inquiries" && (
              <div className="text-right text-[10px] text-slate-400 font-mono pr-1 -mt-1">
                {text.length} / 500 characters
              </div>
            )}
            
            <div className="flex items-center justify-between border-t border-white/5 pt-2 flex-wrap gap-2">
              <div className="flex gap-2">
                <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5 transition-all cursor-pointer text-[10px] uppercase font-bold tracking-wider select-none ${isUploading ? 'opacity-50 pointer-events-none' : ''}`} title="Attach files/images">
                  {isUploading ? (
                    <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                  ) : (
                    <Paperclip className="w-3.5 h-3.5" />
                  )}
                  <span>Attach Document</span>
                  <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" onChange={e => handleMultipleFiles(e.target.files)} className="hidden" disabled={isUploading} />
                </label>

                <button 
                  type="button" 
                  onClick={() => setShowLinkInput(!showLinkInput)} 
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5 transition-all cursor-pointer text-[10px] uppercase font-bold tracking-wider select-none ${showLinkInput ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25' : ''}`} 
                  title="Attach hyperlink"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Attach URL</span>
                </button>
              </div>
              
              <button 
                type="submit" 
                disabled={isUploading || (!String(text || '').trim() && attachments.length === 0 && links.length === 0 && replyPhotos.length === 0)} 
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[10px] uppercase font-bold tracking-widest flex items-center gap-1.5 transition-all cursor-pointer hover:shadow-lg hover:shadow-indigo-500/15"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Publish Update</span>
              </button>
            </div>
          </div>
      </form>
    </div>
  );
}
