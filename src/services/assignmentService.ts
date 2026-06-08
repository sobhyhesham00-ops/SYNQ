import { db } from "../firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { logActivity } from "./activityService";
import { User } from "../types";

export interface AssigneeDetails {
  id: string;
  name: string;
}

export const assignCase = async (
  entityType: string,
  entityId: string,
  assignee: AssigneeDetails,
  actor: User
) => {
  if (!entityType || !entityId || !assignee || !actor) return;

  const validEntityTypes = ['inquiries', 'tt_requests', 'tt_complaints', 'client_comms', 'requests'];
  let collectionName = entityType;
  
  if (entityType === "inquiry") collectionName = "inquiries";
  else if (entityType === "tt_request") collectionName = "tt_requests";
  else if (entityType === "tt_complaint") collectionName = "tt_complaints";
  else if (entityType === "client_comm") collectionName = "client_comms";
  else if (entityType === "scheduling") collectionName = "requests";

  // Check if mapping succeeded, if not and it's valid, use it. otherwise return
  if (!validEntityTypes.includes(collectionName)) {
      console.warn("Invalid entity type for assignments", entityType);
      return;
  }

  const assignedAt = new Date().toISOString();
  
  const updateData = {
    assignedToId: assignee.id,
    assignedToName: assignee.name,
    assignedAt,
    assignedById: actor.id,
    assignedByName: actor.name,
    updatedAt: assignedAt
  };

  try {
    await updateDoc(doc(db, collectionName, entityId), updateData);

    // Write activity event
    await logActivity(
      entityType,
      entityId,
      'assigned',
      actor.id,
      actor.name,
      actor.role,
      `${actor.name} assigned case to ${assignee.name}`,
      { assigneeId: assignee.id, assigneeName: assignee.name }
    );

    // Note: notification trigger can be implemented downstream/upstream or using cloud functions if available.
    // For now we will return successfully so caller can insert a local addSystemNotification.
    return true;
  } catch (error) {
    console.error("Assignment failed:", error);
    return false;
  }
};
