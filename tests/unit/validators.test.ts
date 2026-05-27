import { validateSchedules, validateMessage } from '../../src/lib/validators';

describe('Validators Unit Tests', () => {
  describe('validateSchedules', () => {
    it('should fail if data is not an array', () => {
      const res = validateSchedules({ date: '2026-05-27' });
      expect(res.valid).toBe(false);
      expect(res.errors).toContain('Must be array');
    });

    it('should fail if array is empty', () => {
      const res = validateSchedules([]);
      expect(res.valid).toBe(false);
      expect(res.errors).toContain('Cannot be empty');
    });

    it('should fail if array is too large', () => {
      const items = Array(1001).fill({ date: '2026-05-27', agentName: 'John', shiftLabel: 'Day' });
      const res = validateSchedules(items);
      expect(res.valid).toBe(false);
      expect(res.errors).toContain('Maximum 1000 items');
    });

    it('should validate correctly formatted objects', () => {
      const payload = [
        { date: '2026-05-27', agentName: 'Doctor Joe', shiftLabel: 'Evening' }
      ];
      const res = validateSchedules(payload);
      expect(res.valid).toBe(true);
      expect(res.data).toBeDefined();
      expect(res.data![0].agentName).toBe('Doctor Joe');
    });

    it('should trim string fields', () => {
      const payload = [
        { date: '  2026-05-27  ', agentName: '  Agent Scully  ', shiftLabel: '  Night  ' }
      ];
      const res = validateSchedules(payload);
      expect(res.valid).toBe(true);
      expect(res.data![0].agentName).toBe('Agent Scully');
      expect(res.data![0].date).toBe('2026-05-27');
      expect(res.data![0].shiftLabel).toBe('Night');
    });

    it('should report invalid, empty, or wrong field types', () => {
      const payload = [
        { date: 'not-a-date', agentName: '', shiftLabel: 'Night'.repeat(20) }
      ];
      const res = validateSchedules(payload);
      expect(res.valid).toBe(false);
      expect(res.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateMessage', () => {
    it('should fail if message is not a string', () => {
      const res = validateMessage(1234);
      expect(res.valid).toBe(false);
    });

    it('should fail if message is empty', () => {
      const res = validateMessage('   ');
      expect(res.valid).toBe(false);
    });

    it('should succeed for valid string message', () => {
      const res = validateMessage('Hello Sync!');
      expect(res.valid).toBe(true);
      expect(res.data).toBe('Hello Sync!');
    });
  });
});
