import { getClinicLabel,  CLINIC_OPTIONS } from "../utils";
import React, { useState } from 'react';
import { Announcement, User } from '../types';
import { Bell, Image as ImageIcon, Link, CheckCircle2, Download, Paperclip, X } from 'lucide-react';
import { doc } from 'firebase/firestore';
import { db, wrappedSetDoc as setDoc, wrappedDeleteDoc as deleteDoc } from '../firebase';
import { toast } from 'sonner';

export function AnnouncementsTab({ 
  announcements, 
  currentUser,
  addSystemNotification
}: { 
  announcements: Announcement[], 
  currentUser: User,
  addSystemNotification?: (title: string, message: string, type: 'schedule' | 'compliance' | 'inquiry' | 'general' | 'incident' | 'absence' | 'feedback', targetAgent: string) => void
}) {
  const isTL = currentUser.role === 'tl' || currentUser.name === 'Hesham Sobhy' || currentUser.role === 'qa';
  
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [clinicFilter, setClinicFilter] = useState('all');
  
  const [filterClinics, setFilterClinics] = useState<string[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageUrl(event.target?.result as string);
        toast.success("Photo attached successfully!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!String(message || '').trim()) return;

    const newAnn: Announcement = {
      id: `ann_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      author: currentUser.name,
      message,
      imageUrl,
      linkUrl,
      clinicFilter,
      reactions: {},
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, "announcements", newAnn.id), newAnn);
      
      if (addSystemNotification) {
        addSystemNotification(
          `📢 New Announcement from ${currentUser.name}`,
          `${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`,
          'general',
          'all'
        );
      }

      toast.success("Announcement posted!");
      setMessage('');
      setImageUrl('');
      setLinkUrl('');
      setClinicFilter('all');
    } catch(err) {
      console.error(err);
      toast.error("Failed to post update.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this announcement?")) return;
    try {
      await deleteDoc(doc(db, "announcements", id));
      toast.success("Deleted.");
    } catch(err) {
      console.error(err);
    }
  };

  // Predefined interactive emojis
  const EMOJI_OPTIONS = ['👍', '❤️', '🎉', '👀', '🔥'];

  const handleReactionToggle = async (annId: string, emoji: string) => {
    const ann = announcements.find(a => a.id === annId);
    if (!ann) return;

    const currentReactions = ann.reactions || {};
    const reactors = currentReactions[emoji] || [];
    const name = currentUser.name;

    let updatedReactors = [...reactors];
    if (reactors.includes(name)) {
      updatedReactors = updatedReactors.filter(u => u !== name);
    } else {
      updatedReactors.push(name);
    }

    const updatedAnn = {
      ...ann,
      reactions: {
        ...currentReactions,
        [emoji]: updatedReactors
      }
    };

    try {
      await setDoc(doc(db, "announcements", annId), updatedAnn);
    } catch (err) {
      console.error("Failed to toggle reaction:", err);
      toast.error("Failed to submit reaction.");
    }
  };

  const triggerDownload = (base64OrUrl: string, filename: string) => {
    try {
      if (base64OrUrl.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = base64OrUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Image download triggered successfully!");
      } else {
        window.open(base64OrUrl, '_blank');
      }
    } catch (err) {
      console.error(err);
      toast.error("Unable to execute download directly. Right click to save or use browser open.");
    }
  };

  const filtered = announcements.filter(a => {
    if (filterClinics.length > 0 && a.clinicFilter !== 'all' && !filterClinics.includes(a.clinicFilter)) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-100 font-display flex items-center gap-2">
            <Bell className="w-8 h-8 text-yellow-500" />
            {isTL ? 'TL Announcements' : 'Updates & Announcements'}
          </h2>
          <p className="text-slate-400 text-sm">Real-time updates, clinic broadcasts, and important instructions.</p>
        </div>
      </div>

      {isTL && (
        <form onSubmit={handlePost} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-slate-200">Post New Update</h3>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Type your announcement here..."
            className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-yellow-500 min-h-[100px]"
            required
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs uppercase font-bold text-slate-400 block mb-1">Attach Photo / Screenshot</label>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs cursor-pointer border border-white/10 select-none transition-colors">
                  <Paperclip className="w-3.5 h-3.5" />
                  Upload Photo file
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
                {imageUrl && (
                  <button type="button" onClick={() => setImageUrl('')} className="p-1 px-2.5 bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 border border-rose-500/30 rounded-xl text-xs transition-colors cursor-pointer">
                    Clear
                  </button>
                )}
              </div>
              <input 
                type="url" 
                value={imageUrl.startsWith('data:') ? '' : imageUrl} 
                onChange={e => setImageUrl(e.target.value)} 
                placeholder="Or paste an Image URL..." 
                className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-yellow-500 mt-1" 
                disabled={imageUrl.startsWith('data:')}
              />
            </div>
            <div>
              <label className="text-xs uppercase font-bold text-slate-400 block mb-1">Reference Link (Optional)</label>
              <input type="url" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://..." className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-yellow-500" />
            </div>
            <div>
              <label className="text-xs uppercase font-bold text-slate-400 block mb-1">Target Clinic</label>
              <select value={clinicFilter} onChange={e => setClinicFilter(e.target.value)} className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-yellow-500 cursor-pointer">
                <option value="all" className="bg-slate-800 text-white font-sans">All Clinics (Global)</option>
                {CLINIC_OPTIONS.map(c => (
<option key={c.value} value={c.value} className="bg-slate-800 text-white font-sans">{c.label}</option>
))}
              </select>
            </div>
          </div>

          {imageUrl && (
            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex items-center gap-4">
              <img src={imageUrl} alt="Upload preview" className="w-20 h-16 object-cover rounded-xl border border-white/10 shrink-0" />
              <div className="space-y-1 text-left">
                <p className="text-xs font-bold text-slate-300">Attached Photo Attachment</p>
                <p className="text-xs text-slate-500">{imageUrl.startsWith('data:') ? 'Local Image Base64 Data Binary File' : 'External Web URL Link resource'}</p>
              </div>
            </div>
          )}
          
          <div className="flex justify-end pt-2">
            <button type="submit" className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold px-6 py-2.5 rounded-xl text-sm flex items-center gap-2 cursor-pointer transition-colors">
              <CheckCircle2 className="w-4 h-4" /> Publish Update
            </button>
          </div>
        </form>
      )}

      <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 min-h-[400px]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-200">Updates History</h3>
          <div className="relative">
            <select 
              value="" 
              onChange={(e) => {
                const val = e.target.value;
                if (val && !filterClinics.includes(val)) {
                  setFilterClinics([...filterClinics, val]);
                }
              }} 
              className="bg-white/[0.04] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 outline-none cursor-pointer"
            >
               <option value="" className="font-sans">➕ Add Clinic to Filter...</option>
               {CLINIC_OPTIONS.filter(c => !filterClinics.includes(c.value)).map(c => (
                 <option key={c.value} value={c.value} className="font-sans">{c.label}</option>
               ))}
            </select>
            {filterClinics.length > 0 && (
              <div className="absolute top-full right-0 z-50 mt-1 flex flex-wrap gap-1 bg-slate-800 p-2 rounded-xl border border-slate-700 shadow w-64">
                <span className="w-full text-xs text-slate-400 font-bold mb-1 flex justify-between">
                  Selected Clinics:
                  <button onClick={() => setFilterClinics([])} className="text-rose-400 hover:text-rose-300">Clear</button>
                </span>
                {filterClinics.map(c => {
                  const label = CLINIC_OPTIONS.find(opt => opt.value === c)?.label || c;
                  return (
                    <span key={c} className="bg-amber-500/20 text-amber-300 border-none px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1">
                      {label}
                      <button onClick={() => setFilterClinics(prev => prev.filter(x => x !== c))} className="hover:text-white cursor-pointer">&times;</button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 text-left">
          {filtered.length === 0 ? (
            <p className="text-slate-400 text-center py-10 font-mono text-sm">No updates found.</p>
          ) : (
            filtered.map(a => (
              <div key={a.id} className="p-5 border border-white/10 rounded-2xl bg-white/5 relative group space-y-3">
                {isTL && (
                  <button onClick={() => handleDelete(a.id)} className="absolute top-4 right-4 text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-rose-400/10 rounded-xl cursor-pointer text-xs font-bold">
                    Delete
                  </button>
                )}
                
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-amber-500 border border-amber-500/20">
                    {(a.author || "System").substring(0,2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-orange-400 font-bold text-sm tracking-wide">{a.author || "System"}</h4>
                    <p className="text-xs text-slate-400 font-mono flex items-center gap-1.5 flex-wrap">
                      <span>{new Date(a.createdAt || Date.now()).toLocaleString()}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded uppercase tracking-wider">
                        {a.clinicFilter === 'all' ? 'Global Broadcast' : getClinicLabel(a.clinicFilter)}
                      </span>
                    </p>
                  </div>
                </div>

                <p className="text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">
                  {a.message}
                </p>
                
                {a.imageUrl && (
                  <div className="p-2.5 bg-white/[0.03] rounded-xl max-w-lg border border-white/5 space-y-2">
                    <img src={a.imageUrl} alt="Attached Announcement File" className="w-full max-h-72 object-contain rounded-xl" />
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-500 font-mono">Image attached by Management</p>
                      <button 
                        type="button" 
                        onClick={() => triggerDownload(a.imageUrl || '', `announcement_file_${a.id}.png`)}
                        className="px-2.5 py-1 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/25 text-yellow-300 rounded-xl text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" /> Download Image
                      </button>
                    </div>
                  </div>
                )}

                {/* Open Link */}
                {a.linkUrl && (
                  <div className="pt-1">
                    <a href={a.linkUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-xl text-xs font-bold transition-colors">
                      <Link className="w-3.5 h-3.5" /> Open Attached URL: {new URL(a.linkUrl).hostname}
                    </a>
                  </div>
                )}

                {/* Emojis Section: Cannot post text reply, can only leave emoji */}
                <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 bg-white/[0.02] p-1.5 rounded-xl border border-white/5">
                    <span className="text-xs text-slate-400 uppercase font-black tracking-wider px-2 border-r border-white/10 select-none">Reactions Only:</span>
                    <div className="flex items-center gap-1">
                      {EMOJI_OPTIONS.map(emoji => {
                        const reactors = (a.reactions || {})[emoji] || [];
                        const hasReacted = reactors.includes(currentUser.name);
                        return (
                          <button
                            key={emoji}
                            onClick={() => handleReactionToggle(a.id, emoji)}
                            className={`px-2 py-1 rounded-xl text-xs transition-all relative group flex items-center gap-1 cursor-pointer select-none border ${
                              hasReacted 
                                ? 'bg-amber-500/15 border-amber-500/35 text-amber-300 scale-105 shadow-inner' 
                                : 'bg-white/5 border-transparent hover:bg-white/10 text-slate-400'
                            }`}
                            title={reactors.length > 0 ? `Reacted: ${reactors.join(', ')}` : "Click to react"}
                          >
                            <span>{emoji}</span>
                            {reactors.length > 0 && (
                              <span className="text-xs font-bold font-mono text-slate-300">{reactors.length}</span>
                            )}

                            {/* Tooltip containing reactor names */}
                            {reactors.length > 0 && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block px-2 py-1 bg-slate-950 text-xs font-mono text-slate-200 rounded border border-white/10 whitespace-nowrap z-30 shadow">
                                {reactors.map(name => name.split(' ')[0]).join(', ')}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 italic mt-0.5 select-none font-sans">
                    * Text reply disabled by Team Leader permissions. Emoji reactions active.
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
