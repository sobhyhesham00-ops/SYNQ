import React from 'react';
import { ExternalLink, Copy, Download } from 'lucide-react';

interface AttachmentsDisplayProps {
  photos?: string[];
  links?: string[];
}

export const AttachmentsDisplay: React.FC<AttachmentsDisplayProps> = ({ photos, links }) => {
  const hasPhotos = photos && photos.length > 0;
  const hasLinks = links && links.length > 0;

  if (!hasPhotos && !hasLinks) return null;

  return (
    <div className="space-y-3 mt-3 border-t border-white/5 pt-3">
      {/* Display Photos */}
      {hasPhotos && (
        <div className="space-y-2">
          <span className="text-[10px] text-slate-400 font-mono block">Attached Screenshots ({photos.length}):</span>
          <div className="flex flex-wrap gap-2">
            {photos.map((photo, pIdx) => (
              <div key={pIdx} className="relative group/photo shrink-0 w-full max-w-sm">
                <a
                  href={photo}
                  target="_blank"
                  rel="noreferrer"
                  className="block w-full rounded-lg overflow-hidden border border-white/10 group-hover/photo:border-indigo-500 transition-all bg-black/55"
                  title="View Full Image"
                >
                  <img referrerPolicy="no-referrer" src={photo} alt="screenshot" className="w-full h-auto object-contain max-h-[300px]" />
                </a>
                <button
                  type="button"
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = photo;
                    a.download = `attachment-${pIdx + 1}.jpg`;
                    a.click();
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black text-white rounded-md opacity-0 group-hover/photo:opacity-100 transition-opacity backdrop-blur-sm border border-white/20"
                  title="Download Image"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Display Links */}
      {hasLinks && (
        <div className="space-y-1">
          <span className="text-[10px] text-slate-400 font-mono block">References & Links:</span>
          <div className="flex flex-col gap-1.5">
            {links.map((link, lIdx) => (
              <div key={lIdx} className="flex items-center justify-between text-[11px] bg-slate-900/50 p-2 rounded-lg border border-white/5 group">
                <a 
                  href={link} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 hover:underline max-w-[200px] sm:max-w-xs truncate"
                >
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{link}</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(link);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-100 bg-white/5 rounded-md hover:bg-white/10 transition-colors shrink-0"
                  title="Copy Link"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
