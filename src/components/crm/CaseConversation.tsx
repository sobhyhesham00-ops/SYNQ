import React from "react";
import { MessageSquare } from "lucide-react";
import { RequestReplyThread } from "../RequestReplyThread";
import { CRMCase } from "./CRMTypes";

interface CaseConversationProps {
  caseData: CRMCase;
  currentUser: any;
  addSystemNotification?: (
    title: string, 
    message: string, 
    type: any, 
    target: string, 
    stableId?: string, 
    entityType?: any, 
    entityId?: string
  ) => void;
}

export const CaseConversation: React.FC<CaseConversationProps> = ({
  caseData,
  currentUser,
  addSystemNotification,
}) => {
  // Map our unified crmType to the Firestore collectionName
  const getCollectionName = (type: 'inquiry' | 'complaint' | 'tabby_tamara' | 'client_comm') => {
    switch (type) {
      case 'inquiry':
        return 'inquiries';
      case 'complaint':
        return 'tt_complaints';
      case 'tabby_tamara':
        return 'tt_requests';
      case 'client_comm':
        return 'client_comms';
      default:
        return 'inquiries';
    }
  };

  const getRequestType = (type: 'inquiry' | 'complaint' | 'tabby_tamara' | 'client_comm') => {
    switch (type) {
      case 'inquiry': return 'inquiry';
      case 'complaint': return 'tt_complaint';
      case 'tabby_tamara': return 'tt_request';
      case 'client_comm': return 'client_comm';
      default: return 'inquiry';
    }
  };

  const collectionName = getCollectionName(caseData.crmType);
  const requestType = getRequestType(caseData.crmType);

  return (
    <div id="case-conversation-flow" className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <MessageSquare className="w-4 h-4 text-emerald-400" />
        <h3 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Conversation History</h3>
      </div>

      <div className="bg-transparent border border-white/8 rounded-xl p-1 md:p-2">
        <RequestReplyThread 
          request={caseData.raw}
          currentUser={currentUser}
          collectionName={collectionName}
          addSystemNotification={addSystemNotification}
          requestType={requestType}
          requestAgentName={caseData.agentName || caseData.raw.agentName || caseData.raw.submittedByName}
        />
      </div>
    </div>
  );
};
