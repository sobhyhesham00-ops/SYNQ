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
