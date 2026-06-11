import React, { useState } from 'react';
import { ExternalLink, Copy, Download, Link as LinkIcon, CheckCircle2, Image as ImageIcon, FileText } from 'lucide-react';
import { extractLinks, normalizeUrl, copyToClipboard, normalizeAttachments } from '../utils';
import { toast } from 'sonner';
import { FileAttachment } from '../types';

interface AttachmentsDisplayProps {
  photos?: string[];
  attachments?: any[];
  links?: any;
  tlPhotos?: string[];
  tlLinks?: any;
  showSideBadges?: boolean;
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

export const AttachmentsDisplay: React.FC<AttachmentsDisplayProps> = ({ 
  photos, 
  attachments, 
  links,
  tlPhotos,
  tlLinks,
  showSideBadges = true
}) => {
  const extractedLinks = extractLinks(links);
  const normalizedAttachments = normalizeAttachments(photos, attachments);
  
  const hasAttachments = normalizedAttachments.length > 0;
  const hasLinks = extractedLinks.length > 0;

  const extractedTlLinks = extractLinks(tlLinks);
  const normalizedTlAttachments = normalizeAttachments(tlPhotos, undefined);

  const hasTlAttachments = normalizedTlAttachments.length > 0;
  const hasTlLinks = extractedTlLinks.length > 0;

  if (!hasAttachments && !hasLinks && !hasTlAttachments && !hasTlLinks) return null;

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
    for (let i = 0; i < normalizedAttachments.length; i++) {
        const att = normalizedAttachments[i];
        const a = document.createElement('a');
        a.href = att.url;
        a.download = att.name || `attachment-${i + 1}`;
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        await new Promise(r => setTimeout(r, 300));
    }
  };

  return (
    <div className="space-y-4 mt-3 border-t border-white/5 pt-3">
      {/* Display Photos & Attachments */}
      {hasAttachments && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-mono block">Attached Files ({normalizedAttachments.length}):</span>
            <button 
              onClick={downloadAll} 
              className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider flex items-center gap-1 bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-1 rounded transition-colors"
            >
              <Download className="w-3 h-3" /> Download All
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {normalizedAttachments.map((att) => {
              const fileTitle = att.name;
              const isImage = att.type?.startsWith('image/') || att.url.startsWith('data:image/') || (!att.type?.includes('pdf') && att.url.match(/\.(jpeg|jpg|gif|png|webp)$/i));
              
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
                         <Copy className="w-3.5 h-3.5" /> Copy
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

      {/* Display TL Photos & Attachments */}
      {hasTlAttachments && (
        <div className="space-y-2 border-t border-amber-500/15 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-amber-400 font-mono font-black block uppercase tracking-wider">
              ⚠️ TL / Supervisor Files ({normalizedTlAttachments.length}):
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {normalizedTlAttachments.map((att) => {
              const fileTitle = att.name;
              const isImage = att.type?.startsWith('image/') || att.url.startsWith('data:image/') || (!att.type?.includes('pdf') && att.url.match(/\.(jpeg|jpg|gif|png|webp)$/i));
              
              return (
              <div key={att.id} className="relative group/photo shrink-0 w-full max-w-[280px] bg-black/55 rounded-lg border border-amber-500/20 hover:border-amber-400/50 transition-all overflow-hidden flex flex-col">
                {showSideBadges && (
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-amber-500 text-slate-950 font-black text-[9px] rounded uppercase shadow-md z-10 select-none">
                    TL
                  </div>
                )}
                {isImage ? (
                  <div className="w-full flex-1 min-h-[140px] flex items-center justify-center p-1 relative">
                    <img referrerPolicy="no-referrer" src={att.url} alt={fileTitle} className="w-full h-auto object-contain max-h-[180px] rounded" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/photo:opacity-100 transition-opacity flex flex-wrap items-center justify-center gap-2 p-2 backdrop-blur-sm">
                       <a href={att.url} target="_blank" rel="noreferrer" className="px-2 py-1.5 bg-white/10 hover:bg-white/20 rounded font-bold text-xs text-white flex items-center gap-1.5">
                         <ExternalLink className="w-3.5 h-3.5" /> Open
                       </a>
                       <button onClick={() => handleCopyImage(att.url)} className="px-2 py-1.5 bg-white/10 hover:bg-white/20 rounded font-bold text-xs text-white flex items-center gap-1.5">
                         <Copy className="w-3.5 h-3.5" /> Copy
                       </button>
                       <a href={att.url} download={fileTitle} className="px-2 py-1.5 bg-amber-500 hover:bg-amber-400 rounded font-bold text-xs text-slate-900 flex items-center gap-1.5">
                         <Download className="w-3.5 h-3.5" /> Download
                       </a>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 w-full flex-1">
                    <FileText className="w-8 h-8 text-amber-500 mb-2" />
                    <span className="text-xs text-slate-300 font-medium font-sans mb-3 text-center truncate w-full px-2" title={fileTitle}>{fileTitle}</span>
                    <div className="flex items-center gap-2">
                       <a href={att.url} target="_blank" rel="noreferrer" className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 rounded font-bold text-xs text-white flex items-center gap-1.5">
                         <ExternalLink className="w-3 h-3" /> Open
                       </a>
                       <a href={att.url} download={fileTitle} className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded font-bold text-xs flex items-center gap-1.5 border border-amber-500/30">
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

      {/* Display TL Links */}
      {hasTlLinks && (
        <div className="space-y-1 border-t border-amber-500/15 pt-3">
          <span className="text-[10px] text-amber-400 font-mono font-black block uppercase tracking-wider">
            ⚠️ TL / Supervisor References & Links:
          </span>
          <div className="flex flex-col gap-2">
            {extractedTlLinks.map((link, lIdx) => (
              <div key={lIdx} className="relative">
                {showSideBadges && (
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-amber-500 text-slate-950 font-black text-[9px] rounded uppercase shadow-md z-10 select-none">
                    TL
                  </span>
                )}
                <div className={showSideBadges ? "pl-11" : ""}>
                  <LinkItem link={link} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
