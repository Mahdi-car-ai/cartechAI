import { io, Socket } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "./api";
import { EventEmitter } from "events";

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

// Custom event emitter for socket status
class SocketEventEmitter extends EventEmitter {}
const socketEvents = new SocketEventEmitter();

class SocketManager {
  private static instance: SocketManager;
  private socket: Socket | null = null;
  private currentRoomId: string | null = null;
  private reconnecting: boolean = false;
  private messageCallback: ((messageData: MessageData) => void) | null = null;
  public events: SocketEventEmitter = socketEvents;

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

      // Emit reconnecting event
      this.events.emit("reconnecting");

      // Store current state to restore after reconnect
      const currentCallback = this.messageCallback;
      const currentRoomId = this.currentRoomId;

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
        this.events.emit("reconnect_failed");
        this.reconnecting = false;
        return false;
      }

      // Disconnect if already connected
      if (this.socket) {
        this.socket.disconnect();
      }

      // Create new connection with fresh token
      this.socket = io(`${process.env.API_URL}/chats`, {
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
          this.events.emit("reconnect_failed");
          reject(new Error("Socket initialization failed"));
          return;
        }

        this.socket.on("connect", () => {
          console.log("Reconnected to Socket.IO server with new token");

          // Restore previous state
          if (currentRoomId) {
            this.joinRoom(currentRoomId);
          }

          // Restore message listeners if they existed
          if (currentCallback) {
            this.messageCallback = currentCallback;
            this.socket!.on("message", currentCallback);
          }

          this.reconnecting = false;
          this.events.emit("reconnected");
          resolve(true);
        });

        this.socket.on("connect_error", (error) => {
          console.error("Socket reconnection error:", error);
          this.reconnecting = false;
          this.events.emit("reconnect_failed");
          reject(error);
        });
      });
    } catch (error) {
      this.reconnecting = false;
      this.events.emit("reconnect_failed");
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
      this.socket = io(`${process.env.API_URL}/chats`, {
        path: "/socket.io",
        transports: ["websocket"],
        auth: {
          token: token,
        },
      });

      console.log("Attempting to connect to socket server...");
      this.events.emit("connecting");

      return new Promise((resolve, reject) => {
        if (!this.socket) {
          this.events.emit("connect_failed");
          reject(new Error("Socket initialization failed"));
          return;
        }

        this.socket.on("connect", () => {
          console.log("Connected to Socket.IO server");
          this.setupEventListeners();

          // Restore message callback if it exists
          if (this.messageCallback) {
            this.socket!.on("message", this.messageCallback);
          }

          this.events.emit("connected");
          resolve(this.socket!);
        });

        this.socket.on("connect_error", async (error: Error) => {
          console.error("Socket connection error:", error);
          this.events.emit("connect_failed");

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
      this.events.emit("connect_failed");
      throw error;
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on("disconnect", () => {
      console.log("Disconnected from Socket.IO server");
      this.events.emit("disconnected");
    });

    this.socket.on("authenticated", (userData: UserData) => {
      console.log("Authenticated with userId:", userData.userId);
      this.events.emit("authenticated", userData);
    });

    this.socket.on("error", async (error: any) => {
      console.error("Socket.IO error:", error);
      this.events.emit("error", error);

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

      // Don't try to reconnect if already reconnecting to avoid loops
      if (this.reconnecting) {
        console.log("Already reconnecting, will join room when reconnected");
        this.currentRoomId = roomId; // Store the target room ID
        return;
      }

      // Create a more robust connection and joining method
      console.log(`Connecting to socket before joining room: ${roomId}`);

      // First try to connect and then join with a delay
      this.connect()
        .then(() => {
          // Make sure we're fully connected before trying to join
          // Add more delay to ensure connection is fully established
          setTimeout(() => {
            // Double-check connection status before joining
            if (this.socket && this.socket.connected) {
              console.log(`Socket connected, now joining room: ${roomId}`);
              this.socket.emit("joinRoom", roomId);
              this.currentRoomId = roomId;
              this.events.emit("room_joined", roomId);
              console.log(`Joined room: ${roomId}`);
            } else {
              console.error(
                "Socket still not connected after connect() call and delay",
              );
              this.events.emit("room_join_failed", roomId);
              // Try one more attempt after a delay
              setTimeout(() => {
                if (this.socket && this.socket.connected) {
                  console.log(
                    `Second attempt: Socket now connected, joining room: ${roomId}`,
                  );
                  this.socket.emit("joinRoom", roomId);
                  this.currentRoomId = roomId;
                  this.events.emit("room_joined", roomId);
                } else {
                  console.error(
                    "Socket connection failed after second attempt",
                  );
                }
              }, 1000);
            }
          }, 500); // Increased delay to 500ms
        })
        .catch((error) => {
          console.error("Failed to connect before joining room:", error);
          this.events.emit("room_join_failed", roomId);
        });
      return;
    }

    console.log(`Emitting joinRoom event for room: ${roomId}`);
    this.socket.emit("joinRoom", roomId);
    this.currentRoomId = roomId;
    console.log(`Joined room: ${roomId}`);
    this.events.emit("room_joined", roomId);
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
            this.events.emit("message_sent", content);
          }
        })
        .catch((error) => {
          console.error("Failed to reconnect before sending message:", error);
          this.events.emit("message_send_failed", content);
        });
      return;
    }

    if (!this.currentRoomId) {
      console.error("No room joined. Cannot send message.");
      this.events.emit("message_send_failed", content);
      return;
    }

    this.socket.emit("message", {
      content,
      chatId: this.currentRoomId,
    } as MessageData);
    this.events.emit("message_sent", content);
  }

  public onMessage(callback: (messageData: MessageData) => void): void {
    // Store the callback for reconnection
    this.messageCallback = callback;

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

  public offMessage(): void {
    if (!this.socket) {
      console.error("Socket not initialized");
      return;
    }

    // Remove all message listeners
    this.socket.off("message");
    this.messageCallback = null;
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentRoomId = null;
      this.messageCallback = null;
      this.events.emit("disconnected");
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
