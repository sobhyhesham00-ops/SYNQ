import React, { useState, useMemo, useEffect } from "react";
import { CaseCommandBar } from "./CaseCommandBar";
import { CaseTable } from "./CaseTable";
import { CaseDetailDrawer } from "./CaseDetailDrawer";
import { CRMCase, CRMFiters, CRMQuickView } from "./CRMTypes";
import { formatCaseRef, getSLAStatus } from "../../utils";
import { updateDoc, doc, arrayUnion, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { toast } from "sonner";
import { assignCase } from "../../services/assignmentService";

interface CRMWorkspaceProps {
  activeTab: "inquiries" | "complaints" | "tabby-tamara" | "client-comms";
  currentUser: any;
  isTLOreSupport: boolean;
  inquiries: any[];
  tabbyTamaraRequests: any[];
  tabbyTamaraComplaints: any[];
  clientComms?: any[];
  addSystemNotification?: any;
  onEditItem: (item: any) => void;
  // Firestore reactive state setters so CRM changes reflect instantly
  setInquiries: React.Dispatch<React.SetStateAction<any[]>>;
  setTabbyTamaraRequests: React.Dispatch<React.SetStateAction<any[]>>;
  setTabbyTamaraComplaints: React.Dispatch<React.SetStateAction<any[]>>;
  setClientComms?: React.Dispatch<React.SetStateAction<any[]>>;
}

export const CRMWorkspace: React.FC<CRMWorkspaceProps> = ({
  activeTab,
  currentUser,
  isTLOreSupport,
  inquiries,
  tabbyTamaraRequests,
  tabbyTamaraComplaints,
  clientComms,
  addSystemNotification,
  onEditItem,
  setInquiries,
  setTabbyTamaraRequests,
  setTabbyTamaraComplaints,
  setClientComms,
}) => {
  // 1. Initial workspace status
  const initialType = useMemo(() => {
    if (activeTab === "inquiries") return "inquiry";
    if (activeTab === "complaints") return "complaint";
    if (activeTab === "client-comms") return "client_comm";
    return "tabby_tamara";
  }, [activeTab]);

  const [filters, setFilters] = useState<CRMFiters>({
    searchQuery: "",
    status: "",
    type: initialType,
    clinic: "",
    submitter: "",
    assignee: "",
    sourceChannel: "",
    sla: "all",
    date: "",
  });

  const [quickView, setQuickView] = useState<CRMQuickView>("team_queue");
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'sla_urgency' | 'last_updated'>('newest');

  // Sync type filter when activeTab header changes
  useEffect(() => {
    setFilters((f) => ({ ...f, type: initialType }));
    setSelectedCaseId(null);
  }, [initialType]);

  // Translate status formats
  const getNormalizedStatus = (crmType: string, rawStatus: string) => {
    return rawStatus || "submitted";
  };

  // 2. Map all lists to CRMCase schema
  const cases: CRMCase[] = useMemo(() => {
    const list: CRMCase[] = [];

    // Map Inquiries
    inquiries.forEach((inq) => {
      list.push({
        id: inq.id,
        crmType: "inquiry",
        referenceId: formatCaseRef(inq.id, "inq", inq.createdAt, inq.caseRef),
        status: inq.status || "submitted",
        clinicName: inq.clinicName || "",
        subject: inq.text || "",
        phoneNumber: inq.phoneNumber,
        agentName: inq.agentName || "Agent",
        submittedByName: inq.submittedByName || inq.agentName || "Agent",
        callCenterAgentName: inq.callCenterAgentName || undefined,
        createdAt: inq.createdAt || new Date().toISOString(),
        updatedAt: inq.answeredAt || inq.createdAt,
        attachmentCount: (inq.photos?.length || 0) + (inq.attachments?.length || 0),
        replyCount: inq.replies?.length || 0,
        unread: !inq.seenByAgent,
        raw: inq,
      });
    });

    // Map Complaints
    tabbyTamaraComplaints.forEach((comp) => {
      list.push({
        id: comp.id,
        crmType: "complaint",
        referenceId: formatCaseRef(comp.id, "tt_complaint", comp.createdAt, comp.caseRef),
        status: comp.status || "submitted",
        clinicName: comp.clinicName || "",
        subject: comp.complaintDetails || "No statement prompt",
        patientName: comp.patientName,
        phoneNumber: comp.phoneNumber,
        agentName: comp.submittedByName || comp.agentName || "Agent",
        submittedByName: comp.submittedByName || comp.agentName || "Agent",
        callCenterAgentName: comp.callCenterAgentName || undefined,
        assignedToName: comp.assignedToName,
        assignedToId: comp.assignedToId,
        createdAt: comp.createdAt || new Date().toISOString(),
        updatedAt: comp.commentedAt || comp.createdAt,
        attachmentCount: (comp.photos?.length || 0) + (comp.attachments?.length || 0),
        replyCount: comp.replies?.length || 0,
        unread: false,
        raw: comp,
      });
    });

    // Map Tabby/Tamara Requests
    tabbyTamaraRequests.forEach((req) => {
      list.push({
        id: req.id,
        crmType: "tabby_tamara",
        referenceId: formatCaseRef(req.id, "tt_request", req.createdAt, req.caseRef),
        status: req.workflowStatus || "submitted",
        clinicName: req.clinicName || "",
        subject: `Payment processing request validation for ${req.patientName || "Customer"}`,
        patientName: req.patientName,
        phoneNumber: req.phoneNumber,
        agentName: req.submittedByName || req.agentName || "Agent",
        submittedByName: req.submittedByName || req.agentName || "Agent",
        callCenterAgentName: req.callCenterAgentName || undefined,
        assignedToName: req.assignedToName,
        assignedToId: req.assignedToId,
        createdAt: req.createdAt || new Date().toISOString(),
        updatedAt: req.partnerSentAt || req.createdAt,
        attachmentCount: (req.photos?.length || 0) + (req.attachments?.length || 0) + (req.partnerAttachments?.length || 0),
        replyCount: req.replies?.length || 0,
        unread: false,
        raw: req,
      });
    });

    // Map Client Comms (if passed)
    if (clientComms) {
      clientComms.forEach((comm) => {
        list.push({
          id: comm.id,
          crmType: "client_comm",
          referenceId: formatCaseRef(comm.id, "client_comm", comm.createdAt, comm.caseRef),
          status: comm.status || "new",
          clinicName: comm.clinicName || "",
          subject: typeof comm.notes === 'string' ? comm.notes.substring(0, 50) + "..." : "Client Communication Request",
          patientName: comm.patientName || comm.patientRef || "",
          phoneNumber: comm.phoneNumber || "",
          agentName: comm.agentName || comm.callCenterAgentName || "Agent",
          submittedByName: comm.submittedByName || comm.agentName || undefined,
          callCenterAgentName: comm.callCenterAgentName || undefined,
          assignedToName: comm.assignedToName,
          assignedToId: comm.assignedToId,
          createdAt: comm.createdAt || new Date().toISOString(),
          updatedAt: comm.handledAt || comm.createdAt,
          attachmentCount: (comm.photos?.length || 0) + (comm.handlingPhotos?.length || 0) + (comm.attachments?.length || 0),
          replyCount: comm.replies?.length || 0,
          unread: false,
          raw: comm,
        });
      });
    }

    return list;
  }, [inquiries, tabbyTamaraRequests, tabbyTamaraComplaints, clientComms]);

  // 3. Unique dropdown collections for Filters CommandBar
  const uniqueClinics = useMemo(() => {
    return Array.from(new Set(cases.map((c) => c.clinicName))).filter(Boolean);
  }, [cases]);

  const uniqueSubmitters = useMemo(() => {
    return Array.from(new Set(cases.map((c) => c.agentName))).filter(Boolean);
  }, [cases]);

  const uniqueAssignees = useMemo(() => {
    return Array.from(new Set(cases.map((c) => c.assignedToName))).filter(Boolean);
  }, [cases]);

  // 4. Process Case filter logic
  const filteredCases = useMemo(() => {
    const isAgentRole = currentUser?.role === 'agent';

    return cases
      .filter((c) => {
        const myName = currentUser?.name?.toLowerCase();
        const query = filters.searchQuery.toLowerCase().trim();

        if (isAgentRole) {
          // Phone search (7+ digits) reveals all requests for that patient
          const isPhoneSearch = query.replace(/\D/g, '').length >= 7;
          if (!isPhoneSearch) {
            // Only show own requests
            const isMyRequest = (
              c.agentName?.toLowerCase() === myName ||
              c.assignedToName?.toLowerCase() === myName ||
              c.submittedByName?.toLowerCase() === myName ||
              c.callCenterAgentName?.toLowerCase() === myName
            );
            if (!isMyRequest) return false;
          }
        }

        // Quick view scoping
        if (quickView === "my_cases") {
          const matchesAssignee = c.assignedToName?.toLowerCase() === myName;
          const matchesSubmitter = c.crmType === "inquiry" && c.agentName?.toLowerCase() === myName;
          if (!matchesAssignee && !matchesSubmitter) return false;
        } else if (quickView === "unassigned") {
          if (c.crmType !== "inquiry" && (c.assignedToName || c.assignedToId)) return false;
        } else if (quickView === "closed") {
          if (c.status !== "closed" && c.status !== "resolved" && c.status !== "confirmed") return false;
        }

        // Search Query matches: reference, patient, phone, clinic, agent, assignee, text, text inside replies
        if (query) {
          const mRef = c.referenceId.toLowerCase().includes(query);
          const mPatient = c.patientName?.toLowerCase().includes(query);
          const mPhone = c.phoneNumber?.includes(query);
          const mClinic = c.clinicName.toLowerCase().includes(query);
          const mAgent = c.agentName.toLowerCase().includes(query);
          const mAssignee = c.assignedToName?.toLowerCase().includes(query);
          const mSubject = c.subject.toLowerCase().includes(query);
          const mReplies = c.raw.replies?.some((r: any) => r.text?.toLowerCase().includes(query));

          if (!mRef && !mPatient && !mPhone && !mClinic && !mAgent && !mAssignee && !mSubject && !mReplies) {
            return false;
          }
        }

        // Explicit Filter elements
        if (filters.type !== "all" && c.crmType !== filters.type) return false;
        if (filters.status && c.status !== filters.status) return false;
        if (filters.clinic && c.clinicName !== filters.clinic) return false;
        if (filters.submitter && c.agentName !== filters.submitter) return false;
        if (filters.assignee && c.assignedToName !== filters.assignee) return false;
        if (filters.date && !c.createdAt.startsWith(filters.date)) return false;

        if (filters.sourceChannel) {
          const channel = (c.raw.channel || c.raw.sourceChannel || "").toLowerCase();
          if (channel !== filters.sourceChannel.toLowerCase()) return false;
        }

        // SLA Scopes
        if (filters.sla !== "all") {
          const slaObj = getSLAStatus(c.createdAt, c.status, ["answered", "resolved", "closed"]);
          if (filters.sla === "unresolved" && slaObj.isResolved) return false;
          
          const ageHours = slaObj.ageMs / 3600000;
          if (filters.sla === "over_24h" && (slaObj.isResolved || ageHours <= 24)) return false;
          if (filters.sla === "over_4h" && (slaObj.isResolved || ageHours <= 4)) return false;
          if (filters.sla === "over_1h" && (slaObj.isResolved || ageHours <= 1)) return false;
          if (filters.sla === "under_1h" && (slaObj.isResolved || ageHours > 1)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "oldest") {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortBy === "sla_urgency") {
          const slaA = getSLAStatus(a.createdAt, a.status, ["answered", "resolved", "closed"]);
          const slaB = getSLAStatus(b.createdAt, b.status, ["answered", "resolved", "closed"]);
          if (slaA.isResolved && !slaB.isResolved) return 1;
          if (!slaA.isResolved && slaB.isResolved) return -1;
          return slaB.ageMs - slaA.ageMs; // higher age first
        }
        if (sortBy === "last_updated") {
          const timeA = new Date(a.updatedAt || a.createdAt).getTime();
          const timeB = new Date(b.updatedAt || b.createdAt).getTime();
          return timeB - timeA;
        }
        // default newest
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [cases, filters, quickView, sortBy, currentUser]);

  // Selected item object reference
  const selectedCase = useMemo(() => {
    return filteredCases.find((c) => c.id === selectedCaseId) || null;
  }, [filteredCases, selectedCaseId]);

  const handleClearFilters = () => {
    setFilters({
      searchQuery: "",
      status: "",
      type: initialType,
      clinic: "",
      submitter: "",
      assignee: "",
      sourceChannel: "",
      sla: "all",
      date: "",
    });
    setQuickView("team_queue");
    setSortBy("newest");
  };

  // 5. Firebase Mutations proxying through reactive state setters
  const handleAssignCase = async (caseId: string, type: 'inquiry' | 'complaint' | 'tabby_tamara' | 'client_comm', agentName: string) => {
    const assignActivity = {
      id: "act_" + Math.random().toString(36).substring(2, 11),
      senderName: "System",
      authorId: "system",
      authorRole: "system",
      text: `${currentUser.name} assigned this request to ${agentName}.`,
      createdAt: new Date().toISOString()
    };

    const assigneeId = "usr_" + agentName.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    const mappedType = type === "tabby_tamara" ? "tt_request" : type === "complaint" ? "tt_complaint" : type;

    // Call central assignment service
    await assignCase(mappedType, caseId, { id: assigneeId, name: agentName }, currentUser);

    const basePayload = {
      assignedToId: assigneeId,
      assignedToName: agentName,
      assignedAt: new Date().toISOString(),
      assignedById: currentUser.id || currentUser.uid || assigneeId,
      assignedByName: currentUser.name,
      updatedAt: new Date().toISOString()
    };

    if (type === "inquiry") {
      const targetDoc = doc(db, "inquiries", caseId);
      await updateDoc(targetDoc, {
        agentName: agentName,
        seenByAgent: false,
        replies: arrayUnion(assignActivity),
        ...basePayload
      });

      // Update parent reactive state
      setInquiries((prev) =>
        prev.map((item) => (item.id === caseId ? { ...item, agentName: agentName, seenByAgent: false, replies: [...(item.replies || []), assignActivity], ...basePayload } : item))
      );

      if (addSystemNotification) {
        addSystemNotification(
          "Inquiry Reassigned",
          `TL ${currentUser.name} reassigned your inquiry regarding case reference to ${agentName}.`,
          "inquiry",
          agentName,
          undefined,
          "inquiry",
          caseId
        );
      }
      toast.success(`Inquiry assigned to ${agentName}!`);
    } else if (type === "client_comm") {
      const targetDoc = doc(db, "client_comms", caseId);
      
      const payload: any = {
        ...basePayload,
        replies: arrayUnion(assignActivity)
      };

      await updateDoc(targetDoc, payload);

      if (setClientComms) {
        setClientComms((prev) =>
          prev.map((item) => (item.id === caseId ? { ...item, ...payload, replies: [...(item.replies || []), assignActivity] } : item))
        );
      }

      if (addSystemNotification) {
        addSystemNotification(
          `Assigned: Client Communication`,
          `You have been assigned to handle this communication request.`,
          "general",
          agentName,
          undefined,
          "client_comm",
          caseId
        );
      }
      toast.success(`Communication assigned to ${agentName}!`);
    } else if (type === "complaint") {
      const targetDoc = doc(db, "tt_complaints", caseId);
      
      const payload: any = {
        ...basePayload,
        replies: arrayUnion(assignActivity)
      };

      await updateDoc(targetDoc, payload);

      setTabbyTamaraComplaints((prev) =>
        prev.map((item) => (item.id === caseId ? { ...item, ...payload, replies: [...(item.replies || []), assignActivity] } : item))
      );

      if (addSystemNotification) {
        addSystemNotification(
          `Assigned: Complaint`,
          `You have been assigned to handle this case reference.`,
          "general",
          agentName,
          undefined,
          "tt_complaint",
          caseId
        );
      }

      toast.success(`Case assigned to ${agentName}!`);
    } else if (type === "tabby_tamara") {
      const targetDoc = doc(db, "tt_requests", caseId);
      
      const payload: any = {
        ...basePayload,
        replies: arrayUnion(assignActivity),
        workflowStatus: "awaiting_client_contact"
      };

      await updateDoc(targetDoc, payload);

      setTabbyTamaraRequests((prev) =>
        prev.map((item) => (item.id === caseId ? { ...item, ...payload, replies: [...(item.replies || []), assignActivity] } : item))
      );

      if (addSystemNotification) {
        addSystemNotification(
          `Assigned: Installment request`,
          `You have been assigned to handle this case reference.`,
          "general",
          agentName,
          undefined,
          "tt_request",
          caseId
        );
      }

      toast.success(`Case assigned to ${agentName}!`);
    } else {
      toast.error(`Unknown entity type: ${type}`);
    }
  };

  const handleClaimCase = async (caseId: string, type: 'inquiry' | 'complaint' | 'tabby_tamara' | 'client_comm') => {
    await handleAssignCase(caseId, type, currentUser.name);
  };

  const handleDeleteCase = async (caseId: string, type: 'inquiry' | 'complaint' | 'tabby_tamara' | 'client_comm') => {
    let collName = 'tt_requests';
    if (type === 'inquiry') collName = 'inquiries';
    else if (type === 'complaint') collName = 'tt_complaints';
    else if (type === 'client_comm') collName = 'client_comms';
    else if (type === 'tabby_tamara') collName = 'tt_requests';
    else throw new Error("Unknown entity type for deletion.");

    await deleteDoc(doc(db, collName, caseId));

    if (type === "inquiry") {
      setInquiries((prev) => prev.filter((i) => i.id !== caseId));
    } else if (type === "client_comm") {
      if (setClientComms) setClientComms((prev) => prev.filter((i) => i.id !== caseId));
    } else if (type === "complaint") {
      setTabbyTamaraComplaints((prev) => prev.filter((i) => i.id !== caseId));
    } else {
      setTabbyTamaraRequests((prev) => prev.filter((i) => i.id !== caseId));
    }
    setSelectedCaseId(null);
    toast.success("Case record deleted from cloud database successfully.");
  };

  const handleSendToPartner = async (caseId: string, notes: string, photos: string[]) => {
    const targetDoc = doc(db, "tt_requests", caseId);
    const sendActivity = {
      id: "act_" + Math.random().toString(36).substring(2, 11),
      senderName: "System",
      authorId: "system",
      authorRole: "system",
      text: `${currentUser.name} sent case to partner. Case completed with notes: "${notes || "None"}".`,
      createdAt: new Date().toISOString()
    };

    const payload = {
      workflowStatus: "sent_to_partner",
      partnerSentAt: new Date().toISOString(),
      partnerSentById: currentUser.id || currentUser.uid || "usr_" + currentUser.name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase(),
      partnerSentByName: currentUser.name,
      partnerNotes: notes,
      status: "confirmed",
      replies: arrayUnion(sendActivity)
    };

    await updateDoc(targetDoc, payload);

    setTabbyTamaraRequests((prev) =>
      prev.map((item) => (item.id === caseId ? { ...item, ...payload, replies: [...(item.replies || []), sendActivity] } : item))
    );

    toast.success("Case dispatched and confirmed successfully!");
  };

  const handleMarkInquirySent = async (inquiryId: string) => {
    const targetDoc = doc(db, "inquiries", inquiryId);
    const payload = {
      status: "sent" as const,
      sentBy: currentUser.name,
      sentAt: new Date().toISOString(),
      seenByAgent: false,
    };

    await updateDoc(targetDoc, payload);

    setInquiries((prev) =>
      prev.map((item) => (item.id === inquiryId ? { ...item, ...payload } : item))
    );

    toast.success("Inquiry set to Sent to Partner.");
  };

  const handleMarkPatientContactedTT = async (caseId: string, type: 'complaint' | 'tabby_tamara', contactedStatus: 'contacted' | 'attempted' | 'not_contacted') => {
    let coll = 'tt_requests';
    if (type === 'complaint') coll = 'tt_complaints';
    else if (type === 'tabby_tamara') coll = 'tt_requests';
    else throw new Error("Unknown entity type for marking patient contacted");

    const targetDoc = doc(db, coll, caseId);
    
    const payload: any = {
      customerContacted: contactedStatus,
    };

    if (contactedStatus === 'contacted') {
      payload.status = "confirmed";
      payload.workflowStatus = "completed";
    }

    await updateDoc(targetDoc, payload);

    const stateUpdater = type === "complaint" ? setTabbyTamaraComplaints : setTabbyTamaraRequests;
    stateUpdater((prev: any[]) =>
      prev.map((item) => (item.id === caseId ? { ...item, ...payload } : item))
    );

    toast.success(`Contact state updated to ${contactedStatus}!`);
  };

  const handleTLCommentComplaint = async (complaintId: string, comment: string, resolutionType: string) => {
    const targetDoc = doc(db, "tt_complaints", complaintId);
    const now = new Date().toISOString();
    
    const payload = {
      tlComment: comment,
      tlResolutionType: resolutionType,
      tlName: currentUser.name,
      tlHandledBy: currentUser.name,
      tlHandledAt: now,
      commentedAt: now,
      status: "need_contact" as const,
    };

    await updateDoc(targetDoc, payload);

    setTabbyTamaraComplaints((prev) =>
      prev.map((item) => (item.id === complaintId ? { ...item, ...payload } : item))
    );

    toast.success("Complaint resolution registered! Agent notified.");
  };

  const handleCloseComplaint = async (complaintId: string) => {
    const targetDoc = doc(db, "tt_complaints", complaintId);
    const activity = {
      id: "act_" + Math.random().toString(36).substring(2, 11),
      senderName: "System",
      authorId: "system",
      text: `${currentUser.name} closed the complaint ticket.`,
      createdAt: new Date().toISOString()
    };

    await updateDoc(targetDoc, {
      status: "closed",
      replies: arrayUnion(activity)
    });

    setTabbyTamaraComplaints((prev) =>
      prev.map((item) => (item.id === complaintId ? { ...item, status: "closed", replies: [...(item.replies || []), activity] } : item))
    );

    toast.success("Complaint ticket marked CLOSED.");
  };

  const handleReopenComplaint = async (complaintId: string) => {
    const targetDoc = doc(db, "tt_complaints", complaintId);
    const activity = {
      id: "act_" + Math.random().toString(36).substring(2, 11),
      senderName: "System",
      authorId: "system",
      text: `${currentUser.name} reopened the complaint file.`,
      createdAt: new Date().toISOString()
    };

    await updateDoc(targetDoc, {
      status: "submitted",
      replies: arrayUnion(activity)
    });

    setTabbyTamaraComplaints((prev) =>
      prev.map((item) => (item.id === complaintId ? { ...item, status: "submitted", replies: [...(item.replies || []), activity] } : item))
    );

    toast.success("Complaint file REOPENED for TL review.");
  };

  return (
    <div id="unified-crm-workspace" className="space-y-5 flex flex-col min-h-0 h-full">
      {/* Search and Filters command bar */}
      <CaseCommandBar
        filters={filters}
        onFiltersChange={setFilters}
        quickView={quickView}
        onQuickViewChange={setQuickView}
        totalResults={filteredCases.length}
        onClearFilters={handleClearFilters}
        uniqueClinics={uniqueClinics}
        uniqueSubmitters={uniqueSubmitters}
        uniqueAssignees={uniqueAssignees}
      />

      {/* Main split work bench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start min-h-0 flex-1">
        {/* Cases Table - left block (Col Span 7 / Expandable if nothing selected) */}
        <div className={`col-span-1 = h-full flex flex-col min-h-0 ${selectedCaseId ? "lg:col-span-7" : "lg:col-span-12"}`}>
          <CaseTable
            cases={filteredCases}
            selectedCaseId={selectedCaseId}
            onSelectCase={(c) => setSelectedCaseId(c.id)}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
        </div>

        {/* Selected Case Detail Drawer - right block (Col Span 5 on layout) */}
        {selectedCaseId && (
          <div className="col-span-1 lg:col-span-5 h-full min-h-[550px] lg:max-h-[85vh]">
            <CaseDetailDrawer
              caseData={selectedCase}
              onClose={() => setSelectedCaseId(null)}
              currentUser={currentUser}
              isTLOreSupport={isTLOreSupport}
              addSystemNotification={addSystemNotification}
              onAssignCase={handleAssignCase}
              onClaimCase={handleClaimCase}
              onDeleteCase={handleDeleteCase}
              onEditItem={onEditItem}
              onSendToPartner={handleSendToPartner}
              onMarkInquirySent={handleMarkInquirySent}
              onMarkPatientContactedTT={handleMarkPatientContactedTT}
              onTLCommentComplaint={handleTLCommentComplaint}
              onCloseComplaint={handleCloseComplaint}
              onReopenComplaint={handleReopenComplaint}
            />
          </div>
        )}
      </div>
    </div>
  );
};
