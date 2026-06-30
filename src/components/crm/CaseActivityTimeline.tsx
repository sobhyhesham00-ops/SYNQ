import React from "react";
import { 
  FileText, 
  MessageSquare, 
  UserPlus, 
  Settings, 
  CheckCircle, 
  Clock, 
  Paperclip,
  Check
} from "lucide-react";
import { CRMCase } from "./CRMTypes";

interface CaseActivityTimelineProps {
  caseData: CRMCase;
}

export const CaseActivityTimeline: React.FC<CaseActivityTimelineProps> = ({ caseData }) => {
  const replies = caseData.raw.replies || [];

  // Construct events: Submission + Replies
  interface TimelineEvent {
    id: string;
    type: 'submission' | 'reply' | 'assignment' | 'system' | 'resolution';
    title: string;
    description: string;
    user: string;
    date: string;
    details?: string;
  }

  const events: TimelineEvent[] = [];

  // 1. Initial Submission Event
  events.push({
    id: 'submit_' + caseData.id,
    type: 'submission',
    title: 'Case Submitted',
    description: `Case successfully created and set to status '${caseData.status}'`,
    user: caseData.raw.agentName || caseData.agentName || caseData.raw.submittedByName || 'Agent',
    date: caseData.createdAt,
    details: caseData.subject
  });

  // 2. Replies and System Logs
  replies.forEach((r: any, idx: number) => {
    const isSystem = r.senderName === "System" || r.authorId === "system";
    let eventType: TimelineEvent['type'] = 'reply';
    let title = 'Conversation Update';
    let text = r.text || '';

    if (isSystem) {
      if (text.toLowerCase().includes('assign') || text.toLowerCase().includes('claim')) {
        eventType = 'assignment';
        title = 'Case Assignment';
      } else if (text.toLowerCase().includes('edit') || text.toLowerCase().includes('manage')) {
        eventType = 'system';
        title = 'Case Modified';
      } else if (text.toLowerCase().includes('close') || text.toLowerCase().includes('resolve') || text.toLowerCase().includes('reopen')) {
        eventType = 'resolution';
        title = 'Status Transition';
      } else {
        eventType = 'system';
        title = 'System Event';
      }
    } else {
      title = `Response from ${r.senderName}`;
    }

    events.push({
      id: r.id || `reply_${idx}`,
      type: eventType,
      title: title,
      description: text,
      user: r.senderName || 'Anonymous',
      date: r.createdAt || new Date().toISOString()
    });
  });

  // Sort events chronologically (newest first)
  const sortedEvents = [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'submission':
        return <FileText className="w-3.5 h-3.5 text-cyan-400" />;
      case 'reply':
        return <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />;
      case 'assignment':
        return <UserPlus className="w-3.5 h-3.5 text-amber-400" />;
      case 'resolution':
        return <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Settings className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getBorderColor = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'submission': return 'border-cyan-500/20';
      case 'reply': return 'border-indigo-500/20';
      case 'assignment': return 'border-amber-500/20';
      case 'resolution': return 'border-emerald-500/20';
      default: return 'border-white/10';
    }
  };

  const getBgColor = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'submission': return 'bg-cyan-500/10';
      case 'reply': return 'bg-indigo-500/10';
      case 'assignment': return 'bg-amber-500/10';
      case 'resolution': return 'bg-emerald-500/10';
      default: return 'bg-white/5';
    }
  };

  return (
    <div id="case-timeline" className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Clock className="w-4 h-4 text-emerald-400" />
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Activity History</h3>
      </div>

      {sortedEvents.length === 0 ? (
        <p className="text-xs text-slate-500 italic py-4">No activity logged.</p>
      ) : (
        <div className="relative border-l border-white/5 ml-3 pl-6 space-y-5">
          {sortedEvents.map((evt) => (
            <div key={evt.id} className="relative">
              {/* Vertical line node */}
              <span className={`absolute -left-[30px] top-0 w-5 h-5 rounded-xl flex items-center justify-center border ${getBorderColor(evt.type)} ${getBgColor(evt.type)} shadow-sm`}>
                {getIcon(evt.type)}
              </span>

              <div className="bg-transparent border border-white/5 rounded-xl p-3 hover:bg-white/[0.06] transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">
                      {evt.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 font-medium whitespace-pre-wrap leading-relaxed">
                      {evt.description}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500 font-sans flex items-center gap-1 shrink-0 bg-white/5 px-2 py-0.5 rounded-xl border border-white/5">
                    {new Date(evt.date).toLocaleDateString([], { month: 'short', day: 'numeric' })} · {new Date(evt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {evt.details && (
                  <div className="mt-2 bg-white/[0.03] border border-white/5 p-2 rounded-xl text-xs font-sans text-slate-400 select-all max-h-32 overflow-y-auto">
                    {evt.details}
                  </div>
                )}

                <p className="text-xs text-slate-500 mt-2 font-bold uppercase tracking-wider">
                  👤 {evt.user}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
