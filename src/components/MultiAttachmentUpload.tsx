import React, { useState } from 'react';
import { Link, Camera, X, ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { compressImage } from '../utils';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

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

  const handleRemovePhoto = (index: number) => {
    onPhotosChange(photos.filter((_, i) => i !== index));
  };
  
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{current: number, total: number} | null>(null);

  React.useEffect(() => {
    if (onUploadStateChange) onUploadStateChange(isUploading);
  }, [isUploading, onUploadStateChange]);

  const uploadSingleFile = async (file: File): Promise<string> => {
    const timestamp = Date.now();
    const safeFileName = file.name ? file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_") : `pasted_image_${timestamp}.png`;
    const path = `case-attachments/general/upload/root/${timestamp}-${safeFileName}`;
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    return new Promise<string>((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        null,
        (error) => reject(error),
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(url);
          } catch (err) {
            reject(err);
          }
        }
      );
    });
  };
  
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const filesArray: File[] = [];
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            if (file) filesArray.push(file);
        }
    }

    if (filesArray.length > 0) {
        if (photos.length >= maxFiles) {
          toast.error(`You can only upload up to ${maxFiles} attachments.`);
          return;
        }
        const availableSlots = maxFiles - photos.length;
        const sliceArray = filesArray.slice(0, availableSlots);
        if (sliceArray.length < filesArray.length) {
          toast.warning(`Only ${sliceArray.length} pasted file(s) were processed due to the file limit.`);
        }

        setIsUploading(true);
        setUploadProgress({ current: 0, total: sliceArray.length });

        try {
          const uploadedUrls: string[] = [];
          for (let i = 0; i < sliceArray.length; i++) {
            const file = sliceArray[i];
            const url = await uploadSingleFile(file);
            if (url) {
              uploadedUrls.push(url);
            }
            setUploadProgress({ current: i + 1, total: sliceArray.length });
          }
          const filtered = uploadedUrls.filter(Boolean);
          if (filtered.length > 0) {
            const uniquePhotos = Array.from(new Set([...photos, ...filtered]));
            onPhotosChange(uniquePhotos);
            toast.success(`Successfully uploaded ${filtered.length} pasted file(s)`);
          }
        } catch (err: any) {
          console.error("Paste upload failed", err);
          const code = err?.code ? ` (${err.code})` : '';
          toast.error(`Failed to upload pasted image: ${err.message}${code}`);
        } finally {
          setIsUploading(false);
          setUploadProgress(null);
        }
    }
  };


  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleMultipleFiles(e.dataTransfer.files);
    }
  };

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

  const handlePhotoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    handleMultipleFiles(files);
  };

  const handleMultipleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    if (photos.length >= maxFiles) {
      toast.error(`You can only upload up to ${maxFiles} attachments.`);
      return;
    }

    setIsUploading(true);
    setUploadProgress({ current: 0, total: files.length });

    const filesArray = Array.from(files);
    const newPhotos: string[] = [];

    for (let i = 0; i < filesArray.length; i++) {
        if (photos.length + newPhotos.length >= maxFiles) {
             toast.error(`Attachment limit of ${maxFiles} reached. Remaining files were skipped.`);
             break;
        }
        const file = filesArray[i];
        
        // Size validation (Max 5MB)
        if (file.size > 5 * 1024 * 1024) {
             toast.error(`File ${file.name} is too large. Max size is 5MB.`);
             continue;
        }

        // Type validation
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
        if (!allowedTypes.includes(file.type) && !file.type.startsWith('image/')) {
             toast.error(`Invalid file type for ${file.name}`);
             continue;
        }

        try {
            const downloadUrl = await uploadSingleFile(file);
            if (downloadUrl && !photos.includes(downloadUrl) && !newPhotos.includes(downloadUrl)) {
                 newPhotos.push(downloadUrl);
            }
        } catch (e: any) {
            console.error('File upload error', e);
            const code = e?.code ? ` (${e.code})` : '';
            toast.error(`Failed to upload ${file.name}: ${e.message}${code}`);
        }

        setUploadProgress({ current: i + 1, total: files.length });
    }

    if (newPhotos.length > 0) {
        onPhotosChange([...photos, ...newPhotos]);
        toast.success(`Successfully uploaded ${newPhotos.length} attachment(s)`);
    }
    
    setIsUploading(false);
    setUploadProgress(null);
  };

  return (
    <div 
      className={`space-y-4 rounded-xl transition-all ${isDragging ? 'bg-white/5 ring-2 ring-indigo-500 border border-indigo-500/50 p-2' : ''}`}
      onPaste={handlePaste}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Photos Section */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-widest block text-slate-400">
          {photosLabel}
        </label>
        
        <div className="flex flex-wrap gap-2 items-start mt-2">
            {photos.map((photo, index) => {
              const isImage = photo.startsWith('data:image/') || photo.startsWith('http');
              return (
              <div key={index} className="relative group w-24 h-24 rounded-xl border border-white/10 overflow-hidden bg-white/[0.04] shadow-sm">
                {isImage ? (
                  <img referrerPolicy="no-referrer" src={photo} alt="screenshot" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800">
                    <ImageIcon className="w-6 h-6 text-slate-400 mb-1" />
                    <span className="text-xs text-slate-400 font-bold uppercase truncate max-w-[80px]">File</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                    type="button"
                    onClick={() => handleRemovePhoto(index)}
                    className="p-1.5 bg-rose-500 rounded-xl hover:bg-rose-400 transition-colors shadow-sm active:scale-95"
                >
                    <X className="w-4 h-4 text-white" />
                </button>
                </div>
              </div>
            )})}
            <label className={`flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-white/10 rounded-xl bg-white/5 transition-all ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10 hover:border-indigo-500/50 cursor-pointer group hover:scale-[1.02] active:scale-95'}`}>
                <input 
                    type="file"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                    multiple
                    className="hidden"
                    disabled={isUploading}
                    onChange={(e) => handleMultipleFiles(e.target.files)}
                />
                {isUploading ? (
                  <>
                    <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                    <span className="text-xs text-indigo-300 font-bold uppercase mt-2">
                       {uploadProgress ? `${uploadProgress.current}/${uploadProgress.total}` : 'Uploading'}
                    </span>
                  </>
                ) : (
                  <>
                    <Camera className="w-6 h-6 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                    <span className="text-xs text-slate-500 font-bold uppercase mt-1 group-hover:text-indigo-300">Add File</span>
                  </>
                )}
            </label>
        </div>
      </div>

      {/* Links Section */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-widest block text-slate-400">
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
              className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>
          <button
            type="button"
            onClick={handleAddLink}
            className="px-3 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/20 text-indigo-300 text-xs font-bold rounded-xl transition-all active:scale-95 h-[34px] uppercase"
          >
            Add
          </button>
        </div>

        {links.length > 0 && (
          <div className="space-y-1.5 pt-1">
            {links.map((linkStr, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-white/5 border border-white/10 rounded-xl text-xs">
                <span className="text-indigo-300 underline font-mono truncate max-w-[200px]">{linkStr}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveLink(index)}
                  className="text-red-400 hover:text-red-300 text-xs font-medium uppercase font-bold transition-all px-2 py-1 bg-red-400/10 rounded-xl border border-red-400/20 active:scale-95"
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
