import React, { useState } from 'react';
import { ExternalLink, Copy, Download, Link as LinkIcon, CheckCircle2, Image as ImageIcon, FileText } from 'lucide-react';
import { extractLinks, normalizeUrl, copyToClipboard } from '../utils';
import { toast } from 'sonner';

interface AttachmentsDisplayProps {
  photos?: string[];
  attachments?: any[];
  links?: any;
}

const LinkItem = ({ link }: { link: string }) => {
  const [copied, setCopied] = useState(false);
  const normalized = normalizeUrl(link) || link;

  return (
    <div className="flex items-start justify-between gap-3 text-[12px] bg-slate-900/50 p-3 rounded-lg border border-white/5 break-words">
      <div className="flex-1 break-all flex items-start gap-2 pt-1 font-mono text-slate-300">
        <LinkIcon className="w-4 h-4 shrink-0 mt-0.5 text-indigo-400" />
        <span className="whitespace-pre-wrap">{normalized}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={async (e) => {
            e.preventDefault();
            const ok = await copyToClipboard(normalized, "Link copied!");
            if (ok) {
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-400 hover:text-slate-100 bg-white/5 rounded-md hover:bg-white/10 transition-colors font-semibold"
          title="Copy Link"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          Copy
        </button>
        <a 
          href={normalized} 
          target="_blank" 
          rel="noreferrer"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-md transition-colors font-semibold"
          title="Open Link"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Open
        </a>
      </div>
    </div>
  );
};

export const AttachmentsDisplay: React.FC<AttachmentsDisplayProps> = ({ photos, attachments, links }) => {
  const extractedLinks = extractLinks(links);
  const hasPhotos = photos && photos.length > 0;
  const hasAttachments = attachments && attachments.length > 0;
  const hasLinks = extractedLinks.length > 0;

  if (!hasPhotos && !hasAttachments && !hasLinks) return null;

  const handleCopyImage = async (imageUrl: string) => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.write) {
        toast.error("Image copy not supported in this browser");
        return;
      }
      toast.info("Copying image...");
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      let writeBlob = blob;
      
      // Convert to PNG if needed for Clipboard API
      if (blob.type !== 'image/png') {
         const img = new Image();
         img.src = imageUrl;
         await new Promise((resolve) => { img.onload = resolve; img.onerror = resolve; });
         const canvas = document.createElement('canvas');
         canvas.width = img.width || 500;
         canvas.height = img.height || 500;
         const ctx = canvas.getContext('2d');
         if (ctx) {
           ctx.fillStyle = '#FFFFFF';
           ctx.fillRect(0, 0, canvas.width, canvas.height);
           ctx.drawImage(img, 0, 0);
           writeBlob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png')) as Blob;
         }
      }

      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': writeBlob })
      ]);
      toast.success("Image copied to clipboard!");
    } catch (e: any) {
      console.error("Clipboard copy failed", e);
      toast.error("Failed to copy image. Browser restriction or CORS.");
    }
  };

  const downloadAll = async () => {
    toast.info("Downloading attachments...");
    if (photos) {
      for (let i = 0; i < photos.length; i++) {
          const photo = photos[i];
          const isPdf = photo.includes('application/pdf') || photo.includes('.pdf');
          const a = document.createElement('a');
          a.href = photo;
          a.download = `attachment-${i + 1}${isPdf ? '.pdf' : '.jpg'}`;
          a.target = "_blank";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          await new Promise(r => setTimeout(r, 300));
      }
    }
    if (attachments) {
      for (let i = 0; i < attachments.length; i++) {
          const att = attachments[i];
          const a = document.createElement('a');
          a.href = att.url;
          a.download = att.name;
          a.target = "_blank";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          await new Promise(r => setTimeout(r, 300));
      }
    }
  };

  return (
    <div className="space-y-3 mt-3 border-t border-white/5 pt-3">
      {/* Display Photos & Attachments */}
      {(hasPhotos || hasAttachments) && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-mono block">Attached Files ({(photos?.length || 0) + (attachments?.length || 0)}):</span>
            <button 
              onClick={downloadAll} 
              className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider flex items-center gap-1 bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-1 rounded transition-colors"
            >
              <Download className="w-3 h-3" /> Download All
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {photos && photos.map((photo, pIdx) => {
              const isPdf = typeof photo === 'string' && (photo.includes('application/pdf') || photo.includes('.pdf'));
              const isImage = typeof photo === 'string' && (photo.startsWith('data:image/') || (!isPdf && photo.startsWith('http')));
              const fileTitle = `attachment-${pIdx + 1}${isPdf ? '.pdf' : '.jpg'}`;

              return (
              <div key={pIdx} className="relative group/photo shrink-0 w-full max-w-[280px] bg-black/55 rounded-lg border border-white/10 hover:border-indigo-500/50 transition-all overflow-hidden flex flex-col">
                {isImage ? (
                  <div className="w-full flex-1 min-h-[140px] flex items-center justify-center p-1 relative">
                    <img referrerPolicy="no-referrer" src={photo} alt={fileTitle} className="w-full h-auto object-contain max-h-[180px] rounded" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/photo:opacity-100 transition-opacity flex flex-wrap items-center justify-center gap-2 p-2 backdrop-blur-sm">
                       <a href={photo} target="_blank" rel="noreferrer" className="px-2 py-1.5 bg-white/10 hover:bg-white/20 rounded font-bold text-xs text-white flex items-center gap-1.5">
                         <ExternalLink className="w-3.5 h-3.5" /> Open
                       </a>
                       <button onClick={() => handleCopyImage(photo)} className="px-2 py-1.5 bg-white/10 hover:bg-white/20 rounded font-bold text-xs text-white flex items-center gap-1.5">
                         <Copy className="w-3.5 h-3.5" /> Copy Image
                       </button>
                       <a href={photo} download={fileTitle} className="px-2 py-1.5 bg-indigo-500 hover:bg-indigo-400 rounded font-bold text-xs text-slate-900 flex items-center gap-1.5">
                         <Download className="w-3.5 h-3.5" /> Download
                       </a>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 w-full flex-1">
                    <FileText className="w-8 h-8 text-indigo-400 mb-2" />
                    <span className="text-xs text-slate-300 font-medium font-sans mb-3 text-center truncate w-full px-2" title={fileTitle}>{fileTitle}</span>
                    <div className="flex items-center gap-2">
                       <a href={photo} target="_blank" rel="noreferrer" className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 rounded font-bold text-xs text-white flex items-center gap-1.5">
                         <ExternalLink className="w-3 h-3" /> Open
                       </a>
                       <a href={photo} download={fileTitle} className="px-2.5 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 rounded font-bold text-xs flex items-center gap-1.5 border border-indigo-500/30">
                         <Download className="w-3 h-3" /> Download
                       </a>
                    </div>
                  </div>
                )}
              </div>
            )})}
            
            {attachments && attachments.map((att) => {
              const fileTitle = att.name;
              const isImage = att.type?.startsWith('image/');
              
              return (
              <div key={att.id} className="relative group/photo shrink-0 w-full max-w-[280px] bg-black/55 rounded-lg border border-white/10 hover:border-indigo-500/50 transition-all overflow-hidden flex flex-col">
                {isImage ? (
                  <div className="w-full flex-1 min-h-[140px] flex items-center justify-center p-1 relative">
                    <img referrerPolicy="no-referrer" src={att.url} alt={fileTitle} className="w-full h-auto object-contain max-h-[180px] rounded" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/photo:opacity-100 transition-opacity flex flex-wrap items-center justify-center gap-2 p-2 backdrop-blur-sm">
                       <a href={att.url} target="_blank" rel="noreferrer" className="px-2 py-1.5 bg-white/10 hover:bg-white/20 rounded font-bold text-xs text-white flex items-center gap-1.5">
                         <ExternalLink className="w-3.5 h-3.5" /> Open
                       </a>
                       <button onClick={() => handleCopyImage(att.url)} className="px-2 py-1.5 bg-white/10 hover:bg-white/20 rounded font-bold text-xs text-white flex items-center gap-1.5">
                         <Copy className="w-3.5 h-3.5" /> Copy Image
                       </button>
                       <a href={att.url} download={fileTitle} className="px-2 py-1.5 bg-indigo-500 hover:bg-indigo-400 rounded font-bold text-xs text-slate-900 flex items-center gap-1.5">
                         <Download className="w-3.5 h-3.5" /> Download
                       </a>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 w-full flex-1">
                    <FileText className="w-8 h-8 text-indigo-400 mb-2" />
                    <span className="text-xs text-slate-300 font-medium font-sans mb-3 text-center truncate w-full px-2" title={fileTitle}>{fileTitle}</span>
                    <div className="flex items-center gap-2">
                       <a href={att.url} target="_blank" rel="noreferrer" className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 rounded font-bold text-xs text-white flex items-center gap-1.5">
                         <ExternalLink className="w-3 h-3" /> Open
                       </a>
                       <a href={att.url} download={fileTitle} className="px-2.5 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 rounded font-bold text-xs flex items-center gap-1.5 border border-indigo-500/30">
                         <Download className="w-3 h-3" /> Download
                       </a>
                    </div>
                  </div>
                )}
              </div>
            )})}
          </div>
        </div>
      )}

      {/* Display Links */}
      {hasLinks && (
        <div className="space-y-1">
          <span className="text-[10px] text-slate-400 font-mono block">References & Links:</span>
          <div className="flex flex-col gap-2">
            {extractedLinks.map((link, lIdx) => (
              <LinkItem key={lIdx} link={link} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
