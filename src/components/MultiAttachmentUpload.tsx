import React, { useState } from 'react';
import { Link } from 'lucide-react';
import { toast } from 'sonner';

interface MultiAttachmentUploadProps {
  photos: string[];
  links: string[];
  onPhotosChange: (photos: string[]) => void;
  onLinksChange: (links: string[]) => void;
  photosLabel?: string;
  onUploadStateChange?: (isUploading: boolean) => void;
  maxFiles?: number;
}

export const MultiAttachmentUpload: React.FC<MultiAttachmentUploadProps> = ({
  photos,
  links,
  onPhotosChange,
  onLinksChange,
  photosLabel = "Additional Photos / Screenshots",
  onUploadStateChange,
  maxFiles = 4
}) => {
  const [tempLinkInput, setTempLinkInput] = useState('');

  const handleAddLink = () => {
    if (!String(tempLinkInput || '').trim()) return;
    let url = String(tempLinkInput || '').trim();
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    if (links.includes(url)) {
      toast.error('Link already added');
      return;
    }
    onLinksChange([...links, url]);
    setTempLinkInput('');
  };

  const handleRemoveLink = (index: number) => {
    onLinksChange(links.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4 rounded-xl transition-all">
      {/* Links Section */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold uppercase tracking-widest block text-slate-400">
          Useful Links / URLs
        </label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Link className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="e.g. ticket link, reference..."
              value={tempLinkInput}
              onChange={(e) => setTempLinkInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/8 rounded-xl text-slate-100 text-[11px] focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>
          <button
            type="button"
            onClick={handleAddLink}
            className="px-3 bg-transparent border border-white/12 text-white hover:bg-white/5 border border-transparent text-indigo-300 text-[11px] font-bold rounded-xl transition-all active:scale-95 h-[34px] uppercase"
          >
            Add
          </button>
        </div>

        {links.length > 0 && (
          <div className="space-y-1.5 pt-1">
            {links.map((linkStr, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-white/5 border border-white/8 rounded-xl text-[11px]">
                <span className="text-indigo-300 underline font-mono truncate max-w-[200px]">{linkStr}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveLink(index)}
                  className="text-red-400 hover:text-red-300 text-[11px] font-medium uppercase font-bold transition-all px-2 py-1 bg-red-400/10 rounded-xl border border-transparent active:scale-95"
                >
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
