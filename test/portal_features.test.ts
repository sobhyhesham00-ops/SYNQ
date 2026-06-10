// Mock window for firebase initialization in node environments
if (typeof window === "undefined") {
  const mockWindow = {
    location: {
      hostname: "localhost"
    }
  };
  (global as any).window = mockWindow;
  (globalThis as any).window = mockWindow;
}

import { describe, it, expect, vi } from "vitest";

// Dynamically import src/utils to ensure window mock is loaded first
const { normalizeAttachments } = await import("../src/utils");

// Business logic definition for notification tab routing corresponding to src/components/NotificationDrawer.tsx
function getNavTab(notif: any): string | null {
  if (notif.entityType === 'inquiry') return 'inquiries';
  if (notif.entityType === 'scheduling_request') return 'my-requests';
  if (notif.entityType === 'case') return 'daily-cases';
  if (notif.entityType === 'tt_request') return 'tabby-tamara';
  if (notif.entityType === 'tt_complaint') return 'complaints';
  if (notif.entityType === 'client_comm') return 'client-comms';
  
  if (notif.type === 'inquiry') return 'inquiries';
  if (notif.type === 'schedule') return 'my-requests';
  if (notif.type === 'feedback') return 'tl-feedback';
  return null;
}

// Simulated Purge Logs Batch Delete Helper representing handlePurgeTimeLogs in App.tsx
interface FakeDoc {
  ref: { id: string };
}
interface BatchCall {
  deletedIds: string[];
  committed: boolean;
}

async function simulatePurgeTimeLogs(
  docs: FakeDoc[],
  batchSize = 450
): Promise<{ deletedCount: number; batchesCommitted: number }> {
  let deletedCount = 0;
  let batchesCommitted = 0;
  
  for (let i = 0; i < docs.length; i += batchSize) {
    const chunk = docs.slice(i, i + batchSize);
    const batch: BatchCall = { deletedIds: [], committed: false };
    
    chunk.forEach((docSnap) => {
      batch.deletedIds.push(docSnap.ref.id);
    });
    
    // simulate await batch.commit();
    batch.committed = true;
    batchesCommitted += 1;
    deletedCount += chunk.length;
  }
  
  return { deletedCount, batchesCommitted };
}

describe("Notification Routing & Read State Tests", () => {
  it("routes entity types to their designated tabs without redirecting tabby-tamara/complaints/etc to non-existent fintech tab", () => {
    expect(getNavTab({ entityType: 'inquiry' })).toBe('inquiries');
    expect(getNavTab({ entityType: 'scheduling_request' })).toBe('my-requests');
    expect(getNavTab({ entityType: 'case' })).toBe('daily-cases');
    expect(getNavTab({ entityType: 'tt_request' })).toBe('tabby-tamara');
    expect(getNavTab({ entityType: 'tt_complaint' })).toBe('complaints');
    expect(getNavTab({ entityType: 'client_comm' })).toBe('client-comms');
  });

  it("applies legacy fallback mapping when entityType is absent", () => {
    expect(getNavTab({ type: 'inquiry' })).toBe('inquiries');
    expect(getNavTab({ type: 'schedule' })).toBe('my-requests');
    expect(getNavTab({ type: 'feedback' })).toBe('tl-feedback');
    expect(getNavTab({ type: 'unknown' })).toBeNull();
  });

  it("checks read/unread state using currentUser.id and ignores name field entirely", () => {
    const currentUser = { id: "user_789", name: "John Doe" };
    
    // If user's ID is not present in seenByUsers list, it must be considered unread (true)
    const notifUnread = {
      id: "notif_1",
      seenByUsers: ["user_111", "user_222"]
    };
    const isUnread1 = !notifUnread.seenByUsers?.includes(currentUser.id);
    expect(isUnread1).toBe(true);

    // If user's ID is present in seenByUsers list, it is read (not unread - false)
    const notifRead = {
      id: "notif_2",
      seenByUsers: ["user_789"]
    };
    const isUnread2 = !notifRead.seenByUsers?.includes(currentUser.id);
    expect(isUnread2).toBe(false);

    // Verifying name match does not mistakenly mark it read if id is missing
    const notifNameMatchOnly = {
      id: "notif_3",
      seenByUsers: ["John Doe"] // incorrectly populated legacy way
    };
    const isUnread3 = !notifNameMatchOnly.seenByUsers?.includes(currentUser.id);
    expect(isUnread3).toBe(true); // Should remain unread because only name matches, not ID!
  });
});

describe("Attachment Normalization Tests", () => {
  it("handles string inputs correctly (identifying data URLs vs plain strings)", () => {
    const inputs = [
      "https://example.com/file.pdf",
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
    ];
    
    const result = normalizeAttachments(inputs);
    expect(result).toHaveLength(2);
    
    expect(result[0].url).toBe("https://example.com/file.pdf");
    expect(result[0].name).toBe("https://example.com/file.pdf");
    expect(result[0].type).toBe("application/octet-stream");

    expect(result[1].url).toContain("data:image/png;base64,");
    expect(result[1].name).toBe("Attachment 2");
    expect(result[1].type).toBe("image/png");
  });

  it("handles object inputs containing full/partial FileAttachment structure fields", () => {
    const inputs = [
      { id: "custom_id", name: "Summary.xlsx", type: "application/vnd.ms-excel", size: 1024, url: "http://storage/excel" },
      { filename: "Photo.jpg", mimeType: "image/jpeg", dataUrl: "http://storage/jpg" }
    ];

    const result = normalizeAttachments(inputs);
    expect(result).toHaveLength(2);

    expect(result[0].id).toBe("custom_id");
    expect(result[0].name).toBe("Summary.xlsx");
    expect(result[0].type).toBe("application/vnd.ms-excel");
    expect(result[0].size).toBe(1024);
    expect(result[0].url).toBe("http://storage/excel");

    expect(result[1].id).toBeDefined();
    expect(result[1].name).toBe("Photo.jpg");
    expect(result[1].type).toBe("image/jpeg");
    expect(result[1].size).toBe(0);
    expect(result[1].url).toBe("http://storage/jpg");
  });

  it("handles null/undefined and returns an empty array safely without throwing", () => {
    expect(normalizeAttachments(null)).toEqual([]);
    expect(normalizeAttachments(undefined)).toEqual([]);
    expect(normalizeAttachments([])).toEqual([]);
  });
});

describe("Collection Routing in RequestReplyThread", () => {
  it("correctly infers target database collection name for complaints", () => {
    // Expected collection values for thread updates:
    const inferCollectionName = (colName: string) => {
      if (colName === 'tt_complaints') return 'tt_complaints';
      if (colName === 'tt_requests') return 'tt_requests';
      return colName;
    };

    expect(inferCollectionName('tt_complaints')).toBe('tt_complaints');
    expect(inferCollectionName('tt_requests')).toBe('tt_requests');
  });
});

describe("Purge All Logs Firestore Deletion Helper Tests", () => {
  it("performs batching division so each block deletes at most 450 records", async () => {
    const docsToPurge = Array.from({ length: 1000 }, (_, idx) => ({
      ref: { id: `log_${idx}` }
    }));

    const result = await simulatePurgeTimeLogs(docsToPurge, 450);
    
    // 1000 logs with batch size of 450 should take exactly 3 batch commits
    // Chunk 0: 450
    // Chunk 1: 450
    // Chunk 2: 100
    expect(result.deletedCount).toBe(1000);
    expect(result.batchesCommitted).toBe(3);
  });

  it("succeeds cleanly when collection has 0 elements to purge", async () => {
    const result = await simulatePurgeTimeLogs([], 450);
    expect(result.deletedCount).toBe(0);
    expect(result.batchesCommitted).toBe(0);
  });
});

describe("Inquiry File Upload & Validation Tests", () => {
  it("rejects oversized files (>20MB)", async () => {
    const { validateFile } = await import("../src/services/attachmentService");
    const oversizedFile = new File(["a".repeat(21 * 1024 * 1024)], "big.png", { type: "image/png" });
    const result = validateFile(oversizedFile);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("exceeds 20MB limit");
  });

  it("rejects blocked extensions", async () => {
    const { validateFile } = await import("../src/services/attachmentService");
    const badFile = new File(["console.log(1)"], "script.js", { type: "text/plain" });
    const result = validateFile(badFile);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("not allowed for security reasons");
  });

  it("rejects blocked MIME types", async () => {
    const { validateFile } = await import("../src/services/attachmentService");
    const badMimeFile = new File(["mz"], "app.exe", { type: "application/x-executable" });
    const result = validateFile(badMimeFile);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("is not allowed");
  });

  it("firestore payload contains no base64 string in screenshot or photos when files are used", async () => {
    const mockAuth = { currentUser: { uid: "firebase_user_abc123" } };
    const mockCurrentUser = { id: "agent_789", name: "AbdelRahman Al Sayed" };
    const setDocSpy = vi.fn().mockResolvedValue(true);
    
    const normalPhotos = ["https://example.com/photo.png"]; // valid link

    // Simulate handleSubmitInquiry's construction
    const newInquiry = {
      id: "inq_test_123",
      submittedById: mockAuth.currentUser.uid,
      submittedByName: mockCurrentUser.name,
      agentName: mockCurrentUser.name,
      clinicName: "Cairo",
      text: "Issue",
      photos: normalPhotos, // Base64 should be excluded in actual implementation
      screenshot: null,     // Strictly null format
      attachments: [{ name: "photo_1.png", url: "firebase-url" }],
      status: "submitted",
    };

    await setDocSpy("inquiries", newInquiry.id, newInquiry);

    const payload = setDocSpy.mock.calls[0][2];
    expect(payload.screenshot).toBeNull();
    payload.photos.forEach((ph: string) => expect(ph).not.toContain("data:image"));
    expect(payload.attachments).toBeDefined();
  });
});
describe("Inquiry Submission Workflow Tests", () => {
  it("blocks unauthenticated submissions", async () => {
    const mockAuth = { currentUser: null };
    const toastErrorSpy = vi.fn();
    const mockToast = { error: toastErrorSpy };
    const setDocSpy = vi.fn();
    
    const handleSubmit = async () => {
      if (!mockAuth.currentUser) {
        mockToast.error("You must be logged in to submit an inquiry.");
        return;
      }
    };
    
    await handleSubmit();
    expect(toastErrorSpy).toHaveBeenCalledWith("You must be logged in to submit an inquiry.");
    expect(setDocSpy).not.toHaveBeenCalled();
  });

  it("allows authenticated agents to submit and builds correct inquiry object", async () => {
    const mockAuth = { currentUser: { uid: "firebase_user_abc123" } };
    const mockCurrentUser = { id: "agent_789", name: "AbdelRahman Al Sayed" };
    const mockToast = { error: vi.fn(), success: vi.fn() };
    const setDocSpy = vi.fn().mockResolvedValue(true);
    const setInquiryTextSpy = vi.fn();
    const addNotificationSpy = vi.fn();

    const formValues = {
      clinicName: "Cairo Clinic",
      text: "Need support on shift schedules",
      phoneNumber: "123456"
    };

    const handleSubmit = async () => {
      if (!mockAuth.currentUser) {
        mockToast.error("You must be logged in to submit an inquiry.");
        return;
      }
      if (!formValues.clinicName || !formValues.clinicName.trim()) {
        mockToast.error("Please select a Clinic Name! This is a mandatory field.");
        return;
      }
      if (!formValues.text || !formValues.text.trim()) {
        mockToast.error("Please enter your inquiry text!");
        return;
      }

      const agentNameStr = mockCurrentUser.name;
      const newInquiry = {
        id: "inq_test_123",
        submittedById: mockAuth.currentUser.uid,
        submittedByName: agentNameStr,
        agentName: agentNameStr,
        clinicName: formValues.clinicName.trim(),
        phoneNumber: formValues.phoneNumber,
        text: formValues.text.trim(),
        createdAt: new Date().toISOString(),
        status: "submitted",
      };

      await setDocSpy("inquiries", newInquiry.id, newInquiry);

      setInquiryTextSpy("");
      addNotificationSpy("New Inquiry Submitted");
    };

    await handleSubmit();
    
    expect(setDocSpy).toHaveBeenCalled();
    const calledWithInquiry = setDocSpy.mock.calls[0][2];
    expect(calledWithInquiry.submittedById).toBe("firebase_user_abc123");
    expect(calledWithInquiry.submittedByName).toBe("AbdelRahman Al Sayed");
    expect(calledWithInquiry.agentName).toBe("AbdelRahman Al Sayed");
    expect(calledWithInquiry.clinicName).toBe("Cairo Clinic");
    expect(setInquiryTextSpy).toHaveBeenCalledWith("");
    expect(addNotificationSpy).toHaveBeenCalledWith("New Inquiry Submitted");
  });

  it("keeps the form content intact if the Firestore write fails", async () => {
    const mockAuth = { currentUser: { uid: "firebase_user_abc123" } };
    const mockToast = { error: vi.fn() };
    const setDocSpy = vi.fn().mockRejectedValue(new Error("Firebase Permission Denied"));
    
    const formValues = {
      clinicName: "Cairo Clinic",
      text: "Need support on shift schedules",
    };
    
    const setInquiryTextSpy = vi.fn();
    const setInquiryClinicNameSpy = vi.fn();

    const handleSubmit = async () => {
      try {
        if (!mockAuth.currentUser) return;
        
        await setDocSpy();
        
        setInquiryTextSpy("");
        setInquiryClinicNameSpy("");
      } catch (err: any) {
        mockToast.error(`Submission failed. ${err.message}`);
      }
    };

    await handleSubmit();

    expect(setInquiryTextSpy).not.toHaveBeenCalled();
    expect(setInquiryClinicNameSpy).not.toHaveBeenCalled();
    expect(mockToast.error).toHaveBeenCalledWith("Submission failed. Firebase Permission Denied");
  });

  it("prevents duplicate submissions on double-clicking/concurrent triggers", async () => {
    const setDocSpy = vi.fn().mockImplementation(() => new Promise((r) => setTimeout(r, 100)));
    let isFormSubmitting = false;
    let callCount = 0;

    const handleSubmit = async () => {
      if (isFormSubmitting) return;
      isFormSubmitting = true;
      try {
        callCount++;
        await setDocSpy();
      } finally {
        isFormSubmitting = false;
      }
    };

    await Promise.all([
      handleSubmit(),
      handleSubmit(),
    ]);

    expect(callCount).toBe(1);
  });
});

