import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserData {
  userId: string;
}

interface MessageData {
  id?: string;
  content: string;
  chatId: string;
  senderId?: string;
  timestamp?: string;
}

class SocketManager {
  private static instance: SocketManager;
  private socket: Socket | null = null;
  private currentRoomId: string | null = null;

  private constructor() {}

  public static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  public async connect(): Promise<Socket> {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    try {
      const token = await AsyncStorage.getItem('accessToken');
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      this.socket = io('http://localhost:4000/chats', {
        path: '/socket.io',
        transports: ['websocket'],
        auth: {
          token: token
        }
      });

      console.log('Attempting to connect to socket server...');

      return new Promise((resolve, reject) => {
        if (!this.socket) {
          reject(new Error('Socket initialization failed'));
          return;
        }

        this.socket.on('connect', () => {
          console.log('Connected to Socket.IO server');
          this.setupEventListeners();
          resolve(this.socket!);
        });

        this.socket.on('connect_error', (error: Error) => {
          console.error('Socket connection error:', error);
          reject(error);
        });
      });
    } catch (error) {
      console.error('Socket connection error:', error);
      throw error;
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server');
    });

    this.socket.on('authenticated', (userData: UserData) => {
      console.log('Authenticated with userId:', userData.userId);
    });

    this.socket.on('error', (error: Error) => {
      console.error('Socket.IO error:', error);
    });
  }

  public joinRoom(roomId: string): void {
    if (!this.socket || !this.socket.connected) {
      console.error('Socket not connected. Cannot join room.');
      return;
    }

    this.socket.emit('joinRoom', roomId);
    this.currentRoomId = roomId;
    console.log(`Joined room: ${roomId}`);
  }

  public sendMessage(content: string): void {
    if (!this.socket || !this.socket.connected) {
      console.error('Socket not connected. Cannot send message.');
      return;
    }

    if (!this.currentRoomId) {
      console.error('No room joined. Cannot send message.');
      return;
    }

    this.socket.emit('message', {
      content,
      chatId: this.currentRoomId
    } as MessageData);
  }

  public onMessage(callback: (messageData: MessageData) => void): void {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }

    this.socket.on('message', callback);
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentRoomId = null;
    }
  }

  public getCurrentRoomId(): string | null {
    return this.currentRoomId;
  }

  public isConnected(): boolean {
    return !!this.socket && this.socket.connected;
  }

  public emit(event: string, data: any): void {
    if (!this.socket || !this.socket.connected) {
      console.error('Socket not connected. Cannot emit event.');
      return;
    }

    this.socket.emit(event, data);
  }

  public once(event: string, callback: (data: any) => void): void {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }

    this.socket.once(event, callback);
  }
}

export default SocketManager.getInstance(); 