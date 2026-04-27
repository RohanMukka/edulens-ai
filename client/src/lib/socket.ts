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
  private shouldReconnect = false;
  private currentRoom: string | null = null;
  private currentUserId: number | null = null;
  private currentRole: "student" | "teacher" | null = null;

  constructor() {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    this.url = `${protocol}//${window.location.host}/ws`;
  }

  connect(room: string, userId: number, role: "student" | "teacher") {
    if (this.ws?.readyState === WebSocket.OPEN && this.currentRoom === room) return;

    this.shouldReconnect = true;
    this.currentRoom = room;
    this.currentUserId = userId;
    this.currentRole = role;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
      this.ws.close();
    }

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
      if (!this.shouldReconnect || !this.currentRoom || !this.currentUserId || !this.currentRole) {
        return;
      }
      console.log("WS Disconnected, retrying...");
      this.reconnectTimer = setTimeout(() => {
        if (this.currentRoom && this.currentUserId && this.currentRole) {
          this.connect(this.currentRoom, this.currentUserId, this.currentRole);
        }
      }, 3000);
    };
  }

  disconnect() {
    this.shouldReconnect = false;
    this.currentRoom = null;
    this.currentUserId = null;
    this.currentRole = null;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.onclose = null;
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
