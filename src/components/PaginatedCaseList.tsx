import React, { useState, useMemo } from 'react';
import { ClipboardList, Filter } from 'lucide-react';
import { PaginationControls } from './PaginationControls';

interface FilterState {
  phone?: string;
  clinics?: string[];
}

interface PaginatedCaseListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  icon?: React.ReactNode;
  title: string;
  emptyMessage?: string;
  itemToPhone?: (item: T) => string | undefined;
  itemToClinic?: (item: T) => string | undefined;
  availableClinics?: string[];
}

export function PaginatedCaseList<T>({
  items,
  renderItem,
  icon = <ClipboardList className="w-5 h-5 text-indigo-400" />,
  title,
  emptyMessage = "No items matched the criteria or the queue is empty.",
  itemToPhone,
  itemToClinic,
  availableClinics
}: PaginatedCaseListProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  
  const [phoneFilter, setPhoneFilter] = useState('');
  const [clinicsFilter, setClinicsFilter] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      let matchesPhone = true;
      let matchesClinic = true;

      // Filter by phone
      if (phoneFilter && itemToPhone) {
        const phone = itemToPhone(item) || '';
        if (!phone.includes(phoneFilter)) {
          matchesPhone = false;
        }
      }

      // Filter by clinic
      if (clinicsFilter.length > 0 && itemToClinic) {
        const clinic = itemToClinic(item) || '';
        if (!clinicsFilter.includes(clinic)) {
          matchesClinic = false;
        }
      }

      return matchesPhone && matchesClinic;
    });
  }, [items, phoneFilter, clinicsFilter, itemToPhone, itemToClinic]);

  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Auto adjust current page if total pages shrinks
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(totalPages);
  }

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  const toggleClinic = (c: string) => {
    setClinicsFilter(prev => 
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
    );
    setCurrentPage(1);
  };

  return (
    <div className="bg-[#121216]/80 p-0 rounded-2xl shadow-xl overflow-hidden border border-slate-700/60 w-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-700/60 p-5 bg-[#121216] gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-100 font-display flex items-center gap-2">
            {icon} {title}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Total items matching criteria: <strong className="text-indigo-400">{totalItems}</strong>
          </p>
        </div>
        
        {(itemToPhone || itemToClinic) && (
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${showFilters || phoneFilter || clinicsFilter.length > 0 ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : "bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10"}`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filters {clinicsFilter.length > 0 || phoneFilter ? "(Active)" : ""}
          </button>
        )}
      </div>

      {showFilters && (itemToPhone || itemToClinic) && (
        <div className="bg-[#18181c] p-4 border-b border-slate-700/60 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {itemToPhone && (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Phone Number Search</label>
                <input 
                  type="text" 
                  value={phoneFilter}
                  onChange={(e) => {
                    setPhoneFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="e.g. 050..."
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            )}
            
            {itemToClinic && availableClinics && (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Filter by Clinics</label>
                <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto pr-1">
                  {availableClinics.map(c => (
                    <button
                      key={c}
                      onClick={() => toggleClinic(c)}
                      className={`px-2 py-1 text-[10px] font-bold rounded-md border transition-all ${
                        clinicsFilter.includes(c) 
                          ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300' 
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/10'
                      }`}
                    >
                      {c.replace('_', ' ')}
                    </button>
                  ))}
                  {clinicsFilter.length > 0 && (
                     <button
                       onClick={() => { setClinicsFilter([]); setCurrentPage(1); }}
                       className="px-2 py-1 text-[10px] font-bold rounded-md border border-rose-500/20 bg-rose-500/10 text-rose-300 transition-all hover:bg-rose-500/20 tracking-wider"
                     >
                       Clear
                     </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col w-full min-h-[300px]">
        {paginatedItems.length === 0 ? (
          <div className="p-16 text-center space-y-2 animate-fade-in bg-[#0d0d11] h-full flex-1 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto text-slate-400 mb-2">
              <Filter className="w-6 h-6 text-slate-500" />
            </div>
            <p className="text-sm font-bold text-slate-300 font-sans">
              No Cases Found
            </p>
            <p className="text-xs text-slate-500 max-w-[250px] mx-auto leading-relaxed">
              {emptyMessage}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/60 flex flex-col w-full flex-1">
            {paginatedItems.map(item => renderItem(item))}
          </div>
        )}
      </div>

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        totalItems={totalItems}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
      />
    </div>
  );
}
