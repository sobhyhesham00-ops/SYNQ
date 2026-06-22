import React, { useState, useMemo } from 'react';
import { X, Phone, Search, MessageSquare, CreditCard, AlertTriangle, MessageCircle, Clock, User, ChevronDown, ChevronUp, Copy } from 'lucide-react';
import { normalizePhone, formatCaseRef, copyToClipboard, getClinicLabel } from '../utils';

interface PatientHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  inquiries: any[];
  tabbyTamaraRequests: any[];
  tabbyTamaraComplaints: any[];
  clientComms: any[];
  onNavigate: (tab: string) => void;
}

const TYPE_META = {
  inquiry:    { label: 'Inquiry',      color: 'text-amber-400',  bg: 'bg-amber-500/10  border-amber-500/20',  icon: <MessageSquare className="w-4 h-4" /> },
  tt_request: { label: 'TT Request',   color: 'text-cyan-400',   bg: 'bg-cyan-500/10   border-cyan-500/20',   icon: <CreditCard className="w-4 h-4" /> },
  complaint:  { label: 'Complaint',    color: 'text-pink-400',   bg: 'bg-pink-500/10   border-pink-500/20',   icon: <AlertTriangle className="w-4 h-4" /> },
  client_comm:{ label: 'Client Comm',  color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20', icon: <MessageCircle className="w-4 h-4" /> },
};

const STATUS_COLOR: Record<string, string> = {
  submitted:       'bg-amber-500/20 text-amber-300 border-amber-500/30',
  tl_reviewing:    'bg-blue-500/20 text-blue-300 border-blue-500/30',
  sent_to_clinic:  'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  answered:        'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  closed:          'bg-slate-500/20 text-slate-400 border-slate-500/30',
  not_confirmed:   'bg-amber-500/20 text-amber-300 border-amber-500/30',
  confirmed:       'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  rejected:        'bg-rose-500/20 text-rose-300 border-rose-500/30',
  pending_tl:      'bg-amber-500/20 text-amber-300 border-amber-500/30',
  need_contact:    'bg-orange-500/20 text-orange-300 border-orange-500/30',
  pending:         'bg-amber-500/20 text-amber-300 border-amber-500/30',
  in_progress:     'bg-blue-500/20 text-blue-300 border-blue-500/30',
  contacted:       'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
};

export const PatientHistoryModal: React.FC<PatientHistoryModalProps> = ({
  isOpen,
  onClose,
  inquiries,
  tabbyTamaraRequests,
  tabbyTamaraComplaints,
  clientComms,
  onNavigate,
}) => {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const normSearch = normalizePhone(search);
  const hasSearch = normSearch.length >= 4;

  const results = useMemo(() => {
    if (!hasSearch) return [];

    const items: any[] = [];

    inquiries.forEach(i => {
      if (normalizePhone(i.phoneNumber || '').includes(normSearch)) {
        items.push({
          _type: 'inquiry',
          id: i.id,
          caseRef: formatCaseRef(i.id, 'inq', i.createdAt, i.caseRef),
          patientName: i.patientName || '—',
          clinicName: i.clinicName,
          phoneNumber: i.phoneNumber,
          agentName: i.agentName,
          assignedToName: i.assignedToName,
          status: i.status,
          createdAt: i.createdAt,
          summary: i.text?.slice(0, 120),
          raw: i,
        });
      }
    });

    tabbyTamaraRequests.forEach(r => {
      if (normalizePhone(r.phoneNumber || '').includes(normSearch)) {
        items.push({
          _type: 'tt_request',
          id: r.id,
          caseRef: formatCaseRef(r.id, 'tt_request', r.createdAt, r.caseRef),
          patientName: r.patientName || '—',
          clinicName: r.clinicName,
          phoneNumber: r.phoneNumber,
          agentName: r.agentName,
          assignedToName: r.assignedToName,
          status: r.status,
          createdAt: r.createdAt,
          summary: `${r.platform?.toUpperCase()} · AED ${r.finalPriceWithFee ?? r.priceWithoutTax}`,
          raw: r,
        });
      }
    });

    tabbyTamaraComplaints.forEach(c => {
      if (normalizePhone(c.phoneNumber || '').includes(normSearch)) {
        items.push({
          _type: 'complaint',
          id: c.id,
          caseRef: formatCaseRef(c.id, 'tt_complaint', c.createdAt, c.caseRef),
          patientName: c.patientName || '—',
          clinicName: c.clinicName,
          phoneNumber: c.phoneNumber,
          agentName: c.agentName,
          assignedToName: c.assignedToName,
          status: c.status,
          createdAt: c.createdAt,
          summary: c.complaintDetails?.slice(0, 120),
          raw: c,
        });
      }
    });

    clientComms.forEach(c => {
      if (normalizePhone(c.phoneNumber || '').includes(normSearch)) {
        items.push({
          _type: 'client_comm',
          id: c.id,
          caseRef: formatCaseRef(c.id, 'client_comm', c.createdAt, c.caseRef),
          patientName: c.patientName || '—',
          clinicName: c.clinicName,
          phoneNumber: c.phoneNumber,
          agentName: c.callCenterAgentName || c.agentName,
          assignedToName: c.assignedToName,
          status: c.status,
          createdAt: c.createdAt,
          summary: c.notes?.slice(0, 120),
          raw: c,
        });
      }
    });

    return items.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [normSearch, hasSearch, inquiries, tabbyTamaraRequests, tabbyTamaraComplaints, clientComms]);

  const patientName = results[0]?.patientName;
  const counts = {
    inquiry:    results.filter(r => r._type === 'inquiry').length,
    tt_request: results.filter(r => r._type === 'tt_request').length,
    complaint:  results.filter(r => r._type === 'complaint').length,
    client_comm:results.filter(r => r._type === 'client_comm').length,
  };

  if (!isOpen) return null;

  const TAB_NAV: Record<string, string> = {
    inquiry:     'inquiries',
    tt_request:  'tabby-tamara',
    complaint:   'complaints',
    client_comm: 'client-comms',
  };

  return (
    <div className="fixed inset-0 z-[990] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm font-sans" id="patient-history-modal-overlay">
      <div className="w-full max-w-2xl bg-[#0f0f13] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Patient History Lookup</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Search across all case types by phone number</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search input */}
        <div className="p-4 border-b border-white/5 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              autoFocus
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setExpandedId(null); }}
              placeholder="Enter phone number e.g. 0501234567"
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-100 outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
              id="patient-history-search-input"
            />
          </div>
          {search && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <button
                onClick={() => copyToClipboard(search, 'Phone copied!')}
                className="flex items-center gap-1.5 text-[10px] text-slate-400 hover:text-slate-200 transition-colors"
              >
                <Copy className="w-3 h-3" /> Copy number
              </button>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {!hasSearch && (
            <div className="py-16 text-center text-slate-500 text-xs">
              Type at least 4 digits to search
            </div>
          )}

          {hasSearch && results.length === 0 && (
            <div className="py-16 text-center space-y-2">
              <Phone className="w-10 h-10 text-slate-700 mx-auto" />
              <p className="text-sm font-bold text-slate-400">No records found</p>
              <p className="text-xs text-slate-600">No cases match this phone number across any tab</p>
            </div>
          )}

          {hasSearch && results.length > 0 && (
            <>
              {/* Summary strip */}
              <div className="bg-[#16161c] rounded-xl p-3.5 flex flex-wrap items-center gap-3 border border-white/5">
                <div>
                  {patientName && patientName !== '—' && (
                    <p className="text-sm font-bold text-slate-100">{patientName}</p>
                  )}
                  <p className="text-[11px] text-slate-400 font-mono">{search}</p>
                </div>
                <div className="flex flex-wrap gap-2 ml-auto">
                  {(Object.entries(counts) as [string, number][]).filter(([,n]) => n > 0).map(([type, n]) => {
                    const m = TYPE_META[type as keyof typeof TYPE_META];
                    return (
                      <span key={type} className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold ${m.bg} ${m.color}`}>
                        {m.icon} {n} {m.label}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Timeline */}
              <div className="relative space-y-0">
                <div className="absolute left-[19px] top-4 bottom-4 w-[1px] bg-white/5 z-0" />
                {results.map((item) => {
                  const m = TYPE_META[item._type as keyof typeof TYPE_META];
                  const isExpanded = expandedId === item.id;
                  const statusCls = STATUS_COLOR[item.status] || 'bg-white/5 text-slate-400 border-white/10';
                  return (
                    <div key={`${item._type}-${item.id}`} className="relative flex gap-3 py-2">
                      <div className={`shrink-0 w-9 h-9 rounded-xl border flex items-center justify-center z-10 mt-0.5 ${m.bg} ${m.color}`}>
                        {m.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className="bg-[#16161c] border border-white/5 rounded-xl p-3.5 cursor-pointer hover:border-white/10 transition-colors"
                          onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${m.color}`}>{m.label}</span>
                                <span className={`px-2 py-0.5 rounded-md border text-[9px] font-bold uppercase tracking-wider ${statusCls}`}>{item.status?.replace(/_/g, ' ')}</span>
                              </div>
                              <p className="text-xs font-semibold text-slate-200 mt-1">{item.patientName} · {getClinicLabel(item.clinicName)}</p>
                              <p className="text-[11px] text-slate-400 font-mono mt-0.5">{item.caseRef}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <p className="text-[10px] text-slate-500 font-mono text-right">
                                {new Date(item.createdAt).toLocaleDateString()}
                              </p>
                              {isExpanded
                                ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                                : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                              }
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-white/5 space-y-2.5 animate-fade-in">
                              {item.summary && (
                                <p className="text-[11px] text-slate-300 leading-relaxed">{item.summary}</p>
                              )}
                              <div className="flex flex-wrap gap-3 text-[10px] text-slate-400">
                                <span className="flex items-center gap-1"><User className="w-3 h-3" /> {item.agentName}</span>
                                {item.assignedToName && (
                                  <span className="flex items-center gap-1 text-indigo-400"><User className="w-3 h-3" /> Assigned: {item.assignedToName}</span>
                                )}
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(item.createdAt).toLocaleString()}</span>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onNavigate(TAB_NAV[item._type]);
                                  onClose();
                                }}
                                className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 mt-1"
                              >
                                Open in {TYPE_META[item._type as keyof typeof TYPE_META].label} tab →
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 shrink-0">
          <p className="text-[10px] text-slate-600 text-center font-mono">
            Searching live data · {results.length} record{results.length !== 1 ? 's' : ''} found
          </p>
        </div>
      </div>
    </div>
  );
};
