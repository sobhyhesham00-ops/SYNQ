export type Role = 'tl' | 'agent' | 'qa';

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  storagePath?: string;
  uploadedAt?: string;
  uploadedBy?: string;
  file?: globalThis.File; // Keep for deferred upload
}

export interface User {
  id: string;
  name: string;
  role: Role;
  password?: string; // Stored in plain text or simple local format as requested
  avatarUrl?: string;
  status?: string;
  statusNote?: string;
  bio?: string;
  dailyUpdate?: string;
  email?: string;
}

export interface QAQuestion {
  id: string;
  text: string;
  maxScore: number;
}

export interface QAScore {
  id: string;
  qaName: string;
  agentName: string;
  tlName?: string;
  clinicName: string;
  chatOrCallId: string;
  notes: string;
  scores: Record<string, number>; // questionId -> score
  questionsSnapshot?: QAQuestion[]; // Snapshot of questions at time of evaluation
  totalScore: number;
  maxTotalScore: number;
  createdAt: string;
}

export interface Shift {
  id: string;
  label: string; // e.g. "07:00 - 16:00"
  display: string; // e.g. "7 AM to 4 PM"
}

export interface SwapRequest {
  id: string;
  caseRef?: string;
  agentName: string;
  type: 'swap';
  date: string; // Shift date (YYYY-MM-DD)
  shift: string; // Shift label
  swapWithAgent: string; // Agent name to swap with
  swapWithShift: string; // Swap target's shifts
  status: 'pending_partner' | 'declined_by_partner' | 'pending' | 'approved' | 'declined';
  partnerActionAt?: string;
  createdAt: string;
  notes?: string;
  actionBy?: string; // TL Name
  actionAt?: string;
  ruleViolation?: boolean;
  violationMessage?: string;
  screenshot?: string; // Base64 screenshot
  photos?: string[];
  links?: string[];
  tlPhotos?: string[];
  tlLinks?: string[];
  replies?: { id: string; senderName: string; text: string; createdAt: string; screenshot?: string }[];
}

export interface AnnualRequest {
  id: string;
  caseRef?: string;
  agentName: string;
  type: 'annual';
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD (exclusive or inclusive, we'll make it inclusive)
  status: 'pending' | 'approved' | 'declined';
  createdAt: string;
  notes?: string;
  actionBy?: string; // TL Name
  actionAt?: string;
  ruleViolation?: boolean;
  violationMessage?: string;
  screenshot?: string; // Base64 screenshot
  photos?: string[];
  links?: string[];
  tlPhotos?: string[];
  tlLinks?: string[];
  replies?: { id: string; senderName: string; text: string; createdAt: string; screenshot?: string }[];
}

export type SchedulingRequest = SwapRequest | AnnualRequest;

export interface TodoItem {
  id: string;
  agentName: string;
  text: string;
  isCompleted: boolean;
  reminderTimeMs: number | null;
  createdAt: string;
  notified?: boolean;
  category?: 'Work' | 'Personal' | 'Urgent';
}

export interface Inquiry {
  id: string;
  caseRef?: string;
  agentName: string;
  clinicName: string; // Mandatory dropdown value
  phoneNumber?: string;
  text: string;
  photos: string[]; // Base64 data-urls or image urls
  screenshot?: string | null; // keep for backward compat
  attachments?: any[]; // Array of FileAttachment objects
  links: string[]; // URLs
  createdAt: string; // ISO timestamp
  status: 'submitted' | 'sent' | 'answered';
  sentBy?: string;
  sentAt?: string;
  answer?: string;
  answeredBy?: string;
  answeredAt?: string;
  seenByAgent?: boolean; // Tracking if agent acknowledged the notification
  customerContacted?: 'not_contacted' | 'contacted' | 'attempted'; // Dropdown menu status for customer contact status
  assignedTo?: string;
  replies?: {
    id: string;
    authorId?: string;
    senderName: string;
    authorRole?: 'agent' | 'tl' | 'qa' | 'admin' | 'superadmin' | string;
    text: string;
    createdAt: string;
    attachments?: any[];
    links?: string[];
    screenshot?: string;
  }[];
  tlPhotos?: string[];
  tlLinks?: string[];
}

export type TTWorkflowStatus =
  | "submitted"
  | "tl_link_ready"
  | "awaiting_client_contact"
  | "ready_for_partner"
  | "sent_to_partner"
  | "completed"
  | "rejected";

export interface AssignmentInfo {
  assignedToId?: string;
  assignedToName?: string;
  assignedAt?: string;
  assignedById?: string;
  assignedByName?: string;
}

export interface TabbyTamaraRequest {
  id: string;
  caseRef?: string;
  agentName: string;
  patientName: string;
  fileNumber: string;
  isOldCustomer: boolean;
  idNumber?: string;
  priceWithoutTax: string;
  feeRate?: number;
  feeAmount?: number;
  finalPriceWithFee?: number;
  currency?: "AED";
  phoneNumber: string;
  notes?: string;
  createdAt: string;
  status: 'not_confirmed' | 'confirmed' | 'rejected';
  customerContacted?: 'not_contacted' | 'contacted';
  contactedAt?: string;
  confirmedAt?: string;
  confirmedBy?: string;
  platform: 'tabby' | 'tamara' | 'one_time_payment';
  clinicName: string;
  paymentLink?: string;
  agentContactNotes?: string;
  paymentScreenshot?: string;
  photos?: string[];
  links?: string[];
  tlNotes?: string;
  tlLinks?: string;
  tlPhotos?: string[];
  tlSupportingLinks?: string[];
  attachments?: string[];
  screenshot?: string;
  imageUrl?: string;
  agentFollowUps?: { senderName: string; senderRole: string; text: string; photos?: string[]; createdAt: string }[];
  replies?: { id: string; senderName: string; text: string; createdAt: string; screenshot?: string; photos?: string[]; attachments?: string[]; imageUrl?: string; authorId?: string; authorRole?: string; attachmentsObjects?: FileAttachment[]; links?: string[] }[];
  
  // New workflow fields
  workflowStatus?: TTWorkflowStatus;
  sourceChannel?: "chat" | "call_center";
  submittedById?: string;
  submittedByName?: string;
  assignedToId?: string;
  assignedToName?: string;
  assignedTo?: string;
  assignedAt?: string;
  assignedById?: string;
  assignedByName?: string;
  clientIdAttachments?: FileAttachment[];
  paymentProofAttachments?: FileAttachment[];
  partnerAttachments?: FileAttachment[];
  partnerSentAt?: string;
  partnerSentById?: string;
  partnerSentByName?: string;
  updatedAt?: string;
}

export interface TabbyTamaraComplaint {
  id: string;
  caseRef?: string;
  agentName: string;
  patientName: string;
  fileNumber: string;
  isOldCustomer: boolean;
  idNumber?: string;
  imageUrl?: string;
  phoneNumber: string;
  complaintDetails: string;
  createdAt: string;
  status: 'pending_tl' | 'need_contact' | 'closed';
  tlComment?: string;
  tlHandledAt?: string;
  tlHandledBy?: string;
  customerContacted?: 'not_contacted' | 'contacted';
  contactedAt?: string;
  clinicName: string;
  screenshot?: string; // Optional field for attachment screenshot
  photos?: string[];
  links?: string[];
  replies?: { id: string; senderName: string; text: string; createdAt: string; screenshot?: string }[];
  tlName?: string;
  commentedAt?: string;
  closedAt?: string;
  text?: string;
  tlResolutionType?: string;
  assignedTo?: string;
  tlPhotos?: string[];
  tlLinks?: string[];
}

export interface ClientCommunicationRequest {
  id: string;
  caseRef?: string;
  callCenterAgentName: string;
  clinicName: string;
  phoneNumber: string;
  language: 'Arabic' | 'English';
  notes: string;
  createdAt: string;
  status: 'pending' | 'in_progress' | 'contacted';
  openedBy?: string;
  openedAt?: string;
  handledBy?: string;
  handledAt?: string;
  handlingNotes?: string;
  handlingPhotos?: string[];
  screenshot?: string; // Base64 screenshot
  photos?: string[];
  links?: string[];
  replies?: { id: string; senderName: string; text: string; createdAt: string; screenshot?: string }[];
  patientName?: string;
  assignedTo?: string;
  channel?: string;
  sourceChannel?: string;
  tlPhotos?: string[];
  tlLinks?: string[];
}

export interface CaseRecord {
  id: string;
  caseRef?: string;
  agentName: string;
  patientName: string;
  phoneNumber: string;
  inquiry: string;
  createdAt: string;
  leadSource?: string;
  screenshot?: string; // Base64 screenshot
  branch?: string;
  patientType?: string;
  service?: string;
  ticketType?: string;
  ticketStatus?: string;
  callType?: string;
  photos?: string[];
  links?: string[];
  replies?: { id: string; senderName: string; text: string; createdAt: string; screenshot?: string }[];
  status?: string;
}

export interface DailyActivity {
  id: string;
  label: string; // 'Work', 'Break', 'Lunch', 'Meeting', 'Coaching', 'Training', 'Project'
  startTime: string; // 'HH:MM'
  endTime: string; // 'HH:MM'
}

export interface ScheduledShift {
  id: string;
  agentName: string;
  date: string; // YYYY-MM-DD
  shiftLabel: string; // e.g. "07:00 - 16:00"
  shiftNotes?: string;
  activities?: DailyActivity[];
  breakTime?: string;  // e.g. "10:00"
  lunchTime?: string;  // e.g. "13:00"
  breakNotified?: boolean;
  lunchNotified?: boolean;
}

export interface ActivityRecord {
  id: string;
  type: 'break' | 'lunch' | 'restroom' | 'meeting' | 'one_on_one' | 'personal' | 'day_off' | 'casual' | 'annual' | 'no_show';
  startTime: string; // ISO string
  endTime?: string; // ISO string
  durationMinutes?: number; // Calculated upon ending
}

export interface TimeLog {
  id: string;
  agentName: string;
  date: string; // YYYY-MM-DD
  clockIn?: string; // ISO string
  clockOut?: string; // ISO string
  activities: ActivityRecord[];
  status: 'working' | 'break' | 'lunch' | 'restroom' | 'meeting' | 'one_on_one' | 'personal' | 'clocked_out' | 'day_off' | 'casual' | 'annual' | 'no_show';
}

export interface AgentDirectoryRow {
  id: string;
  agentName: string;
  data: Record<string, string>;
}

export const TEAM_LEADERS = [
  'Hesham Sobhy',
  'Shymaa Hassan',
  'Shaymaa Hassan',
  'Amira Hassan',
  'AbdelAlem Essam AbdelAlem',
  'Emad Sayed'
];

export const INITIAL_AGENTS = [
  'AbdelRahman Al Sayed',
  'AbduAllah Salah Fahmy',
  'Ahmed Eid Abdelbaset Eid',
  'Alaa Ashraf Farouk Darwish',
  'Ammar Ismail Helmy',
  'Amr Mohamed Farouk Mohamed',
  'Anan Ashraf farouk Darwish',
  'Asmaa Ahmed Mohamed Morsy',
  'Bassant Alaa Eldin',
  'Eslam Samy Ashour Ali',
  'Fatma Essam Abdelalem',
  'Hadeer Mohamed',
  'Hager Nagy',
  'Hussam Mahmoud Yousef Ahmed',
  'Hussein Ashraf',
  'Jodie El Sayed Mohamed Mohamed',
  'Kenzi Reda Ahmed Ali',
  'Kholoud Fakhry',
  'Kotoz Sami Mohamed',
  'Mahmoud Mohamed Gamal Eldin',
  'Mai Ashraf Elsayed',
  'Mariam Nagy Eraky',
  'Mariam walaa Gamal Mostafa',
  'Basma Rabea',
  'Mennatallah Ahmed el sayed Salem',
  'Moaz Salah Al-Nagar',
  'Mohamed Alaa',
  'Mohamed Amer Mohy El Din',
  'Mostafa Mahmoud Hamed Abd El Ghany',
  'Nouran Mohamed Saad Eldin Tawfik',
  'Nouran Sharqawi',
  'Salma Ahmed Mohamed Kamel',
  'Yomna Mohamed Ahmed',
  'Youssef Magdy Hamad Abo Al Ainen',
  'Zeina Yasser Nessim Selim',
  'Hana Alaa'
];

export const AGENT_LOBS: Record<string, string> = {
  'AbdelRahman Al Sayed': 'Social Media',
  'AbduAllah Salah Fahmy': 'Call Center',
  'Ahmed Eid Abdelbaset Eid': 'Social Media',
  'Alaa Ashraf Farouk Darwish': 'Social Media',
  'Ammar Ismail Helmy': 'Social Media',
  'Amr Mohamed Farouk Mohamed': 'Social Media',
  'Shymaa Hassan': 'TL',
  'Shaymaa Hassan': 'TL',
  'Anan Ashraf farouk Darwish': 'Social Media',
  'Asmaa Ahmed Mohamed Morsy': 'Call Center',
  'Bassant Alaa Eldin': 'Call Center',
  'AbdelAlem Essam AbdelAlem': 'TL',
  'Eslam Samy Ashour Ali': 'Social Media',
  'Fatma Essam Abdelalem': 'Call Center',
  'Hadeer Mohamed': 'Call Center',
  'Hager Nagy': 'Social Media',
  'Hussam Mahmoud Yousef Ahmed': 'Social Media',
  'Hussein Ashraf': 'Social Media',
  'Jodie El Sayed Mohamed Mohamed': 'Call Center',
  'Kenzi Reda Ahmed Ali': 'Social Media',
  'Kholoud Fakhry': 'Call Center',
  'Kotoz Sami Mohamed': 'Call Center',
  'Mahmoud Mohamed Gamal Eldin': 'Social Media',
  'Mai Ashraf Elsayed': 'Social Media',
  'Mariam Nagy Eraky': 'Call Center',
  'Mariam walaa Gamal Mostafa': 'Call Center',
  'Basma Rabea': 'Quality',
  'Mennatallah Ahmed el sayed Salem': 'Social Media',
  'Moaz Salah Al-Nagar': 'Social Media',
  'Mohamed Alaa': 'Social Media',
  'Mohamed Amer Mohy El Din': 'Call Center',
  'Mostafa Mahmoud Hamed Abd El Ghany': 'Social Media',
  'Nouran Mohamed Saad Eldin Tawfik': 'Call Center',
  'Nouran Sharqawi': 'Social Media',
  'Salma Ahmed Mohamed Kamel': 'Social Media',
  'Yomna Mohamed Ahmed': 'Social Media',
  'Youssef Magdy Hamad Abo Al Ainen': 'Social Media',
  'Zeina Yasser Nessim Selim': 'Social Media',
  'Emad Sayed': 'TL',
  'Hana Alaa': 'Social Media',
  'Hesham Sobhy': 'TL'
};

export const SHIFTS: Shift[] = [
  { id: 'morning', label: '07:00 - 16:00', display: '7 AM to 4 PM' },
  { id: 'afternoon', label: '13:00 - 22:00', display: '1 PM to 10 PM' },
  { id: 'night', label: '22:00 - 07:00', display: '10 PM to 7 AM' }
];

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'schedule' | 'compliance' | 'inquiry' | 'general' | 'incident' | 'absence' | 'feedback';
  targetAgent: string; // specific agent name, or "all", or "tl"
  createdAt: string; // ISO string
  seenByUsers?: string[]; // list of ids who have seen it
  clearedByUsers?: string[]; // list of ids who have cleared/deleted it from their inbox
  userId?: string; // specific recipient user ID for real-time querying filter
  targetGroups?: string[]; // target group arrays for 'all', 'tl', 'qa', or specific user IDs
  entityType?: 'scheduling_request' | 'inquiry' | 'tt_request' | 'tt_complaint' | 'client_comm' | 'case';
  entityId?: string;
}

export interface FeedbackReply {
  id: string;
  senderName: string;
  text: string;
  attachment?: string; // base64 URL or empty
  attachmentName?: string;
  createdAt: string;
}

export interface TlFeedback {
  id: string;
  tlName: string; // selected team leader name
  directorName: string; // "Amira Hassan"
  notes: string;
  attachment?: string; // base64 URL
  attachmentName?: string;
  createdAt: string;
  replies: FeedbackReply[];
  status: 'pending_reply' | 'replied' | 'completed';
}

export interface Announcement {
  id: string;
  author: string;
  message: string;
  imageUrl?: string;
  linkUrl?: string;
  locationUrl?: string;
  clinicFilter?: string; // 'all' or specific clinic name
  createdAt: string;
  reactions?: Record<string, string[]>; // mapping emoji (e.g., "👍") to names of users who pinned it
}

export interface ChatMessage {
  id: string;
  senderName: string;
  receiverName: string; // "all", "tl", or specific agent name
  text: string;
  attachment?: string; // base64 encoded
  attachmentName?: string;
  createdAt: string;
  seen: boolean;
  language: 'en' | 'ar';
}

export interface OrderMember {
  id: string;
  name: string;
  itemsName: string;
  baseAmount: number;
  finalAmount: number; // after tax, tips, discount splits
  paid: boolean;
}

export interface Order {
  id: string;
  makerName: string;
  restaurantName: string;
  status: 'open' | 'ordered' | 'arrived' | 'cancelled';
  createdAt: string;
  orderedAt?: string;
  arrivedAt?: string;
  timerMinutes?: number; 
  members: OrderMember[];
  deliveryFee: number;
  tax: number;
  discount: number;
}


