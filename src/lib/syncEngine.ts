export interface SyncItem {
  id: string;
  type: 'schedule' | 'profile';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  retries: number;
  status: 'pending' | 'synced' | 'failed';
  error?: string;
}

export class SyncEngine {
  private queue: Map<string, SyncItem> = new Map();
  private apiUrl: string;
  private listeners: Record<string, Function[]> = {};
  private timer: any = null;
  private retryTimers: Map<string, any> = new Map();
  private syncedCount: number = 0;
  private failedCount: number = 0;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
    this.loadFromStorage();
    this.startInterval();
  }

  on(event: string, cb: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(cb);
  }

  off(event: string, cb: Function) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(l => l !== cb);
  }

  private emit(event: string, data?: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => {
        try { cb(data); } catch (e) { console.error('Error in listener', e); }
      });
    }
  }

  private saveToStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const items = Array.from(this.queue.values());
      window.localStorage.setItem('syncQueue', JSON.stringify(items));
      window.localStorage.setItem('syncCountSuccess', String(this.syncedCount));
      window.localStorage.setItem('syncCountFailure', String(this.failedCount));
    }
  }

  private loadFromStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = window.localStorage.getItem('syncQueue');
        if (stored) {
          const items: SyncItem[] = JSON.parse(stored);
          items.forEach(item => {
            this.queue.set(item.id, item);
          });
        }
        const savedSuccess = window.localStorage.getItem('syncCountSuccess');
        if (savedSuccess) {
          this.syncedCount = Number(savedSuccess) || 0;
        }
        const savedFailure = window.localStorage.getItem('syncCountFailure');
        if (savedFailure) {
          this.failedCount = Number(savedFailure) || 0;
        }
      } catch (e) {
        console.error('Failed to load sync queue', e);
      }
    }
  }

  private startInterval() {
    if (typeof window !== 'undefined') {
      this.timer = setInterval(() => {
        this.processPending();
      }, 3000);
    }
  }

  public destroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.retryTimers.forEach(id => clearTimeout(id));
    this.retryTimers.clear();
  }

  private generateUUID(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxx-xxxx-4xxx-yxxx-xxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  public addToQueue(type: 'schedule' | 'profile', action: 'create' | 'update' | 'delete', data: any) {
    const id = this.generateUUID();
    const item: SyncItem = {
      id,
      type,
      action,
      data,
      timestamp: Date.now(),
      retries: 0,
      status: 'pending'
    };
    this.queue.set(id, item);
    this.saveToStorage();
    this.emit('queueUpdated', this.getSyncStatus());
    return id;
  }

  public async processPending() {
    const pendingItems = Array.from(this.queue.values()).filter(i => i.status === 'pending');
    if (pendingItems.length === 0) return;

    this.emit('syncStart');

    // Process batched items
    try {
      const response = await fetch(`${this.apiUrl}/api/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: pendingItems })
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const result = await response.json();
      
      // Sync results
      const results: Record<string, { success: boolean; error?: string }> = result.results || {};
      
      for (const item of pendingItems) {
        const itemResult = results[item.id] || { success: true };
        if (itemResult.success) {
          this.onSuccess(item.id);
        } else {
          item.error = itemResult.error || 'Server rejected item';
          this.onFailure(item.id);
        }
      }
    } catch (err: any) {
      this.emit('syncFailure', { error: err.message || 'Network error' });
      for (const item of pendingItems) {
        item.error = err.message || 'Connection failure';
        this.onFailure(item.id);
      }
    }
  }

  public onSuccess(id: string) {
    const item = this.queue.get(id);
    if (item) {
      item.status = 'synced';
      this.syncedCount++;
      this.queue.delete(id);
      this.saveToStorage();
      this.emit('syncSuccess', { id });
      this.emit('queueUpdated', this.getSyncStatus());
    }
  }

  public onFailure(id: string) {
    const item = this.queue.get(id);
    if (item) {
      item.status = 'failed';
      this.failedCount++;
      this.saveToStorage();
      this.emit('queueUpdated', this.getSyncStatus());
      
      if (item.retries < 3) {
        this.retry(id);
      }
    }
  }

  public async retry(id: string, maxRetries = 3) {
    const item = this.queue.get(id);
    if (!item) return;

    if (this.retryTimers.has(id)) {
      clearTimeout(this.retryTimers.get(id));
    }

    item.retries++;
    item.status = 'pending';
    this.saveToStorage();
    this.emit('queueUpdated', this.getSyncStatus());

    // exponential backoff delays: 1s, 2s, 4s, 8s...
    const delay = Math.pow(2, item.retries - 1) * 1000;
    
    const timerId = setTimeout(() => {
      this.retryTimers.delete(id);
      this.processPending();
    }, delay);

    this.retryTimers.set(id, timerId);
  }

  public getQueueSize(): number {
    return Array.from(this.queue.values()).filter(i => i.status === 'pending' || i.status === 'failed').length;
  }

  public getSyncStatus() {
    const items = Array.from(this.queue.values());
    return {
      pending: items.filter(i => i.status === 'pending').length,
      synced: this.syncedCount,
      failed: this.failedCount
    };
  }

  public getQueue() {
    return Array.from(this.queue.values());
  }

  public clearQueue() {
    this.queue.clear();
    this.syncedCount = 0;
    this.failedCount = 0;
    this.saveToStorage();
    this.emit('queueUpdated', this.getSyncStatus());
  }
}
