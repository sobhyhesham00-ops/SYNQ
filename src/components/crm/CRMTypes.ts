import { FileAttachment, TTWorkflowStatus } from '../../types';

export interface CRMCase {
  id: string;
  crmType: 'inquiry' | 'complaint' | 'tabby_tamara' | 'client_comm';
  referenceId: string; // Formatted case reference, e.g., INQ-YMD-XXXX
  status: string; // Raw status from standard collections
  clinicName: string;
  subject: string; // Subject description
  patientName?: string;
  phoneNumber?: string;
  agentName: string; // Submitter agent
  assignedToName?: string;
  assignedToId?: string;
  assignedAt?: string;
  assignedById?: string;
  assignedByName?: string;
  createdAt: string;
  updatedAt?: string;
  attachmentCount: number;
  replyCount: number;
  unread: boolean;
  raw: any; // Entire original request object
}

export type CRMQuickView = 'my_cases' | 'unassigned' | 'team_queue' | 'closed';

export interface CRMFiters {
  searchQuery: string;
  status: string;
  type: string; // 'all' | 'inquiry' | 'complaint' | 'tabby_tamara'
  clinic: string;
  submitter: string;
  assignee: string;
  sourceChannel: string;
  sla: string; // 'all' | 'unresolved' | 'over_24h' | 'over_4h' | 'under_4h'
  date: string; // yyyy-mm-dd or empty
}

export interface CRMSort {
  by: 'newest' | 'oldest' | 'sla_urgency' | 'last_updated';
}
