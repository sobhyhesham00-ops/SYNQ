import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Book, Tag, Plus, File, Paperclip, Trash2, Download } from 'lucide-react';
import { collection, doc, disableNetwork } from 'firebase/firestore';
import { 
  db,
  wrappedOnSnapshot as onSnapshot,
  wrappedAddDoc as addDoc,
  wrappedDeleteDoc as deleteDoc,
  wrappedUpdateDoc as updateDoc
} from '../firebase';

import { toast } from 'sonner';

interface Attachment {
  name: string;
  url: string;
  size: number;
  type: string;
}

interface Article {
  id: string;
  title: string;
  content: string;
  category: 'knowledge' | 'offers';
  attachments: Attachment[];
  createdAt: number;
  createdBy: string;
}

interface ArticleManagerProps {
  currentUser: User;
  category: 'knowledge' | 'offers';
}

export const ArticleManager: React.FC<ArticleManagerProps> = ({ currentUser, category }) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Editor state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
  const isTL = (currentUser.role as string) === 'tl' || (currentUser.role as string) === 'admin' || (currentUser.role as string) === 'director' || currentUser.role === 'qa';

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "articles"), (snap: any) => {
      const docs = snap.docs.map((d: any) => ({ ...d.data(), id: d.id } as Article));
      const filtered = docs.filter((a: any) => a.category === category).sort((a: any, b: any) => b.createdAt - a.createdAt);
      setArticles(filtered);
      if (filtered.length > 0 && !selectedArticleId) {
        setSelectedArticleId(filtered[0].id);
      } else if (filtered.length === 0) {
        setSelectedArticleId(null);
      }
    }, (error: any) => {
      console.error("Articles Real-time Sync Error:", error.code, error.message);
    });
    return () => unsub();
  }, [category]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Size limit (~3MB due to firestore limitations for base64)
    if (file.size > 3 * 1024 * 1024) {
      toast.error('File too large. Please upload files smaller than 3MB.');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setAttachments(prev => [...prev, {
        name: file.name,
        type: file.type,
        size: file.size,
        url: base64
      }]);
    };
    reader.readAsDataURL(file);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!String(title || '').trim()) {
      toast.error('Article title is required.');
      return;
    }
    
    const payload = {
      title,
      content,
      attachments,
      category,
      updatedAt: Date.now()
    };

    try {
      if (isEditing && selectedArticleId && selectedArticleId !== 'new') {
        await updateDoc(doc(db, "articles", selectedArticleId), payload);
        toast.success('Article updated successfully.');
      } else {
        const res = await addDoc(collection(db, "articles"), {
          ...payload,
          createdAt: Date.now(),
          createdBy: currentUser.name
        });
        setSelectedArticleId(res.id);
        toast.success('Article created successfully.');
      }
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save article.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this article?')) return;
    try {
      await deleteDoc(doc(db, "articles", id));
      toast.success('Article deleted.');
      if (selectedArticleId === id) setSelectedArticleId(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete article.');
    }
  };

  const selectedArticle = articles.find(a => a.id === selectedArticleId);

  const startNew = () => {
    setTitle('');
    setContent('');
    setAttachments([]);
    setSelectedArticleId('new');
    setIsEditing(true);
  };

  const startEdit = () => {
    if (!selectedArticle) return;
    setTitle(selectedArticle.title);
    setContent(selectedArticle.content);
    setAttachments(selectedArticle.attachments || []);
    setIsEditing(true);
  };
  
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="flex h-[calc(100vh-120px)] w-full max-w-[1300px] mx-auto bg-white/[0.04] border border-white/5 rounded-2xl overflow-hidden">
      {/* Sidebar Tabs */}
      <div className="w-1/4 min-w-[250px] border-r border-white/10 p-4 flex flex-col gap-2 bg-slate-900/40">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-100 uppercase tracking-widest text-sm flex items-center gap-2">
            {category === 'knowledge' ? <Book className="w-4 h-4 text-cyan-400" /> : <Tag className="w-4 h-4 text-emerald-400" />}
            {category === 'knowledge' ? 'Knowledge Base' : 'Offers & Promotions'}
          </h2>
          {isTL && (
            <button onClick={startNew} className="text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-full transition-colors flex items-center justify-center" title="Create New">
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
        
        <div className="flex flex-col gap-1 overflow-y-auto max-h-[80vh] pr-1 scrollbar-thin">
          {articles.map(article => (
            <button
              key={article.id}
              onClick={() => { setSelectedArticleId(article.id); setIsEditing(false); }}
              className={`text-left px-4 py-3 rounded-xl transition-all font-medium text-sm border ${ selectedArticleId === article.id && !isEditing ? 'bg-indigo-500/20 text-indigo-100 border-indigo-500/30 shadow-sm-sm' : 'bg-white/5 text-slate-400 border-transparent hover:bg-white/10 hover:text-slate-200' }`}
            >
              <div className="line-clamp-2">{article.title}</div>
            </button>
          ))}
          {articles.length === 0 && !isEditing && (
            <div className="text-center py-10 text-slate-500 text-xs italic">
              No content published yet.
            </div>
          )}
          {isEditing && selectedArticleId === 'new' && (
            <div className="text-left px-4 py-3 rounded-xl bg-indigo-500/20 text-indigo-100 border border-indigo-500/30 font-medium text-sm italic">
              Creating New...
            </div>
          )}
        </div>
      </div>
      
      {/* Article Content / Editor */}
      <div className="flex-1 w-3/4 p-6 relative bg-[#121212]">
        {isEditing && selectedArticleId === 'new' || (isEditing && selectedArticle) ? (
          /* Editor Mode */
          <div className="flex flex-col h-full overflow-hidden max-w-[800px] mx-auto bg-white/[0.02] rounded-2xl p-6 border border-white/10">
            <h3 className="font-bold text-slate-100 text-xl mb-6">{selectedArticleId === 'new' ? 'Create New Entry' : 'Edit Entry'}</h3>
            
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Title Name</label>
            <input 
              type="text" 
              placeholder="E.g. Travel Policy Q3, New Cash Offer..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-slate-100 font-bold mb-6 outline-none focus:border-indigo-500 transition-colors"
            />
            
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Notes / Description (Optional)</label>
            <textarea 
              placeholder="Detailed notes and descriptions..."
              value={content}
              onChange={e => setContent(e.target.value)}
              className="w-full flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-sm mb-6 outline-none focus:border-indigo-500 transition-colors resize-none min-h-[150px]"
            />
            
            <div className="mb-6">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center justify-between">
                <span>Attachments</span>
                <span className="text-xs text-yellow-500/80 bg-yellow-500/10 px-2 py-0.5 rounded-full">Max 3MB limit</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {attachments.map((att, i) => (
                  <div key={i} className="flex items-center gap-2 bg-indigo-900/40 border border-indigo-500/30 rounded-xl px-3 py-1.5 text-xs text-indigo-100">
                    <File className="w-3 h-3 text-indigo-400" />
                    <span className="truncate max-w-[200px]">{att.name}</span>
                    <button onClick={() => removeAttachment(i)} className="text-indigo-400 hover:text-red-400 ml-2"><Trash2 className="w-3 h-3"/></button>
                  </div>
                ))}
                
                <label className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 rounded-xl px-4 py-2 text-xs font-bold cursor-pointer transition-colors">
                  <Paperclip className="w-3 h-3" /> Upload File
                  <input type="file" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-auto pt-4 border-t border-white/10">
              <button 
                onClick={() => {
                  setIsEditing(false);
                  if (selectedArticleId === 'new') setSelectedArticleId(articles[0]?.id || null);
                }}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-slate-700 hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        ) : selectedArticle ? (
          /* View Mode */
          <div className="h-full overflow-y-auto max-w-[800px] mx-auto p-2 scrollbar-thin">
            <div className="flex justify-between items-start mb-8 pt-4">
              <div>
                <h1 className="text-3xl font-sans font-bold text-slate-100 mb-2 leading-tight">{selectedArticle.title}</h1>
                <p className="text-xs text-slate-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Published by <span className="font-bold text-slate-200">{selectedArticle.createdBy}</span> on {new Date(selectedArticle.createdAt).toLocaleDateString()}
                </p>
              </div>
              {isTL && (
                <div className="flex gap-2">
                  <button onClick={startEdit} className="text-xs font-bold bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/30 px-4 py-2 rounded-xl transition-colors shadow-sm">Edit</button>
                  <button onClick={() => handleDelete(selectedArticle.id)} className="text-xs font-bold bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 px-4 py-2 rounded-xl transition-colors">Delete</button>
                </div>
              )}
            </div>
            
            <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-6 mb-8">
              <div className="prose prose-invert max-w-none text-slate-300 text-[15px] whitespace-pre-wrap leading-relaxed font-sans">
                {selectedArticle.content || <span className="text-slate-500 italic">No notes provided for this entry.</span>}
              </div>
            </div>
            
            {selectedArticle.attachments && selectedArticle.attachments.length > 0 && (
              <div className="bg-[#1a1a1c] rounded-2xl p-6 border border-white/5">
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-4">
                  <Paperclip className="w-4 h-4" /> Available Downloads & Resources
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedArticle.attachments.map((att, i) => (
                    <div key={i} className="bg-slate-800/40 border border-white/10 rounded-xl p-4 flex justify-between items-center group hover:bg-slate-800/80 transition-colors">
                      <div className="flex items-center gap-4 overflow-hidden">
                        <div className="bg-indigo-500/20 p-2.5 rounded-xl text-indigo-400 shrink-0">
                          <File className="w-5 h-5" />
                        </div>
                        <div className="truncate">
                          <p className="text-sm font-bold text-slate-200 truncate">{att.name}</p>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">{formatSize(att.size)}</p>
                        </div>
                      </div>
                      <a href={att.url} download={att.name} className="opacity-0 group-hover:opacity-100 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 p-2.5 rounded-full text-emerald-400 transition-all shadow-sm shrink-0" title="Download File">
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-4 opacity-50">
            {category === 'knowledge' ? <Book className="w-20 h-20 text-slate-700" /> : <Tag className="w-20 h-20 text-slate-700" />}
            <p className="text-lg font-medium">Select a topic from the menu to open.</p>
          </div>
        )}
      </div>
    </div>
  );
};
