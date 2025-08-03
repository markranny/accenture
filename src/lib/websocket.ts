import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';

export interface ProgressMessage {
  type: 'progress';
  transcriptId: string;
  stage: 'upload' | 'transcription' | 'analysis';
  progress: number;
  message?: string;
}

export interface StatusMessage {
  type: 'status';
  transcriptId: string;
  status: 'processing' | 'completed' | 'failed';
  data?: any;
  error?: string;
}

export type WebSocketMessage = ProgressMessage | StatusMessage;

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, WebSocket> = new Map();

  initialize(server: any) {
    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
      const clientId = this.generateClientId();
      this.clients.set(clientId, ws);

      console.log(`Client ${clientId} connected`);

      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message);
          this.handleMessage(clientId, data);
        } catch (error) {
          console.error('Invalid message format:', error);
        }
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
        console.log(`Client ${clientId} disconnected`);
      });

      ws.on('error', (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
        this.clients.delete(clientId);
      });

      // Send welcome message
      this.sendToClient(clientId, {
        type: 'status',
        transcriptId: 'system',
        status: 'processing',
        data: { message: 'Connected to Rianna WebSocket server' }
      });
    });
  }

  private generateClientId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private handleMessage(clientId: string, data: any) {
    // Handle client messages (e.g., subscription to specific transcript updates)
    if (data.type === 'subscribe' && data.transcriptId) {
      // Store subscription info
      console.log(`Client ${clientId} subscribed to transcript ${data.transcriptId}`);
    }
  }

  sendToClient(clientId: string, message: WebSocketMessage) {
    const client = this.clients.get(clientId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }

  broadcastProgress(transcriptId: string, stage: ProgressMessage['stage'], progress: number, message?: string) {
    const progressMessage: ProgressMessage = {
      type: 'progress',
      transcriptId,
      stage,
      progress,
      message
    };

    this.broadcast(progressMessage);
  }

  broadcastStatus(transcriptId: string, status: StatusMessage['status'], data?: any, error?: string) {
    const statusMessage: StatusMessage = {
      type: 'status',
      transcriptId,
      status,
      data,
      error
    };

    this.broadcast(statusMessage);
  }

  private broadcast(message: WebSocketMessage) {
    this.clients.forEach((client, clientId) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(JSON.stringify(message));
        } catch (error) {
          console.error(`Failed to send message to client ${clientId}:`, error);
          this.clients.delete(clientId);
        }
      }
    });
  }

  getConnectedClientsCount(): number {
    return this.clients.size;
  }
}

export const wsManager = new WebSocketManager();