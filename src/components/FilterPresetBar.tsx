import React, { useState } from 'react';
import { Bookmark, Trash2, ChevronDown } from 'lucide-react';

interface Preset {
  id: string;
  name: string;
  tab: string;
  filters: Record<string, any>;
}

interface FilterPresetBarProps {
  currentTab: string;
  currentFilters: Record<string, any>;
  presets: Preset[];
  onSave: (name: string, tab: string, filters: Record<string, any>) => void;
  onLoad: (preset: Preset) => void;
  onDelete: (id: string) => void;
}

export const FilterPresetBar: React.FC<FilterPresetBarProps> = ({
  currentTab,
  currentFilters,
  presets,
  onSave,
  onLoad,
  onDelete,
}) => {
  const [newName, setNewName] = useState('');
  const [open, setOpen] = useState(false);

  const tabPresets = presets.filter(p => p.tab === currentTab);

  const handleSave = () => {
    if (!newName.trim()) return;
    onSave(newName, currentTab, { ...currentFilters, name: newName });
    setNewName('');
  };

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-900 rounded-xl border border-white/5" id={`filter-preset-bar-${currentTab}`}>
      <Bookmark className="w-3.5 h-3.5 text-indigo-400 shrink-0" />

      {tabPresets.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setOpen(o => !o)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-300 bg-white/5 px-3 py-1.5 rounded-xl hover:bg-white/10 transition-colors"
            id={`preset-dropdown-trigger-${currentTab}`}
          >
            Saved Presets ({tabPresets.length})
            <ChevronDown className="w-3 h-3" />
          </button>
          {open && (
            <div className="absolute top-full mt-1 left-0 z-50 bg-[#1a1a22] border border-white/10 rounded-xl shadow min-w-[200px] overflow-hidden">
              {tabPresets.map(p => (
                <div
                  key={p.id}
                  className="flex items-center justify-between px-3 py-2 hover:bg-white/5 transition-colors gap-3"
                >
                  <button
                    onClick={() => { onLoad(p); setOpen(false); }}
                    className="text-xs text-slate-200 text-left flex-1 font-semibold hover:text-indigo-300 transition-colors"
                  >
                    {p.name}
                  </button>
                  <button
                    onClick={() => onDelete(p.id)}
                    className="text-slate-500 hover:text-rose-400 transition-colors shrink-0"
                    id={`delete-preset-${p.id}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-1.5 ml-auto">
        <input
          type="text"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          placeholder="Name this filter..."
          className="bg-white/[0.02] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500 w-36 placeholder:text-slate-600"
        />
        <button
          onClick={handleSave}
          disabled={!newName.trim()}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-bold rounded-xl transition-all"
        >
          Save
        </button>
      </div>
    </div>
  );
};
