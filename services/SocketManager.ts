import { io, Socket } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "./api";

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
  private reconnecting: boolean = false;

  private constructor() {
    // Listen for the socket error event outside of connect
    this.setupErrorHandlers();
  }

  private setupErrorHandlers() {
    // Listen for storage events that might indicate a token refresh
    this.listenForTokenRefresh();
  }

  private async listenForTokenRefresh() {
    // We can't directly listen to AsyncStorage changes, so we use periodic check for critical actions
    setInterval(async () => {
      // Only check if we're disconnected or have errors
      if (this.socket && !this.socket.connected && !this.reconnecting) {
        try {
          // Try to refresh the token and reconnect
          await this.refreshTokenAndReconnect();
        } catch (error) {
          console.error("Error in token refresh interval:", error);
        }
      }
    }, 5000); // Check every 5 seconds
  }

  private async refreshTokenAndReconnect(): Promise<boolean> {
    try {
      this.reconnecting = true;
      console.log("Attempting to refresh token and reconnect socket...");

      // Try to refresh token using API service
      try {
        // Make a request to refresh the token
        await api.post("/auth/refresh");
      } catch (refreshError) {
        console.error("Token refresh API error:", refreshError);
      }

      // Get fresh token after refresh attempt
      const newToken = await AsyncStorage.getItem("accessToken");

      if (!newToken) {
        console.error("No token available after refresh attempt");
        return false;
      }

      // Disconnect if already connected
      if (this.socket) {
        this.socket.disconnect();
      }

      // Create new connection with fresh token
      this.socket = io("http://localhost:4000/chats", {
        path: "/socket.io",
        transports: ["websocket"],
        auth: {
          token: newToken,
        },
      });

      // Set up necessary event listeners
      this.setupEventListeners();

      // Return a promise that resolves when connected or rejects on error
      return new Promise((resolve, reject) => {
        if (!this.socket) {
          this.reconnecting = false;
          reject(new Error("Socket initialization failed"));
          return;
        }

        this.socket.on("connect", () => {
          console.log("Reconnected to Socket.IO server with new token");

          // Rejoin the room if we were in one
          if (this.currentRoomId) {
            this.joinRoom(this.currentRoomId);
          }

          this.reconnecting = false;
          resolve(true);
        });

        this.socket.on("connect_error", (error) => {
          console.error("Socket reconnection error:", error);
          this.reconnecting = false;
          reject(error);
        });
      });
    } catch (error) {
      this.reconnecting = false;
      console.error("Error in refreshTokenAndReconnect:", error);
      return false;
    }
  }

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

    if (this.reconnecting) {
      console.log("Already attempting to reconnect, waiting...");
      // Wait for current reconnection attempt to finish
      return new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          if (!this.reconnecting && this.socket && this.socket.connected) {
            clearInterval(checkInterval);
            resolve(this.socket);
          } else if (!this.reconnecting) {
            clearInterval(checkInterval);
            reject(new Error("Reconnection failed"));
          }
        }, 500);
      });
    }

    try {
      // Get fresh token
      let token = await AsyncStorage.getItem("accessToken");

      if (!token) {
        throw new Error("No authentication token available");
      }

      // Create socket connection
      this.socket = io("http://localhost:4000/chats", {
        path: "/socket.io",
        transports: ["websocket"],
        auth: {
          token: token,
        },
      });

      console.log("Attempting to connect to socket server...");

      return new Promise((resolve, reject) => {
        if (!this.socket) {
          reject(new Error("Socket initialization failed"));
          return;
        }

        this.socket.on("connect", () => {
          console.log("Connected to Socket.IO server");
          this.setupEventListeners();
          resolve(this.socket!);
        });

        this.socket.on("connect_error", async (error: Error) => {
          console.error("Socket connection error:", error);

          // Check if error is authentication related
          if (
            error.message.includes("Authentication") ||
            error.message.includes("jwt")
          ) {
            try {
              const success = await this.refreshTokenAndReconnect();
              if (success) {
                resolve(this.socket!);
                return;
              }
            } catch (refreshError) {
              console.error(
                "Token refresh failed during connect:",
                refreshError,
              );
            }
          }

          reject(error);
        });
      });
    } catch (error) {
      console.error("Socket connection error:", error);
      throw error;
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on("disconnect", () => {
      console.log("Disconnected from Socket.IO server");
    });

    this.socket.on("authenticated", (userData: UserData) => {
      console.log("Authenticated with userId:", userData.userId);
    });

    this.socket.on("error", async (error: any) => {
      console.error("Socket.IO error:", error);

      // If we get an auth error while connected, try to refresh token
      if (
        typeof error === "object" &&
        error.message &&
        (error.message.includes("Authentication") ||
          error.message.includes("jwt"))
      ) {
        try {
          await this.refreshTokenAndReconnect();
        } catch (refreshError) {
          console.error(
            "Token refresh failed after socket error:",
            refreshError,
          );
        }
      }
    });
  }

  public joinRoom(roomId: string): void {
    if (!this.socket || !this.socket.connected) {
      console.error("Socket not connected. Cannot join room.");
      this.connect()
        .then(() => {
          if (this.socket && this.socket.connected) {
            this.socket.emit("joinRoom", roomId);
            this.currentRoomId = roomId;
            console.log(`Joined room: ${roomId}`);
          }
        })
        .catch((error) => {
          console.error("Failed to connect before joining room:", error);
        });
      return;
    }

    this.socket.emit("joinRoom", roomId);
    this.currentRoomId = roomId;
    console.log(`Joined room: ${roomId}`);
  }

  public sendMessage(content: string): void {
    if (!this.socket || !this.socket.connected) {
      console.error("Socket not connected. Cannot send message.");

      // Try to reconnect before sending
      this.connect()
        .then(() => {
          if (this.socket && this.socket.connected && this.currentRoomId) {
            this.socket.emit("message", {
              content,
              chatId: this.currentRoomId,
            } as MessageData);
          }
        })
        .catch((error) => {
          console.error("Failed to reconnect before sending message:", error);
        });
      return;
    }

    if (!this.currentRoomId) {
      console.error("No room joined. Cannot send message.");
      return;
    }

    this.socket.emit("message", {
      content,
      chatId: this.currentRoomId,
    } as MessageData);
  }

  public onMessage(callback: (messageData: MessageData) => void): void {
    if (!this.socket) {
      console.error("Socket not initialized");
      this.connect()
        .then(() => {
          if (this.socket) {
            this.socket.on("message", callback);
          }
        })
        .catch((error) => {
          console.error(
            "Failed to connect before setting message listener:",
            error,
          );
        });
      return;
    }

    this.socket.on("message", callback);
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
      console.error("Socket not connected. Cannot emit event.");

      // Try to reconnect before emitting
      this.connect()
        .then(() => {
          if (this.socket && this.socket.connected) {
            this.socket.emit(event, data);
          }
        })
        .catch((error) => {
          console.error("Failed to reconnect before emitting event:", error);
        });
      return;
    }

    this.socket.emit(event, data);
  }

  public once(event: string, callback: (data: any) => void): void {
    if (!this.socket) {
      console.error("Socket not initialized");

      // Try to connect before setting listener
      this.connect()
        .then(() => {
          if (this.socket) {
            this.socket.once(event, callback);
          }
        })
        .catch((error) => {
          console.error(
            "Failed to connect before setting once listener:",
            error,
          );
        });
      return;
    }

    this.socket.once(event, callback);
  }
}

export default SocketManager.getInstance();
