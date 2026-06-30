import React, { useState, useRef, useEffect } from 'react';
import { ChevronsRight, Check, Loader2 } from 'lucide-react';

interface SlideToConfirmProps {
  label: string;              // e.g. "Slide to Mark as Answered"
  confirmedLabel?: string;    // e.g. "Answered!"
  onConfirm: () => Promise<void> | void;
  disabled?: boolean;
  colorClass?: string;        // e.g. "from-emerald-500 to-teal-500"
  icon?: React.ReactNode;
}

export const SlideToConfirm: React.FC<SlideToConfirmProps> = ({
  label,
  confirmedLabel = "Done!",
  onConfirm,
  disabled = false,
  colorClass = "from-emerald-500 to-teal-500",
  icon,
}) => {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  const THRESHOLD = 0.85; // 85% of track width to confirm

  const getMaxDrag = () => {
    if (!trackRef.current || !handleRef.current) return 0;
    return trackRef.current.offsetWidth - handleRef.current.offsetWidth - 8; // 8px padding
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled || isConfirmed || isLoading) return;
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - 24; // 24 = half handle width
    const maxDrag = getMaxDrag();
    const clamped = Math.max(0, Math.min(x, maxDrag));
    setDragX(clamped);
  };

  const handlePointerUp = async () => {
    if (!isDragging) return;
    setIsDragging(false);
    const maxDrag = getMaxDrag();
    if (maxDrag > 0 && dragX / maxDrag >= THRESHOLD) {
      setDragX(maxDrag);
      setIsLoading(true);
      try {
        await onConfirm();
        setIsConfirmed(true);
      } catch (e) {
        console.error("Slide confirm action failed:", e);
        setDragX(0); // snap back on error
      } finally {
        setIsLoading(false);
      }
    } else {
      setDragX(0); // snap back
    }
  };

  useEffect(() => {
    if (isConfirmed) {
      const t = setTimeout(() => {
        setIsConfirmed(false);
        setDragX(0);
      }, 1800);
      return () => clearTimeout(t);
    }
  }, [isConfirmed]);

  // Fallback for keyboard accessibility
  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (disabled || isConfirmed || isLoading) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsLoading(true);
      try {
        await onConfirm();
        setIsConfirmed(true);
        setDragX(getMaxDrag());
      } catch (e) {
        console.error("Keyboard confirm action failed:", e);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const maxDrag = getMaxDrag();
  const progress = maxDrag > 0 ? dragX / maxDrag : 0;

  return (
    <div
      ref={trackRef}
      className={`relative w-full h-12 rounded-full border border-white/8 overflow-hidden select-none touch-none transition-opacity ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-grab'
      } ${isConfirmed ? `bg-gradient-to-r ${colorClass}` : 'bg-white/5'}`}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Progress fill */}
      <div
        className={`absolute inset-y-0 left-0 bg-gradient-to-r ${colorClass} opacity-30 transition-all`}
        style={{ width: `${Math.min(100, (dragX + 48) / (trackRef.current?.offsetWidth || 1) * 100)}%` }}
      />

      {/* Label */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-12">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-200 truncate">
          {isConfirmed ? confirmedLabel : isLoading ? "Processing..." : label}
        </span>
      </div>

      {/* Handle */}
      <div
        ref={handleRef}
        onPointerDown={handlePointerDown}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        className={`absolute top-1 left-1 h-10 w-10 z-10 rounded-full flex items-center justify-center bg-gradient-to-br ${colorClass} transition-transform focus:outline-none focus:ring-2 focus:ring-white/50 ${ isDragging ? '' : 'transition-all duration-300' }`}
        style={{ transform: `translateX(${dragX}px)` }}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 text-white animate-spin" />
        ) : isConfirmed ? (
          <Check className="w-5 h-5 text-white" />
        ) : (
          icon || <ChevronsRight className="w-5 h-5 text-white" />
        )}
      </div>
    </div>
  );
};
