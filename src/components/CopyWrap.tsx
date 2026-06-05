import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

export const CopyWrap = ({ 
  text, 
  children, 
  label = "Data",
  phoneMode = false
}: { 
  text: string; 
  children: React.ReactNode; 
  label?: string;
  phoneMode?: boolean;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!text) return;
    
    let textToCopy = text;
    if (phoneMode && typeof text === 'string') {
      textToCopy = text.replace(/^0+/, '');
    }
    
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast.success(`${label} copied!`, { icon: '📋' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <span 
      onClick={handleCopy} 
      className="group/cwrap inline-flex items-center gap-1 cursor-pointer transition-colors bg-white/[0.03] hover:bg-white/[0.08] px-1.5 py-0.5 rounded border border-transparent hover:border-white/10 active:scale-95" 
      title={`Copy ${label}`}
    >
      {children}
      {copied ? (
        <Check className="w-3 h-3 text-emerald-400 shrink-0" />
      ) : (
        <Copy className="w-3 h-3 text-slate-500 opacity-20 group-hover/cwrap:opacity-100 transition-opacity shrink-0" />
      )}
    </span>
  );
};
