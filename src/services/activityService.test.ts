import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logActivity, getCaseTimeline } from './activityService';

vi.mock('../firebase', () => ({
  db: {}
}));

vi.mock('firebase/firestore', () => {
  return {
    collection: vi.fn(),
    doc: vi.fn(),
    setDoc: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    getDocs: vi.fn(() => Promise.resolve({
      docs: [
        { data: () => ({ id: '1', entityType: 'inquiry', entityId: 'abc', action: 'created', createdAt: new Date().toISOString() }) }
      ]
    })),
    serverTimestamp: vi.fn()
  };
});

describe('ActivityService', () => {
  it('should log activity and get case timeline', async () => {
    await logActivity('inquiry', 'abc', 'created', 'u1', 'Test User', 'agent', 'Test log');
    
    // It should not throw and simply pass through mocked methods
    
    const events = await getCaseTimeline('inquiry', 'abc');
    expect(events.length).toBe(1);
    expect(events[0].action).toBe('created');
  });
});
