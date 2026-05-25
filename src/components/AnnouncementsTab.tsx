import React, { useState } from 'react';
import { Announcement, User } from '../types';
import { Bell, Image as ImageIcon, Link, CheckCircle2 } from 'lucide-react';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
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
  
  const [filterClinic, setFilterClinic] = useState('all');

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const newAnn: Announcement = {
      id: `ann_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      author: currentUser.name,
      message,
      imageUrl,
      linkUrl,
      clinicFilter,
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

  const filtered = announcements.filter(a => {
    if (filterClinic !== 'all' && a.clinicFilter !== 'all' && a.clinicFilter !== filterClinic) return false;
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
          <p className="text-slate-400 text-sm">Real-time updates and important clinic broadcasts.</p>
        </div>
      </div>

      {isTL && (
        <form onSubmit={handlePost} className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-2xl space-y-4">
          <h3 className="text-lg font-bold text-slate-200">Post New Update</h3>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Type your announcement here..."
            className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-yellow-500 min-h-[100px]"
            required
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Image URL (Optional)</label>
              <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-yellow-500" />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Reference Link (Optional)</label>
              <input type="url" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://..." className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-yellow-500" />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Target Clinic</label>
              <select value={clinicFilter} onChange={e => setClinicFilter(e.target.value)} className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-yellow-500 cursor-pointer">
                <option value="all" className="bg-slate-800 text-white">All Clinics (Global)</option>
                <option value="Dermadent vip" className="bg-slate-800 text-white">Dermadent VIP</option>
                <option value="dermadent" className="bg-slate-800 text-white">Dermadent</option>
                <option value="onetouch1" className="bg-slate-800 text-white">One Touch 1 AlMu'tarid</option>
                <option value="onetouch2" className="bg-slate-800 text-white">One Touch 2 Markhaniya</option>
                <option value="welltouch" className="bg-slate-800 text-white">WellTouch</option>
                <option value="newedge" className="bg-slate-800 text-white">New Edge</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end pt-2">
            <button type="submit" className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold px-6 py-2.5 rounded-xl text-sm flex items-center gap-2 cursor-pointer transition-colors shadow-lg shadow-yellow-500/20">
              <CheckCircle2 className="w-4 h-4" /> Publish Update
            </button>
          </div>
        </form>
      )}

      <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 backdrop-blur-xl min-h-[400px]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-200">Updates History</h3>
          <select value={filterClinic} onChange={e => setFilterClinic(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 outline-none cursor-pointer">
             <option value="all">Filter by Clinic...</option>
             <option value="Dermadent vip">Dermadent VIP</option>
             <option value="dermadent">Dermadent</option>
             <option value="onetouch1">One Touch 1 AlMu'tarid</option>
             <option value="onetouch2">One Touch 2 Markhaniya</option>
             <option value="welltouch">WellTouch</option>
             <option value="newedge">New Edge</option>
          </select>
        </div>

        <div className="space-y-4">
          {filtered.length === 0 ? (
            <p className="text-slate-400 text-center py-10 font-mono text-sm">No updates found.</p>
          ) : (
            filtered.map(a => (
              <div key={a.id} className="p-5 border border-white/10 rounded-2xl bg-white/5 relative group">
                {isTL && (
                  <button onClick={() => handleDelete(a.id)} className="absolute top-4 right-4 text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-rose-400/10 rounded-lg cursor-pointer">
                    Delete
                  </button>
                )}
                
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-amber-500 border border-amber-500/20">
                    {(a.author || "System").substring(0,2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-orange-400 font-bold text-sm tracking-wide">{a.author || "System"}</h4>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {new Date(a.createdAt || Date.now()).toLocaleString()} • {a.clinicFilter === 'all' ? 'Global Broadcast' : a.clinicFilter}
                    </p>
                  </div>
                </div>

                <p className="text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">
                  {a.message}
                </p>
                
                {(a.imageUrl || a.linkUrl) && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {a.imageUrl && (
                      <a href={a.imageUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg text-xs font-bold transition-colors">
                        <ImageIcon className="w-3.5 h-3.5" /> View Image
                      </a>
                    )}
                    {a.linkUrl && (
                      <a href={a.linkUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-lg text-xs font-bold transition-colors">
                        <Link className="w-3.5 h-3.5" /> Open Link
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
