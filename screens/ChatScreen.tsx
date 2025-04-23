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
import {
  createChat,
  addMessage,
  getChats,
  getMessagesByChatId,
} from "../utils/Chat";
import { RootStackParamList } from "@/types/NavigationTypes";
import { CarDetails } from "@/types/CarDetails";
import * as ImagePicker from "expo-image-picker";
import Voice from "@react-native-voice/voice";

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

const OPENAI_API_KEY =
  "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";

const SERPAPI_KEY =
  "2c464ccd6bf9d342cd364f66bf1c68c87f2053a15f7e4e36cb1fa3af0c36af77";

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
  const [chatId, setChatId] = useState<string | null>("0SYzBsl57w2sDYRQHrEK");
  const carName = `${carDetails?.Make || ""} ${carDetails?.Model || ""} - ${carDetails?.["Model Year"] || ""}`;
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedText, setRecordedText] = useState("");

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
        await handleImageMessage(result.assets[0].uri);
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
        await handleImageMessage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Could not pick image. Please try again.");
    }
  };

  // Handle sending image message
  const handleImageMessage = async (imageUri: string) => {
    if (!chatId) {
      console.error("Chat ID is missing. Cannot store messages.");
      return;
    }

    // Create a message with the image
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text: "Image",
      sender: "user",
      images: [imageUri],
    };

    // Add to UI
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setConversationHistory((prevHistory) => [...prevHistory, newMessage]);

    // Store in Firebase (modify your addMessage function to handle image uploads if needed)
    try {
      await addMessage(chatId, "user", "Image", [imageUri]);

      // Now send a follow-up typing indicator and get AI response
      setIsTyping(true);
      const typingMessage: ChatMessage = {
        id: "typing",
        text: "CarTechAI is analyzing your image...",
        sender: "bot",
      };
      setMessages((prevMessages) => [...prevMessages, typingMessage]);

      // Handle AI response to image (similar to handleSend but for image processing)
      // This is a simplified version - you may need to expand this
      setTimeout(async () => {
        try {
          // Create AI response for the image
          const aiResponse =
            "I've received your image. Can you tell me more about what you're seeing?";

          await addMessage(chatId, "CarTechAI", aiResponse);

          setMessages((prevMessages) => [
            ...prevMessages.filter((msg) => msg.id !== "typing"),
            {
              id: Date.now().toString(),
              text: aiResponse,
              sender: "bot",
            },
          ]);
        } catch (error) {
          console.error("Error creating AI response for image:", error);
          setMessages((prevMessages) => [
            ...prevMessages.filter((msg) => msg.id !== "typing"),
            {
              id: Date.now().toString(),
              text: "Error: Unable to process your image. Please try again.",
              sender: "bot",
            },
          ]);
        } finally {
          setIsTyping(false);
        }
      }, 1500);
    } catch (error) {
      console.error("Error sending image:", error);
      Alert.alert("Error", "Failed to send image. Please try again.");
    }
  };

  useEffect(() => {
    const initChat = async () => {
      if (!chatId && !route.params?.chatId) {
        const createdChatId = await createChat(carName);
        if (createdChatId) {
          setChatId("0SYzBsl57w2sDYRQHrEK");

          // First message from bot
          const firstMessage: ChatMessage = {
            id: Date.now().toString(),
            sender: "bot",
            message: `Hello! I am CarTechAI. How can I assist you with your car:\n${carDetails?.Make || ""} ${carDetails?.Model || ""} - ${carDetails?.["Model Year"] || ""}?`,
            timestamp: new Date(), // Optional: Firestore uses serverTimestamp() automatically
          };

          // Save message to Firestore
          const messageId = await addMessage(
            createdChatId,
            firstMessage.sender,
            firstMessage.message || "",
          );
          if (messageId) {
            setMessages([{ ...firstMessage, id: messageId }]);
          }
        }
      } else if (route.params?.chatId) {
        setChatId("0SYzBsl57w2sDYRQHrEK");
        const fetchedMessages = await getMessagesByChatId(route.params.chatId);
        if (fetchedMessages && Array.isArray(fetchedMessages)) {
          setMessages(fetchedMessages as ChatMessage[]);
        }
      }
    };

    initChat();
  }, [chatId, route.params?.chatId]);

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

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText,
      sender: "user",
    };

    if (!chatId) {
      console.error("Chat ID is missing. Cannot store messages.");
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText,
      sender: "user",
    };

    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setConversationHistory((prevHistory) => [...prevHistory, newMessage]); // Store in history
    setInputText("");
    setIsTyping(true);

    await addMessage(chatId, "user", inputText);

    const typingMessage: ChatMessage = {
      id: "typing",
      text: "CarTechAI is analyzing...",
      sender: "bot",
    };
    setMessages((prevMessages) => [...prevMessages, typingMessage]);

    setTimeout(async () => {
      try {
        // Fetch AI response
        const response = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              max_tokens: 150,
              messages: [
                {
                  role: "system",
                  content: `You are CarTechAI, an AI automotive mechanic. 
                  User's car details: ${JSON.stringify(carDetails)}. 
                  ONLY respond to automobile-related issues. 
                  Ignore non-automotive questions entirely. 
                  Keep responses **concise**.
                  `,
                },
                ...conversationHistory.map((msg) => ({
                  role: msg.sender === "user" ? "user" : "assistant",
                  content: msg.text || "",
                })),
                { role: "user", content: inputText },
              ],
            }),
          },
        );

        const data = await response.json();
        const aiResponse =
          data?.choices?.[0]?.message?.content?.trim() ||
          "Sorry, I could not understand that.";

        let images: string[] = [];
        let youtubeVideo = null;

        images = await fetchImagesFromSerpAPI(
          `${inputText} ${carDetails?.Make || ""} ${carDetails?.Model || ""} ${carDetails?.["Model Year"] || ""} parts images or official diagrams`,
        );

        youtubeVideo = await fetchYoutubeVideosFromSerpAPI(
          `${inputText} ${carDetails?.Make || ""} ${carDetails?.Model || ""} ${carDetails?.["Model Year"] || ""} videos`,
        );

        console.log(carDetails);

        await addMessage(chatId, "CarTechAI", aiResponse, images, youtubeVideo);

        // Typewriter effect for AI response
        const typeWriterEffect = (
          text: string,
          callback: (text: string) => void,
          completeCallback?: () => void,
        ) => {
          let index = 0;
          let typedText = "";

          const interval = setInterval(() => {
            if (index < text.length) {
              typedText += text.charAt(index);
              index++;
              callback(typedText);
            } else {
              clearInterval(interval);
              if (completeCallback) completeCallback();
            }
          }, 10);
        };

        // Remove typing indicator and add AI response
        setMessages((prevMessages) => [
          ...prevMessages.filter((msg) => msg.id !== "typing"),
          {
            id: Date.now().toString(),
            text: "",
            sender: "bot",
            images: [],
            youtubeVideo: null,
          },
        ]);

        typeWriterEffect(
          aiResponse,
          (updatedText) => {
            setMessages((prevMessages) =>
              prevMessages.map((msg, idx) =>
                idx === prevMessages.length - 1
                  ? { ...msg, text: updatedText }
                  : msg,
              ),
            );
          },
          () => {
            setMessages((prevMessages) =>
              prevMessages.map((msg, idx) =>
                idx === prevMessages.length - 1
                  ? { ...msg, images, youtubeVideo }
                  : msg,
              ),
            );
          },
        );
      } catch (error) {
        console.error("Error fetching AI response:", error);
        await addMessage(
          chatId,
          "CarTechAI",
          "Error: Unable to get a response. Please try again.",
        );

        setMessages((prevMessages) => [
          ...prevMessages.filter((msg) => msg.id !== "typing"),
          {
            id: Date.now().toString(),
            text: "Error: Unable to get a response. Please try again.",
            sender: "bot",
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    }, 50);
  };

  useEffect(() => {
    if (!isUserScrolling) {
      scrollToBottom();
    }
  }, [messages]); // Runs every time a new message is added

  const fetchYoutubeVideosFromSerpAPI = async (query: string) => {
    try {
      const searchQuery = [
        query,
        carDetails?.Make,
        carDetails?.Model,
        carDetails?.["Model Year"],
      ]
        .filter(Boolean)
        .join(" ");

      console.log(carDetails);

      const url = `https://serpapi.com/search.json?engine=youtube&search_query=${encodeURIComponent(
        searchQuery,
      )}&gl=us&hl=en&api_key=${SERPAPI_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.video_results && data.video_results.length > 0) {
        return data.video_results.slice(0, 1).map((video: any) => ({
          title: video.title,
          link: video.link + "&pp=ygU%3D",
          thumbnail:
            video.thumbnail?.static ||
            `https://img.youtube.com/vi/${
              video.link.split("v=")[1]
            }/hqdefault.jpg`, // Always use static image
        }))[0];
      }
    } catch (error) {}
    return null;
  };

  const fetchImagesFromSerpAPI = async (query: string) => {
    try {
      const response = await fetch(
        `https://serpapi.com/search.json?q=${encodeURIComponent(
          query,
        )}&location=United+States&hl=en&gl=us&google_domain=google.com&tbm=isch&api_key=${SERPAPI_KEY}`,
      );
      const data = await response.json();
      if (data.images_results && data.images_results.length > 0) {
        return data.images_results.slice(0, 3).map((img: any) => img.original);
      }
    } catch (error) {}
    return [];
  };

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

        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.attachButton}
            onPress={() => setShowMediaOptions(true)}
          >
            <Icon name="paperclip" type="feather" size={24} color="#fff" />
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your message..."
            placeholderTextColor="#aaa"
          />

          {inputText.trim() ? (
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
});

export default ChatScreen;
