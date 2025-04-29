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

  // Add timeout reference for message response
  const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  useEffect(() => {
    const initChat = async () => {
      if (!chatId && !route.params?.chatId) {
        // Create chat through socket instead of Firebase
        if (socketConnected && socketManager.isConnected()) {
          // TODO: Implement chat creation through your backend
          // For now, we'll use a temporary ID
          const tempChatId = "chat-" + Date.now().toString();

          // Clear messages when creating a new chat
          setMessages([]);
          setConversationHistory([]);

          setChatId(tempChatId);

          // Join the chat room
          socketManager.joinRoom(tempChatId);

          // First message from bot will come through the socket connection
        }
      } else if (route.params?.chatId) {
        // Clear previous messages when changing chat
        if (chatId !== route.params.chatId) {
          setMessages([]);
          setConversationHistory([]);
        }

        setChatId(route.params.chatId);
        // If we have a chat ID, we'll join the room and previous messages
        // will be loaded through socket connection
      }
    };

    initChat();
  }, [chatId, route.params?.chatId, socketConnected]);

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
    if (flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 50);
    }
  };

  // Connect to socket when component mounts
  useEffect(() => {
    const connectToSocket = async () => {
      try {
        await socketManager.connect();
        setSocketConnected(true);

        if (route.params?.chatId) {
          socketManager.joinRoom(route.params.chatId);

          // Clear any existing message listeners before adding new ones
          socketManager.offMessage();

          // Listen for socket messages
          socketManager.onMessage((messageData) => {
            console.log("Received socket message:", messageData);

            // Clear any pending timeout when we receive a message
            if (messageTimeoutRef.current) {
              clearTimeout(messageTimeoutRef.current);
              messageTimeoutRef.current = null;
            }

            // If the message is from the bot (senderId is 00000000-0000-0000-0000-000000000000)
            if (
              messageData.senderId === "00000000-0000-0000-0000-000000000000"
            ) {
              // Remove typing indicator if exists
              setMessages((prevMessages) =>
                prevMessages.filter((msg) => !msg.id.startsWith("typing")),
              );

              // Add message to state if it's not already there
              setMessages((prevMessages) => {
                const messageExists = prevMessages.some(
                  (msg) =>
                    msg.id === messageData.id ||
                    (msg.text === messageData.content && msg.sender === "bot"),
                );

                if (!messageExists) {
                  return [
                    ...prevMessages,
                    {
                      id: messageData.id || Date.now().toString(),
                      text: messageData.content,
                      sender: "bot",
                      timestamp: messageData.timestamp
                        ? new Date(messageData.timestamp)
                        : new Date(),
                    },
                  ];
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

    connectToSocket();

    // Cleanup socket connection on unmount
    return () => {
      socketManager.offMessage(); // Remove message listener
      socketManager.disconnect();
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
    };
  }, [route.params?.chatId]);

  // Load previous messages when chat ID changes
  useEffect(() => {
    const loadPreviousMessages = async () => {
      if (!chatId || !socketConnected) return;

      try {
        // Request previous messages from the server
        // This assumes your socket service has a method to request chat history
        // If it doesn't, you'll need to implement this on the backend and client
        if (socketManager.isConnected()) {
          // Request chat history from socket/backend
          socketManager.emit("getChatHistory", { chatId });

          // You should handle the response in the onMessage listener
          // by adding a specific handler for history messages
          socketManager.once(
            "chatHistory",
            (historyData: {
              messages: Array<{
                id?: string;
                content: string;
                senderId?: string;
                timestamp?: string;
              }>;
            }) => {
              if (historyData && Array.isArray(historyData.messages)) {
                const formattedMessages = historyData.messages.map((msg) => ({
                  id: msg.id || Date.now().toString(),
                  text: msg.content,
                  sender:
                    msg.senderId === "00000000-0000-0000-0000-000000000000"
                      ? "bot"
                      : "user",
                  timestamp: msg.timestamp
                    ? new Date(msg.timestamp)
                    : new Date(),
                }));

                setMessages(formattedMessages);
                setConversationHistory(formattedMessages);
              }
            },
          );
        }
      } catch (error) {
        console.error("Error loading previous messages:", error);
      }
    };

    loadPreviousMessages();
  }, [chatId, socketConnected]);

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
                    text: "Sorry, I didn't receive a response from the server. Please try again.",
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
      }
    };
  }, []);

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

        <FlatList
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
          onContentSizeChange={() => !isUserScrolling && scrollToBottom()}
          onLayout={() => !isUserScrolling && scrollToBottom()}
          onScrollBeginDrag={() => setIsUserScrolling(true)}
          onMomentumScrollEnd={() => setIsUserScrolling(false)} // Re-enable auto-scroll when user stops
          keyboardShouldPersistTaps="handled"
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
});

export default ChatScreen;
