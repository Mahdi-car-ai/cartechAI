import React, { useCallback, memo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from "react-native";
import { RenderChatProps, ChatMessage } from "@/types/chat";

const processTextWithMedia = (
  text: string | undefined,
  item: ChatMessage,
  handleImageLoad: (id: string) => void
) => {
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  const imagePattern =
    /(https?:\/\/[^\s)]+?\.(?:png|jpg|jpeg|gif))(?=[\s)]|$)/i;
  const pdfPattern = /(https?:\/\/[^\s)]+?\.pdf)(?=[\s)]|$)/i;
  const boldPattern = /\*\*(.*?)\*\*/g;
  const emojiPattern = /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu;

  return (text || "").split(urlPattern).map((part: string, index: number) => {
    if (imagePattern.test(part)) {
      return (
        <TouchableOpacity key={index} onPress={() => Linking.openURL(part)}>
          <Image
            source={{ uri: part }}
            style={styles.chatImage}
            onLoad={() => handleImageLoad(item.id)}
          />
        </TouchableOpacity>
      );
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
      return (
        <Text key={index} style={[styles.messageText, styles.boldText]}>
          {part.replace(boldPattern, "$1")}
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
};

const RenderChat = memo(
  ({ item, loadingStates, setLoadingStates }: RenderChatProps) => {
    const handleImageLoad = useCallback(
      (id: string) => {
        const updatedStates: Record<string, boolean> = { ...loadingStates };
        updatedStates[id] = false;
        setLoadingStates(updatedStates);
      },
      [loadingStates, setLoadingStates],
    );

    const imageLoading = loadingStates[item.id] ?? true;
    return (
      <View
        style={[
          styles.messageContainer,
          item.sender === "user" ? styles.userMessage : styles.botMessage,
        ]}
      >
        {processTextWithMedia(item.text || item.message, item, handleImageLoad)}

        {item.images && item.images.length > 0 && (
          <View style={styles.imageContainer}>
            {item.images.map((img, index) => (
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
                    onLoad={() => handleImageLoad(item.id)}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
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
  emojiText: {
    fontFamily: "Aeonik",
    fontSize: 16,
    color: "#1a1c1b",
  },
});

export default RenderChat;
