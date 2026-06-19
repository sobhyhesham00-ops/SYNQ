import React from "react";
import { 
  ChevronUp, 
  ChevronDown, 
  Pencil, 
  Trash2, 
  Copy, 
  CheckCircle2, 
  MessageSquare 
} from "lucide-react";
import { ClientCommunicationRequest, User } from "../types";
import { AttachmentsDisplay } from "./AttachmentsDisplay";
import { MultiAttachmentUpload } from "./MultiAttachmentUpload";
import { RequestReplyThread } from "./RequestReplyThread";
import { CopyWrap } from "./CopyWrap";
import { 
  getClinicLabel, 
  formatCaseRef, 
  copyToClipboard, 
  formatPhoneForCopy,
  getAgentLOB
} from "../utils";
import { toast } from "sonner";

const getClinicBadgeColor = (clinic: string) => {
  if (!clinic) return "bg-white/5 text-slate-300 border-white/10";
  const lp = clinic.toLowerCase();
  if (lp.includes("dermadent"))
    return "bg-blue-500/10 text-blue-300 border-blue-500/20";
  if (lp.includes("onetouch"))
    return "bg-emerald-500/10 text-emerald-300 border-emerald-500/20";
  if (lp.includes("welltouch"))
    return "bg-rose-500/10 text-rose-300 border-rose-500/20";
  if (lp.includes("newage"))
    return "bg-amber-500/10 text-amber-300 border-amber-500/20";
  return "bg-white/5 text-slate-300 border-white/10";
};

const formatComRef = (id: string) => {
  const tsMatch = id?.match(/(\d{10,13})/);
  if (!tsMatch) return "COM-??????";
  const d = new Date(parseInt(tsMatch[1]));
  return `COM-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${tsMatch[1].slice(-4)}`;
};

export interface ClientCommCardProps {
  comm: ClientCommunicationRequest;
  currentUser: User | null;
  isExpanded: boolean;
  onToggle: () => void;
  isTLOreSupport: boolean;
  isSuperAdmin: boolean;
  activeCcHandlingId?: string | null;
  setActiveCcHandlingId?: (id: string | null) => void;
  ccHandlingNotes?: string;
  setCcHandlingNotes?: (notes: string) => void;
  ccHandlingPhotos?: string[];
  setCcHandlingPhotos?: (photos: string[]) => void;
  handleProcessClientComms?: (id: string, notes: string, photos: string[]) => void;
  handleDeleteClientComms?: (id: string) => void;
  canEditItem?: (createdAt: string | number | Date) => boolean;
  getRemainingEditTime?: (createdAt: string | number | Date) => string;
  setEditingItem?: (item: any) => void;
  handleTakeClientComm?: (id: string) => void;
  handleMarkClientCommDone?: (id: string) => void;
  addSystemNotification?: any;
  getElapsedTimerString?: (confirmedAtISO: string, contactedAtISO?: string) => string;
  agentsList?: string[];
  handleAssignRecord?: (
    recordId: string,
    collectionName: string,
    toAgent: string,
    recordType: string,
    fromAgent: string,
  ) => void;
}

export const ClientCommCard: React.FC<ClientCommCardProps> = ({
  comm,
  currentUser,
  isExpanded,
  onToggle,
  isTLOreSupport,
  isSuperAdmin,
  activeCcHandlingId,
  setActiveCcHandlingId = () => {},
  ccHandlingNotes = "",
  setCcHandlingNotes = () => {},
  ccHandlingPhotos = [],
  setCcHandlingPhotos = () => {},
  handleProcessClientComms = () => {},
  handleDeleteClientComms = () => {},
  canEditItem = () => false,
  getRemainingEditTime = () => "",
  setEditingItem = () => {},
  handleTakeClientComm = () => {},
  handleMarkClientCommDone = () => {},
  addSystemNotification = () => {},
  getElapsedTimerString = () => "",
  agentsList = [],
  handleAssignRecord
}) => {
  const isPending = comm.status === "pending";
  const isInProgress = comm.status === "in_progress";
  const isClosed = comm.status === "contacted";

  const canTakeRequest = isPending && comm.callCenterAgentName !== currentUser?.name && comm.assignedTo?.toLowerCase() !== currentUser?.name?.toLowerCase();
  const canProcessRequest = isInProgress && (!comm.openedBy || comm.openedBy === currentUser?.name || comm.assignedTo?.toLowerCase() === currentUser?.name?.toLowerCase());

  const commAgeHours = (Date.now() - new Date(comm.createdAt).getTime()) / 3600000;
  
  const commSLABadge = isClosed
    ? "bg-emerald-500/10 text-emerald-400"
    : commAgeHours > 2
      ? "bg-red-500/20 text-red-400 animate-pulse"
      : commAgeHours > 0.5
        ? "bg-amber-500/20 text-amber-400"
        : "bg-slate-700 text-slate-400";

  const commAgeLabel = commAgeHours < 1
    ? `${Math.floor(commAgeHours * 60)}m`
    : `${Math.floor(commAgeHours)}h ${Math.floor((commAgeHours % 1) * 60)}m`;

  const defaultGetElapsedTimerString = (confirmedAtISO: string, contactedAtISO?: string) => {
    const startTime = new Date(confirmedAtISO).getTime();
    const endTime = contactedAtISO ? new Date(contactedAtISO).getTime() : Date.now();
    const diffMs = Math.max(0, endTime - startTime);
    const totalSecs = Math.floor(diffMs / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, "0")}m ${secs.toString().padStart(2, "0")}s`;
  };

  const timerFunc = getElapsedTimerString || defaultGetElapsedTimerString;

  const STATUS_BORDER_COLORS: Record<string, string> = {
    submitted: "border-l-amber-500",
    pending: "border-l-amber-500",
    in_progress: "border-l-indigo-500",
    contacted: "border-l-emerald-500",
    closed: "border-l-slate-600",
  };
  const borderLeftColor = STATUS_BORDER_COLORS[comm.status] || "border-l-slate-700";

  return (
    <div
      className={`relative p-4 bg-[#121216] border-y border-r border-slate-700/60 border-l-4 ${borderLeftColor} rounded-xl shadow-md overflow-hidden transition-all duration-300 flex flex-col w-full ${isExpanded ? "ring-1 ring-white/5 space-y-4" : "hover:bg-white/[0.04] cursor-pointer"}`}
      onClick={() => {
        if (!isExpanded) {
          onToggle();
        }
      }}
    >
      {/* Top Accent line if pending */}
      {isPending && (
        <div className="absolute top-0 right-0 left-0 h-1 flex animate-pulse">
          <div className="w-full bg-indigo-500/50" />
        </div>
      )}

      {/* Header section clickable to toggle expansion */}
      <div 
        onClick={(e) => {
          if (isExpanded) {
            e.stopPropagation();
            onToggle();
          }
        }}
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full ${isExpanded ? "border-b border-white/5 pb-3 cursor-pointer hover:opacity-80" : ""}`}
      >
        <div className="flex flex-col space-y-1">
          {/* Row 1: Agent & Badges */}
          <div className="flex items-center gap-2 flex-wrap text-left">
            <span
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(comm.callCenterAgentName || "", "Agent name copied!");
              }}
              className="text-xs font-bold text-slate-100 uppercase tracking-wide cursor-pointer hover:text-indigo-300 transition-colors shrink-0"
            >
              {comm.callCenterAgentName}
            </span>
            <span className="text-[10px] text-slate-400 lowercase tracking-wide bg-white/5 border border-white/5 px-2 py-0.5 rounded font-sans shrink-0">
              {getAgentLOB(comm.callCenterAgentName)}
            </span>
            <span className="font-mono text-[10px] text-slate-500 bg-black/20 px-1.5 py-0.5 rounded shrink-0">
              {formatCaseRef(comm.id, "client_comm", comm.createdAt, comm.caseRef)}
            </span>
            <span className="text-[9px] text-slate-500 font-mono shrink-0">
              {new Date(comm.createdAt).toLocaleString()}
            </span>
          </div>

          {/* Row 2: Patient Name, Clinic, Phone */}
          <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-300 flex-wrap">
            {comm.patientName && <span className="font-bold">{comm.patientName}</span>}
            {comm.clinicName && <span>• {getClinicLabel(comm.clinicName)}</span>}
            {comm.phoneNumber && <span>• {comm.phoneNumber}</span>}
            
            {comm.language && (
               <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border border-white/10 shrink-0 ml-2 ${comm.language === "Arabic" ? "bg-emerald-500/10 text-emerald-300" : "bg-blue-500/10 text-blue-300"}`}>
                 {comm.language}
               </span>
            )}

            {comm.assignedTo && (
              <span className="text-[10px] text-indigo-300 bg-indigo-500/10 border border-indigo-500/25 px-2 py-0.5 rounded font-bold font-sans flex items-center gap-1 shrink-0 ml-2 animate-pulse">
                📌 Assigned to: {comm.assignedTo}
              </span>
            )}
          </div>
        </div>

        {/* Status Badges & Toggle */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <span
            className={`px-2 py-0.5 border text-[9px] font-bold rounded-lg uppercase tracking-wider shrink-0 ${
              comm.status === "contacted"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : comm.status === "in_progress"
                  ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 animate-pulse"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
            }`}
          >
            {comm.status === "contacted" ? "✓ Contacted" : comm.status === "in_progress" ? "⚡ In Progress" : "⏳ Pending"}
          </span>
          <span className={`px-2 py-0.5 border text-[9px] font-bold rounded-lg shrink-0 flex items-center gap-1 ${commSLABadge}`}>
             ⏱ {commAgeLabel} open
          </span>
          {isSuperAdmin && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClientComms(comm.id);
              }}
              className="text-stone-400 hover:text-rose-400 p-1 rounded-md transition-all shrink-0 ml-1.5"
              title="Delete Request"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="w-full flex-col flex space-y-4 text-left">
          {/* Core Detail Grid */}
      <div className="p-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl space-y-2 text-xs text-left">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-2 gap-y-1">
          <div>
            <p className="text-[9px] text-slate-400 uppercase tracking-wider">
              Requested By:
            </p>
            <p className="text-slate-200 font-bold truncate">
              <CopyWrap
                text={comm.callCenterAgentName || ""}
                label="Agent Name"
              >
                {comm.callCenterAgentName}
              </CopyWrap>
            </p>
          </div>
          <div>
            <p className="text-[9px] text-slate-400 uppercase tracking-wider">
              Patient Name:
            </p>
            <p className="text-slate-200 font-bold truncate">
              <CopyWrap
                text={comm.patientName || "N/A"}
                label="Patient Name"
              >
                {comm.patientName || "N/A"}
              </CopyWrap>
            </p>
          </div>
          <div>
            <p className="text-[9px] text-slate-400 uppercase tracking-wider">
              Phone number:
            </p>
            <p className="text-indigo-300 font-mono font-bold truncate">
              <CopyWrap
                text={comm.phoneNumber ? comm.phoneNumber.replace(/\s+/g, "") : ""}
                label="Phone"
              >
                {comm.phoneNumber ? comm.phoneNumber.replace(/\s+/g, "") : ""}
              </CopyWrap>
            </p>
          </div>
        </div>

        <div className="border-t border-white/5 pt-1.5 text-xs text-slate-300">
          <p className="text-[9px] text-slate-400 uppercase tracking-wider mb-0.5 font-bold">
            Notes / Inquiry:
          </p>
          <div className="bg-black/25 p-2 rounded-lg border border-white/[0.03] text-slate-300 leading-normal font-sans italic">
            <CopyWrap
              text={comm.notes || ""}
              label="Notes"
            >
              {comm.notes || (
                <span className="text-slate-500 italic">
                  No notes
                </span>
              )}
            </CopyWrap>
          </div>
        </div>

        <AttachmentsDisplay
          photos={[
            ...(comm.photos || []),
            ...(comm.screenshot ? [comm.screenshot] : []),
          ]}
          links={comm.links}
          tlPhotos={comm.tlPhotos}
          tlLinks={comm.tlLinks}
          showSideBadges={true}
        />

        {(comm.handlingNotes ||
          (comm.handlingPhotos && comm.handlingPhotos.length > 0)) && (
          <div className="border-t border-indigo-500/20 pt-1.5 text-xs text-indigo-300">
            {comm.handlingNotes && (
              <>
                <p className="text-[9px] text-indigo-400 uppercase tracking-wider mb-0.5 font-bold">
                  Resolution Notes ({comm.handledBy}):
                </p>
                <div className="bg-indigo-950/20 p-2 rounded-lg border border-indigo-500/10 text-slate-200 leading-normal font-sans mb-1">
                  <CopyWrap
                    text={comm.handlingNotes || ""}
                    label="Resolution Notes"
                  >
                    {comm.handlingNotes}
                  </CopyWrap>
                </div>
              </>
            )}
            {comm.handlingPhotos && comm.handlingPhotos.length > 0 && (
              <div className="mt-2">
                <AttachmentsDisplay
                  photos={comm.handlingPhotos}
                  links={[]}
                  tlPhotos={comm.tlPhotos}
                  tlLinks={comm.tlLinks}
                  showSideBadges={true}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Timers */}
      <div className="p-3 bg-black/15 rounded-xl border border-white/[0.02] flex items-center justify-between text-xs font-sans">
        <div className="space-y-0.5 text-left">
          <p className="text-[9px] text-slate-400 uppercase">
            {isClosed ? "Closed By" : "Submitted"}:
          </p>
          <p className="text-[10px] text-slate-300">
            {isClosed
              ? comm.handledBy
              : new Date(comm.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="text-right space-y-0.5">
          <p className="text-[9px] text-slate-400 uppercase font-bold">
            {isClosed
              ? "Turnaround Time"
              : isInProgress
                ? "Time Active"
                : "Time Waiting"}:
          </p>
          <p
            className={`font-mono text-xs font-black px-2 py-0.5 rounded ${
              isClosed 
                ? "text-emerald-400 bg-emerald-500/10" 
                : isInProgress 
                  ? "text-indigo-400 bg-indigo-500/10 animate-pulse" 
                  : "text-amber-400 bg-amber-500/10 animate-pulse"
            }`}
          >
            {isClosed && comm.handledAt
              ? timerFunc(comm.createdAt, comm.handledAt)
              : timerFunc(comm.createdAt)}
          </p>
        </div>
      </div>

      {/* Inline Handling form */}
      {activeCcHandlingId === comm.id && (
        <div className="p-3 bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl space-y-2 text-left animate-fade-in mt-1">
          <label className="text-[9px] font-bold text-slate-300 uppercase tracking-widest block mb-1">
            Handling Notes & Attachments *
          </label>
          <textarea
            placeholder="What was the outcome of contacting the client?"
            value={ccHandlingNotes}
            onChange={(e) => setCcHandlingNotes(e.target.value)}
            className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg px-2.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-sans min-h-[60px]"
            required
          />
          <MultiAttachmentUpload
            photos={ccHandlingPhotos}
            links={[]} // links unsupported for inline
            onPhotosChange={setCcHandlingPhotos}
            onLinksChange={() => {}}
            photosLabel="Upload / Paste Handling Screenshots"
          />
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={() => {
                setActiveCcHandlingId(null);
                setCcHandlingPhotos([]);
              }}
              className="px-2.5 py-1.5 hover:bg-white/20 backdrop-blur-md rounded-lg text-[10px] font-bold text-slate-400 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (!ccHandlingNotes.trim() && ccHandlingPhotos.length === 0) {
                  toast.error("Please add notes or an attachment");
                  return;
                }
                handleProcessClientComms(
                  comm.id,
                  ccHandlingNotes,
                  ccHandlingPhotos
                );
                setCcHandlingPhotos([]);
              }}
              className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:brightness-110 active:scale-95 text-slate-950 text-[10px] font-black rounded-lg shadow cursor-pointer transition-all flex items-center gap-1"
            >
              Confirm Handled
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 justify-end pt-1 border-t border-white/5 items-center flex-wrap">
        {isSuperAdmin && (
          <button
            onClick={() => handleDeleteClientComms(comm.id)}
            className="px-2 py-1.5 hover:bg-rose-500/15 border border-transparent hover:border-rose-500/10 rounded-lg text-rose-400 text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
            title="Delete Request"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}

        {isTLOreSupport && handleAssignRecord && agentsList.length > 0 && (
          <div className="flex items-center gap-1.5 mr-auto">
            <span className="text-[10px] text-slate-400 font-semibold">Assign To:</span>
            <select
              value={comm.assignedTo || ""}
              onChange={(e) => {
                const selectedAgent = e.target.value;
                if (selectedAgent) {
                  handleAssignRecord(
                    comm.id,
                    "client_comms",
                    selectedAgent,
                    "Client Comm",
                    comm.assignedTo || comm.callCenterAgentName || "unassigned"
                  );
                }
              }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg px-2 py-1 text-[10px] text-slate-100 font-bold cursor-pointer focus:outline-none focus:border-indigo-500 font-sans"
            >
              <option value="" className="bg-[#1c1c1f] text-slate-400">-- Assign Agent --</option>
              {agentsList.map((aName) => (
                <option
                  key={aName}
                  value={aName}
                  className="bg-[#1c1c1f] text-slate-100 font-sans"
                >
                  {aName}
                </option>
              ))}
            </select>
          </div>
        )}

        {canEditItem(comm.createdAt) && (
          <button
            onClick={() =>
              setEditingItem({
                type: "client_comm",
                id: comm.id,
                data: { ...comm },
              })
            }
            className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg text-emerald-300 text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title={`Edit communication (${getRemainingEditTime(comm.createdAt)})`}
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit ({getRemainingEditTime(comm.createdAt)})
          </button>
        )}

        {/* Copy Option */}
        <button
          onClick={() => {
            const statusEmoji = comm.status === "contacted" ? "✅" : "⏳";
            const details = [
              `📣 *CLIENT COMMUNICATION* 📣`,
              `--------------------------------------`,
              `🆔 *Ref:* ${comm.caseRef || formatCaseRef(comm.id, "client_comm", comm.createdAt, comm.caseRef)}`,
              `👤 *Patient:* ${comm.patientName || "N/A"}`,
              `🏥 *Clinic:* ${getClinicLabel(comm.clinicName)}`,
              `🌐 *Language:* ${comm.language || "N/A"}`,
              `📞 *Phone:* ${formatPhoneForCopy(comm.phoneNumber)}`,
              `${statusEmoji} *Status:* ${comm.status ? comm.status.toUpperCase() : "PENDING"}`,
              comm.notes ? `📝 *Notes:* ${comm.notes}` : "",
              comm.handlingNotes
                ? `✅ *Resolution:* ${comm.handlingNotes}`
                : "⏳ *Resolution:* Pending TL review",
              comm.handledBy ? `👮 *Handled By:* ${comm.handledBy}` : "",
              (comm.photos || []).length > 0
                ? `📎 *Attachments:* ${comm.photos.length} item(s)`
                : "",
              `--------------------------------------`,
            ]
              .filter(Boolean)
              .join("\n");
            copyToClipboard(
              details,
              "Client communication details copied with beautiful emojis!"
            );
          }}
          className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-300 hover:text-slate-100 text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          title="Copy Request details"
        >
          <Copy className="w-3.5 h-3.5" />
          Copy
        </button>

        {canTakeRequest && (
          <button
            onClick={() => handleTakeClientComm(comm.id)}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-slate-950 font-sans font-black text-xs rounded-xl shadow-lg cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
          >
            Open Request
          </button>
        )}

        {canProcessRequest && activeCcHandlingId !== comm.id && (
          <button
            onClick={() => {
              setActiveCcHandlingId(comm.id);
              setCcHandlingNotes("");
            }}
            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:brightness-110 text-slate-100 font-sans font-black text-xs rounded-xl shadow-lg cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
          >
            Finalize Handled
          </button>
        )}

        {!isClosed &&
          (currentUser?.role === "tl" ||
            currentUser?.name === comm.callCenterAgentName ||
            currentUser?.name === comm.openedBy) && (
            <button
              onClick={() => handleMarkClientCommDone(comm.id)}
              className={`px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:brightness-110 text-slate-950 font-sans font-black text-xs rounded-xl shadow-lg cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 ${canProcessRequest ? "ml-1" : ""}`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {currentUser?.role === "tl" && comm.status === "pending"
                ? "Force Close"
                : "Done / Close"}
            </button>
          )}
      </div>

      <div className="w-full mt-3 pt-3 border-t border-white/5 mx-[2px]">
        <RequestReplyThread
          request={comm}
          currentUser={currentUser}
          collectionName="client_comms"
          addSystemNotification={addSystemNotification}
          requestType="Client Comm"
          requestAgentName={comm.callCenterAgentName || comm.openedBy}
        />
      </div>
        </div>
      )}
    </div>
  );
};
