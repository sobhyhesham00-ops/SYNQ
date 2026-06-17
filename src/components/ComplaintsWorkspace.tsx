import React from "react";
import { 
  AlertTriangle, 
  Search, 
  Calendar, 
  History, 
} from "lucide-react";
import { ComplaintCard } from "./ComplaintCard";
import { TabbyTamaraComplaint, User as UserType } from "../types";
import { getClinicLabel } from "../utils";

const compStatusLabels: Record<string, string> = {
  pending_tl: "⏳ Pending TL review",
  need_contact: "📞 Pending contact",
  closed: "✅ Resolved & Closed"
};

interface ComplaintsWorkspaceProps {
  tabbyTamaraComplaints: TabbyTamaraComplaint[];
  currentUser: UserType | null;
  isTLOreSupport: boolean;
  isSuperAdmin: boolean;
  complaintSearch: string;
  selectedComplaintId: string | null;
  setSelectedComplaintId: (id: string | null) => void;
  complaintListFilter: "all" | "pending_tl" | "need_contact" | "closed";
  compDateFilter: string;
  tcFilterClinics: string[];
  
  // Handling action callbacks
  activeComplaintHandlingId: string | null;
  setActiveComplaintHandlingId: (id: string | null) => void;
  tlComplaintResolutionType: string;
  setTlComplaintResolutionType: (type: string) => void;
  tlComplaintComment: string;
  setTlComplaintComment: (comment: string) => void;
  
  handleTLCommentComplaint: (id: string, comment: string, resolutionType: string) => void;
  handleToggleContactComplaint: (id: string, status: "not_contacted" | "contacted") => void;
  handleDeleteComplaint: (id: string) => void;
  handleAssignRecord: (
    recordId: string,
    collectionName: string,
    toAgent: string,
    recordType: string,
    fromAgent: string
  ) => void;
  addSystemNotification: any;
  canEditItem: (createdAt: string | number | Date) => boolean;
  getRemainingEditTime: (createdAt: string | number | Date) => string;
  setEditingItem: (item: any) => void;
  getElapsedTimerString: (confirmedAtISO: string, contactedAtISO?: string) => string;
}

export const ComplaintsWorkspace: React.FC<ComplaintsWorkspaceProps> = ({
  tabbyTamaraComplaints,
  currentUser,
  isTLOreSupport,
  isSuperAdmin,
  complaintSearch,
  selectedComplaintId,
  setSelectedComplaintId,
  complaintListFilter,
  compDateFilter,
  tcFilterClinics,
  activeComplaintHandlingId,
  setActiveComplaintHandlingId,
  tlComplaintResolutionType,
  setTlComplaintResolutionType,
  tlComplaintComment,
  setTlComplaintComment,
  handleTLCommentComplaint,
  handleToggleContactComplaint,
  handleDeleteComplaint,
  handleAssignRecord,
  addSystemNotification,
  canEditItem,
  getRemainingEditTime,
  setEditingItem,
  getElapsedTimerString
}) => {
  const filteredComps = tabbyTamaraComplaints.filter((c) => {
    const isMyComplaint =
      c.agentName?.toLowerCase() ===
      currentUser?.name?.toLowerCase();
    if (!isTLOreSupport && !isMyComplaint)
      return false;

    const sq = complaintSearch.toLowerCase();
    const matchesSearch =
      !sq ||
      (c.patientName || "")
        .toLowerCase()
        .includes(sq) ||
      (c.phoneNumber || "")
        .toLowerCase()
        .includes(sq.replace(/\D/g, "")) ||
      (c.clinicName || "")
        .toLowerCase()
        .includes(sq) ||
      (c.agentName || "")
        .toLowerCase()
        .includes(sq) ||
      (c.complaintDetails || "")
        .toLowerCase()
        .includes(sq);

    const matchesStatus =
      complaintListFilter === "all" ||
      c.status === complaintListFilter;

    const matchesProvider =
      tcFilterClinics.length === 0 ||
      (c.clinicName && tcFilterClinics.includes(c.clinicName));

    const matchesDate =
      !compDateFilter ||
      (c.createdAt &&
        c.createdAt.startsWith(
          compDateFilter,
        ));

    return (
      matchesSearch &&
      matchesStatus &&
      matchesProvider &&
      matchesDate
    );
  });

  if (filteredComps.length === 0) {
    return (
      <div className="p-12 text-center rounded-3xl border border-dashed border-white/10 bg-white/10 backdrop-blur-md/[0.02] space-y-2 animate-fade-in">
        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto text-slate-500">
          <AlertTriangle className="w-6 h-6 text-pink-500" />
        </div>
        <p className="text-sm font-bold text-slate-100 font-sans">
          No complaints matching criteria.
        </p>
        <p className="text-xs text-slate-400 font-sans">
          Logged complaints, issues and dispute timelines will load here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 animate-fade-in font-sans w-full">
      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1 pl-1 text-left font-sans">
        📁 {filteredComps.length} Complaints Found
      </p>

      <div className="space-y-3 w-full">
        {filteredComps.map((comp) => {
          const isExpanded = selectedComplaintId === comp.id;
          return (
            <ComplaintCard
              key={comp.id}
              comp={comp}
              currentUser={currentUser}
              isTLOreSupport={isTLOreSupport}
              isSuperAdmin={isSuperAdmin}
              isExpanded={isExpanded}
              onToggle={() => setSelectedComplaintId(isExpanded ? null : comp.id)}
              activeComplaintHandlingId={activeComplaintHandlingId}
              setActiveComplaintHandlingId={setActiveComplaintHandlingId}
              tlComplaintResolutionType={tlComplaintResolutionType}
              setTlComplaintResolutionType={setTlComplaintResolutionType}
              tlComplaintComment={tlComplaintComment}
              setTlComplaintComment={setTlComplaintComment}
              handleTLCommentComplaint={handleTLCommentComplaint}
              handleToggleContactComplaint={handleToggleContactComplaint}
              handleDeleteComplaint={handleDeleteComplaint}
              handleAssignRecord={handleAssignRecord}
              addSystemNotification={addSystemNotification}
              canEditItem={canEditItem}
              getRemainingEditTime={getRemainingEditTime}
              setEditingItem={setEditingItem}
              getElapsedTimerString={getElapsedTimerString}
            />
          );
        })}
      </div>
    </div>
  );
};
