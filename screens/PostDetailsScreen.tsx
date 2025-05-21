import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Icon } from "react-native-elements";
import Logo from "@/components/ui/Logo";
import {
  getChatMessages,
  getCommunityChat,
  Message,
  CommunityChat,
} from "@/utils/Community";
import socketManager from "@/services/SocketManager";

interface Response {
  id: string;
  content: string;
  senderId: string;
  timestamp: string;
  votes?: number;
}

type RootStackParamList = {
  PostDetailsScreen: { chatId: string };
  CommunityScreen: undefined;
  [key: string]: undefined | object;
};

type PostDetailsScreenRouteProp = RouteProp<
  RootStackParamList,
  "PostDetailsScreen"
>;
type NavigationProp = StackNavigationProp<RootStackParamList>;

const PostDetailsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<PostDetailsScreenRouteProp>();
  const { chatId } = route.params;

  const [chat, setChat] = useState<CommunityChat | null>(null);
  const [messages, setMessages] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const [responseText, setResponseText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const flatListRef = useRef<FlatList | null>(null);

  // Create a ref for timeout to track message response
  const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchChatDetails();
    fetchMessages();
    connectToSocket();

    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
        messageTimeoutRef.current = null;
      }
      socketManager.offMessage();
    };
  }, [chatId]);

  const connectToSocket = async () => {
    try {
      if (!socketManager.isConnected()) {
        console.log("Connecting to socket in PostDetailsScreen");
        await socketManager.connect();
      }

      setSocketConnected(true);
      console.log(`Joining room in PostDetailsScreen: ${chatId}`);
      socketManager.joinRoom(chatId);

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

          // If bot message, remove any typing indicators
          if (isBot) {
            console.log("Removing typing indicators - bot message received");
            setMessages((prevMessages) => {
              const updatedMessages = prevMessages.filter(
                (msg) => !msg.id.startsWith("typing")
              );

              const removedCount = prevMessages.length - updatedMessages.length;
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
                (msg.content === messageData.content &&
                  ((isBot &&
                    msg.senderId === "00000000-0000-0000-0000-000000000000") ||
                    (!isBot &&
                      msg.senderId !== "00000000-0000-0000-0000-000000000000")))
            );

            if (!messageExists) {
              console.log(
                `Adding message to UI: ${messageData.content} from ${
                  isBot ? "bot" : "user"
                }`
              );
              return [
                ...prevMessages,
                {
                  id: messageData.id || `msg-${Date.now()}`,
                  content: messageData.content || "",
                  senderId: messageData.senderId,
                  timestamp: messageData.timestamp || new Date().toISOString(),
                } as Response,
              ];
            } else {
              console.log(
                `Message already exists in UI: ${messageData.content}`
              );
            }
            return prevMessages;
          });
        }
      });

      // Set up event listeners
      const onReconnected = () => {
        console.log("SOCKET RECONNECTED - Clearing timeouts and indicators");
        if (messageTimeoutRef.current) {
          clearTimeout(messageTimeoutRef.current);
          messageTimeoutRef.current = null;
        }

        setMessages((prevMessages) =>
          prevMessages.filter((msg) => !msg.id.startsWith("typing"))
        );

        socketManager.joinRoom(chatId);
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

      // Check connection periodically
      const connectionCheckInterval = setInterval(() => {
        if (!socketManager.isConnected()) {
          console.log("Socket disconnected, attempting to reconnect...");
          connectToSocket();
        }
      }, 10000);

      return () => {
        clearInterval(connectionCheckInterval);
        socketManager.events.off("reconnected", onReconnected);
        socketManager.events.off("authenticated", onAuthenticated);
        socketManager.events.off("connected", onReconnected);
      };
    } catch (error) {
      console.error("Error connecting to socket:", error);
      setSocketConnected(false);
    }
  };

  const fetchChatDetails = async () => {
    setLoading(true);
    try {
      const communityChat = await getCommunityChat(chatId);

      if (communityChat) {
        setChat(communityChat);
      } else {
        Alert.alert("Error", "Chat not found.");
        navigation.goBack();
      }
    } catch (error) {
      console.error("Error fetching community chat:", error);
      Alert.alert("Error", "Unable to load chat details.");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (pageNum = 1) => {
    try {
      setLoading(true);
      const response = await getChatMessages(chatId, pageNum);

      const formattedMessages = response.messages.map(
        (msg): Response => ({
          id: msg.id,
          content: msg.content,
          senderId: msg.senderId,
          timestamp: msg.timestamp,
          votes: 0,
        })
      );

      if (pageNum === 1) {
        setMessages(formattedMessages);
      } else {
        setMessages((prev) => [...prev, ...formattedMessages]);
      }

      setHasMoreMessages(response.total > pageNum * 10);
      setPage(pageNum);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    if (flatListRef.current && !isUserScrolling) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 50);
    }
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleAddResponse = async () => {
    if (!responseText.trim()) return;
    setSubmitting(true);

    try {
      if (!socketManager.isConnected()) {
        console.log(
          "Socket not connected. Reconnecting before sending message..."
        );
        await socketManager.connect();
        socketManager.joinRoom(chatId);
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      // Add the user message to the UI immediately
      const newMessage: Response = {
        id: `user-${Date.now()}`,
        content: responseText,
        senderId: "user", // This will be replaced with actual user ID from the response
        timestamp: new Date().toISOString(),
      };

      console.log(`Sending message: "${responseText}"`);

      setMessages((prevMessages) => [...prevMessages, newMessage]);
      setResponseText("");

      if (socketConnected && socketManager.isConnected()) {
        socketManager.sendMessage(responseText);

        // Add typing indicator
        const typingId = `typing-${Date.now()}`;
        const typingMessage: Response = {
          id: typingId,
          content: "CarTechAI is analyzing...",
          senderId: "00000000-0000-0000-0000-000000000000",
          timestamp: new Date().toISOString(),
        };

        setMessages((prevMessages) => [...prevMessages, typingMessage]);

        if (messageTimeoutRef.current) {
          clearTimeout(messageTimeoutRef.current);
        }

        const checkForResponse = () => {
          console.log(`Checking timeout for message: "${responseText}"`);
          setMessages((prevMessages) => {
            const typingExists = prevMessages.some(
              (msg) => msg.id === typingId
            );

            if (typingExists) {
              console.log(
                "No response received within timeout period, showing error message"
              );
              return prevMessages.map((msg) =>
                msg.id === typingId
                  ? {
                      ...msg,
                      id: `error-${Date.now()}`,
                      content:
                        "Sorry, I didn't receive a response from the server. Please try again.",
                    }
                  : msg
              );
            }
            return prevMessages;
          });

          console.log("Attempting to reconnect socket after timeout");
          socketManager.disconnect();
          socketManager
            .connect()
            .then(() => {
              socketManager.joinRoom(chatId);
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
          "Failed to send message. Please check your connection and try again."
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);
      Alert.alert("Error", "Could not send message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoadMore = () => {
    if (hasMoreMessages && !loading) {
      fetchMessages(page + 1);
    }
  };

  // Function to format the response date
  const formatDate = (timestamp: string) => {
    if (!timestamp) return "Unknown";
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isBotMessage = (senderId: string) => {
    return senderId === "00000000-0000-0000-0000-000000000000";
  };

  if (loading && !messages.length) {
    return (
      <ActivityIndicator size="large" color="#95ff77" style={{ flex: 1 }} />
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoWrapper}>
          <Logo />
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate("CommunityScreen")}
          style={styles.closeButton}
        >
          <Icon name="close" type="material" color="#fff" size={24} />
        </TouchableOpacity>
      </View>

      {/* Chat Content */}
      {chat && (
        <View style={styles.postContent}>
          <Text style={styles.postTitle}>{chat.topic}</Text>
          <Text style={styles.postDescription}>{chat.description}</Text>
        </View>
      )}

      {/* Load More Button */}
      {hasMoreMessages && (
        <TouchableOpacity
          style={styles.loadMoreButton}
          onPress={handleLoadMore}
        >
          <Text style={styles.loadMoreText}>Load More</Text>
        </TouchableOpacity>
      )}

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.responseCard,
              isBotMessage(item.senderId)
                ? styles.botMessage
                : styles.userMessage,
            ]}
          >
            {/* Message Content */}
            <View style={styles.responseContent}>
              {/* Sender Info and Date */}
              <View style={styles.responseHeader}>
                <Text
                  style={[
                    styles.posterName,
                    isBotMessage(item.senderId)
                      ? styles.botName
                      : styles.userName,
                  ]}
                >
                  {isBotMessage(item.senderId) ? "CarTechAI" : "You"}
                </Text>
                <Text style={styles.postedDate}>
                  {formatDate(item.timestamp)}
                </Text>
              </View>

              {/* Response Text */}
              <Text
                style={[
                  styles.responseText,
                  isBotMessage(item.senderId)
                    ? styles.botResponseText
                    : styles.userResponseText,
                ]}
              >
                {item.content}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.noResponsesText}>No messages yet.</Text>
        }
        contentContainerStyle={styles.flatListContent}
        onContentSizeChange={scrollToBottom}
        onLayout={scrollToBottom}
        onScrollBeginDrag={() => setIsUserScrolling(true)}
        onMomentumScrollEnd={() => setIsUserScrolling(false)}
        showsVerticalScrollIndicator={false}
      />

      {/* Add Response Input */}
      <View style={styles.responseInputContainer}>
        <TextInput
          style={styles.responseInput}
          placeholder="Type your message..."
          placeholderTextColor="#aaa"
          value={responseText}
          onChangeText={setResponseText}
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={handleAddResponse}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Icon name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1c1b",
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 36,
    marginBottom: 8,
    position: "relative",
  },
  logoWrapper: {
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    right: 0,
    padding: 10,
    backgroundColor: "#2a2e2e",
    borderRadius: 12,
  },
  postContent: {
    marginBottom: 24,
  },
  postTitle: {
    fontSize: 24,
    color: "#fff",
    fontFamily: "Aeonik",
    marginBottom: 8,
  },
  postDescription: {
    fontSize: 16,
    color: "#ddd",
    fontFamily: "Aeonik",
    marginBottom: 16,
  },
  loadMoreButton: {
    backgroundColor: "#2a2e2e",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  loadMoreText: {
    fontSize: 14,
    color: "#fff",
    fontFamily: "Aeonik",
  },
  responseCard: {
    padding: 12,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#2a2e2e",
    maxWidth: "80%",
    borderBottomRightRadius: 4,
    marginLeft: "10%",
  },
  botMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#95ff77",
    maxWidth: "80%",
    borderBottomLeftRadius: 4,
    marginRight: "10%",
  },
  responseContent: {},
  responseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  posterName: {
    fontSize: 14,
    fontFamily: "Aeonik",
    fontWeight: "600",
  },
  userName: {
    color: "#95ff77",
  },
  botName: {
    color: "#2a2e2e",
  },
  postedDate: {
    fontSize: 10,
    color: "#aaa",
    fontFamily: "Aeonik",
  },
  responseText: {
    fontSize: 16,
    fontFamily: "Aeonik",
    lineHeight: 22,
  },
  botResponseText: {
    color: "#2a2e2e",
  },
  userResponseText: {
    color: "#fff",
  },
  responseInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2a2e2e",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
    marginTop: 8,
  },
  responseInput: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
    fontFamily: "Aeonik",
    paddingVertical: 8,
  },
  sendButton: {
    padding: 8,
    backgroundColor: "#95ff77",
    borderRadius: 50,
  },
  noResponsesText: {
    fontSize: 14,
    color: "#aaa",
    fontFamily: "Aeonik",
    textAlign: "center",
    marginTop: 16,
  },
  flatListContent: {
    paddingBottom: 16,
    paddingTop: 8,
  },
});

export default PostDetailsScreen;
