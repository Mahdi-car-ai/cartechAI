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
import { getChatMessages, Message as ApiMessage } from "@/utils/Chat";
import { ChatMessage } from "@/types/chat";
import { API_URL } from "@/constants/Environment";

type ChatScreenRouteProp = RouteProp<RootStackParamList, "ChatScreen">;
type NavigationProp = StackNavigationProp<RootStackParamList>;

const ChatScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const flatListRef = useRef<FlatList<ChatMessage> | null>(null);
  const route = useRoute<ChatScreenRouteProp>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);

  const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [messagePage, setMessagePage] = useState<number>(1);
  const [hasMoreMessages, setHasMoreMessages] = useState<boolean>(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const messagesPerPage = 10;

  const [isAtTop, setIsAtTop] = useState<boolean>(false);

  const [isLoadingMoreMessages, setIsLoadingMoreMessages] =
    useState<boolean>(false);

  /**
   * Prepare image for upload, handling different formats
   */
  const prepareImageForUpload = (uri: string): { uri: string; type: string; name: string } => {
    // Convert file extension to lowercase for easier checking
    const lowercaseUri = uri.toLowerCase();
    
    // Extract filename from URI
    let filename = uri.split("/").pop() || "image.jpg";
    
    // Determine type based on extension
    let mimeType = "image/jpeg"; // Default mime type
    
    // Check for known image formats
    if (lowercaseUri.endsWith(".png")) {
      mimeType = "image/png";
    } else if (lowercaseUri.endsWith(".gif")) {
      mimeType = "image/gif";
    } else if (lowercaseUri.endsWith(".webp")) {
      mimeType = "image/webp";
    } else if (lowercaseUri.endsWith(".heic") || lowercaseUri.endsWith(".heif")) {
      // For HEIC images, we'll force the extension to be .jpg since 
      // most servers can't handle HEIC files directly
      mimeType = "image/jpeg";
      filename = filename.replace(/\.heic|\.heif/i, ".jpg");
    }
    
    // Log what we're doing with the image
    console.log(`Preparing image: ${uri}`);
    console.log(`Filename: ${filename}, Type: ${mimeType}`);
    
    return {
      uri,
      name: filename,
      type: mimeType
    };
  };

  const handleImageMessage = async (imageUri: string, text: string) => {
    if (!chatId) {
      console.error("Chat ID is missing. Cannot store messages.");
      return;
    }

    try {
      // Prepare the image for upload
      const imageFile = prepareImageForUpload(imageUri);
      
      // Create form data - make sure we're using the right field name expected by the server
      const formData = new FormData();
      
      console.log(`Creating form data with image: ${imageFile.uri}`);
      console.log(`Field name: file, filename: ${imageFile.name}, type: ${imageFile.type}`);
      
      // @ts-ignore - FormData expects a Blob but React Native uses objects
      formData.append("file", {
        uri: imageFile.uri,
        name: imageFile.name,
        type: imageFile.type,
      });

      // Add text message to form data if needed
      if (text.trim()) {
        formData.append("message", text);
        console.log(`Added message to form data: ${text}`);
      }

      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        text: text || "Image",
        sender: "user",
        type: "image",
      };

      setMessages((prevMessages) => [...prevMessages, newMessage]);

      console.log(`Uploading image to: ${API_URL}/upload/message/${chatId}`);
      
      // Make the API request
      const response = await fetch(`${API_URL}/upload/message/${chatId}`, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
          "Accept": "application/json",
        },
      });

      // Log full response details for debugging
      console.log(`Upload response status: ${response.status}`);
      const responseText = await response.text();
      console.log(`Upload response body: ${responseText}`);

      if (!response.ok) {
        throw new Error(`Failed to upload image: ${response.status} ${response.statusText}`);
      }

      let responseData;
      try {
        responseData = JSON.parse(responseText);
        console.log("Image upload response:", responseData);
      } catch (e) {
        console.log("Response is not JSON, using text response");
      }

      // Clear the image and text after successful upload
      setSelectedImage(null);
      setInputText("");

      // Send text message separately if needed (server might expect it this way)
      if (text.trim() && socketConnected && socketManager.isConnected()) {
        socketManager.sendMessage(text);
      }

      const typingId = `typing-${Date.now()}`;
      const typingMessage: ChatMessage = {
        id: typingId,
        text: "CarTechAI is analyzing your image...",
        sender: "bot",
      };
      setMessages((prevMessages) => [...prevMessages, typingMessage]);

      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }

      messageTimeoutRef.current = setTimeout(() => {
        setMessages((prevMessages) => {
          const typingExists = prevMessages.some((msg) => msg.id === typingId);

          if (typingExists) {
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
      }, 15000);
    } catch (error) {
      console.error("Error uploading image:", error);
      Alert.alert("Error", "Failed to upload image. Please try again.");
    }
  };

  useEffect(() => {
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const onSpeechStart = () => {
    console.log("Speech recognition started");
  };

  const onSpeechEnd = () => {
    setIsRecording(false);
    console.log("Speech recognition ended");
  };

  const onSpeechResults = (e: any) => {
    const text = e.value && e.value.length > 0 ? e.value[0] : "";
    setInputText(text);
    console.log("Speech results:", text);
  };

  const onSpeechError = (e: any) => {
    console.error("Speech recognition error:", e);
    setIsRecording(false);
    Alert.alert("Speech Recognition Error", "Please try again.");
  };

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

  const stopRecording = async () => {
    try {
      await Voice.stop();
      setIsRecording(false);
    } catch (e) {
      console.error("Error stopping voice recognition:", e);
    }
  };

  const takePhoto = async () => {
    setShowMediaOptions(false);

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
        // Add additional options for image compatibility
        exif: false
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
        // No special options needed as we'll handle the formats in prepareImageForUpload
        exif: false
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Could not pick image. Please try again.");
    }
  };

  useEffect(() => {
    if (chatId) {
      fetchMessages(chatId);
    }
  }, [chatId]);

  const fetchMessages = async (chatId: string, page: number = 1) => {
    try {
      setIsLoadingMessages(true);
      const response = await getChatMessages(chatId, page, messagesPerPage);

      const apiMessages = response.messages;
      setHasMoreMessages(page * messagesPerPage < response.total);

      const formattedMessages = apiMessages.map(
        (msg: ApiMessage): ChatMessage => {
          const message: ChatMessage = {
            id: msg.id,
            text: msg.content,
            sender:
              msg.senderId === "00000000-0000-0000-0000-000000000000"
                ? "bot"
                : "user",
            timestamp: new Date(msg.timestamp),
            type: msg.type,
          };

          return message;
        },
      );

      if (page === 1) {
        setMessages(formattedMessages);
      } else {
        setIsLoadingMoreMessages(true);

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

  const handleLoadMoreMessages = () => {
    if (hasMoreMessages && !isLoadingMessages && chatId && isAtTop) {
      setIsLoadingMoreMessages(true);
      fetchMessages(chatId, messagePage + 1);
    }
  };

  useEffect(() => {
    const initChat = async () => {
      try {
        if (!socketManager.isConnected()) {
          console.log(
            "Socket not connected during initChat, connecting first...",
          );
          await socketManager.connect();
          await new Promise((resolve) => setTimeout(resolve, 300));
        }

        if (!chatId && !route.params?.chatId) {
          console.log("Creating new chat session...");
          const tempChatId = "chat-" + Date.now().toString();

          setMessages([]);

          setChatId(tempChatId);

          console.log(`New chat created with ID: ${tempChatId}`);

          if (socketManager.isConnected()) {
            console.log(`Socket is connected, joining new room: ${tempChatId}`);
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
          const existingChatId = route.params.chatId;

          if (chatId !== existingChatId) {
            console.log(`Changing chat from ${chatId} to ${existingChatId}`);
            setMessages([]);
          }

          setChatId(existingChatId);

          if (socketManager.isConnected()) {
            console.log(
              `Socket is connected, joining existing room: ${existingChatId}`,
            );
            setTimeout(() => {
              socketManager.joinRoom(existingChatId);
            }, 500);
          } else {
            console.log(
              "Socket not connected, will join room when socket connects",
            );
          }
        }

        setSocketConnected(socketManager.isConnected());
      } catch (error) {
        console.error("Error in initChat:", error);
      }
    };

    initChat();
  }, [chatId, route.params?.chatId]);

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

  const scrollToBottom = () => {
    if (flatListRef.current && !isLoadingMoreMessages) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 50);
    }
  };

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

    return () => {};
  }, []);

  const handleSend = async () => {
    if (!inputText.trim() && !selectedImage) return;

    if (selectedImage) {
      await handleImageMessage(selectedImage, inputText);
      setSelectedImage(null);
      setInputText("");
      return;
    }

    if (!socketManager.isConnected()) {
      console.log(
        "Socket not connected. Reconnecting before sending message...",
      );
      try {
        await socketManager.connect();
        if (chatId) {
          socketManager.joinRoom(chatId);
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

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText,
      sender: "user",
    };

    if (!chatId) {
      console.error("Chat ID is missing. Cannot store messages.");
      return;
    }

    const currentMessage = inputText;
    console.log(`Sending message: "${currentMessage}"`);

    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setInputText("");

    if (socketConnected && socketManager.isConnected()) {
      socketManager.sendMessage(inputText);

      const typingId = `typing-${Date.now()}`;
      const typingMessage: ChatMessage = {
        id: typingId,
        text: "CarTechAI is analyzing...",
        sender: "bot",
      };
      setMessages((prevMessages) => [...prevMessages, typingMessage]);

      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
        messageTimeoutRef.current = null;
      }

      const checkForResponse = () => {
        console.log(`Checking timeout for message: "${currentMessage}"`);
        setMessages((prevMessages) => {
          const typingExists = prevMessages.some((msg) => msg.id === typingId);

          if (typingExists) {
            console.log(
              "No response received within timeout period, showing error message",
            );
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

      messageTimeoutRef.current = setTimeout(checkForResponse, 30000);
    } else {
      Alert.alert(
        "Connection Error",
        "Failed to send message. Please check your connection and try again.",
      );
    }
  };

  useEffect(() => {
    if (!isUserScrolling) {
      scrollToBottom();
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
        messageTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (socketConnected) {
      console.log(
        "Socket connected/reconnected - clearing any pending timeouts",
      );
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
        messageTimeoutRef.current = null;
      }

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

  useEffect(() => {
    const connectToSocket = async () => {
      try {
        if (!socketManager.isConnected()) {
          console.log("Connecting to socket in main useEffect");
          await socketManager.connect();
        }

        setSocketConnected(true);
        console.log(`Chat ID from route: ${route.params?.chatId}`);

        if (route.params?.chatId) {
          console.log(`Joining room: ${route.params.chatId}`);
          socketManager.joinRoom(route.params.chatId);

          socketManager.offMessage();

          socketManager.onMessage((messageData) => {
            console.log("Received socket message:", messageData);

            if (messageTimeoutRef.current) {
              console.log("Clearing timeout - response received");
              clearTimeout(messageTimeoutRef.current);
              messageTimeoutRef.current = null;
            }

            if (messageData.senderId) {
              const isBot =
                messageData.senderId === "00000000-0000-0000-0000-000000000000";

              if (isBot) {
                console.log(
                  "Removing typing indicators - bot message received",
                );
                setMessages((prevMessages) => {
                  const updatedMessages = prevMessages.filter(
                    (msg) => !msg.id.startsWith("typing"),
                  );

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

              setMessages((prevMessages) => {
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

    const onReconnected = () => {
      console.log("SOCKET RECONNECTED - Clearing timeouts and indicators");
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
        messageTimeoutRef.current = null;
      }

      setMessages((prevMessages) =>
        prevMessages.filter((msg) => !msg.id.startsWith("typing")),
      );

      if (chatId) {
        socketManager.joinRoom(chatId);
      }
    };

    const onAuthenticated = () => {
      console.log("SOCKET AUTHENTICATED");
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
        messageTimeoutRef.current = null;
      }
    };

    socketManager.events.on("reconnected", onReconnected);
    socketManager.events.on("authenticated", onAuthenticated);
    socketManager.events.on("connected", onReconnected);

    connectToSocket();

    const connectionCheckInterval = setInterval(() => {
      if (!socketManager.isConnected() && chatId) {
        console.log("Socket disconnected, attempting to reconnect...");
        connectToSocket();
      }
    }, 10000);

    return () => {
      clearInterval(connectionCheckInterval);
      socketManager.events.off("reconnected", onReconnected);
      socketManager.events.off("authenticated", onAuthenticated);
      socketManager.events.off("connected", onReconnected);

      socketManager.offMessage();

      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
        messageTimeoutRef.current = null;
      }
    };
  }, [route.params?.chatId, chatId]);

  useEffect(() => {
    if (isLoadingMoreMessages && !isLoadingMessages) {
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
            setIsAtTop(currentY < 20);
          }}
          onMomentumScrollEnd={() => {
            setIsUserScrolling(false);
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

          {!isRecording && (inputText.trim() || selectedImage) ? (
            <TouchableOpacity
              onPress={handleSend}
              style={[
                styles.sendButton,
                selectedImage && styles.imageSelectedSendButton,
              ]}
            >
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
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 8,
    marginTop: 5,
    resizeMode: "cover",
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
    backgroundColor: "#95ff77",
    maxWidth: "80%",
  },
  linkContainer: {
    marginVertical: 5,
  },
  link: {
    zIndex: 100,
    fontFamily: "Aeonik",
    fontSize: 16,
    color: "#0066cc",
    textDecorationLine: "underline",
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
  imageSelectedSendButton: {
    backgroundColor: "#95ff77",
    borderRadius: 20,
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
