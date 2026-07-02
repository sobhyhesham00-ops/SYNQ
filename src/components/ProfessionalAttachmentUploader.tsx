import React, { useState } from 'react';
import { Link as LinkIcon } from 'lucide-react';
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

export const ProfessionalAttachmentUploader: React.FC<ProfessionalAttachmentUploaderProps> = ({
  attachments = [],
  links = [],
  onAttachmentsChange,
  onLinksChange,
  onUploadStateChange,
  maxAttachments = 4
}) => {
  const [tempLinkInput, setTempLinkInput] = useState('');

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

  return (
    <div className="space-y-4 rounded-xl transition-all">
      <div className="space-y-2 pt-2">
        <label className="text-[11px] font-bold uppercase tracking-widest block text-slate-400">
          Links & URLs
        </label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <LinkIcon className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text" placeholder="https://" value={tempLinkInput}
              onChange={(e) => setTempLinkInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLink())}
              className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/8 rounded-xl text-slate-100 text-[11px] focus:outline-none focus:border-indigo-500 transition-all font-sans"
            />
          </div>
          <button type="button" onClick={handleAddLink} className="px-3 py-2 bg-transparent border border-white/12 text-white text-indigo-300 hover:bg-white/5 font-bold border border-transparent rounded-xl uppercase tracking-wider text-[11px] transition-colors h-[34px]">
            Add
          </button>
        </div>

        {links.length > 0 && (
          <div className="space-y-1.5 pt-1">
            {links.map((linkStr, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-white/5 border border-white/8 rounded-xl text-[11px]">
                <span className="text-indigo-300 underline font-sans truncate mr-2" title={linkStr}>{linkStr}</span>
                <button type="button" onClick={() => onLinksChange(links.filter((_, i) => i !== index))} className="text-red-400 hover:text-red-300 text-[11px] font-bold uppercase px-2 py-1 bg-red-400/10 rounded border border-transparent relative z-10 cursor-pointer">
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
