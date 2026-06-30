import React, { useEffect, useState } from 'react';
import { getCaseTimeline } from '../services/activityService';
import { Clock, User, CheckCircle2, Edit3, Paperclip, ArrowRight, Send } from 'lucide-react';

interface CaseTimelineProps {
  entityType: string;
  entityId: string;
}

const ACTION_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  created:          { label: 'Created',          color: 'text-emerald-400', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  edited:           { label: 'Edited',           color: 'text-amber-400',   icon: <Edit3 className="w-3.5 h-3.5" /> },
  replied:          { label: 'Reply added',      color: 'text-indigo-400',  icon: <Send className="w-3.5 h-3.5" /> },
  attachment_added: { label: 'File attached',    color: 'text-cyan-400',    icon: <Paperclip className="w-3.5 h-3.5" /> },
  assigned:         { label: 'Assigned',         color: 'text-purple-400',  icon: <User className="w-3.5 h-3.5" /> },
  status_changed:   { label: 'Status changed',   color: 'text-sky-400',     icon: <ArrowRight className="w-3.5 h-3.5" /> },
  sent_to_partner:  { label: 'Sent to partner',  color: 'text-pink-400',    icon: <Send className="w-3.5 h-3.5" /> },
};

export const CaseTimeline: React.FC<CaseTimelineProps> = ({ entityType, entityId }) => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!entityId) return;
    setLoading(true);
    getCaseTimeline(entityType, entityId)
      .then(setEvents)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [entityType, entityId]);

  if (loading) return (
    <div className="py-4 text-center text-xs text-slate-500 animate-pulse" id={`timeline-loading-${entityId}`}>
      Loading audit trail...
    </div>
  );

  if (events.length === 0) return (
    <div className="py-4 text-center text-xs text-slate-500" id={`timeline-empty-${entityId}`}>
      No audit history yet for this record.
    </div>
  );

  return (
    <div className="space-y-0 relative" id={`timeline-container-${entityId}`}>
      <div className="absolute left-[7px] top-2 bottom-2 w-[1px] bg-white/5" />
      {events.map((ev, i) => {
        const meta = ACTION_META[ev.action] || { label: ev.action, color: 'text-slate-400', icon: <Clock className="w-3.5 h-3.5" /> };
        return (
          <div key={ev.id || i} className="flex items-start gap-3 py-2.5 pl-1 relative">
            <div className={`shrink-0 w-4 h-4 rounded-full bg-transparent border border-white/8 flex items-center justify-center mt-0.5 ${meta.color} z-10`}>
              {meta.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-200 leading-snug">{ev.summary}</p>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                {new Date(ev.createdAt).toLocaleString()} · {ev.actorRole}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
