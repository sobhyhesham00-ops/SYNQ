import React, { useState } from 'react';
import { Link, Camera, X, ImageIcon } from 'lucide-react';
import { ScreenshotUpload } from './ScreenshotUpload'; // Optional: reuse existing single-photo if needed, but we will make it independent
import { compressImage } from '../utils';

interface MultiAttachmentUploadProps {
  photos: string[];
  links: string[];
  onPhotosChange: (photos: string[]) => void;
  onLinksChange: (links: string[]) => void;
  photosLabel?: string;
}

export const MultiAttachmentUpload: React.FC<MultiAttachmentUploadProps> = ({
  photos,
  links,
  onPhotosChange,
  onLinksChange,
  photosLabel = "Additional Photos / Screenshots"
}) => {
  const [tempLinkInput, setTempLinkInput] = useState('');

  const handleAddLink = () => {
    if (!tempLinkInput.trim()) return;
    let url = tempLinkInput.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    onLinksChange([...links, url]);
    setTempLinkInput('');
  };

  const handleRemoveLink = (index: number) => {
    onLinksChange(links.filter((_, i) => i !== index));
  };

  const handlePhotoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    handleMultipleFiles(files);
  };

  // We handle multiple files by tracking an array of pending loads so we don't overwrite
  const handleMultipleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const filesArray = Array.from(files);
    Promise.all(filesArray.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
          if (event.target?.result) {
            const compressed = await compressImage(event.target.result as string);
            resolve(compressed);
          } else {
            resolve('');
          }
        };
        reader.readAsDataURL(file);
      });
    })).then(newCompressedPhotos => {
      const filtered = newCompressedPhotos.filter(Boolean);
      if (filtered.length > 0) {
        onPhotosChange([...photos, ...filtered]);
      }
    });
  };

  const handleRemovePhoto = (index: number) => {
    onPhotosChange(photos.filter((_, i) => i !== index));
  };
  
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const filesArray: File[] = [];
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            if (file) filesArray.push(file);
        }
    }

    if (filesArray.length > 0) {
        Promise.all(filesArray.map(file => {
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = async (event) => {
              if (event.target?.result) {
                const compressed = await compressImage(event.target.result as string);
                resolve(compressed);
              } else {
                resolve('');
              }
            };
            reader.readAsDataURL(file);
          });
        })).then(newCompressedPhotos => {
          const filtered = newCompressedPhotos.filter(Boolean);
          if (filtered.length > 0) {
            onPhotosChange([...photos, ...filtered]);
          }
        });
    }
  };


  return (
    <div className="space-y-4" onPaste={handlePaste}>
      {/* Photos Section */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold uppercase tracking-widest block text-slate-400">
          {photosLabel}
        </label>
        
        <div className="flex flex-wrap gap-2 items-start mt-2">
            {photos.map((photo, index) => (
            <div key={index} className="relative group w-24 h-24 rounded-xl border border-white/10 overflow-hidden bg-slate-900 shadow-lg">
                <img referrerPolicy="no-referrer" src={photo} alt="screenshot" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                    type="button"
                    onClick={() => handleRemovePhoto(index)}
                    className="p-1.5 bg-rose-500 rounded-lg hover:bg-rose-400 transition-colors shadow-lg active:scale-95"
                >
                    <X className="w-4 h-4 text-white" />
                </button>
                </div>
            </div>
            ))}
            <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-white/10 rounded-xl bg-white/5 hover:bg-white/10 hover:border-indigo-500/50 transition-all cursor-pointer group hover:scale-[1.02] active:scale-95">
                <input 
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleMultipleFiles(e.target.files)}
                />
                <Camera className="w-6 h-6 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                <span className="text-[9px] text-slate-500 font-bold uppercase mt-1 group-hover:text-indigo-300">Add Photo</span>
            </label>
        </div>
      </div>

      {/* Links Section */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold uppercase tracking-widest block text-slate-400">
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
              className="w-full pl-9 pr-3 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>
          <button
            type="button"
            onClick={handleAddLink}
            className="px-3 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/20 text-indigo-300 text-xs font-bold rounded-lg transition-all active:scale-95 h-[34px] uppercase"
          >
            Add
          </button>
        </div>

        {links.length > 0 && (
          <div className="space-y-1.5 pt-1">
            {links.map((linkStr, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-xs">
                <span className="text-indigo-300 underline font-mono truncate max-w-[200px]">{linkStr}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveLink(index)}
                  className="text-red-400 hover:text-red-300 text-[10px] font-medium uppercase font-bold transition-all px-2 py-1 bg-red-400/10 rounded-lg border border-red-400/20 active:scale-95"
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
