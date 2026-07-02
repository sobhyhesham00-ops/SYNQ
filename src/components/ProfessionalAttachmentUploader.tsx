import React, { useState, useEffect, useRef } from 'react';
import { Link as LinkIcon, Upload, X, FileText, Loader2, AlertCircle, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage, ensureAuth } from '../firebase';

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string; // download URL
  file?: globalThis.File;
}

interface UploadingFile {
  tempId: string;
  name: string;
  progress: number;
  error?: string;
}

interface ProfessionalAttachmentUploaderProps {
  attachments: FileAttachment[];
  links: string[];
  onAttachmentsChange: (attachments: FileAttachment[]) => void;
  onLinksChange: (links: string[]) => void;
  onUploadStateChange?: (isUploading: boolean) => void;
  maxAttachments?: number;
}

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 
  'application/pdf', 'application/msword', 
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
  'application/vnd.ms-excel', 
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const ProfessionalAttachmentUploader: React.FC<ProfessionalAttachmentUploaderProps> = ({
  attachments = [],
  links = [],
  onAttachmentsChange,
  onLinksChange,
  onUploadStateChange,
  maxAttachments = 4
}) => {
  const [tempLinkInput, setTempLinkInput] = useState('');
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let mounted = true;
    ensureAuth().then(() => { if (mounted) setAuthReady(true); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (onUploadStateChange) onUploadStateChange(uploadingFiles.length > 0);
  }, [uploadingFiles.length, onUploadStateChange]);

  const slotsUsed = attachments.length + uploadingFiles.length;
  const slotsLeft = maxAttachments - slotsUsed;

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) return `${file.name} exceeds the 10MB limit.`;
    if (!ALLOWED_TYPES.includes(file.type) && !file.type.startsWith('image/')) {
      return `${file.name} is not a supported file type.`;
    }
    return null;
  };

  const uploadOne = async (file: File, tempId: string) => {
    try {
      await ensureAuth();
      const timestamp = Date.now();
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const path = `case-attachments/general/upload/root/${timestamp}-${safeFileName}`;
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file);

      await new Promise<void>((resolve, reject) => {
        uploadTask.on('state_changed',
          (snapshot) => {
            const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            setUploadingFiles(prev => prev.map(f => f.tempId === tempId ? { ...f, progress: pct } : f));
          },
          (error) => reject(error),
          () => resolve()
        );
      });

      const url = await getDownloadURL(uploadTask.snapshot.ref);
      const newAttachment: FileAttachment = {
        id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        url: url
      };
      onAttachmentsChange([...attachments, newAttachment]);
    } catch (err: any) {
      console.error('Upload failed', err);
      setUploadingFiles(prev => prev.map(f => f.tempId === tempId ? { ...f, error: 'Upload failed' } : f));
      toast.error(`Failed to upload ${file.name}`);
      setTimeout(() => setUploadingFiles(prev => prev.filter(f => f.tempId !== tempId)), 3000);
      return;
    }
    setUploadingFiles(prev => prev.filter(f => f.tempId !== tempId));
  };

  const handleFiles = (fileList: FileList | File[] | null) => {
    if (!fileList) return;
    const files = Array.from(fileList);
    if (files.length === 0) return;
    if (slotsLeft <= 0) {
      toast.error(`You can only attach up to ${maxAttachments} files.`);
      return;
    }
    const accepted = files.slice(0, slotsLeft);
    if (accepted.length < files.length) {
      toast.warning(`Only ${accepted.length} file(s) added — ${maxAttachments} file limit reached.`);
    }
    accepted.forEach(file => {
      const error = validateFile(file);
      if (error) { toast.error(error); return; }
      const tempId = `up_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      setUploadingFiles(prev => [...prev, { tempId, name: file.name, progress: 0 }]);
      uploadOne(file, tempId);
    });
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const imageFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) imageFiles.push(file);
      }
    }
    if (imageFiles.length > 0) handleFiles(imageFiles);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); 
    e.stopPropagation(); 
    setIsDragging(false);
    if (e.dataTransfer.files?.length > 0) handleFiles(e.dataTransfer.files);
  };

  const handleRemovePhoto = (index: number) => {
    onAttachmentsChange(attachments.filter((_, i) => i !== index));
  };

  const handleAddLink = () => {
    if (!tempLinkInput.trim()) return;
    let url = tempLinkInput.trim();
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    if (links.includes(url)) { toast.error('Link already added'); return; }
    onLinksChange([...links, url]);
    setTempLinkInput('');
  };

  const handleRemoveLink = (index: number) => onLinksChange(links.filter((_, i) => i !== index));
  
  const isImageUrl = (url: string) => 
    /\.(jpe?g|png|gif|webp)(\?|$)/i.test(url) || 
    url.startsWith('data:image/') || 
    url.includes('image%2F') || 
    url.includes('image/');

  return (
    <div
      className={`space-y-4 rounded-xl transition-all ${isDragging ? 'bg-white/5 ring-2 ring-indigo-500 p-2' : ''}`}
      onPaste={handlePaste}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
      onDrop={handleDrop}
    >
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Files & Screenshots</label>
          <span className="text-[11px] text-slate-500 font-mono">{slotsUsed}/{maxAttachments}</span>
        </div>
        <div className="flex flex-wrap gap-2 items-start mt-2">
          {attachments.map((att, index) => {
            const isImg = isImageUrl(att.url);
            return (
              <div key={att.id || index} className="relative group w-24 h-24 rounded-xl border border-white/8 overflow-hidden bg-white/[0.04]">
                {isImg ? (
                  <img referrerPolicy="no-referrer" src={att.url} alt="attachment" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 gap-1 px-1.5 text-center">
                    <FileText className="w-6 h-6 text-slate-400" />
                    <span className="text-[9px] text-slate-400 font-bold uppercase truncate max-w-[80px]" title={att.name}>
                      {att.name}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                  <a 
                    href={att.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="p-1 bg-white/10 rounded hover:bg-white/20 text-white transition-all"
                    title="View file"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </a>
                  <button 
                    type="button" 
                    onClick={() => handleRemovePhoto(index)} 
                    className="p-1 bg-rose-500 rounded hover:bg-rose-400 active:scale-95 transition-all text-white"
                    title="Delete file"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
          {uploadingFiles.map(uf => (
            <div key={uf.tempId} className="relative w-24 h-24 rounded-xl border border-white/8 bg-white/[0.04] flex flex-col items-center justify-center gap-1.5 px-2 text-center">
              {uf.error ? (
                <>
                  <AlertCircle className="w-5 h-5 text-rose-400" />
                  <span className="text-[10px] text-rose-400 font-bold uppercase truncate max-w-full">Failed</span>
                </>
              ) : (
                <>
                  <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                  <span className="text-[10px] text-slate-400 font-mono">{uf.progress}%</span>
                  <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 transition-all" style={{ width: `${uf.progress}%` }} />
                  </div>
                </>
              )}
            </div>
          ))}
          {slotsLeft > 0 && (
            <label className={`flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-white/8 rounded-xl bg-white/5 transition-all ${!authReady ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10 hover:border-transparent cursor-pointer group'}`}>
              <input type="file" ref={fileInputRef} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" multiple className="hidden" disabled={!authReady} onChange={(e) => handleFiles(e.target.files)} />
              <Upload className="w-6 h-6 text-slate-500 group-hover:text-indigo-400 transition-colors" />
              <span className="text-[10px] text-slate-500 font-bold uppercase mt-1 group-hover:text-indigo-300 text-center px-1">
                {authReady ? 'Add File' : 'Preparing…'}
              </span>
            </label>
          )}
        </div>
        <p className="text-[10px] text-slate-500">Up to {maxAttachments} files · 10MB each · images, PDF, Word, Excel</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-bold uppercase tracking-widest block text-slate-400">Useful Links / URLs</label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <LinkIcon className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text" placeholder="e.g. ticket link, reference..." value={tempLinkInput}
              onChange={(e) => setTempLinkInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLink())}
              className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/8 rounded-xl text-slate-100 text-[11px] focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>
          <button type="button" onClick={handleAddLink} className="px-3 h-[34px] bg-transparent border border-white/12 text-indigo-300 hover:bg-white/5 text-[11px] font-bold uppercase rounded-xl transition-all active:scale-95">Add</button>
        </div>
        {links.length > 0 && (
          <div className="space-y-1.5 pt-1">
            {links.map((linkStr, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-white/5 border border-white/8 rounded-xl text-[11px]">
                <span className="text-indigo-300 underline font-mono truncate max-w-[200px]">{linkStr}</span>
                <button type="button" onClick={() => handleRemoveLink(index)} className="text-red-400 hover:text-red-300 text-[11px] font-bold uppercase px-2 py-1 bg-red-400/10 rounded-xl active:scale-95 transition-all">Remove</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
