import { db } from "../firebase";
import { collection, doc, setDoc, serverTimestamp, query, where, orderBy, getDocs } from "firebase/firestore";

export interface ActivityEvent {
  id: string;
  entityType: string;
  entityId: string;
  action: 'created' | 'edited' | 'replied' | 'attachment_added' | 'assigned' | 'status_changed' | 'sent_to_partner';
  actorId: string;
  actorName: string;
  actorRole: string;
  createdAt: string;
  summary: string;
  metadata?: Record<string, any>;
}

export const logActivity = async (
  entityType: string,
  entityId: string,
  action: ActivityEvent['action'],
  actorId: string,
  actorName: string,
  actorRole: string,
  summary: string,
  metadata?: Record<string, any>
) => {
  const eventId = `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const event: ActivityEvent = {
    id: eventId,
    entityType,
    entityId,
    action,
    actorId,
    actorName,
    actorRole,
    createdAt: new Date().toISOString(),
    summary,
    metadata
  };

  try {
    await setDoc(doc(db, "case_activity", eventId), event);
  } catch (error) {
    console.error("Failed to log case activity:", error);
  }
};

export const getCaseTimeline = async (entityType: string, entityId: string): Promise<ActivityEvent[]> => {
  try {
    const q = query(
      collection(db, "case_activity"),
      where("entityType", "==", entityType),
      where("entityId", "==", entityId),
    );
    const snap = await getDocs(q);
    const events = snap.docs.map(d => d.data() as ActivityEvent);
    
    events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return events;
  } catch (e) {
    console.error("Failed to retrieve timeline:", e);
    return [];
  }
};
