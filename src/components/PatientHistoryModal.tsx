import React, { useState, useMemo } from 'react';
import {
  X, Phone, Search, MessageSquare, CreditCard, AlertTriangle,
  MessageCircle, Clock, User, ChevronDown, ChevronUp, Copy,
  Link2, Image as ImageIcon, FileText, MessageCircle as ReplyIcon,
  CheckCircle,
} from 'lucide-react';
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
  inquiry:     { label: 'Inquiry',     color: 'text-amber-400',  bg: 'bg-amber-500/10  border-amber-500/20',  icon: <MessageSquare className="w-4 h-4" /> },
  tt_request:  { label: 'TT Request',  color: 'text-cyan-400',   bg: 'bg-cyan-500/10   border-cyan-500/20',   icon: <CreditCard className="w-4 h-4" /> },
  complaint:   { label: 'Complaint',   color: 'text-pink-400',   bg: 'bg-pink-500/10   border-pink-500/20',   icon: <AlertTriangle className="w-4 h-4" /> },
  client_comm: { label: 'Client Comm', color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20', icon: <MessageCircle className="w-4 h-4" /> },
};

const STATUS_COLOR: Record<string, string> = {
  submitted:            'bg-amber-500/20 text-amber-300 border-amber-500/30',
  tl_reviewing:         'bg-blue-500/20 text-blue-300 border-blue-500/30',
  sent_to_clinic:       'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  answered:             'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  closed:               'bg-slate-500/20 text-slate-400 border-slate-500/30',
  not_confirmed:        'bg-amber-500/20 text-amber-300 border-amber-500/30',
  confirmed:            'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  rejected:             'bg-rose-500/20 text-rose-300 border-rose-500/30',
  pending_tl:           'bg-amber-500/20 text-amber-300 border-amber-500/30',
  need_contact:         'bg-orange-500/20 text-orange-300 border-orange-500/30',
  pending:              'bg-amber-500/20 text-amber-300 border-amber-500/30',
  in_progress:          'bg-blue-500/20 text-blue-300 border-blue-500/30',
  contacted:            'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  tl_link_ready:        'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  awaiting_client_contact: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  ready_for_partner:    'bg-violet-500/20 text-violet-300 border-violet-500/30',
  sent_to_partner:      'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  completed:            'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
};

/* ── helpers ── */
const CopyBtn = ({ value, label }: { value: string; label?: string }) => (
  <button
    onClick={e => { e.stopPropagation(); copyToClipboard(value, `${label || 'Copied'}!`); }}
    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors text-xs font-mono ml-1 shrink-0"
    title={`Copy ${label || value}`}
  >
    <Copy className="w-2.5 h-2.5" />
  </button>
);

const LinkRow = ({ url }: { url: string }) => (
  <div className="flex items-center gap-1.5 py-0.5">
    <Link2 className="w-3 h-3 text-indigo-400 shrink-0" />
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="text-xs text-indigo-300 hover:text-indigo-200 underline truncate max-w-[280px]"
      onClick={e => e.stopPropagation()}
    >{url}</a>
    <CopyBtn value={url} label="link" />
  </div>
);

const PhotoGrid = ({ photos, label }: { photos: string[]; label: string }) => {
  if (!photos?.length) return null;
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
        <ImageIcon className="w-3 h-3" /> {label} ({photos.length})
      </p>
      <div className="flex flex-wrap gap-2">
        {photos.map((src, i) => (
          <a key={i} href={src} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
            <img src={src} alt={`${label} ${i + 1}`}
              className="w-16 h-16 rounded-xl object-cover border border-white/10 hover:border-indigo-400 transition-colors cursor-pointer"
            />
          </a>
        ))}
      </div>
    </div>
  );
};

const RepliesThread = ({ replies }: { replies: any[] }) => {
  if (!replies?.length) return null;
  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
        <ReplyIcon className="w-3 h-3" /> Reply Thread ({replies.length})
      </p>
      <div className="space-y-2 pl-2 border-l border-white/5">
        {replies.map((r, i) => {
          const isAgent = r.authorRole === 'agent' || (!r.authorRole && !['tl','qa','admin','superadmin','director'].includes(r.authorRole));
          return (
            <div key={r.id || i} className={`rounded-xl p-3 border text-xs ${isAgent ? 'bg-white/[0.04] border-white/5' : 'bg-indigo-500/5 border-indigo-500/10'}`}>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className={`font-bold ${isAgent ? 'text-slate-300' : 'text-indigo-300'}`}>{r.senderName}</span>
                <span className="text-slate-600 font-mono text-xs">{new Date(r.createdAt).toLocaleString()}</span>
              </div>
              {r.text && (
                <div className="flex items-start gap-1">
                  <p className="text-slate-300 leading-relaxed flex-1">{r.text}</p>
                  <CopyBtn value={r.text} label="reply" />
                </div>
              )}
              {r.links?.map((url: string, li: number) => <LinkRow key={li} url={url} />)}
              {(r.photos?.length > 0) && <PhotoGrid photos={r.photos} label="Photos" />}
              {r.screenshot && <PhotoGrid photos={[r.screenshot]} label="Screenshot" />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ── Full record detail panel ── */
const FullRecordDetail = ({ item }: { item: any }) => {
  const raw = item.raw || {};

  // Gather all links across the record
  const allLinks: string[] = [
    ...(raw.links && Array.isArray(raw.links) ? raw.links : (typeof raw.links === 'string' && raw.links ? [raw.links] : [])),
    ...(raw.tlLinks && Array.isArray(raw.tlLinks) ? raw.tlLinks : (typeof raw.tlLinks === 'string' && raw.tlLinks ? [raw.tlLinks] : [])),
    ...(raw.tlSupportingLinks && Array.isArray(raw.tlSupportingLinks) ? raw.tlSupportingLinks : (typeof raw.tlSupportingLinks === 'string' && raw.tlSupportingLinks ? [raw.tlSupportingLinks] : [])),
    ...(raw.paymentLink ? [raw.paymentLink] : []),
  ].filter(Boolean);

  const agentPhotos: string[] = raw.photos || [];
  const tlPhotos: string[] = raw.tlPhotos || [];
  const replies: any[] = raw.replies || [];
  const agentFollowUps: any[] = raw.agentFollowUps || [];

  // Gather screenshots and other image attachments
  const otherPhotos: string[] = [
    raw.screenshot,
    raw.paymentScreenshot,
    raw.imageUrl
  ].filter(Boolean);

  // Parse other non-image attachments
  const fileAttachments: { name: string; url: string }[] = [];
  if (Array.isArray(raw.attachments)) {
    raw.attachments.forEach((att: any, idx: number) => {
      const url = typeof att === 'string' ? att : (att.url || '');
      const name = typeof att === 'string' ? `Attachment ${idx + 1}` : (att.name || `Attachment ${idx + 1}`);
      const isImg = url.match(/\.(jpeg|jpg|gif|png|webp)/i);
      if (isImg) {
        otherPhotos.push(url);
      } else if (url) {
        fileAttachments.push({ name, url });
      }
    });
  }
  if (Array.isArray(raw.clientIdAttachments)) {
    raw.clientIdAttachments.forEach((att: any) => {
      if (att?.url) fileAttachments.push({ name: att.name || 'Client ID', url: att.url });
    });
  }
  if (Array.isArray(raw.paymentProofAttachments)) {
    raw.paymentProofAttachments.forEach((att: any) => {
      if (att?.url) fileAttachments.push({ name: att.name || 'Payment Proof', url: att.url });
    });
  }

  // Build a "key fields" summary per type
  const keyFields: { label: string; value: string }[] = [];

  if (item._type === 'inquiry') {
    if (raw.text) keyFields.push({ label: 'Inquiry Text', value: raw.text });
    if (raw.answer) keyFields.push({ label: 'Answer', value: raw.answer });
    if (raw.platform) keyFields.push({ label: 'Platform', value: raw.platform });
    if (raw.fileNumber) keyFields.push({ label: 'File #', value: raw.fileNumber });
    if (raw.customerType) keyFields.push({ label: 'Customer', value: raw.customerType });
    if (raw.answeredBy) keyFields.push({ label: 'Answered By', value: raw.answeredBy });
  }
  if (item._type === 'tt_request') {
    if (raw.platform) keyFields.push({ label: 'Platform', value: raw.platform?.toUpperCase() });
    if (raw.priceWithoutTax || raw.finalPriceWithFee) keyFields.push({ label: 'Amount', value: `AED ${raw.finalPriceWithFee ?? raw.priceWithoutTax}` });
    if (raw.fileNumber) keyFields.push({ label: 'File #', value: raw.fileNumber });
    if (raw.notes) keyFields.push({ label: 'Notes', value: raw.notes });
    if (raw.tlNotes) keyFields.push({ label: 'TL Notes', value: raw.tlNotes });
    if (raw.agentContactNotes) keyFields.push({ label: 'Contact Notes', value: raw.agentContactNotes });
    if (raw.paymentLink) keyFields.push({ label: 'Payment Link', value: raw.paymentLink });
    if (raw.confirmedBy) keyFields.push({ label: 'Confirmed By', value: raw.confirmedBy });
  }
  if (item._type === 'complaint') {
    if (raw.complaintDetails) keyFields.push({ label: 'Complaint', value: raw.complaintDetails });
    if (raw.tlComment) keyFields.push({ label: 'TL Comment', value: raw.tlComment });
    if (raw.tlResolutionType) keyFields.push({ label: 'Resolution', value: raw.tlResolutionType });
    if (raw.tlHandledBy) keyFields.push({ label: 'Handled By', value: raw.tlHandledBy });
  }
  if (item._type === 'client_comm') {
    if (raw.notes) keyFields.push({ label: 'Notes', value: raw.notes });
    if (raw.language) keyFields.push({ label: 'Language', value: raw.language });
    if (raw.handlingNotes) keyFields.push({ label: 'Handling Notes', value: raw.handlingNotes });
    if (raw.handledBy) keyFields.push({ label: 'Handled By', value: raw.handledBy });
  }

  return (
    <div className="mt-3 pt-3 border-t border-white/5 space-y-4 animate-fade-in" onClick={e => e.stopPropagation()}>

      {/* Meta row */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
        <span className="flex items-center gap-1"><User className="w-3 h-3" /> Agent: <span className="text-slate-300 font-semibold">{item.agentName}</span></span>
        {item.assignedToName && (
          <span className="flex items-center gap-1 text-indigo-400"><User className="w-3 h-3" /> Assigned: <span className="font-semibold">{item.assignedToName}</span></span>
        )}
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(item.createdAt).toLocaleString()}</span>
        {raw.phoneNumber && (
          <span className="flex items-center gap-1 font-mono">
            <Phone className="w-3 h-3" /> {raw.phoneNumber}
            <CopyBtn value={raw.phoneNumber} label="phone" />
          </span>
        )}
        {raw.fileNumber && (
          <span className="flex items-center gap-1 font-mono">
            <FileText className="w-3 h-3" /> {raw.fileNumber}
            <CopyBtn value={raw.fileNumber} label="file #" />
          </span>
        )}
      </div>

      {/* Case ref copy */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 font-mono">{item.caseRef}</span>
        <CopyBtn value={item.caseRef} label="case ref" />
      </div>

      {/* Key fields */}
      {keyFields.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {keyFields.map((f, i) => (
            <div key={i} className="space-y-0.5 col-span-1 md:col-span-2 last:col-span-1 md:last:col-span-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{f.label}</p>
              <div className="flex items-start gap-1">
                <p className="text-xs text-slate-200 leading-relaxed flex-1 bg-white/[0.04] rounded-xl p-2 border border-white/5 whitespace-pre-wrap">{f.value}</p>
                <CopyBtn value={f.value} label={f.label} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Links */}
      {allLinks.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Link2 className="w-3 h-3" /> Links ({allLinks.length})
          </p>
          {allLinks.map((url, i) => <LinkRow key={i} url={url} />)}
        </div>
      )}

      {/* Agent photos */}
      {agentPhotos.length > 0 && <PhotoGrid photos={agentPhotos} label="Agent Photos" />}

      {/* TL photos */}
      {tlPhotos.length > 0 && <PhotoGrid photos={tlPhotos} label="TL Photos" />}

      {/* Other image attachments */}
      {otherPhotos.length > 0 && <PhotoGrid photos={otherPhotos} label="Screenshots & Images" />}

      {/* File Attachments */}
      {fileAttachments.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Attached Files ({fileAttachments.length})</h4>
          <div className="grid grid-cols-2 gap-2">
            {fileAttachments.map((att, idx) => (
              <a
                key={idx}
                href={att.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 p-2 bg-white/[0.02] border border-white/10 rounded-xl hover:border-white/20 transition-all"
              >
                <div className="w-10 h-10 rounded bg-indigo-500/10 text-indigo-400 shrink-0 flex items-center justify-center border border-indigo-500/10">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs text-slate-200 block font-medium truncate">{att.name}</span>
                  <span className="text-xs text-slate-500 uppercase tracking-wider">file</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Agent follow-ups */}
      {agentFollowUps.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-emerald-400" /> Agent Follow-ups ({agentFollowUps.length})
          </p>
          <div className="space-y-2 pl-2 border-l border-white/5">
            {agentFollowUps.map((fu, i) => (
              <div key={i} className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-emerald-300">{fu.senderName}</span>
                  <span className="text-slate-600 font-mono text-xs">{new Date(fu.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex items-start gap-1">
                  <p className="text-slate-300 flex-1">{fu.text}</p>
                  <CopyBtn value={fu.text} label="note" />
                </div>
                {fu.photos?.length > 0 && <PhotoGrid photos={fu.photos} label="Photos" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full reply thread */}
      <RepliesThread replies={replies} />

      {/* Navigate button */}
      <button
        onClick={e => { e.stopPropagation(); }}
        className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
      >
        {/* handled by parent onClick */}
      </button>
    </div>
  );
};

/* ══════════════════════════════════════════════
   Main Modal
══════════════════════════════════════════════ */
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
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const normSearch = normalizePhone(search);
  const hasSearch = normSearch.length >= 4;

  const results = useMemo(() => {
    if (!hasSearch) return [];
    const items: any[] = [];

    inquiries.forEach(i => {
      if (normalizePhone(i.phoneNumber || '').includes(normSearch)) {
        items.push({
          _type: 'inquiry', id: i.id,
          caseRef: formatCaseRef(i.id, 'inq', i.createdAt, i.caseRef),
          patientName: i.patientName || '—', clinicName: i.clinicName,
          phoneNumber: i.phoneNumber, agentName: i.agentName,
          assignedToName: i.assignedToName, status: i.status,
          createdAt: i.createdAt, raw: i,
        });
      }
    });

    tabbyTamaraRequests.forEach(r => {
      if (normalizePhone(r.phoneNumber || '').includes(normSearch)) {
        items.push({
          _type: 'tt_request', id: r.id,
          caseRef: formatCaseRef(r.id, 'tt_request', r.createdAt, r.caseRef),
          patientName: r.patientName || '—', clinicName: r.clinicName,
          phoneNumber: r.phoneNumber, agentName: r.agentName,
          assignedToName: r.assignedToName, status: r.status,
          createdAt: r.createdAt, raw: r,
        });
      }
    });

    tabbyTamaraComplaints.forEach(c => {
      if (normalizePhone(c.phoneNumber || '').includes(normSearch)) {
        items.push({
          _type: 'complaint', id: c.id,
          caseRef: formatCaseRef(c.id, 'tt_complaint', c.createdAt, c.caseRef),
          patientName: c.patientName || '—', clinicName: c.clinicName,
          phoneNumber: c.phoneNumber, agentName: c.agentName,
          assignedToName: c.assignedToName, status: c.status,
          createdAt: c.createdAt, raw: c,
        });
      }
    });

    clientComms.forEach(c => {
      if (normalizePhone(c.phoneNumber || '').includes(normSearch)) {
        items.push({
          _type: 'client_comm', id: c.id,
          caseRef: formatCaseRef(c.id, 'client_comm', c.createdAt, c.caseRef),
          patientName: c.patientName || '—', clinicName: c.clinicName,
          phoneNumber: c.phoneNumber, agentName: c.callCenterAgentName || c.agentName,
          assignedToName: c.assignedToName, status: c.status,
          createdAt: c.createdAt, raw: c,
        });
      }
    });

    return items.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [normSearch, hasSearch, inquiries, tabbyTamaraRequests, tabbyTamaraComplaints, clientComms]);

  const patientName = results[0]?.patientName;
  const counts = {
    inquiry:     results.filter(r => r._type === 'inquiry').length,
    tt_request:  results.filter(r => r._type === 'tt_request').length,
    complaint:   results.filter(r => r._type === 'complaint').length,
    client_comm: results.filter(r => r._type === 'client_comm').length,
  };

  const TAB_NAV: Record<string, string> = {
    inquiry: 'inquiries', tt_request: 'tabby-tamara',
    complaint: 'complaints', client_comm: 'client-comms',
  };

  const handleCopyAll = () => {
    if (!results.length) return;
    const lines: string[] = [`Patient History — ${search}`, patientName && patientName !== '—' ? `Patient: ${patientName}` : '', ''];
    results.forEach(item => {
      const raw = item.raw;
      lines.push(`[${TYPE_META[item._type as keyof typeof TYPE_META].label}] ${item.caseRef}`);
      lines.push(`Status: ${item.status?.replace(/_/g, ' ') || '—'}`);
      lines.push(`Clinic: ${getClinicLabel(item.clinicName)}`);
      lines.push(`Agent: ${item.agentName}`);
      lines.push(`Date: ${new Date(item.createdAt).toLocaleString()}`);
      if (raw.text) lines.push(`Text: ${raw.text}`);
      if (raw.answer) lines.push(`Answer: ${raw.answer}`);
      if (raw.notes) lines.push(`Notes: ${raw.notes}`);
      if (raw.tlNotes) lines.push(`TL Notes: ${raw.tlNotes}`);
      if (raw.complaintDetails) lines.push(`Complaint: ${raw.complaintDetails}`);
      if (raw.tlComment) lines.push(`TL Comment: ${raw.tlComment}`);
      if (raw.paymentLink) lines.push(`Payment Link: ${raw.paymentLink}`);
      const allLinks = [...(raw.links || []), ...(raw.tlLinks || []), ...(raw.paymentLink ? [raw.paymentLink] : [])];
      if (allLinks.length) lines.push(`Links: ${allLinks.join(' | ')}`);
      if (raw.replies?.length) {
        lines.push('--- Replies ---');
        raw.replies.forEach((r: any) => lines.push(`  [${r.senderName}] ${r.text || ''}${r.links?.length ? ' ' + r.links.join(' ') : ''}`));
      }
      lines.push('');
    });
    copyToClipboard(lines.filter(Boolean).join('\n'), 'Full history copied!');
    setCopiedId('all');
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[990] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm font-sans" id="patient-history-modal-overlay">
      <div className="w-full max-w-2xl bg-slate-950 border border-white/10 rounded-2xl shadow flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Patient History Lookup</h3>
              <p className="text-xs text-slate-400 mt-0.5">Full read-only history across all case types</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-white/5 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              autoFocus type="text" value={search}
              onChange={e => { setSearch(e.target.value); setExpandedId(null); }}
              placeholder="Enter phone number e.g. 0501234567"
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-100 outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
            />
          </div>
          {search && (
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <button onClick={() => copyToClipboard(search, 'Phone copied!')}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors">
                <Copy className="w-3 h-3" /> Copy number
              </button>
              {results.length > 0 && (
                <button onClick={handleCopyAll}
                  className={`flex items-center gap-1.5 text-xs transition-colors ${copiedId === 'all' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'}`}>
                  <Copy className="w-3 h-3" /> {copiedId === 'all' ? 'Copied!' : 'Copy full history'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {!hasSearch && (
            <div className="py-16 text-center text-slate-500 text-xs">Type at least 4 digits to search</div>
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
              <div className="bg-slate-900 rounded-xl p-3.5 flex flex-wrap items-center gap-3 border border-white/5">
                <div>
                  {patientName && patientName !== '—' && (
                    <p className="text-sm font-bold text-slate-100">{patientName}</p>
                  )}
                  <p className="text-xs text-slate-400 font-mono">{search}</p>
                </div>
                <div className="flex flex-wrap gap-2 ml-auto">
                  {(Object.entries(counts) as [string, number][]).filter(([, n]) => n > 0).map(([type, n]) => {
                    const m = TYPE_META[type as keyof typeof TYPE_META];
                    return (
                      <span key={type} className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-bold ${m.bg} ${m.color}`}>
                        {m.icon} {n} {m.label}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Timeline */}
              <div className="relative space-y-0">
                <div className="absolute left-[19px] top-4 bottom-4 w-[1px] bg-white/5 z-0" />
                {results.map(item => {
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
                          className="bg-slate-900 border border-white/5 rounded-xl p-3.5 cursor-pointer hover:border-white/10 transition-colors"
                          onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-xs font-bold uppercase tracking-wider ${m.color}`}>{m.label}</span>
                                <span className={`px-2 py-0.5 rounded-xl border text-xs font-bold uppercase tracking-wider ${statusCls}`}>
                                  {item.status?.replace(/_/g, ' ')}
                                </span>
                              </div>
                              <p className="text-xs font-semibold text-slate-200 mt-1">{item.patientName} · {getClinicLabel(item.clinicName)}</p>
                              <p className="text-xs text-slate-400 font-mono mt-0.5">{item.caseRef}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <p className="text-xs text-slate-500 font-mono text-right">
                                {new Date(item.createdAt).toLocaleDateString()}
                              </p>
                              {isExpanded
                                ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                                : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                              }
                            </div>
                          </div>

                          {isExpanded && <FullRecordDetail item={item} />}

                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-white/5">
                              <button
                                onClick={e => { e.stopPropagation(); onNavigate(TAB_NAV[item._type]); onClose(); }}
                                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
                              >
                                Open in {m.label} tab →
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
          <p className="text-xs text-slate-600 text-center font-mono">
            Searching live data · {results.length} record{results.length !== 1 ? 's' : ''} found
          </p>
        </div>
      </div>
    </div>
  );
};
