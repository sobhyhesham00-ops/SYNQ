import React, { useState } from 'react';
import { Sparkles, X, MessageCircle, Send } from 'lucide-react';
import { toast } from 'sonner';

export const AIChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!String(message || '').trim()) return;

    const userMsg = message;
    setMessage('');
    setHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    // Dynamic search of knowledge base for relevant snippets
    let knowledgeContext = '';
    try {
      const rawKb = localStorage.getItem('synq_knowledge_base');
      if (rawKb) {
        const docs = JSON.parse(rawKb);
        if (Array.isArray(docs) && docs.length > 0) {
          const queryLower = (userMsg || '').toLowerCase();
          const words = queryLower.split(/\W+/).filter(w => w.length > 2);
          const matched = docs.filter(doc => {
            const nameMatch = (doc.name || '').toLowerCase().includes(queryLower);
            const contentMatch = (doc.content || '').toLowerCase().includes(queryLower);
            if (nameMatch || contentMatch) return true;
            return words.some(w => (doc.name || '').toLowerCase().includes(w) || (doc.content || '').toLowerCase().includes(w));
          });
          const targetDocs = matched.length > 0 ? matched : docs.slice(0, 3);
          knowledgeContext = targetDocs.map(d => `[Source: ${d.name}]\n${d.content}`).join('\n\n---\n\n');
        }
      }
    } catch (err) {
      console.error('KB retrieve error for chat:', err);
    }

    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, knowledgeContext })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setHistory(prev => [...prev, { role: 'ai', text: data.reply }]);
    } catch (err: any) {
      toast.error('AI Chat Error: ' + err.message);
      setHistory(prev => [...prev, { role: 'ai', text: 'Sorry, I am having trouble connecting right now.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      {isOpen && (
        <div className="w-80 sm:w-96 h-[400px] bg-white/[0.04] border border-indigo-500/30 rounded-2xl flex flex-col overflow-hidden animate-fade-in font-sans relative">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-purple-500/5 pointer-events-none" />
          
          <div className="bg-indigo-950/80 border-b border-indigo-500/20 p-4 flex justify-between items-center z-10">
            <h3 className="font-bold text-indigo-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-400" />
              Synq AI Assistant
            </h3>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col relative z-0 relative z-10 scrollbar-hide">
            {history.length === 0 ? (
              <div className="text-center text-slate-400 text-sm mt-10">
                <MessageCircle className="w-8 h-8 opacity-20 mx-auto mb-2" />
                Hello! How can I assist you with scheduling or ops today?
              </div>
            ) : (
              history.map((msg, i) => (
                <div key={i} className={`max-w-[85%] rounded-xl p-3 text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white self-end rounded-br-none' : 'bg-slate-800 border border-slate-700 text-slate-200 self-start rounded-bl-none'}`}>
                  {msg.text}
                </div>
              ))
            )}
            {isTyping && (
              <div className="max-w-[85%] rounded-xl p-3 text-sm bg-slate-800 border border-slate-700 text-slate-400 self-start rounded-bl-none flex gap-1">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100" />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200" />
              </div>
            )}
          </div>

          <form onSubmit={sendMessage} className="p-3 border-t border-white/10 bg-white/[0.03] z-10">
            <div className="relative">
              <input
                type="text"
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Ask AI..."
                className="w-full bg-slate-800 border border-slate-700 rounded-full py-2.5 pl-4 pr-10 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
              <button 
                type="submit" 
                disabled={!String(message || '').trim() || isTyping}
                className="absolute right-1.5 top-1.5 p-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-full text-white transition-colors disabled:opacity-50 disabled:hover:bg-indigo-600"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full shadow-sm flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all text-white border border-white/20"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
      </button>
    </div>
  );
};
