import React from 'react';
import { Camera, X, Clipboard, Image as ImageIcon } from 'lucide-react';

interface ScreenshotUploadProps {
  screenshot: string | null;
  onScreenshotChange: (base64: string | null) => void;
  label?: string;
}

export const ScreenshotUpload: React.FC<ScreenshotUploadProps> = ({ 
  screenshot, 
  onScreenshotChange,
  label = "Attach Screenshot or Image"
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        onScreenshotChange(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            onScreenshotChange(event.target?.result as string);
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold uppercase tracking-widest block text-slate-400">
        {label}
      </label>
      
      {!screenshot ? (
        <div 
          onPaste={handlePaste}
          className="relative group cursor-pointer"
        >
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange}
            className="hidden"
            id="screenshot-input-file"
          />
          <label 
            htmlFor="screenshot-input-file"
            className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-white/10 rounded-2xl bg-white/5 hover:bg-white/10 hover:border-indigo-500/50 transition-all group-hover:scale-[1.01] active:scale-[0.98]"
          >
            <div className="p-3 bg-white/10 rounded-xl text-slate-400 group-hover:text-indigo-400 group-hover:bg-indigo-500/10 transition-colors">
              <Camera className="w-6 h-6" />
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-slate-300">Click to upload or <span className="text-indigo-400">paste screenshot</span></p>
              <p className="text-[10px] text-slate-500 mt-1">Supports PNG, JPG (Max 5MB)</p>
            </div>
          </label>
        </div>
      ) : (
        <div className="relative rounded-2xl overflow-hidden border border-white/20 group">
          <img 
            src={screenshot} 
            alt="Upload Preview" 
            className="w-full h-auto max-h-64 object-contain bg-black/40"
          />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
            <button 
              onClick={() => onScreenshotChange(null)}
              className="p-2 bg-rose-500 text-white rounded-xl hover:scale-110 active:scale-95 transition-all shadow-lg"
              title="Remove recruitment image"
            >
              <X className="w-5 h-5" />
            </button>
            <label 
              htmlFor="screenshot-input-file-change"
              className="p-2 bg-indigo-500 text-white rounded-xl hover:scale-110 active:scale-95 transition-all shadow-lg cursor-pointer"
              title="Change recruitment image"
            >
              <ImageIcon className="w-5 h-5" />
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange}
                className="hidden"
                id="screenshot-input-file-change"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
