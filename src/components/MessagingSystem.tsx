import React, { useState, useEffect, useRef } from 'react';
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
  Filter,
  FileText,
  ImageIcon,
  Download,
  AlertCircle,
  Users
} from 'lucide-react';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  where,
  Timestamp,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { ChatMessage, User as AppUser } from '../types';
import { getAgentTL } from '../utils';
import { toast } from 'sonner';

interface MessagingSystemProps {
  currentUser: AppUser;
  agentsList: string[];
}

export const MessagingSystem: React.FC<MessagingSystemProps> = ({ currentUser, agentsList }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState<string>('all'); // "all", "tl", "team:NAME", or agent name
  const [language, setLanguage] = useState<'en' | 'ar'>('en');
  const [attachment, setAttachment] = useState<{ data: string; name: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isRecipientDrawerOpen, setIsRecipientDrawerOpen] = useState(false);

  const userTL = getAgentTL(currentUser.name);
  const isTL = currentUser.role === 'tl';

  // Helper to get friendly name for current recipient
  const getRecipientLabel = () => {
    if (selectedRecipient === 'all') return 'Global Sync';
    if (selectedRecipient === 'tl') return 'TL & Support Only';
    if (selectedRecipient.startsWith('team:')) {
      const tl = selectedRecipient.split(':')[1];
      return tl === currentUser.name ? 'My Team' : `${tl}'s Team`;
    }
    return selectedRecipient;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const messagesRef = collection(db, 'messages');
    let q = query(messagesRef, orderBy('createdAt', 'desc'), limit(100));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      
      const filtered = msgs.filter(m => {
        // Global channel
        if (m.receiverName === 'all') return true;
        
        // TL channel (accessible by any TL or specific management)
        if (m.receiverName === 'tl' && (currentUser.role === 'tl' || currentUser.name === 'Amira Hassan')) return true;
        
        // Team channel
        if (m.receiverName.startsWith('team:')) {
          const teamTL = m.receiverName.split(':')[1];
          // I see it if I am the TL of this team, or if I am an agent in this team
          if (currentUser.name === teamTL) return true;
          if (userTL === teamTL) return true;
          return false;
        }

        // Private direct message
        if (m.receiverName === currentUser.name || m.senderName === currentUser.name) return true;
        
        return false;
      }).reverse();

      setMessages(filtered);
      
      // Mark as seen if recipient matches (and it's not a group channel for simplify)
      snapshot.docs.forEach(d => {
        const data = d.data();
        if (data.receiverName === currentUser.name && !data.seen) {
          updateDoc(doc(db, 'messages', d.id), { seen: true });
        }
      });
    });

    return () => unsubscribe();
  }, [selectedRecipient, currentUser, userTL]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !attachment) return;

    const newMessage = {
      senderName: currentUser.name,
      receiverName: selectedRecipient,
      text: inputText,
      attachment: attachment?.data || null,
      attachmentName: attachment?.name || null,
      createdAt: new Date().toISOString(),
      seen: false,
      language: language
    };

    try {
      await addDoc(collection(db, 'messages'), newMessage);
      setInputText('');
      setAttachment(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  const isArabic = (text: string) => {
    const arabicPattern = /[\u0600-\u06FF]/;
    return arabicPattern.test(text);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/50 rounded-2xl border border-white/5 overflow-hidden backdrop-blur-xl relative">
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsRecipientDrawerOpen(!isRecipientDrawerOpen)}
            className="md:hidden p-2 rounded-lg bg-white/5 text-slate-400"
          >
            <Users className="w-4 h-4" />
          </button>
          <div className="hidden sm:block p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-100">{getRecipientLabel()}</h2>
              {selectedRecipient !== 'all' && (
                <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-[8px] font-bold text-indigo-400 uppercase tracking-tighter">
                  {selectedRecipient.includes(':') ? 'Channel' : 'Direct'}
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
              {messages.length} Messages • {language.toUpperCase()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 flex items-center gap-2 transition-all shadow-sm"
          >
            <Languages className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{language === 'en' ? 'Arabic' : 'English'}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Recipient Sidebar (Desktop) / Drawer (Mobile) */}
        <AnimatePresence>
          {(isRecipientDrawerOpen || true) && (
            <motion.div 
              initial={false}
              animate={{ 
                x: isRecipientDrawerOpen ? 0 : (window.innerWidth < 768 ? -256 : 0),
                opacity: 1
              }}
              className={`w-64 border-r border-white/10 bg-black/40 backdrop-blur-2xl absolute md:relative z-30 h-full overflow-y-auto transition-transform ${!isRecipientDrawerOpen ? 'hidden md:block' : 'block'}`}
            >
              <div className="p-3 space-y-1">
                <div className="flex items-center justify-between px-2 mb-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Channels</p>
                  {isRecipientDrawerOpen && (
                    <button onClick={() => setIsRecipientDrawerOpen(false)} className="md:hidden text-slate-500">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                
                <button 
                  onClick={() => { setSelectedRecipient('all'); setIsRecipientDrawerOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all flex items-center gap-2 ${selectedRecipient === 'all' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/20' : 'text-slate-400 hover:bg-white/5'}`}
                >
                  <div className="w-2 h-2 rounded-full bg-indigo-500" />
                  # Global Sync
                </button>
                <button 
                  onClick={() => { setSelectedRecipient('tl'); setIsRecipientDrawerOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all flex items-center gap-2 ${selectedRecipient === 'tl' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/20' : 'text-slate-400 hover:bg-white/5'}`}
                >
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  # TL / Support Only
                </button>

                {isTL && (
                  <button 
                    onClick={() => { setSelectedRecipient(`team:${currentUser.name}`); setIsRecipientDrawerOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all flex items-center gap-2 ${selectedRecipient === `team:${currentUser.name}` ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20' : 'text-slate-400 hover:bg-white/5'}`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    # My Team
                  </button>
                )}

                {!isTL && userTL !== 'Unassigned' && (
                  <button 
                    onClick={() => { setSelectedRecipient(`team:${userTL}`); setIsRecipientDrawerOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all flex items-center gap-2 ${selectedRecipient === `team:${userTL}` ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20' : 'text-slate-400 hover:bg-white/5'}`}
                  >
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    # {userTL}'s Team
                  </button>
                )}

                <div className="pt-4 px-2">
                  <div className="relative">
                    <Search className="w-3 h-3 absolute left-2.5 top-2.5 text-slate-500" />
                    <input 
                      type="text" 
                      placeholder="Filter agents..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-8 pr-3 text-[10px] text-slate-200 focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>
                </div>

                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter px-2 mt-4 mb-2">Direct Message</p>
                {agentsList
                  .filter(name => name.toLowerCase().includes(searchQuery.toLowerCase()) && name !== currentUser.name)
                  .map(name => (
                    <button 
                      key={name}
                      onClick={() => { setSelectedRecipient(name); setIsRecipientDrawerOpen(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all flex items-center gap-2 ${selectedRecipient === name ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/20' : 'text-slate-400 hover:bg-white/5'}`}
                    >
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-[10px] font-bold shrink-0">
                        {name[0]}
                      </div>
                      <span className="truncate">{name}</span>
                    </button>
                  ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-black/10">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-30">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <p className="text-sm font-medium">No messages in this thread yet</p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isMine = msg.senderName === currentUser.name;
                const isAr = msg.language === 'ar' || isArabic(msg.text);
                const isTeamMsg = msg.receiverName.startsWith('team:');
                const isTLMsg = msg.receiverName === 'tl';
                
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={msg.id}
                    className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                  >
                    <div className={`flex gap-2 max-w-[80%] ${isMine ? 'flex-row-reverse' : ''}`}>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-[10px] font-bold shrink-0">
                        {msg.senderName[0]}
                      </div>
                      <div className="space-y-1">
                        {!isMine && (
                          <div className="flex items-center gap-2 ml-1">
                             <p className="text-[10px] font-bold text-slate-400">{msg.senderName}</p>
                             {isTeamMsg && <span className="text-[8px] bg-emerald-500/10 text-emerald-400 px-1 rounded border border-emerald-500/20">TEAM</span>}
                             {isTLMsg && <span className="text-[8px] bg-amber-500/10 text-amber-400 px-1 rounded border border-amber-500/20">TL ONLY</span>}
                          </div>
                        )}
                        <div className={`p-3 rounded-2xl text-xs font-sans ${isMine ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white/10 text-slate-100 rounded-tl-none'} ${isAr ? 'text-right dir-rtl' : 'text-left'}`}>
                          {msg.text && <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>}
                          
                          {msg.attachment && (
                            <div className={`mt-2 p-2 rounded-lg bg-black/20 border border-white/10 flex items-center gap-3 ${isAr ? 'flex-row-reverse' : ''}`}>
                              {msg.attachment.startsWith('data:image') ? (
                                <img src={msg.attachment} alt="attachment" className="w-12 h-12 rounded-md object-cover" />
                              ) : (
                                <div className="p-2 rounded bg-white/10">
                                  <FileText className="w-5 h-5 text-indigo-400" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="truncate font-medium text-[10px]">{msg.attachmentName}</p>
                                <a 
                                  href={msg.attachment} 
                                  download={msg.attachmentName}
                                  className="text-indigo-400 hover:text-indigo-300 text-[10px] font-bold flex items-center gap-1 mt-1"
                                >
                                  <Download className="w-3 h-3" />
                                  Download
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className={`flex items-center gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <p className="text-[8px] text-slate-500 uppercase">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {isMine && (
                            <CheckCheck className={`w-3 h-3 ${msg.seen ? 'text-indigo-400' : 'text-slate-600'}`} />
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white/5 border-t border-white/10">
            <form onSubmit={handleSendMessage} className="space-y-3">
              <AnimatePresence>
                {attachment && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center justify-between p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20"
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

              <div className="flex items-end gap-2">
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 transition-all active:scale-95"
                >
                  <Paperclip className="w-5 h-5" />
                  <input 
                    type="file" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                  />
                </button>
                
                <div className={`flex-1 relative ${language === 'ar' ? 'text-right' : ''}`}>
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                    placeholder={language === 'ar' ? 'اكتب رسالة...' : 'Type a message...'}
                    className={`w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 resize-none min-h-[44px] max-h-32 ${language === 'ar' ? 'dir-rtl' : ''}`}
                    rows={1}
                  />
                  <div className="absolute right-3 bottom-3 flex items-center gap-2">
                     {inputText && isArabic(inputText) && language === 'en' && (
                       <div className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-[8px] text-indigo-400 font-bold uppercase">AR Detected</div>
                     )}
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={!inputText.trim() && !attachment}
                  className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        .dir-rtl {
          direction: rtl;
        }
      `}</style>
    </div>
  );
};

