import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Paperclip, 
  X, 
  CheckCheck, 
  Languages, 
  User, 
  MessageSquare,
  Search,
  FileText,
  ImageIcon,
  Download,
  Users,
  ChevronRight,
  Sparkles,
  Check,
  MoreVertical,
  Bell,
  Trash2,
  Clock,
  Heart,
  Smile
} from 'lucide-react';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  where,
  disableNetwork, 
  doc
} from 'firebase/firestore';
import { 
  db,
  wrappedOnSnapshot as onSnapshot,
  wrappedAddDoc as addDoc,
  wrappedUpdateDoc as updateDoc,
  wrappedDeleteDoc as deleteDoc,
  wrappedSetDoc as setDoc
} from '../firebase';

import { ChatMessage, User as AppUser } from '../types';
import { getAgentTL } from '../utils';
import { toast } from 'sonner';

interface MessagingSystemProps {
  currentUser: AppUser;
  agentsList: string[];
  registeredUsers?: any[];
  addSystemNotification?: (title: string, message: string, type: 'schedule' | 'compliance' | 'inquiry' | 'general' | 'incident' | 'absence' | 'feedback', targetAgent: string) => void;
}

export const MessagingSystem: React.FC<MessagingSystemProps> = ({ currentUser, agentsList, registeredUsers, addSystemNotification }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState<string>('all'); // "all", "tl", "team:NAME", or agent name
  const [activeSegment, setActiveSegment] = useState<'all' | 'channels' | 'direct'>('all');
  const [language, setLanguage] = useState<'en' | 'ar'>('en');
  const [attachment, setAttachment] = useState<{ data: string; name: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [msgSearchQuery, setMsgSearchQuery] = useState('');
  const [isShowingMsgSearch, setIsShowingMsgSearch] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isRecipientDrawerOpen, setIsRecipientDrawerOpen] = useState(false);

  const userTL = getAgentTL(currentUser.name);
  const isTL = currentUser.role === 'tl';

  // Helper quick phrases for easy tap & send
  const quickPhrases = [
    "Adherence Checked!",
    "Clocking in now 🚀",
    "Logging lunch break 🍱",
    "Returning to desk!",
    "Sent the requested details.",
    "Could you please check my inquiry?",
    "Need urgent TL support, please."
  ];

  // Helper to get friendly label
  const getRecipientLabel = () => {
    if (!selectedRecipient) return 'Inbox 📧';
    if (selectedRecipient === 'all') return 'Global Broadcast 🌐';
    if (selectedRecipient === 'tl') return 'TL & Support Sync 🛡️';
    if (selectedRecipient.startsWith('team:')) {
      const tl = String(selectedRecipient || '').split(':')[1] || '';
      return tl === currentUser.name ? 'My Sub-Team 👥' : `${tl}'s Team 👥`;
    }
    return selectedRecipient;
  };

  const getRecipientSubtitle = () => {
    if (selectedRecipient === 'all') return 'Reaches all department agents instantly';
    if (selectedRecipient === 'tl') return 'Private management & support channel';
    if (selectedRecipient.startsWith('team:')) return 'Only members of your direct reporting team';
    return 'Private Direct Message • Encrypted Connection';
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Track visiting group channels to reset unread counters
  useEffect(() => {
    if (selectedRecipient.startsWith('team:') || selectedRecipient === 'all' || selectedRecipient === 'tl') {
      localStorage.setItem(`sched_read_time_${selectedRecipient}`, new Date().toISOString());
    }
  }, [selectedRecipient]);

  // Firestore listener
  useEffect(() => {
    const messagesRef = collection(db, 'messages');
    let q = query(
      messagesRef,
      where('participants', 'array-contains', currentUser.id),
      orderBy('createdAt', 'desc'),
      limit(500)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      
      const filtered = msgs.filter(m => {
        const rName = (m.receiverName || '').toLowerCase();
        const sName = (m.senderName || '').toLowerCase();
        const curName = (currentUser.name || '').toLowerCase();
        
        // Global channel
        if (rName === 'all') return true;
        
        // TL channel (accessible by any TL or specific management)
        if (rName === 'tl' && (currentUser.role === 'tl' || curName === 'amira hassan' || curName === 'hesham sobhy' || curName === 'hesso')) return true;
        
        // Team channel
        if (rName.startsWith('team:')) {
          const teamTL = String(m.receiverName || '').split(':')[1]?.toLowerCase() || '';
          if (curName === teamTL) return true;
          if ((userTL || '').toLowerCase() === teamTL) return true;
          return false;
        }

        // Private direct message (case insensitive)
        if (rName === curName || sName === curName) return true;
        
        return false;
      }).reverse();

      setMessages(filtered);
      
      // Real-time inbox reading indicator:
      // ONLY mark as seen if the recipient matches current user AND we are actively viewing this sender!
      snapshot.docs.forEach(d => {
        const data = d.data();
        const rName = (data.receiverName || '').toLowerCase();
        const sName = (data.senderName || '').toLowerCase();
        const curName = (currentUser.name || '').toLowerCase();
        
        if (rName === curName && !data.seen && selectedRecipient.toLowerCase() === sName) {
          updateDoc(doc(db, 'messages', d.id), { seen: true });
        }
      });
    }, (error) => {
      console.error("Messages Real-time Sync Error:", error.code, error.message);
    });

    return () => unsubscribe();
  }, [selectedRecipient, currentUser, userTL]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Compute stats for all items
  const statsEngine = useMemo(() => {
    const privateStats: Record<string, { lastText: string; lastTime: string; unreadCount: number }> = {};
    const channelStats: Record<string, { lastText: string; lastTime: string; unreadCount: number }> = {};

    const curName = (currentUser.name || '').toLowerCase();

    // 1. Compute Direct Message Stats (Case Insensitive)
    agentsList.forEach(name => {
      const targetName = (name || '').toLowerCase();
      const relativeMsgs = messages.filter(m => {
        const rName = (m.receiverName || '').toLowerCase();
        const sName = (m.senderName || '').toLowerCase();
        return (sName === targetName && rName === curName) ||
               (sName === curName && rName === targetName);
      });
      const unread = relativeMsgs.filter(m => (m.receiverName || '').toLowerCase() === curName && !m.seen).length;
      const last = relativeMsgs[relativeMsgs.length - 1];
      privateStats[name] = {
        lastText: last ? (last.text || "📎 Shared an attachment") : "Tap to start chatting",
        lastTime: last ? last.createdAt : "",
        unreadCount: unread
      };
    });

    // 2. Compute Channels Stats
    const channels = ['all', 'tl'];
    if (isTL) {
      channels.push(`team:${currentUser.name}`);
    } else if (userTL !== 'Unassigned') {
      channels.push(`team:${userTL}`);
    }

    channels.forEach(ch => {
      const relativeMsgs = messages.filter(m => (m.receiverName || '').toLowerCase() === ch.toLowerCase());
      const last = relativeMsgs[relativeMsgs.length - 1];
      
      const lastVisited = localStorage.getItem(`sched_read_time_${ch}`);
      const unreadMsgs = lastVisited
        ? relativeMsgs.filter(m => (m.senderName || '').toLowerCase() !== curName && new Date(m.createdAt).getTime() > new Date(lastVisited).getTime())
        : relativeMsgs.filter(m => (m.senderName || '').toLowerCase() !== curName);

      channelStats[ch] = {
        lastText: last ? `${last.senderName}: ${last.text || "📎 Shared an attachment"}` : "No messages yet",
        lastTime: last ? last.createdAt : "",
        unreadCount: unreadMsgs.length
      };
    });

    return { privateStats, channelStats };
  }, [messages, agentsList, currentUser, isTL, userTL]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachment({
        data: event.target?.result as string,
        name: file.name
      });
      setIsUploading(false);
      toast.success(`Attached: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const finalVal = textToSend !== undefined ? textToSend : inputText;
    if (!String(finalVal || '').trim() && !attachment) return;

    const rName = selectedRecipient.toLowerCase();
    let pids = [currentUser.id];
    
    // Attempt to extract all relevant target IDs based on recipient logic
    if (rName === 'all') {
      pids = Array.from(new Set([
        currentUser.id,
        ...(registeredUsers || []).map(u => u.uid || u.id).filter(Boolean)
      ]));
    } else if (rName === 'tl') {
      pids = Array.from(new Set([
        currentUser.id,
        ...(registeredUsers || []).filter(u => {
          const uName = (u.name || '').toLowerCase();
          return u.role === 'tl' || u.role === 'admin' || u.role === 'superadmin' || 
                 uName === 'amira hassan' || uName === 'hesham sobhy' || uName === 'hesso';
        }).map(u => u.uid || u.id).filter(Boolean)
      ]));
    } else if (rName.startsWith('team:')) {
      const teamTL = rName.split(':')[1]?.toLowerCase() || '';
      let meta: any = {};
      try { meta = JSON.parse(localStorage.getItem('sched_agent_meta') || '{}'); } catch(e) {}
      
      pids = Array.from(new Set([
        currentUser.id,
        ...(registeredUsers || []).filter(u => {
          const uN = (u.name || '').toLowerCase();
          if (uN === teamTL) return true;
          const uMetaTL = (meta[u.name]?.tlName || '').toLowerCase();
          if (uMetaTL === teamTL) return true;
          return false;
        }).map(u => u.uid || u.id).filter(Boolean)
      ]));
    } else {
      const target = (registeredUsers || []).find(u => (u.name || '').toLowerCase() === rName);
      if (target && (target.uid || target.id)) {
        pids.push(target.uid || target.id);
      }
    }

    const newMessage = {
      senderName: currentUser.name,
      senderId: currentUser.id,
      receiverName: selectedRecipient,
      text: String(finalVal || '').trim(),
      attachment: attachment?.data || null,
      attachmentName: attachment?.name || null,
      createdAt: new Date().toISOString(),
      seen: false,
      language: language,
      participants: pids
    };

    try {
      await addDoc(collection(db, 'messages'), newMessage);
      
      if (addSystemNotification) {
        addSystemNotification(
          `💬 Chat from ${currentUser.name}`,
          String(finalVal || '').trim() || (attachment ? `Shared attachment: ${attachment.name}` : 'Sent a chat message'),
          'general',
          selectedRecipient
        );
      }

      if (textToSend === undefined) {
        setInputText('');
      }
      setAttachment(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  const handleQuickPhraseClick = (phrase: string) => {
    handleSendMessage(phrase);
    toast.success(`Quick phrase dispatched!`);
  };

  const isArabic = (text: string) => {
    const arabicPattern = /[\u0600-\u06FF]/;
    return arabicPattern.test(text);
  };

  // Delete message (Available for TLs or original sender)
  const handleDeleteMessage = async (msgId: string) => {
    if (!window.confirm("Are you sure you want to retract/delete this message?")) return;
    try {
      await deleteDoc(doc(db, "messages", msgId));
      toast.success("Message deleted successfully.");
    } catch (err) {
      console.error("Delete Msg Error:", err);
      toast.error("Failed to delete message");
    }
  };

  // Filter messages in thread
  const filteredThreadMessages = useMemo(() => {
    const curName = (currentUser.name || '').toLowerCase();
    const selRecName = selectedRecipient.toLowerCase();

    // First filter by selected channel/recipient thread
    const threadMsgs = messages.filter(m => {
      const rName = (m.receiverName || '').toLowerCase();
      const sName = (m.senderName || '').toLowerCase();

      if (selectedRecipient === 'all') {
        return rName === 'all';
      }
      if (selectedRecipient === 'tl') {
        return rName === 'tl';
      }
      if (selectedRecipient.startsWith('team:')) {
        return rName === selRecName;
      }
      // Direct message: sender and receiver must match current user and selected recipient
      return (sName === curName && rName === selRecName) || 
             (sName === selRecName && rName === curName);
    });

    if (!String(msgSearchQuery || '').trim()) return threadMsgs;
    return threadMsgs.filter(m => 
      m.text?.toLowerCase().includes(msgSearchQuery.toLowerCase())
    );
  }, [messages, selectedRecipient, currentUser, msgSearchQuery]);

  // Aggregate channels for Segment views
  const listItems = useMemo(() => {
    const cList: any[] = [
      { id: 'all', type: 'channel', label: 'Global broadcast', subtitle: 'Public sync room', color: 'from-blue-500 to-indigo-500', icon: '🌐' },
      { id: 'tl', type: 'channel', label: 'TL & Support channel', subtitle: 'Restricted group chat', color: 'from-amber-500 to-orange-500', icon: '🛡️' }
    ];

    if (isTL) {
      cList.push({ id: `team:${currentUser.name}`, type: 'channel', label: 'My sub-team sync', subtitle: 'Direct reports only', color: 'from-teal-500 to-emerald-500', icon: '👥' });
    } else if (userTL !== 'Unassigned') {
      cList.push({ id: `team:${userTL}`, type: 'channel', label: `${userTL}'s team sync`, subtitle: 'Direct reports only', color: 'from-teal-500 to-emerald-500', icon: '👥' });
    }

    const agentsFiltered = agentsList
      .filter(name => (name || '').toLowerCase() !== (currentUser.name || '').toLowerCase() && (name || '').toLowerCase().includes(searchQuery.toLowerCase()))
      .map(name => {
        const isThisTL = (name || '').toLowerCase().includes('tl') || name === 'Amira Hassan' || name === 'Sobhy Hesham' || name === 'Hesham Sobhy';
        
        // Find matching presence and mood status
        const match = (registeredUsers || []).find(u => (u.name || '').toLowerCase() === (name || '').toLowerCase());
        const status = match?.status || 'offline';
        const statusNote = match?.statusNote || '';
        
        let displaySubtitle = isThisTL ? 'Team Leader / Support' : 'Agent Member';
        if (statusNote) {
          displaySubtitle = `💭 "${statusNote}"`;
        } else if (status === 'busy') {
          displaySubtitle = '🔴 Busy';
        } else if (status === 'away') {
          displaySubtitle = '🟡 Away';
        } else if (status === 'online') {
          displaySubtitle = '🟢 Active now';
        } else {
          displaySubtitle = 'Offline';
        }

        return {
          id: name,
          type: 'direct',
          label: name,
          subtitle: displaySubtitle,
          statusValue: status,
          color: isThisTL ? 'from-amber-500/80 to-pink-500/80' : 'from-slate-600 to-slate-800',
          icon: name[0]
        };
      });

    let combined = [];
    if (activeSegment === 'all') {
      combined = [...cList, ...agentsFiltered];
    } else if (activeSegment === 'channels') {
      combined = cList;
    } else {
      combined = agentsFiltered;
    }

    // Sort items so those with unread counts are always pushed to the absolute TOP of the iOS Inbox!
    return combined.sort((a, b) => {
      const aUnread = a.type === 'channel' ? (statsEngine.channelStats[a.id]?.unreadCount || 0) : (statsEngine.privateStats[a.id]?.unreadCount || 0);
      const bUnread = b.type === 'channel' ? (statsEngine.channelStats[b.id]?.unreadCount || 0) : (statsEngine.privateStats[b.id]?.unreadCount || 0);
      if (aUnread !== bUnread) return bUnread - aUnread;

      // Secondary: sort by last message timestamp
      const aTime = a.type === 'channel' ? (statsEngine.channelStats[a.id]?.lastTime || '') : (statsEngine.privateStats[a.id]?.lastTime || '');
      const bTime = b.type === 'channel' ? (statsEngine.channelStats[b.id]?.lastTime || '') : (statsEngine.privateStats[b.id]?.lastTime || '');
      return bTime.localeCompare(aTime);
    });

  }, [activeSegment, statsEngine, agentsList, searchQuery, isTL, currentUser, userTL]);

  return (
    <div id="ios-live-chat-viewport" className="flex flex-col md:flex-row h-[78vh] min-h-[500px] w-full bg-slate-950/20 md:bg-slate-900/40 rounded-3xl border border-white/5 overflow-hidden backdrop-blur-3xl relative font-sans shadow-2xl">
      
      {/* LEFT SIDEBAR: Styled Message Inbox Thread List */}
      <div className={`w-full md:w-80 shrink-0 border-r border-white/5 bg-slate-950/45 flex flex-col h-full ${selectedRecipient !== '' && isRecipientDrawerOpen === false && window.innerWidth < 768 ? 'hidden' : 'flex'}`}>
        
        {/* Inbox Header */}
        <div className="p-4 pb-2 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Live Messages
              <span className="text-[10px] font-mono leading-none tracking-widest uppercase bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/15">
                Active State
              </span>
            </h1>
            
            <button 
              onClick={() => {
                setLanguage(language === 'en' ? 'ar' : 'en');
                toast.success(`Keyboard language switched to ${language === 'en' ? 'Arabic' : 'English'}`);
              }}
              className="p-1.5 hover:bg-white/5 active:scale-95 text-slate-400 hover:text-indigo-400 rounded-lg transition-all"
              title="Switch Translation Language"
            >
              <Languages className="w-5 h-5" />
            </button>
          </div>

          {/* iOS Segmented Navigation Pill Bar */}
          <div className="p-0.5 bg-white/5 rounded-xl flex items-center gap-1">
            {(['all', 'channels', 'direct'] as const).map((seg) => (
              <button
                key={seg}
                onClick={() => setActiveSegment(seg)}
                className={`flex-1 text-center py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all relative cursor-pointer ${activeSegment === seg ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/10' : 'text-slate-400 hover:text-slate-200'}`}
              >
                {seg}
              </button>
            ))}
          </div>

          {/* Contact Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/80 border border-white/5 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/40 transition-all font-sans"
            />
          </div>
        </div>

        {/* Thread Rows Container */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {listItems.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No matching conversations found.
            </div>
          ) : (
            listItems.map((item) => {
              const isSelected = selectedRecipient.toLowerCase() === item.id.toLowerCase();
              const stats = item.type === 'channel' ? statsEngine.channelStats[item.id] : statsEngine.privateStats[item.id];
              const unread = stats?.unreadCount || 0;
              const lastText = stats?.lastText || "Tap to chat...";
              const lastTimeRaw = stats?.lastTime;
              const displayTime = lastTimeRaw 
                ? new Date(lastTimeRaw).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '';

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedRecipient(item.id);
                    setIsRecipientDrawerOpen(false); // Close on mobile to slide into chat bubble page
                  }}
                  className={`w-full p-3 rounded-2xl transition-all flex items-start gap-3 text-left relative group ${isSelected ? 'bg-indigo-600/90 text-white shadow-md' : 'hover:bg-white/5 text-slate-300'}`}
                >
                  {/* Avatar bubble */}
                  <div className={`w-10 h-10 rounded-full shrink-0 bg-gradient-to-tr ${item.color} border border-white/10 flex items-center justify-center text-xs font-black text-white shadow-inner relative`}>
                    {item.icon}
                    {unread > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-rose-500 text-white font-black text-[9px] rounded-full border border-slate-950 px-1 shadow animate-pulse">
                        {unread}
                      </span>
                    )}

                    {/* Active Presence Indicator Dot */}
                    {item.type === 'direct' && (
                      <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${
                        item.statusValue === 'online' ? 'bg-emerald-500 shadow shadow-emerald-500/50' :
                        item.statusValue === 'busy' ? 'bg-rose-500 shadow shadow-rose-500/50' :
                        item.statusValue === 'away' ? 'bg-amber-500 shadow shadow-amber-500/50' :
                        'bg-slate-500'
                      }`} />
                    )}
                  </div>

                  {/* Text details */}
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <p className={`text-xs font-extrabold truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                        {item.label}
                      </p>
                      {displayTime && (
                        <span className={`text-[9px] font-mono leading-none ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>
                          {displayTime}
                        </span>
                      )}
                    </div>

                    <p className={`text-[10px] leading-relaxed truncate max-w-[200px] ${isSelected ? 'text-indigo-100 font-medium' : unread > 0 ? 'text-white font-bold' : 'text-slate-400'}`}>
                      {lastText}
                    </p>
                  </div>

                  {/* iOS Blue dot indicator at the absolute right if unread */}
                  {unread > 0 && !isSelected && (
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 self-center shrink-0 shadow shadow-blue-500/45 ml-1 animate-bounce" />
                  )}
                  
                  <ChevronRight className={`w-4 h-4 self-center opacity-0 group-hover:opacity-100 transition-all ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                </button>
              );
            })
          )}
        </div>

        {/* User Self bar with Interactive Status Switcher & Feelings Note */}
        <div className="p-3 bg-slate-950/70 border-t border-white/10 flex flex-col gap-2 px-4 rounded-b-3xl shrink-0">
          <div className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600/70 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-inner">
                {currentUser.name[0]}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-100 truncate leading-none">{currentUser.name}</p>
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 leading-none">Status Panel</span>
              </div>
            </div>

            {/* Status Select bullet dropdown trigger */}
            <select
              value={currentUser.status || 'online'}
              onChange={async (e) => {
                const newStatus = e.target.value;
                const userDocId = (currentUser.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                try {
                  await setDoc(doc(db, "users", userDocId), {
                    status: newStatus,
                    lastUpdated: Date.now()
                  }, { merge: true });
                  toast.success(`Presence changed to ${newStatus.toUpperCase()}!`);
                } catch (err) {
                  console.error("Failed to update status in DB:", err);
                }
              }}
              className="bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="online">🟢 Online</option>
              <option value="busy">🔴 Busy</option>
              <option value="away">🟡 Away</option>
              <option value="offline">⚪ Offline</option>
            </select>
          </div>

          {/* Feel Custom Notes textbox */}
          <div className="relative mt-1">
            <input 
              type="text"
              placeholder="How are you feeling / What are you doing? 💭"
              value={currentUser.statusNote || ''}
              onChange={async (e) => {
                const val = e.target.value;
                const userDocId = (currentUser.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                try {
                  await setDoc(doc(db, "users", userDocId), {
                    statusNote: val,
                    lastUpdated: Date.now()
                  }, { merge: true });
                } catch (err) {
                  console.error("Failed to update statusNote in DB:", err);
                }
              }}
              className="w-full bg-slate-900/55 border border-white/5 rounded-lg py-1 px-2.5 text-[10px] text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/40 transition-all font-sans italic"
            />
          </div>
        </div>
      </div>

      {/* RIGHT CHAT AREA: iOS Style Chat Panel & iMessage Speech Bubbles */}
      <div className={`flex-1 flex flex-col min-w-0 bg-slate-950/15 h-full relative ${selectedRecipient === '' && window.innerWidth < 768 ? 'hidden' : 'flex'}`}>
        
        {/* Thread Header */}
        <div className="p-3.5 border-b border-white/5 bg-slate-950/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile Back Button to inbox */}
            <button 
              onClick={() => setIsRecipientDrawerOpen(true)}
              className="md:hidden p-2 rounded-xl bg-white/5 text-slate-300 hover:text-white transition-colors active:scale-95 cursor-pointer flex items-center gap-1"
            >
              ← <span className="text-xs font-bold">Inbox</span>
            </button>

            <div className="w-9 h-9 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center text-sm shrink-0">
              {selectedRecipient === 'all' ? '🌐' : selectedRecipient === 'tl' ? '🛡️' : selectedRecipient.startsWith('team:') ? '👥' : '💬'}
            </div>

            <div>
              <h2 className="text-sm font-black text-slate-100 flex items-center gap-2">
                {getRecipientLabel()}
              </h2>
              <p className="text-[10px] text-slate-400">
                {getRecipientSubtitle()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search inside this Thread button */}
            <button 
              onClick={() => setIsShowingMsgSearch(!isShowingMsgSearch)}
              className={`p-2 rounded-xl transition-all active:scale-95 cursor-pointer ${isShowingMsgSearch ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-400 hover:text-slate-200'}`}
              title="Search keywords inside thread"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Language indicator pill */}
            <span className="px-2 py-1 bg-white/5 border border-white/5 rounded-xl text-[9px] font-black text-slate-300 uppercase select-none">
              {language} Board
            </span>
          </div>
        </div>

        {/* Thread Search panel (Framer animated slide-down) */}
        <AnimatePresence>
          {isShowingMsgSearch && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-slate-950 border-b border-white/5 p-3 flex items-center gap-2 shrink-0 z-10"
            >
              <Search className="w-4 h-4 text-slate-500 shrink-0" />
              <input 
                type="text" 
                placeholder="Type keyword to filter messages in this view..." 
                value={msgSearchQuery}
                onChange={(e) => setMsgSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-1.5 px-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-all font-sans"
              />
              {msgSearchQuery && (
                <button 
                  onClick={() => setMsgSearchQuery('')}
                  className="p-1 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* iMessage Style Messages Scroll Window */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-slate-950/25">
          {filteredThreadMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-30">
              <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center text-2xl">
                💬
              </div>
              <div>
                <p className="text-sm font-bold text-slate-200">No messages found</p>
                <p className="text-xs text-slate-400 mt-0.5">Send a message to kickstart the sync thread</p>
              </div>
            </div>
          ) : (
                            filteredThreadMessages.map((msg, idx) => {
                              const isMine = (msg.senderName || '').toLowerCase() === (currentUser.name || '').toLowerCase();
                              const isAr = msg.language === 'ar' || (msg.text ? isArabic(msg.text) : false);
                              const isTeamMsg = (msg.receiverName || '').startsWith('team:');
                              const isTLMsg = (msg.receiverName || '') === 'tl';
                              
                              // Formatting dates nicely
                              const timeDisplay = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                              const dateDisplay = new Date(msg.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' });
                
                              // Stagger consecutive messages from the same sender to look compact and organic
                              const prevMsg = filteredThreadMessages[idx - 1];
                              const isFirstInSequence = !prevMsg || (prevMsg.senderName || '').toLowerCase() !== (msg.senderName || '').toLowerCase();

              return (
                <div key={msg.id} className="space-y-1">
                  {/* High contrast center date element if first message of new date */}
                  {isFirstInSequence && prevMsg && new Date(prevMsg.createdAt).toDateString() !== new Date(msg.createdAt).toDateString() && (
                    <div className="w-full flex justify-center my-4">
                      <span className="px-3 py-1 bg-white/5 text-[9px] font-black uppercase tracking-widest text-slate-500 rounded-full border border-white/5">
                        {dateDisplay}
                      </span>
                    </div>
                  )}

                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                  >
                    <div className={`flex gap-2 max-w-[85%] sm:max-w-[70%] ${isMine ? 'flex-row-reverse' : ''}`}>
                      
                      {/* Avatar shown for first message in sender sequence for clean UI */}
                      {isFirstInSequence ? (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-[10px] font-black text-slate-300 shrink-0 select-none">
                          {(msg.senderName || '?')[0]}
                        </div>
                      ) : (
                        <div className="w-7 shrink-0" /> // spacer to keep bubbles aligned
                      )}

                      <div className="space-y-0.5">
                        {isFirstInSequence && !isMine && (
                          <div className="flex items-center gap-1.5 ml-1">
                             <p className="text-[10px] font-black text-slate-400">{msg.senderName}</p>
                             {isTeamMsg && <span className="text-[7px] font-black uppercase bg-emerald-500/20 text-emerald-300 px-1 border border-emerald-500/10 rounded leading-none">TEAM</span>}
                             {isTLMsg && <span className="text-[7px] font-black uppercase bg-amber-500/20 text-amber-300 px-1 border border-amber-500/10 rounded leading-none">TL ONLY</span>}
                          </div>
                        )}

                        {/* Speech Bubble: Pure iOS Blue vs Glossy Slate */}
                        <div className={`px-4 py-2.5 rounded-[20px] text-[14px] font-sans shadow-sm group relative ${isMine ? 'bg-[#007AFF] text-white rounded-br-[4px]' : 'bg-[#1C1C1E] text-slate-100 rounded-bl-[4px]'} ${isAr ? 'text-right dir-rtl font-display font-medium leading-relaxed' : 'text-left leading-relaxed'}`}>
                          {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
                          
                          {/* Attachments rendering */}
                          {msg.attachment && (
                            <div className={`mt-2 p-2 rounded-xl bg-black/35 border border-white/5 flex items-center gap-3 ${isAr ? 'flex-row-reverse' : ''}`}>
                              {msg.attachment.startsWith('data:image') ? (
                                <img src={msg.attachment} alt="attachment" className="w-14 h-14 rounded-lg object-cover border border-white/10 shrink-0" />
                              ) : (
                                <div className="p-2 mr-1 rounded bg-white/5 text-indigo-400 shrink-0">
                                  <FileText className="w-5 h-5" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="truncate font-extrabold text-[9px] text-slate-300">{msg.attachmentName}</p>
                                <a 
                                  href={msg.attachment} 
                                  download={msg.attachmentName}
                                  className="text-[#0084FF] hover:underline text-[9px] font-black uppercase tracking-wider flex items-center gap-1 mt-1"
                                >
                                  <Download className="w-3 h-3" /> Download
                                </a>
                              </div>
                            </div>
                          )}

                          {/* Action Trash trigger button inside speech buble (visible on hover) */}
                          <div className="absolute top-1/2 -translate-y-1/2 right-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-slate-900 border border-white/10 p-1.5 rounded-lg">
                            {(isMine || currentUser.role === 'tl') && (
                              <button 
                                onClick={() => handleDeleteMessage(msg.id)}
                                className="text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                                title="Delete/Retract message"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Seen/Timing Indicators */}
                        <div className={`flex items-center gap-1 px-1 justify-end ${isMine ? 'flex-row' : 'flex-row-reverse'}`}>
                          <p className="text-[8px] text-slate-600 font-mono">
                            {timeDisplay}
                          </p>
                          {isMine && (
                            <CheckCheck className={`w-3 h-3 ${msg.seen ? 'text-blue-400' : 'text-slate-700'}`} />
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick phrases bar */}
        <div className="px-3 py-2 bg-slate-950/40 border-t border-white/5 shrink-0 flex items-center gap-1.5 overflow-x-auto select-none max-w-full custom-scrollbar">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 shrink-0 mr-1">Tap phrase:</span>
          {quickPhrases.map((phrase) => (
            <button
              key={phrase}
              onClick={() => handleQuickPhraseClick(phrase)}
              className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 rounded-full text-[10px] text-slate-300 hover:text-white transition-all border border-white/5 whitespace-nowrap active:scale-95 shrink-0 cursor-pointer"
            >
              {phrase}
            </button>
          ))}
        </div>

        {/* Bottom Message Input Area */}
        <div className="p-4 bg-slate-950/60 border-t border-white/5 shrink-0 rounded-br-3xl">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="space-y-3"
          >
            <AnimatePresence>
              {attachment && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center justify-between p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20"
                >
                  <div className="flex items-center gap-2">
                     {attachment.data.startsWith('data:image') ? <ImageIcon className="w-4 h-4 text-indigo-400" /> : <FileText className="w-4 h-4 text-indigo-400" />}
                     <span className="text-xs text-indigo-200 truncate max-w-[200px]">{attachment.name}</span>
                  </div>
                  <button onClick={() => setAttachment(null)} className="p-1 hover:bg-indigo-500/20 rounded-md transition-all">
                    <X className="w-3.5 h-3.5 text-indigo-300" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 transition-all active:scale-95 shrink-0 cursor-pointer"
                title="Attach image or file"
              >
                <Paperclip className="w-5 h-5" />
                <input 
                  type="file" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*,application/pdf,.doc,.docx"
                />
              </button>
              
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={language === 'ar' ? 'اكتب رسالة على لوحة الإتصال...' : 'Message on live panel...'}
                  className={`w-full bg-[#1C1C1E] border border-white/5 rounded-full px-5 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 transition-all shadow-inner ${language === 'ar' ? 'dir-rtl text-right font-display' : 'text-left font-sans'}`}
                />
                
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 select-none pointer-events-none">
                  {inputText && isArabic(inputText) && language === 'en' && (
                    <span className="text-[7px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/20 px-1.5 py-0.5 rounded border border-indigo-500/20">
                      Arabic Max
                    </span>
                  )}
                </div>
              </div>

              <button 
                type="submit"
                disabled={!String(inputText || '').trim() && !attachment}
                className="p-3 rounded-full bg-[#007AFF] hover:bg-blue-600 shadow-lg shadow-blue-500/10 text-white transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none shrink-0 cursor-pointer"
                title="Send Live Sync"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        .dir-rtl {
          direction: rtl;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 99px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.12);
          border-radius: 99px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.25);
        }
        #ios-live-chat-viewport {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
      `}</style>
    </div>
  );
};
