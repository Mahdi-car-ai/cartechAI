import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Linking,
  Image,
  Modal,
  Alert,
} from "react-native";
import { Icon } from "react-native-elements";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import Logo from "@/components/ui/Logo";
import { ActivityIndicator } from "react-native";
import RenderChat from "@/utils/RenderChat";
import { RootStackParamList } from "@/types/NavigationTypes";
import * as ImagePicker from "expo-image-picker";
import Voice from "@react-native-voice/voice";
import socketManager from "@/services/SocketManager";
import { CarDetails } from "@/types/CarDetails";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import { getChatMessages, Message as ApiMessage } from "@/utils/Chat";

// Function to convert image URI to base64
const getBase64FromUri = async (uri: string): Promise<string | null> => {
  try {
    // Check if the URI is valid
    if (!uri || !uri.startsWith("file://")) {
      console.error("Invalid URI format for image conversion:", uri);
      return null;
    }

    // Read the file as base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return base64 ? `data:image/jpeg;base64,${base64}` : null;
  } catch (error) {
    console.error("Error converting image to base64:", error);
    return null;
  }
};

// Define types for the chat message
interface ChatMessage {
  id: string;
  text?: string;
  message?: string;
  sender: string;
  images?: string[];
  youtubeVideo?: {
    title: string;
    link: string;
    thumbnail: string;
  } | null;
  timestamp?: Date;
  [key: string]: any;
}

type ChatScreenRouteProp = RouteProp<RootStackParamList, "ChatScreen">;
type NavigationProp = StackNavigationProp<RootStackParamList>;

const ChatScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const flatListRef = useRef<FlatList<ChatMessage> | null>(null); // Reference to FlatList
  const route = useRoute<ChatScreenRouteProp>();
  const carDetails = route.params?.carDetails || ({} as Partial<CarDetails>);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>(
    [],
  ); // Stores all messages
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const carName = `${carDetails?.Make || ""} ${carDetails?.Model || ""} - ${carDetails?.["Model Year"] || ""}`;
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedText, setRecordedText] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);

  // Create ref for message timeout
  const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Add new state for API pagination
  const [messagePage, setMessagePage] = useState<number>(1);
  const [hasMoreMessages, setHasMoreMessages] = useState<boolean>(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [totalMessages, setTotalMessages] = useState<number>(0);
  const messagesPerPage = 10;

  // Add scroll position tracking
  const [isAtTop, setIsAtTop] = useState<boolean>(false);
  const [scrollY, setScrollY] = useState<number>(0);

  // Add a new state to control scrolling behavior during loading more messages
  const [isLoadingMoreMessages, setIsLoadingMoreMessages] =
    useState<boolean>(false);

  // Initialization for voice recognition
  useEffect(() => {
    // Initialize voice handler
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;

    return () => {
      // Cleanup voice handler
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  // Voice recognition handlers
  const onSpeechStart = () => {
    console.log("Speech recognition started");
  };

  const onSpeechEnd = () => {
    setIsRecording(false);
    console.log("Speech recognition ended");
  };

  const onSpeechResults = (e: any) => {
    const text = e.value && e.value.length > 0 ? e.value[0] : "";
    setRecordedText(text);
    setInputText(text);
    console.log("Speech results:", text);
  };

  const onSpeechError = (e: any) => {
    console.error("Speech recognition error:", e);
    setIsRecording(false);
    Alert.alert("Speech Recognition Error", "Please try again.");
  };

  // Start recording
  const startRecording = async () => {
    try {
      await Voice.start("en-US");
      setIsRecording(true);
    } catch (e) {
      console.error("Error starting voice recognition:", e);
      Alert.alert(
        "Error",
        "Could not start voice recording. Please try again.",
      );
    }
  };

  // Stop recording
  const stopRecording = async () => {
    try {
      await Voice.stop();
      setIsRecording(false);
    } catch (e) {
      console.error("Error stopping voice recognition:", e);
    }
  };

  // Image picker functions
  const takePhoto = async () => {
    setShowMediaOptions(false);

    // Request camera permissions
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Camera permission is required to take photos.",
      );
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Could not take photo. Please try again.");
    }
  };

  const pickImage = async () => {
    setShowMediaOptions(false);

    // Request media library permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Media library permission is required to select images.",
      );
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Could not pick image. Please try again.");
    }
  };

  // Handle sending image message
  const handleImageMessage = async (imageUri: string, text: string) => {
    if (!chatId) {
      console.error("Chat ID is missing. Cannot store messages.");
      return;
    }

    // Create a message with the image and text
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text: text || "Image",
      sender: "user",
      images: [imageUri],
    };

    // Add to UI
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setConversationHistory((prevHistory) => [...prevHistory, newMessage]);

    // Send through socket if connected
    if (socketConnected && socketManager.isConnected()) {
      // TODO: Implement image upload through your backend
      socketManager.sendMessage(text || "Image");
    } else {
      // Show error if socket isn't connected
      Alert.alert(
        "Connection Error",
        "Unable to send image. Please check your connection.",
      );
    }

    // Show typing indicator for AI response
    setIsTyping(true);
    const typingId = `typing-${Date.now()}`;
    const typingMessage: ChatMessage = {
      id: typingId,
      text: "CarTechAI is analyzing your image...",
      sender: "bot",
    };
    setMessages((prevMessages) => [...prevMessages, typingMessage]);

    // Set a timeout to handle case when no response comes back
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }

    messageTimeoutRef.current = setTimeout(() => {
      // Check if typing indicator still exists (no response received)
      setMessages((prevMessages) => {
        const typingExists = prevMessages.some((msg) => msg.id === typingId);

        if (typingExists) {
          // Replace typing indicator with error message
          return prevMessages.map((msg) =>
            msg.id === typingId
              ? {
                  ...msg,
                  id: `error-${Date.now()}`,
                  text: "Sorry, I didn't receive a response for your image. Please try again.",
                }
              : msg,
          );
        }
        return prevMessages;
      });

      setIsTyping(false);

      // Try to reconnect socket
      socketManager.disconnect();
      socketManager
        .connect()
        .then(() => {
          if (chatId) {
            socketManager.joinRoom(chatId);
          }
        })
        .catch((error) => {
          console.error("Failed to reconnect socket:", error);
        });
    }, 15000); // 15 second timeout
  };

  // Fetch initial messages from API
  useEffect(() => {
    if (chatId) {
      fetchMessages(chatId);
    }
  }, [chatId]);

  // Function to fetch messages from API
  const fetchMessages = async (chatId: string, page: number = 1) => {
    try {
      setIsLoadingMessages(true);
      const response = await getChatMessages(chatId, page, messagesPerPage);

      const apiMessages = response.messages;
      setTotalMessages(response.total);

      // Check if there are more messages to load
      setHasMoreMessages(page * messagesPerPage < response.total);

      // Convert API messages to ChatMessage format
      const formattedMessages = apiMessages.map(
        (msg: ApiMessage): ChatMessage => ({
          id: msg.id,
          text: msg.content,
          sender:
            msg.senderId === "00000000-0000-0000-0000-000000000000"
              ? "bot"
              : "user",
          timestamp: new Date(msg.timestamp),
        }),
      );

      if (page === 1) {
        // First page, replace existing messages
        setMessages(formattedMessages);
      } else {
        // For loading more messages (pagination), set the flag to prevent auto-scrolling
        setIsLoadingMoreMessages(true);

        // Subsequent pages, prepend to existing messages
        setMessages((prevMessages) => [...formattedMessages, ...prevMessages]);
      }

      setMessagePage(page);
    } catch (error) {
      console.error("Error fetching messages:", error);
      Alert.alert("Error", "Failed to fetch messages. Please try again.");
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Load more messages when explicitly requested
  const handleLoadMoreMessages = () => {
    if (hasMoreMessages && !isLoadingMessages && chatId && isAtTop) {
      // Set the flag to prevent auto-scrolling when more messages are loaded
      setIsLoadingMoreMessages(true);
      fetchMessages(chatId, messagePage + 1);
    }
  };

  useEffect(() => {
    const initChat = async () => {
      try {
        // First ensure the socket is connected
        if (!socketManager.isConnected()) {
          console.log(
            "Socket not connected during initChat, connecting first...",
          );
          await socketManager.connect();
          // Add a small delay to ensure connection is established
          await new Promise((resolve) => setTimeout(resolve, 300));
        }

        if (!chatId && !route.params?.chatId) {
          // Creating a new chat
          console.log("Creating new chat session...");
          // Generate a temporary ID for new chat
          const tempChatId = "chat-" + Date.now().toString();

          // Clear messages when creating a new chat
          setMessages([]);
          setConversationHistory([]);

          // Set the new chat ID
          setChatId(tempChatId);

          console.log(`New chat created with ID: ${tempChatId}`);

          // Double check that socket is connected before joining
          if (socketManager.isConnected()) {
            console.log(`Socket is connected, joining new room: ${tempChatId}`);
            // Add delay before joining to ensure connection is ready
            setTimeout(() => {
              socketManager.joinRoom(tempChatId);
            }, 500);
          } else {
            console.error(
              "Socket not connected after connect attempt, cannot join new chat room",
            );
            try {
              console.log("Trying one more connect attempt for new chat");
              await socketManager.connect();
              setTimeout(() => {
                socketManager.joinRoom(tempChatId);
              }, 500);
            } catch (error) {
              console.error("Failed second connect attempt:", error);
            }
          }
        } else if (route.params?.chatId) {
          // Joining existing chat
          const existingChatId = route.params.chatId;

          // Clear previous messages when changing chat
          if (chatId !== existingChatId) {
            console.log(`Changing chat from ${chatId} to ${existingChatId}`);
            setMessages([]);
            setConversationHistory([]);
          }

          setChatId(existingChatId);

          // Only try to join room if socket is connected
          if (socketManager.isConnected()) {
            console.log(
              `Socket is connected, joining existing room: ${existingChatId}`,
            );
            // Add delay before joining to ensure connection is ready
            setTimeout(() => {
              socketManager.joinRoom(existingChatId);
            }, 500);
          } else {
            console.log(
              "Socket not connected, will join room when socket connects",
            );
          }
        }

        // Set socket connected state to match actual connection status
        setSocketConnected(socketManager.isConnected());
      } catch (error) {
        console.error("Error in initChat:", error);
      }
    };

    initChat();
  }, [chatId, route.params?.chatId]);

  // Handle socket connection changes - this helps ensure we join the room when socket connects
  useEffect(() => {
    if (socketConnected && chatId) {
      console.log(
        `Socket is now connected. Ensuring we are in room: ${chatId}`,
      );
      socketManager.joinRoom(chatId);
    }
  }, [socketConnected, chatId]);

  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {},
  );

  const renderItem = ({ item }: { item: ChatMessage }) => {
    // Get loading states for images and thumbnails
    const imageLoading = loadingStates[item.id] ?? true;
    const thumbnailLoading = loadingStates[item.id + "-thumbnail"] ?? true;

    // Function to update loading state when images/thumbnails are loaded
    const handleImageLoad = (id: string) => {
      setLoadingStates((prev) => ({ ...prev, [id]: false }));
    };

    // Regex patterns for detecting media and links
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    const imagePattern =
      /(https?:\/\/[^\s)]+?\.(?:png|jpg|jpeg|gif))(?=[\s)]|$)/i;
    const pdfPattern = /(https?:\/\/[^\s)]+?\.pdf)(?=[\s)]|$)/i;
    const boldPattern = /\*\*(.*?)\*\*/g;
    const emojiPattern = /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu;

    // Process text for links, bold text, and images
    const textWithMedia = (item.text || item.message || "")
      .split(urlPattern)
      .map((part: string, index: number) => {
        if (imagePattern.test(part)) {
          const match = part.match(imagePattern);
          if (match) {
            const cleanImageUrl = match[1];
            return (
              <TouchableOpacity
                key={index}
                onPress={() => Linking.openURL(cleanImageUrl)}
              >
                <View>
                  {imageLoading && (
                    <ActivityIndicator
                      size="small"
                      color="#00ff00"
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        zIndex: 1,
                      }}
                    />
                  )}
                  <Image
                    source={{ uri: cleanImageUrl }}
                    style={styles.chatImage}
                    onLoad={() => handleImageLoad(item.id)} // Hide loader when image loads
                  />
                </View>
              </TouchableOpacity>
            );
          }
        } else if (pdfPattern.test(part)) {
          return (
            <TouchableOpacity
              key={index}
              style={styles.linkContainer}
              onPress={() => Linking.openURL(part)}
            >
              <Text style={[styles.link, styles.boldText]}>📄 Open PDF</Text>
            </TouchableOpacity>
          );
        } else if (urlPattern.test(part)) {
          return (
            <TouchableOpacity
              key={index}
              style={styles.linkContainer}
              onPress={() => Linking.openURL(part)}
            >
              <Text style={styles.link}>{part}</Text>
            </TouchableOpacity>
          );
        } else if (boldPattern.test(part)) {
          const boldText = part.replace(
            boldPattern,
            (_match: string, p1: string) => p1,
          );
          return (
            <Text key={index} style={[styles.messageText, styles.boldText]}>
              {boldText}
            </Text>
          );
        } else if (emojiPattern.test(part)) {
          return (
            <Text key={index} style={styles.messageText}>
              {part}
            </Text>
          );
        }

        return (
          <Text key={index} style={styles.messageText}>
            {part}
          </Text>
        );
      });

    return (
      <View
        style={[
          styles.messageContainer,
          item.sender === "user" ? styles.userMessage : styles.botMessage,
        ]}
      >
        {/* Render processed text with media */}
        {textWithMedia}

        {/* Display YouTube video with clickable link and thumbnail */}
        {item.youtubeVideo && (
          <View style={styles.youtubeContainer}>
            {/* Clickable YouTube Link */}
            <TouchableOpacity
              onPress={() => Linking.openURL(item.youtubeVideo!.link)}
            >
              <Text style={styles.link}>▶ {item.youtubeVideo.title}</Text>
            </TouchableOpacity>

            {/* Clickable YouTube Thumbnail with Loading Animation */}
            <TouchableOpacity
              onPress={() => Linking.openURL(item.youtubeVideo!.link)}
              style={styles.youtubeThumbnailContainer}
            >
              <View>
                {thumbnailLoading && (
                  <ActivityIndicator
                    size="small"
                    color="#FF0000"
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      zIndex: 1,
                    }}
                  />
                )}
                <Image
                  source={{ uri: item.youtubeVideo.thumbnail }}
                  style={styles.youtubeThumbnail}
                  onLoad={() => handleImageLoad(item.id + "-thumbnail")} // Hide loader when thumbnail loads
                />
              </View>
              {/* Play Button Overlay */}
              <View style={styles.youtubePlayButton}>
                <Text style={styles.playButtonText}>▶</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Display images from SerpAPI with Loading Animation */}
        {item.images && item.images.length > 0 && (
          <View style={styles.imageContainer}>
            {item.images.map((img: string, index: number) => (
              <TouchableOpacity
                key={index}
                onPress={() => Linking.openURL(img)}
              >
                <View>
                  {imageLoading && (
                    <ActivityIndicator
                      size="small"
                      color="#00ff00"
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        zIndex: 1,
                      }}
                    />
                  )}
                  <Image
                    source={{ uri: img }}
                    style={styles.chatImage}
                    onLoad={() => handleImageLoad(item.id)} // Hide loader when image loads
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  const scrollToBottom = () => {
    if (flatListRef.current && !isLoadingMoreMessages) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 50);
    }
  };

  // Connect to socket on component mount - do this early
  useEffect(() => {
    console.log("Initializing socket connection on component mount");
    socketManager
      .connect()
      .then(() => {
        console.log("Socket pre-connected successfully");
      })
      .catch((error) => {
        console.error("Failed to pre-connect socket:", error);
      });

    return () => {
      // No need to disconnect here as we'll do it in the main cleanup
    };
  }, []);

  // Handle sending message with timeout for response
  const handleSend = async () => {
    if (!inputText.trim() && !selectedImage) return;

    if (selectedImage) {
      // If we have an image, send it with the text
      await handleImageMessage(selectedImage, inputText);
      setSelectedImage(null);
      setInputText("");
      return;
    }

    // Ensure we have an active socket connection before sending
    if (!socketManager.isConnected()) {
      console.log(
        "Socket not connected. Reconnecting before sending message...",
      );
      try {
        await socketManager.connect();
        // Ensure we're in the right room
        if (chatId) {
          socketManager.joinRoom(chatId);
          // Give it a moment to connect
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      } catch (error) {
        console.error("Failed to reconnect socket before sending:", error);
        Alert.alert(
          "Connection Error",
          "Cannot connect to chat server. Please try again later.",
        );
        return;
      }
    }

    // If no image, just send text as usual
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText,
      sender: "user",
    };

    if (!chatId) {
      console.error("Chat ID is missing. Cannot store messages.");
      return;
    }

    // Store current message for debugging
    const currentMessage = inputText;
    console.log(`Sending message: "${currentMessage}"`);

    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setConversationHistory((prevHistory) => [...prevHistory, newMessage]); // Store in history
    setInputText("");
    setIsTyping(true);

    // If socket is connected, send the message through socket
    if (socketConnected && socketManager.isConnected()) {
      socketManager.sendMessage(inputText);

      // Show typing indicator
      const typingId = `typing-${Date.now()}`;
      const typingMessage: ChatMessage = {
        id: typingId,
        text: "CarTechAI is analyzing...",
        sender: "bot",
      };
      setMessages((prevMessages) => [...prevMessages, typingMessage]);

      // Set a timeout to handle case when no response comes back
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
        messageTimeoutRef.current = null;
      }

      // Create a function to check for response that we can call and cancel
      const checkForResponse = () => {
        console.log(`Checking timeout for message: "${currentMessage}"`);
        // Check if typing indicator still exists (no response received)
        setMessages((prevMessages) => {
          const typingExists = prevMessages.some((msg) => msg.id === typingId);

          if (typingExists) {
            console.log(
              "No response received within timeout period, showing error message",
            );
            // Replace typing indicator with error message
            return prevMessages.map((msg) =>
              msg.id === typingId
                ? {
                    ...msg,
                    id: `error-${Date.now()}`,
                    text: "Sorry, I didn't receive a response from the server. Please try again.",
                  }
                : msg,
            );
          }
          return prevMessages;
        });

        setIsTyping(false);

        // Try to reconnect socket
        console.log("Attempting to reconnect socket after timeout");
        socketManager.disconnect();
        socketManager
          .connect()
          .then(() => {
            if (chatId) {
              socketManager.joinRoom(chatId);
            }
          })
          .catch((error) => {
            console.error("Failed to reconnect socket:", error);
          });

        messageTimeoutRef.current = null;
      };

      messageTimeoutRef.current = setTimeout(checkForResponse, 30000); // 30 second timeout (increased from 15s)

      // The response will come through the socket connection
    } else {
      Alert.alert(
        "Connection Error",
        "Failed to send message. Please check your connection and try again.",
      );
      setIsTyping(false);
    }
  };

  useEffect(() => {
    if (!isUserScrolling) {
      scrollToBottom();
    }
  }, [messages]); // Runs every time a new message is added

  // Clear timeout when component unmounts
  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
        messageTimeoutRef.current = null;
      }
    };
  }, []);

  // Watch socket connection status to reset timeouts when reconnected
  useEffect(() => {
    if (socketConnected) {
      console.log(
        "Socket connected/reconnected - clearing any pending timeouts",
      );
      // Clear any pending timeouts when socket reconnects
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
        messageTimeoutRef.current = null;
      }

      // Also remove typing indicators from UI when socket reconnects
      setMessages((prevMessages) => {
        const updatedMessages = prevMessages.filter(
          (msg) => !msg.id.startsWith("typing"),
        );
        const removedCount = prevMessages.length - updatedMessages.length;
        if (removedCount > 0) {
          console.log(
            `Removed ${removedCount} stale typing indicators after reconnect`,
          );
        }
        return updatedMessages;
      });
    }
  }, [socketConnected]);

  // Main useEffect for socket connection and chat room handling
  useEffect(() => {
    const connectToSocket = async () => {
      try {
        // Check if socket is already connected, connect if not
        if (!socketManager.isConnected()) {
          console.log("Connecting to socket in main useEffect");
          await socketManager.connect();
        }

        setSocketConnected(true);
        console.log(`Chat ID from route: ${route.params?.chatId}`);

        if (route.params?.chatId) {
          console.log(`Joining room: ${route.params.chatId}`);
          socketManager.joinRoom(route.params.chatId);

          // Clear any existing message listeners before adding new ones
          socketManager.offMessage();

          // Listen for socket messages
          socketManager.onMessage((messageData) => {
            console.log("Received socket message:", messageData);

            // Clear any pending timeout when we receive a message
            if (messageTimeoutRef.current) {
              console.log("Clearing timeout - response received");
              clearTimeout(messageTimeoutRef.current);
              messageTimeoutRef.current = null;
            }

            // If the message is from the user or the bot, handle appropriately
            if (messageData.senderId) {
              const isBot =
                messageData.senderId === "00000000-0000-0000-0000-000000000000";

              // For bot messages, remove typing indicators
              if (isBot) {
                console.log(
                  "Removing typing indicators - bot message received",
                );
                setMessages((prevMessages) => {
                  const updatedMessages = prevMessages.filter(
                    (msg) => !msg.id.startsWith("typing"),
                  );

                  // Log if indicators were actually removed
                  const removedCount =
                    prevMessages.length - updatedMessages.length;
                  if (removedCount > 0) {
                    console.log(`Removed ${removedCount} typing indicators`);
                  } else {
                    console.log("No typing indicators found to remove");
                  }

                  return updatedMessages;
                });
              }

              // Add message to state if it's not already there
              setMessages((prevMessages) => {
                // Check if this message already exists in our state
                const messageExists = prevMessages.some(
                  (msg) =>
                    (msg.id && msg.id === messageData.id) ||
                    (msg.text === messageData.content &&
                      msg.sender === (isBot ? "bot" : "user")),
                );

                if (!messageExists) {
                  console.log(
                    `Adding message to UI: ${messageData.content} from ${isBot ? "bot" : "user"}`,
                  );
                  return [
                    ...prevMessages,
                    {
                      id: messageData.id || `msg-${Date.now()}`,
                      text: messageData.content,
                      sender: isBot ? "bot" : "user",
                      timestamp: messageData.timestamp
                        ? new Date(messageData.timestamp)
                        : new Date(),
                    },
                  ];
                } else {
                  console.log(
                    `Message already exists in UI: ${messageData.content}`,
                  );
                }
                return prevMessages;
              });
            }
          });
        }
      } catch (error) {
        console.error("Error connecting to socket:", error);
        Alert.alert(
          "Connection Error",
          "Failed to connect to chat server. Some features may not work properly.",
        );
      }
    };

    // Setup event listeners for socket state changes
    const onReconnected = () => {
      console.log("SOCKET RECONNECTED - Clearing timeouts and indicators");
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
        messageTimeoutRef.current = null;
      }

      // Remove typing indicators
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => !msg.id.startsWith("typing")),
      );

      // Ensure we are in the right room
      if (chatId) {
        socketManager.joinRoom(chatId);
      }
    };

    const onAuthenticated = () => {
      console.log("SOCKET AUTHENTICATED");
      // Clear timeouts here too as a safety measure
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
        messageTimeoutRef.current = null;
      }
    };

    // Register event listeners
    socketManager.events.on("reconnected", onReconnected);
    socketManager.events.on("authenticated", onAuthenticated);
    socketManager.events.on("connected", onReconnected);

    connectToSocket();

    // Setup periodic check for socket connection
    const connectionCheckInterval = setInterval(() => {
      if (!socketManager.isConnected() && chatId) {
        console.log("Socket disconnected, attempting to reconnect...");
        connectToSocket();
      }
    }, 10000); // Check every 10 seconds

    // Cleanup socket connection on unmount
    return () => {
      clearInterval(connectionCheckInterval);
      // Remove event listeners
      socketManager.events.off("reconnected", onReconnected);
      socketManager.events.off("authenticated", onAuthenticated);
      socketManager.events.off("connected", onReconnected);

      socketManager.offMessage(); // Remove message listener

      // Only disconnect if not using socket elsewhere
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
        messageTimeoutRef.current = null;
      }
    };
  }, [route.params?.chatId, chatId]);

  // Update sendMessage to use the API structure
  const sendMessage = async (text: string, imageUri?: string) => {
    try {
      console.log("Attempting to send message...");

      // Ensure we have a valid chat ID
      if (!chatId) {
        console.error("Cannot send message: No valid chat ID");
        return;
      }

      // Check if socket is connected, attempt to connect if not
      if (!socketManager.isConnected()) {
        console.log(
          "Socket not connected, attempting to connect before sending...",
        );
        try {
          await socketManager.connect();
          socketManager.joinRoom(chatId);
          setSocketConnected(true);
        } catch (socketError) {
          console.error("Failed to connect socket:", socketError);
          Alert.alert(
            "Connection Error",
            "Cannot connect to chat server. Please check your connection and try again.",
          );
          return;
        }
      }

      const newMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        text,
        sender: "user",
        timestamp: new Date(),
      };

      // Add user message to the UI immediately
      setMessages((prevMessages) => [...prevMessages, newMessage]);

      // Clear any existing timeouts
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }

      // Store message in AsyncStorage if we have a valid chat ID
      if (chatId) {
        try {
          // Add the message to chat history in AsyncStorage
          const chatHistory = await AsyncStorage.getItem(`chat_${chatId}`);
          const messages = chatHistory ? JSON.parse(chatHistory) : [];
          messages.push(newMessage);
          await AsyncStorage.setItem(
            `chat_${chatId}`,
            JSON.stringify(messages),
          );
        } catch (storageError) {
          console.error("Failed to save message to storage:", storageError);
        }
      }

      console.log(`Sending message to room ${chatId}`);

      // Add typing indicator
      const typingIndicator: ChatMessage = {
        id: `typing-${Date.now()}`,
        text: "...",
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prevMessages) => [...prevMessages, typingIndicator]);

      // Format the message according to the API structure
      const apiMessage = {
        content: text,
        chatId: chatId,
      };

      // Send the message via socket
      if (imageUri) {
        console.log("Sending message with image:", { text, imageUri });
        const base64Data = await getBase64FromUri(imageUri);
        if (!base64Data) {
          console.error("Failed to get image data for message");
          return;
        }

        socketManager.sendMessage(
          JSON.stringify({
            text,
            image: base64Data,
            chatId,
            type: "image",
          }),
        );
      } else {
        console.log("Sending text message:", text);
        socketManager.sendMessage(text);
      }

      // Set a timeout to detect if no response comes back
      messageTimeoutRef.current = setTimeout(() => {
        console.log("Message response timeout reached (30s)");

        // Remove typing indicators
        setMessages((prevMessages) =>
          prevMessages.filter((msg) => !msg.id.startsWith("typing")),
        );

        // Add a system message indicating the timeout
        const timeoutMessage: ChatMessage = {
          id: `timeout-${Date.now()}`,
          text: "The server is taking longer than expected to respond. Please wait or try again later.",
          sender: "bot",
          timestamp: new Date(),
        };

        setMessages((prevMessages) => [...prevMessages, timeoutMessage]);

        // Clear the timeout ref
        messageTimeoutRef.current = null;

        // Try to reconnect the socket - use connect() instead of reconnect()
        socketManager.connect().catch((error) => {
          console.error("Failed to reconnect socket after timeout:", error);
        });
      }, 30000); // 30 second timeout
    } catch (error) {
      console.error("Error sending message:", error);
      Alert.alert("Error", "Failed to send message. Please try again.");
    }
  };

  // Use effect to maintain scroll position after loading more messages
  useEffect(() => {
    if (isLoadingMoreMessages && !isLoadingMessages) {
      // Reset flag after a short delay to ensure messages are rendered
      setTimeout(() => {
        setIsLoadingMoreMessages(false);
      }, 500);
    }
  }, [isLoadingMessages, isLoadingMoreMessages]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.logo}>
            <Logo />
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate("Home")}
            style={{ padding: 10 }}
          >
            <Icon name="edit" type="feather" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Show load more button when at top and has more messages */}
        {isAtTop && hasMoreMessages && (
          <TouchableOpacity
            style={[
              styles.loadMoreButton,
              isLoadingMessages && styles.loadMoreButtonLoading,
            ]}
            onPress={handleLoadMoreMessages}
            disabled={isLoadingMessages}
          >
            {isLoadingMessages ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Icon name="chevron-up" type="feather" size={20} color="#fff" />
                <Text style={styles.loadMoreText}>Load more messages</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {isLoadingMessages && messagePage > 1 && !isAtTop && (
          <ActivityIndicator
            size="small"
            color="#95ff77"
            style={styles.loadingIndicator}
          />
        )}

        <FlatList
          showsVerticalScrollIndicator={false}
          ref={flatListRef}
          data={messages}
          renderItem={({ item }) => (
            <RenderChat
              item={item as any}
              loadingStates={loadingStates}
              setLoadingStates={setLoadingStates}
            />
          )}
          keyExtractor={(item) => item.id}
          style={styles.chatBox}
          onContentSizeChange={() =>
            !isUserScrolling && !isLoadingMoreMessages && scrollToBottom()
          }
          onLayout={() =>
            !isUserScrolling && !isLoadingMoreMessages && scrollToBottom()
          }
          onScrollBeginDrag={() => setIsUserScrolling(true)}
          onScroll={(event) => {
            const currentY = event.nativeEvent.contentOffset.y;
            setScrollY(currentY);
            setIsAtTop(currentY < 20);
          }}
          onMomentumScrollEnd={() => {
            setIsUserScrolling(false); // Re-enable auto-scroll when user stops
          }}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
          onEndReachedThreshold={0.1}
          inverted={false}
        />

        {selectedImage && (
          <View style={styles.selectedImageContainer}>
            <Image
              source={{ uri: selectedImage }}
              style={styles.selectedImagePreview}
            />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => setSelectedImage(null)}
            >
              <Icon name="x" type="feather" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.attachButton}
            onPress={() => setShowMediaOptions(true)}
          >
            <Icon name="paperclip" type="feather" size={24} color="#fff" />
          </TouchableOpacity>

          <TextInput
            style={[styles.input, selectedImage && styles.inputWithImage]}
            value={inputText}
            onChangeText={setInputText}
            placeholder={
              selectedImage ? "Add a caption..." : "Type your message..."
            }
            placeholderTextColor="#aaa"
          />

          {!isRecording && inputText.trim() ? (
            <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
              <Icon name="send" size={24} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={isRecording ? stopRecording : startRecording}
              style={[styles.sendButton, isRecording && styles.recordingButton]}
            >
              <Icon
                name="mic"
                type="feather"
                size={24}
                color={isRecording ? "#FF4444" : "#fff"}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Media options modal */}
        <Modal
          transparent={true}
          visible={showMediaOptions}
          animationType="slide"
          onRequestClose={() => setShowMediaOptions(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowMediaOptions(false)}
          >
            <View style={styles.modalContent}>
              <TouchableOpacity style={styles.modalOption} onPress={takePhoto}>
                <Icon name="camera" type="feather" size={24} color="#fff" />
                <Text style={styles.modalOptionText}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalOption} onPress={pickImage}>
                <Icon name="image" type="feather" size={24} color="#fff" />
                <Text style={styles.modalOptionText}>Choose from Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalOption, styles.cancelOption]}
                onPress={() => setShowMediaOptions(false)}
              >
                <Text style={[styles.modalOptionText, styles.cancelText]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  chatImage: {
    width: "100%",
    maxWidth: 300,
    height: undefined,
    aspectRatio: 16 / 9,
    borderRadius: 8,
    marginTop: 5,
    alignSelf: "flex-start",
    resizeMode: "cover",
  },

  logo: {
    flex: 1,
    alignItems: "center",
    paddingLeft: 16,
  },

  animation: {
    width: 50,
    height: 50,
  },
  youtubeContainer: {
    flexDirection: "column",
    alignItems: "flex-start",
    marginVertical: 5,
  },
  youtubeThumbnailContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  youtubeThumbnail: {
    width: "100%", // Makes it responsive
    aspectRatio: 16 / 9, // Ensures proper YouTube thumbnail aspect ratio
    borderRadius: 8,
    marginTop: 5,
    resizeMode: "cover", // Ensures the image covers the entire area
  },
  youtubePlayButton: {
    position: "absolute",
    top: "48%",
    left: "45%",
    transform: [{ translateX: -15 }, { translateY: -15 }],
    backgroundColor: "#FF0000",
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  playButtonText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "#1a1c1b",
    alignItems: "center",
  },
  title: {
    fontFamily: "Aeonik",
    fontSize: 20,
    color: "#fff",
    marginTop: 8,
    marginBottom: 8,
  },
  chatBox: {
    flexGrow: 1,
    width: "100%",
  },
  messageContainer: {
    padding: 10,
    marginVertical: 5,
    borderRadius: 16,
  },
  userMessage: {
    fontFamily: "Aeonik",
    alignSelf: "flex-end",
    backgroundColor: "#fff",
  },
  botMessage: {
    fontFamily: "Aeonik",
    alignSelf: "flex-start",
    backgroundColor: "#95ff77",
  },
  messageText: {
    fontFamily: "Aeonik",
    fontSize: 16,
    color: "#1a1c1b",
  },
  boldText: {
    fontFamily: "Aeonik",
    fontSize: 16,
  },
  imageContainer: {
    flexWrap: "wrap",
  },
  typingText: {
    fontFamily: "Aeonik",
    fontSize: 16,
    color: "#2a2e2e",
    fontStyle: "italic",
  },
  typingContainer: {
    padding: 10,
    marginVertical: 5,
    borderRadius: 16,
    backgroundColor: "#95ff77", // Same color as bot messages
    maxWidth: "80%",
  },
  linkContainer: {
    marginVertical: 5,
  },
  link: {
    zIndex: 100,
    fontFamily: "Aeonik",
    fontSize: 16,
    color: "#0066cc", // Blue color for links
    textDecorationLine: "underline", // Underline for links
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 60,
    borderColor: "#444",
    marginBottom: 5,
    marginTop: 10,
    width: "100%",
    position: "relative",
  },
  input: {
    flex: 1,
    padding: 15,
    paddingLeft: 50,
    paddingRight: 50,
    borderWidth: 1,
    height: 60,
    borderColor: "#555",
    borderRadius: 16,
    color: "#fff",
    backgroundColor: "#1a1c1b",
    fontFamily: "Aeonik",
    fontSize: 16,
  },
  inputWithImage: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  attachButton: {
    padding: 12,
    position: "absolute",
    left: 10,
    zIndex: 1,
  },
  sendButton: {
    padding: 12,
    position: "absolute",
    right: 10,
    zIndex: 1,
  },
  recordingButton: {
    backgroundColor: "rgba(255, 68, 68, 0.2)",
    borderRadius: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#2a2e2e",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
  },
  modalOptionText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 16,
    fontFamily: "Aeonik",
  },
  cancelOption: {
    justifyContent: "center",
    borderBottomWidth: 0,
    marginTop: 10,
  },
  cancelText: {
    color: "#FF4444",
    textAlign: "center",
    fontSize: 16,
    marginLeft: 0,
  },
  selectedImageContainer: {
    width: "100%",
    backgroundColor: "#333",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    position: "relative",
  },
  selectedImagePreview: {
    height: 100,
    width: "100%",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    resizeMode: "contain",
  },
  removeImageButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  loadMoreButton: {
    flexDirection: "row",
    backgroundColor: "#2a2e2e",
    padding: 10,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
    alignSelf: "center",
  },
  loadMoreButtonLoading: {
    backgroundColor: "#444",
    opacity: 0.7,
  },
  loadMoreText: {
    color: "#fff",
    marginLeft: 5,
    fontFamily: "Aeonik",
  },
  loadingIndicator: {
    marginVertical: 10,
  },
});

export default ChatScreen;
