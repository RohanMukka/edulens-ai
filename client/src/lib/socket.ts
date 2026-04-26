type MessageType = "join" | "student_update" | "teacher_broadcast" | "live_update" | "broadcast";

interface SocketMessage {
  type: MessageType;
  room: string;
  id?: number;
  role?: "student" | "teacher";
  data?: any;
}

class ClassroomSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private listeners: Set<(msg: any) => void> = new Set();
  private reconnectTimer: any = null;

  constructor() {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    this.url = `${protocol}//${window.location.host}/ws`;
  }

  connect(room: string, userId: number, role: "student" | "teacher") {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log("WS Connected");
      this.send({ type: "join", room, id: userId, role });
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        this.listeners.forEach(l => l(msg));
      } catch (e) {
        console.error("WS Parse Error", e);
      }
    };

    this.ws.onclose = () => {
      console.log("WS Disconnected, retrying...");
      this.reconnectTimer = setTimeout(() => this.connect(room, userId, role), 3000);
    };
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(msg: SocketMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  addListener(fn: (msg: any) => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
}

export const classroomSocket = new ClassroomSocket();
