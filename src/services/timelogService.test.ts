import { describe, it, expect, vi } from 'vitest';
import { purgeAllTimeLogs } from './timelogService';

vi.mock('../firebase', () => ({
  db: {}
}));

const mockDelete = vi.fn();
const mockCommit = vi.fn();

vi.mock('firebase/firestore', () => {
  return {
    collection: vi.fn(),
    getDocs: vi.fn(() => Promise.resolve({
      docs: [
        { ref: { id: 'd1' } },
        { ref: { id: 'd2' } }
      ]
    })),
    writeBatch: vi.fn(() => ({
      delete: mockDelete,
      commit: mockCommit
    }))
  };
});

describe('timelogService', () => {
  it('should throw if not super admin', async () => {
    await expect(purgeAllTimeLogs(false)).rejects.toThrow('Unauthorized');
  });

  it('should purge logs if super admin', async () => {
    const deletedCount = await purgeAllTimeLogs(true);
    // There are 2 mock docs
    expect(mockDelete).toHaveBeenCalledTimes(2);
    expect(mockCommit).toHaveBeenCalledTimes(1);
    expect(deletedCount).toBe(2);
  });
});
