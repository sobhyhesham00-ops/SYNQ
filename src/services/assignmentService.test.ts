import { describe, it, expect, vi } from 'vitest';
import { assignCase } from './assignmentService';
import { User } from '../types';

vi.mock('../firebase', () => ({
  db: {}
}));

vi.mock('firebase/firestore', () => {
  return {
    doc: vi.fn(),
    updateDoc: vi.fn(),
    serverTimestamp: vi.fn()
  };
});

// also mock activity service
vi.mock('./activityService', () => ({
  logActivity: vi.fn()
}));

describe('AssignmentService', () => {
  it('should format assignment and map entity valid type', async () => {
    const actor: User = { id: 'u1', name: 'Actor', role: 'tl' };
    const assignee = { id: 'u2', name: 'Assignee' };
    
    // Testing invalid type returns false/void
    const resultInvalid = await assignCase('unknown', '123', assignee, actor);
    expect(resultInvalid).toBeUndefined();

    // Testing valid
    const resultValid = await assignCase('inquiry', '123', assignee, actor);
    expect(resultValid).toBe(true);
  });
});
