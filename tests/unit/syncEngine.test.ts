import { SyncEngine } from '../../src/lib/syncEngine';

describe('SyncEngine Unit Tests', () => {
  let engine: SyncEngine;
  
  beforeEach(() => {
    // Mock fetch and localStorage for tests
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ results: {} })
      })
    );
    
    // Simple localStorage mock
    const store: Record<string, string> = {};
    const mockLocalStorage = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => { store[key] = value; },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => { Object.keys(store).forEach(k => delete store[k]); }
    };
    Object.defineProperty(global, 'localStorage', { value: mockLocalStorage, writable: true });
    
    engine = new SyncEngine('http://mock-api');
  });

  afterEach(() => {
    engine.destroy();
    jest.restoreAllMocks();
  });

  it('should initialize with empty queue', () => {
    expect(engine.getQueueSize()).toBe(0);
    expect(engine.getSyncStatus()).toEqual({ pending: 0, synced: 0, failed: 0 });
  });

  it('should add item to queue and update size', () => {
    const id = engine.addToQueue('schedule', 'create', { agentName: 'Fox Mulder' });
    expect(id).toBeDefined();
    expect(engine.getQueueSize()).toBe(1);
    expect(engine.getSyncStatus().pending).toBe(1);
  });

  it('should format queue items correctly', () => {
    engine.addToQueue('schedule', 'update', { id: '3', agentName: 'Scully' });
    const items = engine.getQueue();
    expect(items.length).toBe(1);
    expect(items[0].type).toBe('schedule');
    expect(items[0].action).toBe('update');
    expect(items[0].data).toEqual({ id: '3', agentName: 'Scully' });
  });

  it('should handle SUCCESS cycle correctly', () => {
    const id = engine.addToQueue('schedule', 'delete', { id: '123' });
    engine.onSuccess(id);
    expect(engine.getQueueSize()).toBe(0);
    expect(engine.getSyncStatus().synced).toBe(1);
  });

  it('should handle FAILURE cycle correctly', () => {
    const id = engine.addToQueue('schedule', 'create', { data: 'test' });
    engine.onFailure(id);
    expect(engine.getSyncStatus().failed).toBe(1);
  });
});
