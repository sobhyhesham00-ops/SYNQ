import React, { useState, useEffect } from 'react';
import { UploadCloud, Link as LinkIcon, X, File, Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string; // data URL or http URL
  file?: globalThis.File;
}

interface ProfessionalAttachmentUploaderProps {
  attachments: FileAttachment[];
  links: string[];
  onAttachmentsChange: (attachments: FileAttachment[]) => void;
  onLinksChange: (links: string[]) => void;
  onUploadStateChange?: (isUploading: boolean) => void;
  maxAttachments?: number;
}

import { validateFile } from "../services/attachmentService";

export const ProfessionalAttachmentUploader: React.FC<ProfessionalAttachmentUploaderProps> = ({
  attachments = [],
  links = [],
  onAttachmentsChange,
  onLinksChange,
  onUploadStateChange,
  maxAttachments = 4
}) => {
  const [tempLinkInput, setTempLinkInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{current: number, total: number} | null>(null);

  useEffect(() => {
    if (onUploadStateChange) onUploadStateChange(isUploading);
  }, [isUploading, onUploadStateChange]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const filesArray: File[] = [];
    for (let i = 0; i < items.length; i++) {
        const file = items[i].getAsFile();
        if (file) filesArray.push(file);
    }
    if (filesArray.length > 0) handleFiles(filesArray as unknown as FileList);
  };

  const handleFiles = async (files: FileList | globalThis.File[]) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);

    if (attachments.length >= 4 || attachments.length + fileArray.length > 4) {
      toast.error("You can attach a maximum of 4 files per inquiry.");
      return;
    }

    setIsUploading(true);
    setUploadProgress({ current: 0, total: fileArray.length });

    const newAttachments: FileAttachment[] = [];

    for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        
        // 1. Enforce 10MB limit per file
        if (file.size > 10 * 1024 * 1024) {
            toast.error(`File '${file.name}' exceeds the 10MB size limit.`);
            continue;
        }

        // 2. Validate file type & general safety
        const validation = validateFile(file);
        if (!validation.valid) {
            toast.error(validation.error);
            continue;
        }

        // 3. Prevent exact duplicates
        if (attachments.some(a => a.name === file.name && a.size === file.size) || newAttachments.some(a => a.name === file.name && a.size === file.size)) {
            toast.error(`${file.name} is already attached.`);
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
        } catch (e: any) {
            console.error('File process error', e);
            const code = e?.code ? ` (${e.code})` : '';
            toast.error(`Failed to process ${file.name}: ${e.message || e}${code}`);
        }
        setUploadProgress({ current: i + 1, total: fileArray.length });
    }

    if (newAttachments.length > 0) {
        onAttachmentsChange([...attachments, ...newAttachments]);
        toast.success(`Attached ${newAttachments.length} file(s)`);
    }
    
    setIsUploading(false);
    setUploadProgress(null);
  };

  const handleRemoveAttachment = (id: string) => {
    onAttachmentsChange(attachments.filter(a => a.id !== id));
  };

  const handleAddLink = () => {
    let url = tempLinkInput.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    if (links.includes(url)) {
      toast.error('Link already added');
      return;
    }
    onLinksChange([...links, url]);
    setTempLinkInput('');
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div 
      className={`space-y-4 rounded-xl transition-all ${isDragging ? 'bg-indigo-500/10 ring-2 ring-indigo-500 p-2 border border-indigo-500/30' : ''}`}
      onPaste={handlePaste}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-widest block text-slate-400">
           Files & Screenshots
        </label>
        
        <div className="flex flex-col gap-2 relative">
            <label className={`w-full py-5 border-2 border-dashed rounded-xl transition-all flex flex-col items-center justify-center cursor-pointer 
               ${isDragging ? 'border-indigo-400 bg-indigo-500/20' : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-indigo-500/50'}
               ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
            >
                <input 
                    type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" className="hidden"
                    onChange={(e) => handleFiles(e.target.files as unknown as FileList)}
                />
                {isUploading ? (
                   <div className="flex flex-col items-center gap-2">
                       <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                       <span className="text-xs text-indigo-300 font-bold uppercase tracking-wider">
                           Uploading {uploadProgress?.current} / {uploadProgress?.total}
                       </span>
                   </div>
                ) : (
                   <div className="flex flex-col items-center gap-1.5 text-center px-4">
                       <UploadCloud className="w-8 h-8 text-slate-400 mb-1" />
                       <span className="text-xs font-semibold text-slate-200">Click to upload or drag & drop</span>
                       <span className="text-[10px] font-medium text-slate-400 leading-relaxed">
                         Max 4 files, 10MB each. Files are uploaded securely to the cloud on submission.
                       </span>
                   </div>
                )}
            </label>
        </div>

        {attachments.length > 0 && (
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
               {attachments.map(att => {
                  const isImage = att.type.startsWith('image/');
                  return (
                     <div key={att.id} className="relative group flex items-start gap-2 p-2 rounded-lg bg-white/[0.03] border border-white/5 hover:border-indigo-500/30 transition-colors">
                         <div className="w-10 h-10 shrink-0 rounded overflow-hidden bg-slate-800 flex items-center justify-center border border-white/10">
                            {isImage ? (
                               <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                            ) : (
                               <File className="w-5 h-5 text-indigo-400" />
                            )}
                         </div>
                         <div className="flex-1 min-w-0 pr-6">
                            <p className="text-[11px] font-semibold text-slate-200 truncate" title={att.name}>{att.name}</p>
                            <p className="text-[9px] text-slate-500 uppercase tracking-wide flex items-center gap-1">
                               {isImage ? <ImageIcon className="w-3 h-3" /> : ''}
                               {(att.type.split('/')[1] || 'FILE').substring(0, 4)} • {formatSize(att.size)}
                            </p>
                         </div>
                         <button
                            type="button"
                            onClick={() => handleRemoveAttachment(att.id)}
                            className="absolute top-2 right-2 p-1 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded transition-colors"
                         >
                            <X className="w-3 h-3" />
                         </button>
                     </div>
                  );
               })}
           </div>
        )}
      </div>

      <div className="space-y-2 pt-2">
        <label className="text-[10px] font-bold uppercase tracking-widest block text-slate-400">
          Links & URLs
        </label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <LinkIcon className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text" placeholder="https://" value={tempLinkInput}
              onChange={(e) => setTempLinkInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLink())}
              className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-all font-sans"
            />
          </div>
          <button type="button" onClick={handleAddLink} className="px-3 py-2 bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 font-bold border border-indigo-500/20 rounded-lg uppercase tracking-wider text-xs transition-colors h-[34px]">
            Add
          </button>
        </div>

        {links.length > 0 && (
          <div className="space-y-1.5 pt-1">
            {links.map((linkStr, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-white/5 border border-white/10 rounded-lg text-xs">
                <span className="text-indigo-300 underline font-mono truncate mr-2" title={linkStr}>{linkStr}</span>
                <button type="button" onClick={() => onLinksChange(links.filter((_, i) => i !== index))} className="text-red-400 hover:text-red-300 text-[10px] font-bold uppercase px-2 py-1 bg-red-400/10 rounded border border-red-400/20 relative z-10 cursor-pointer">
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
