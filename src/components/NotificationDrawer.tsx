import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, CheckCircle2, Info, AlertTriangle, X, Trash2 } from 'lucide-react';
import { updateDoc, doc } from 'firebase/firestore'; 
import { db } from '../firebase'; // verify path

export const NotificationDrawer = ({
  isOpen,
  onClose,
  visibleNotifs,
  currentUser,
  handleMarkAllNotifsAsRead,
  handleMarkSingleNotifAsRead
}: any) => {

  const handleClearNotif = (id: string, currentClearedBy: string[]) => {
    if (!currentUser) return;
    const seenSet = new Set(currentClearedBy || []);
    seenSet.add(currentUser.name);
    updateDoc(doc(db, "notifications", id), {
      clearedByUsers: Array.from(seenSet)
    }).catch(e => console.error("Clear Notif Error:", e));
  };

  const sortedNotifs = [...visibleNotifs].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const unreadCount = sortedNotifs.filter(n => !n.seenByUsers?.includes(currentUser?.name)).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-[#0f0f13] border-l border-white/10 shadow-2xl z-50 flex flex-col"
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

            <div className="flex-1 overflow-y-auto p-4 space-y-3 relative">
              {sortedNotifs.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 space-y-3">
                  <Bell className="w-12 h-12 opacity-20" />
                  <p className="font-sans text-sm">You're all caught up!</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-end pb-2">
                    <button 
                      onClick={handleMarkAllNotifsAsRead}
                      className="text-[10px] uppercase tracking-wider font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      Mark all as read
                    </button>
                  </div>
                  {sortedNotifs.map(notif => {
                    const isUnread = !notif.seenByUsers?.includes(currentUser?.name);
                    const getIcon = () => {
                      if (notif.type === 'alert') return <AlertTriangle className="w-4 h-4 text-rose-400" />;
                      if (notif.type === 'info') return <Info className="w-4 h-4 text-blue-400" />;
                      return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
                    };

                    const getBgClass = () => {
                      if (!isUnread) return "bg-white/5 border-white/5 opacity-60";
                      if (notif.type === 'alert') return "bg-rose-500/10 border-rose-500/20";
                      if (notif.type === 'info') return "bg-blue-500/10 border-blue-500/20";
                      return "bg-emerald-500/10 border-emerald-500/20";
                    };

                    return (
                      <div 
                        key={notif.id}
                        onMouseEnter={() => {
                          if (isUnread) handleMarkSingleNotifAsRead(notif.id);
                        }}
                        className={`relative p-4 rounded-2xl border transition-all ${getBgClass()}`}
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
                            className="text-slate-500 hover:text-rose-400 p-1"
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
                  })}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
