export class RealtimeClient {
  private url: string;
  private interval: any = null;
  private isConnected = false;
  private listeners: Set<(change: any) => void> = new Set();
  private eventListeners: Record<string, Function[]> = {};
  private knownChangeIds: Set<string> = new Set();
  private offlineMessageQueue: any[] = [];

  constructor(url: string) {
    this.url = url;
  }

  on(event: string, cb: Function) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(cb);
  }

  off(event: string, cb: Function) {
    if (!this.eventListeners[event]) return;
    this.eventListeners[event] = this.eventListeners[event].filter(l => l !== cb);
  }

  private emit(event: string, data?: any) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(cb => {
        try { cb(data); } catch (e) { console.error('Error in event listener', e); }
      });
    }
  }

  public connect() {
    if (this.interval) return;

    this.isConnected = true;
    this.emit('connected');

    this.interval = setInterval(() => {
      this.poll();
    }, 2000);

    // Initial poll
    this.poll();
  }

  public disconnect() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isConnected = false;
    this.emit('disconnected');
  }

  public subscribe(handler: (change: any) => void) {
    this.listeners.add(handler);
  }

  public unsubscribe(handler: (change: any) => void) {
    this.listeners.delete(handler);
  }

  private async poll() {
    try {
      const resp = await fetch(`${this.url}/api/changes`);
      if (!resp.ok) {
        throw new Error(`HTTP status ${resp.status}`);
      }
      const data = await resp.json();
      const changes = data.changes || [];

      if (!this.isConnected) {
        this.isConnected = true;
        this.emit('connected');
      }

      // Heartbeat signal
      this.emit('heartbeat');

      changes.forEach((change: any) => {
        if (!this.knownChangeIds.has(change.id)) {
          this.knownChangeIds.add(change.id);
          this.listeners.forEach(handler => handler(change));
          this.emit('change', change);
        }
      });
    } catch (err: any) {
      if (this.isConnected) {
        this.isConnected = false;
        this.emit('disconnected');
        this.emit('error', err);
      }
    }
  }

  public queueMessage(msg: any) {
    if (!this.isConnected) {
      this.offlineMessageQueue.push(msg);
    }
  }
}
