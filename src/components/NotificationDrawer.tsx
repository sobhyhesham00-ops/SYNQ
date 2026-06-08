import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, CheckCircle2, Info, AlertTriangle, X, Trash2 } from 'lucide-react';
import { doc } from 'firebase/firestore'; 
import { db, wrappedUpdateDoc as updateDoc } from '../firebase'; // verify path

export const NotificationDrawer = ({
  isOpen,
  onClose,
  visibleNotifs,
  currentUser,
  handleMarkAllNotifsAsRead,
  handleMarkSingleNotifAsRead,
  setActiveTab
}: any) => {

  const handleClearNotif = (id: string, currentClearedBy: string[]) => {
    if (!currentUser) return;
    const seenSet = new Set(currentClearedBy || []);
    seenSet.add(currentUser.id);
    updateDoc(doc(db, "notifications", id), {
      clearedByUsers: Array.from(seenSet)
    }).catch(e => console.error("Clear Notif Error:", e));
  };

  const [typeFilter, setTypeFilter] = useState<string>('all');

  const sortedNotifs = [...visibleNotifs].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Filter sortedNotifs by typeFilter before rendering
  const displayNotifs = typeFilter === 'all' ? sortedNotifs : sortedNotifs.filter(n => n.type === typeFilter);

  const getNavTab = (notif: any) => {
    if (notif.entityType === 'inquiry') return 'inquiries';
    if (notif.entityType === 'scheduling_request') return 'my-requests';
    if (notif.entityType === 'case') return 'daily-cases';
    if (notif.entityType === 'tt_request') return 'fintech';
    if (notif.entityType === 'tt_complaint') return 'fintech';
    if (notif.entityType === 'client_comm') return 'fintech';
    
    // fallbacks based on type string for older notifications:
    if (notif.type === 'inquiry') return 'inquiries';
    if (notif.type === 'schedule') return 'my-requests';
    if (notif.type === 'feedback') return 'tl-feedback';
    return null;
  };

  const unreadCount = sortedNotifs.filter(n => !n.seenByUsers?.includes(currentUser?.id)).length;

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <React.Fragment key="drawer">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999]"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-[#0f0f13] border-l border-white/10 shadow-2xl z-[1000] flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-[#16161c]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                  <Bell className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-slate-100 uppercase tracking-widest text-sm">Notifications</h3>
                  <p className="text-xs text-slate-400">{unreadCount} unread message{unreadCount !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-white/5 bg-[#121217] flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {[
                { value: 'all', label: 'All' },
                { value: 'incident', label: 'Incidents' },
                { value: 'compliance', label: 'Compliance' },
                { value: 'schedule', label: 'Schedules' },
                { value: 'inquiry', label: 'Inquiries' },
                { value: 'absence', label: 'Absences' },
                { value: 'feedback', label: 'Feedback' },
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => setTypeFilter(item.value)}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all shrink-0 cursor-pointer ${
                    typeFilter === item.value
                      ? 'bg-[#1e1b4b] text-indigo-300 border-indigo-500/30'
                      : 'bg-white/5 text-slate-400 border-transparent hover:bg-white/10 hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 relative">
              {sortedNotifs.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 space-y-3">
                  <Bell className="w-12 h-12 opacity-20" />
                  <p className="font-sans text-sm">You're all caught up!</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center pb-2">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      Showing {displayNotifs.length} items
                    </span>
                    <button 
                      onClick={handleMarkAllNotifsAsRead}
                      className="text-[10px] uppercase tracking-wider font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                    >
                      Mark all as read
                    </button>
                  </div>

                  {displayNotifs.length === 0 ? (
                    <div className="pt-10 flex flex-col items-center justify-center text-slate-500 space-y-2 text-center px-4">
                      <Bell className="w-8 h-8 opacity-10" />
                      <p className="font-sans text-xs">No notifications for this filter</p>
                    </div>
                  ) : (
                    displayNotifs.map(notif => {
                      const isUnread = !notif.seenByUsers?.includes(currentUser?.name);
                      const getIcon = () => {
                        if (notif.type === 'incident' || notif.type === 'compliance') return <AlertTriangle className="w-4 h-4 text-rose-400" />;
                        if (notif.type === 'schedule') return <Info className="w-4 h-4 text-blue-400" />;
                        if (notif.type === 'inquiry') return <Info className="w-4 h-4 text-amber-400" />;
                        if (notif.type === 'absence') return <Info className="w-4 h-4 text-orange-400" />;
                        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
                      };

                      const getBgClass = () => {
                        if (!isUnread) return 'bg-white/5 border-white/5 opacity-60';
                        if (notif.type === 'incident' || notif.type === 'compliance') return 'bg-rose-500/10 border-rose-500/20';
                        if (notif.type === 'schedule') return 'bg-blue-500/10 border-blue-500/20';
                        if (notif.type === 'inquiry') return 'bg-amber-500/10 border-amber-500/20';
                        if (notif.type === 'absence') return 'bg-orange-500/10 border-orange-500/20';
                        return 'bg-emerald-500/10 border-emerald-500/20';
                      };

                      return (
                        <div 
                          key={notif.id}
                          onClick={() => {
                            if (isUnread && handleMarkSingleNotifAsRead) handleMarkSingleNotifAsRead(notif.id);
                            const tab = getNavTab(notif);
                            if (tab && setActiveTab) {
                              setActiveTab(tab);
                              onClose();
                            }
                            
                            // Scroll to entity
                            if (notif.entityId) {
                                setTimeout(() => {
                                    const element = document.getElementById(`request-${notif.entityId}`) || document.getElementById(`inquiry-${notif.entityId}`);
                                    if (element) {
                                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        element.classList.add('ring-2', 'ring-indigo-500', 'ring-offset-2', 'ring-offset-[#0f0f13]', 'transition-all', 'duration-500');
                                        setTimeout(() => {
                                            element.classList.remove('ring-2', 'ring-indigo-500', 'ring-offset-2', 'ring-offset-[#0f0f13]');
                                        }, 3000);
                                    }
                                }, 300); // Wait for tab change
                            }
                          }}
                          className={`relative p-4 rounded-2xl border transition-all cursor-pointer hover:border-white/10 select-none ${getBgClass()}`}
                        >
                          <div className="flex justify-between items-start mb-2 gap-3">
                            <div className="flex items-center gap-2">
                              {getIcon()}
                              <span className="font-bold text-xs text-slate-200">
                                {notif.title}
                              </span>
                            </div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleClearNotif(notif.id, notif.clearedByUsers || []);
                              }}
                              className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-xs text-slate-300 font-sans leading-relaxed">
                            {notif.message}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono mt-3">
                            {new Date(notif.createdAt).toLocaleString()}
                          </p>
                          {isUnread && (
                            <div className="absolute right-4 bottom-4 w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                          )}
                        </div>
                      );
                    })
                  )}
                </>
              )}
            </div>
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
};
