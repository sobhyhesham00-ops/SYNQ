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
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm bg-white/[0.02] p-4 rounded-xl border border-white/10">
      <div className="flex-1 break-all flex items-start gap-2.5 font-mono text-slate-200 leading-relaxed">
        <LinkIcon className="w-5 h-5 shrink-0 mt-0.5 text-indigo-400" />
        <span className="whitespace-pre-wrap text-sm">{normalized}</span>
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
          className="flex items-center gap-1.5 px-3 py-2 text-slate-300 hover:text-slate-100 bg-white/5 rounded-lg hover:bg-white/10 transition-colors font-semibold text-[13px]"
          title="Copy Link"
        >
          {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          Copy
        </button>
        <a 
          href={normalized} 
          target="_blank" 
          rel="noreferrer"
          className="flex items-center gap-1.5 px-3 py-2 text-indigo-300 hover:text-indigo-200 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg transition-colors font-semibold text-[13px]"
          title="Open Link"
        >
          <ExternalLink className="w-4 h-4" />
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

  const handleOpenUrl = (url: string) => {
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error("Failed to open URL", err);
      const a = document.createElement('a');
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleDownloadFile = async (url: string, filename: string) => {
    toast.info(`Preparing secure download: ${filename}...`);
    try {
      let blobUrl = "";
      if (url.startsWith('data:')) {
        const res = await fetch(url);
        const blob = await res.blob();
        blobUrl = URL.createObjectURL(blob);
      } else {
        // 1. Try to download via proxy fetch to blob for cross-origin iframe support
        const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
        const res = await fetch(proxyUrl);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const blob = await res.blob();
        blobUrl = URL.createObjectURL(blob);
      }
      
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
      toast.success("Download started successfully!");
    } catch (err) {
      console.warn("Direct blob download failed (expected for external/CORS locked files). Directing to simple open...", err);
      // 2. Clear failover back to target _blank layout
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success("Attempting to open/download in a new tab.");
    }
  };

  const handleCopyImage = async (imageUrl: string) => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.write) {
        toast.error("Image copy is not supported in this browser environment");
        return;
      }
      toast.info("Copying image payload...");
      
      let blob;
      if (imageUrl.startsWith('data:')) {
        const res = await fetch(imageUrl);
        blob = await res.blob();
      } else {
        const proxyUrl = `/api/proxy?url=${encodeURIComponent(imageUrl)}`;
        const res = await fetch(proxyUrl);
        blob = await res.blob();
      }
      let writeBlob = blob;
      
      // Convert to standard PNG if needed
      if (blob.type !== 'image/png') {
         const img = new Image();
         const blobUrl = URL.createObjectURL(blob);
         img.src = blobUrl;
         await new Promise((resolve) => { img.onload = resolve; img.onerror = resolve; });
         const canvas = document.createElement('canvas');
         canvas.width = img.width || 500;
         canvas.height = img.height || 500;
         const ctx = canvas.getContext('2d');
         if (ctx) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            const rBlob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
            if (rBlob) writeBlob = rBlob as Blob;
         }
      }

      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': writeBlob })
      ]);
      toast.success("Image copied to clipboard!");
    } catch (e: any) {
      console.error("Clipboard copy failed", e);
      toast.error("Failed to copy image. Trying fallback copy...");
      // Try string fallback
      const ok = await copyToClipboard(imageUrl, "Image URL copied to clipboard!");
      if (!ok) {
        toast.error("Process restricted by browser CORS guidelines.");
      }
    }
  };

  const downloadAll = async () => {
    toast.info("Downloading all attachments sequentially...");
    for (let i = 0; i < normalizedAttachments.length; i++) {
        const att = normalizedAttachments[i];
        await handleDownloadFile(att.url, att.name || `attachment-${i + 1}`);
        await new Promise(r => setTimeout(r, 450));
    }
  };

  return (
    <div className="space-y-4 mt-3 border-t border-white/5 pt-3">
      {/* Display Photos & Attachments */}
      {hasAttachments && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-300 font-mono font-bold block">Attached Files ({normalizedAttachments.length}):</span>
            <button 
              onClick={downloadAll} 
              className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider flex items-center gap-1 bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-1 rounded transition-colors"
            >
              <Download className="w-3 h-3" /> Download All
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            {normalizedAttachments.map((att) => {
              const fileTitle = att.name;
              const isImage = att.type?.startsWith('image/') || att.url.startsWith('data:image/') || (!att.type?.includes('pdf') && att.url.match(/\.(jpeg|jpg|gif|png|webp)$/i));
              
              return (
              <div key={att.id} className="relative group/photo shrink-0 w-full max-w-[380px] bg-white/[0.04] border border-white/10 hover:border-indigo-500/50 transition-all rounded-xl overflow-hidden flex flex-col shadow-lg">
                {isImage ? (
                  <>
                    {/* Image Preview Window */}
                    <div className="w-full flex items-center justify-center p-2 bg-slate-950/40 relative min-h-[160px] max-h-[280px] overflow-hidden">
                      <img 
                        referrerPolicy="no-referrer" 
                        src={att.url} 
                        alt={fileTitle} 
                        className="w-full h-auto max-h-[260px] object-contain rounded" 
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            // Clear other children except the image
                            Array.from(parent.children).forEach(child => {
                              if (child !== e.currentTarget) child.remove();
                            });
                            const placeholder = document.createElement('div');
                            placeholder.className = 'flex flex-col items-center justify-center p-6 text-slate-400 select-none';
                            placeholder.innerHTML = `
                              <svg class="w-10 h-10 text-slate-500 mb-2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                              </svg>
                              <span class="text-xs text-slate-400 font-semibold text-center break-words px-2 max-w-[280px]">Image URL inaccessible (Direct options below)</span>
                            `;
                            parent.appendChild(placeholder);
                          }
                        }}
                      />
                    </div>
                    {/* Information Bar + Touch Friendly Persistent Controls (Never Hidden!) */}
                    <div className="p-3 bg-slate-950/70 border-t border-white/5 flex flex-col gap-2.5">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="text-xs text-slate-300 font-medium truncate flex-1 font-sans" title={fileTitle}>
                          {fileTitle}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[11px] font-bold text-slate-200 transition-colors border border-white/10"
                        >
                          <ExternalLink className="w-3.5 h-3.5 shrink-0" /> Open
                        </a>
                        <button
                          type="button"
                          onClick={() => handleCopyImage(att.url)}
                          className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[11px] font-bold text-slate-200 transition-colors border border-white/10"
                        >
                          <Copy className="w-3.5 h-3.5 shrink-0" /> Copy
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadFile(att.url, fileTitle)}
                          className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-slate-950 rounded-lg text-[11px] font-bold transition-colors"
                        >
                          <Download className="w-3.5 h-3.5 shrink-0" /> Download
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 w-full flex-1 min-h-[160px]">
                    <FileText className="w-8 h-8 text-indigo-400 mb-2" />
                    <span className="text-sm text-slate-200 font-medium font-sans mb-3 text-center break-words w-full px-2 line-clamp-2" title={fileTitle}>
                      {fileTitle}
                    </span>
                    <div className="flex items-center gap-2 w-full justify-center">
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg font-bold text-xs text-white flex items-center gap-1.5 border border-white/10 transition-colors inline-flex"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Open
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDownloadFile(att.url, fileTitle)}
                          className="px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 rounded-lg font-bold text-xs flex items-center gap-1.5 border border-indigo-500/30 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" /> Download
                        </button>
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
          <span className="text-xs text-slate-300 font-mono font-bold block">References & Links:</span>
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
            <span className="text-xs text-amber-500 font-mono font-black block uppercase tracking-wider">
              ⚠️ TL / Supervisor Files ({normalizedTlAttachments.length}):
            </span>
          </div>
          <div className="flex flex-wrap gap-3">
            {normalizedTlAttachments.map((att) => {
              const fileTitle = att.name;
              const isImage = att.type?.startsWith('image/') || att.url.startsWith('data:image/') || (!att.type?.includes('pdf') && att.url.match(/\.(jpeg|jpg|gif|png|webp)$/i));
              
              return (
              <div key={att.id} className="relative group/photo shrink-0 w-full max-w-[380px] bg-white/[0.04] border border-amber-500/20 hover:border-amber-400/50 transition-all rounded-xl overflow-hidden flex flex-col shadow-lg">
                {showSideBadges && (
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-amber-500 text-slate-950 font-black text-[9px] rounded uppercase shadow-md z-10 select-none">
                    TL
                  </div>
                )}
                {isImage ? (
                  <>
                    {/* TL Image Preview Window */}
                    <div className="w-full flex items-center justify-center p-2 bg-slate-950/40 relative min-h-[160px] max-h-[280px] overflow-hidden">
                      <img 
                        referrerPolicy="no-referrer" 
                        src={att.url} 
                        alt={fileTitle} 
                        className="w-full h-auto max-h-[260px] object-contain rounded" 
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            // Clear other children except the image
                            Array.from(parent.children).forEach(child => {
                              if (child !== e.currentTarget) child.remove();
                            });
                            const placeholder = document.createElement('div');
                            placeholder.className = 'flex flex-col items-center justify-center p-6 text-amber-500 select-none';
                            placeholder.innerHTML = `
                              <svg class="w-10 h-10 text-amber-600/70 mb-2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                              </svg>
                              <span class="text-xs text-amber-500/80 font-semibold text-center break-words px-2 max-w-[280px]">Supervisor image URL inaccessible (Direct options below)</span>
                            `;
                            parent.appendChild(placeholder);
                          }
                        }}
                      />
                    </div>
                    {/* TL Information Bar + Touch Friendly Persistent Controls */}
                    <div className="p-3 bg-slate-950/70 border-t border-amber-500/10 flex flex-col gap-2.5">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="text-xs text-amber-400 font-medium truncate flex-1 font-sans" title={fileTitle}>
                          {fileTitle}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                        <button
                          type="button"
                          onClick={() => handleOpenUrl(att.url)}
                          className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[11px] font-bold text-slate-200 transition-colors border border-white/10"
                        >
                          <ExternalLink className="w-3.5 h-3.5 shrink-0" /> Open
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyImage(att.url)}
                          className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[11px] font-bold text-slate-200 transition-colors border border-white/10"
                        >
                          <Copy className="w-3.5 h-3.5 shrink-0" /> Copy
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadFile(att.url, fileTitle)}
                          className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-[11px] font-bold transition-colors"
                        >
                          <Download className="w-3.5 h-3.5 shrink-0" /> Download
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 w-full flex-1 min-h-[160px]">
                    <FileText className="w-8 h-8 text-amber-500 mb-2" />
                    <span className="text-sm text-slate-200 font-medium font-sans mb-3 text-center break-words w-full px-2 line-clamp-2" title={fileTitle}>
                      {fileTitle}
                    </span>
                    <div className="flex items-center gap-2 w-full justify-center">
                       <button
                         type="button"
                         onClick={() => handleOpenUrl(att.url)}
                         className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg font-bold text-xs text-white flex items-center gap-1.5 border border-white/10 transition-colors"
                       >
                         <ExternalLink className="w-3.5 h-3.5" /> Open
                       </button>
                       <button
                         type="button"
                         onClick={() => handleDownloadFile(att.url, fileTitle)}
                         className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg font-bold text-xs flex items-center gap-1.5 border border-amber-500/30 transition-colors"
                       >
                         <Download className="w-3.5 h-3.5" /> Download
                       </button>
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
          <span className="text-xs text-amber-500 font-mono font-black block uppercase tracking-wider">
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
