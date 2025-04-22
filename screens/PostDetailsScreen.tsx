import React, { useEffect, useState } from "react";
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
import { useNavigation, useRoute } from "@react-navigation/native";
import { Icon } from "react-native-elements";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  increment,
} from "firebase/firestore";
import { auth } from "../config/firebaseConfig";
import Logo from "@/components/ui/Logo";

const PostDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { postId } = route.params;
  const db = getFirestore();

  const [post, setPost] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responseText, setResponseText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const user = auth.currentUser;

  useEffect(() => {
    fetchPostDetails();
    fetchResponses();
  }, [postId]); // Add postId as a dependency

  const fetchPostDetails = async () => {
    setLoading(true); // Set loading to true when fetching new data
    try {
      const docRef = doc(db, "community_posts", postId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setPost({ id: docSnap.id, ...docSnap.data() });
      } else {
        Alert.alert("Error", "Post not found.");
        navigation.goBack();
      }
    } catch (error) {
      console.error("Error fetching post:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchResponses = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "community_responses"));
      const responseList = querySnapshot.docs
        .filter((doc) => doc.data().post_id === postId)
        .map((doc) => ({ id: doc.id, ...doc.data() }));

      // Sort responses by votes (highest first)
      responseList.sort((a, b) => (b.votes || 0) - (a.votes || 0));

      setResponses(responseList);
    } catch (error) {
      console.error("Error fetching responses:", error);
    }
  };

  const handleAddResponse = async () => {
    if (!responseText.trim()) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, "community_responses"), {
        post_id: postId,
        user_id: user.uid,
        message: responseText,
        created_at: new Date().toISOString(),
        is_accepted: false,
        votes: 0, // Default vote count
      });
      setResponseText("");
      fetchResponses(); // Refresh responses after adding a new one
    } catch (error) {
      console.error("Error adding response:", error);
      Alert.alert("Error", "Could not add response.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptResponse = async (responseId: string) => {
    if (!post || post.user_id !== user.uid) return;
    try {
      await updateDoc(doc(db, "community_responses", responseId), { is_accepted: true });
      await updateDoc(doc(db, "community_posts", postId), { status: "closed" });
      fetchResponses(); // Refresh responses after accepting
      fetchPostDetails(); // Refresh post details after accepting
      Alert.alert("Success", "Response accepted and post closed.");
    } catch (error) {
      console.error("Error accepting response:", error);
    }
  };

  const handleVote = async (responseId: string, type: string) => {
    try {
      const responseRef = doc(db, "community_responses", responseId);
      await updateDoc(responseRef, { votes: increment(type === "like" ? 1 : -1) });
      fetchResponses(); // Refresh responses after voting
    } catch (error) {
      console.error("Error updating votes:", error);
    }
  };

  // Function to format the response date
  const formatDate = (timestamp: string | number | Date) => {
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

  if (loading) return <ActivityIndicator size="large" color="#95ff77" style={styles.loader} />;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoWrapper}>
          <Logo />
        </View>
        <TouchableOpacity onPress={() => navigation.navigate("CommunityScreen")} style={styles.closeButton}>
          <Icon name="close" type="material" color="#fff" size={24} />
        </TouchableOpacity>
      </View>

      {/* Post Content */}
      <View style={styles.postContent}>
        <Text style={styles.postTitle}>{post?.title}</Text>
        <Text style={styles.postDescription}>{post?.description}</Text>
        <View style={styles.postStatusContainer}>
          <Text style={styles.postStatus}>
            {post?.status.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Responses List */}
      <FlatList
        data={responses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.responseCard}>
            {/* Response Content */}
            <View style={styles.responseContent}>
              {/* Poster Info and Date */}
              <View style={styles.responseHeader}>
                <Text style={styles.posterName}>
                  {item.displayName || "Anonymous"}
                </Text>
                <Text style={styles.postedDate}>
                  {formatDate(item.created_at)}
                </Text>
              </View>

              {/* Response Text */}
              <Text style={styles.responseText}>{item.message}</Text>

              {/* Like and Dislike Buttons */}
              <View style={styles.voteContainer}>
                <TouchableOpacity
                  style={styles.likeButton}
                  onPress={() => handleVote(item.id, "like")}
                >
                  <Icon name="thumb-up" type="material" color="#95ff77" size={24} />
                  <Text style={styles.voteText}>Like</Text>
                </TouchableOpacity>
                <Text style={styles.voteCount}>{item.votes || 0} likes</Text>
              </View>

              {/* Accept Button (for post owner) */}
              {post.user_id === user.uid && !item.is_accepted && post.status === "open" && (
                <TouchableOpacity
                  style={styles.acceptButton}
                  onPress={() => handleAcceptResponse(item.id)}
                >
                  <Text style={styles.acceptButtonText}>Accept</Text>
                </TouchableOpacity>
              )}

              {/* Accepted Badge */}
              {item.is_accepted && (
                <View style={styles.acceptedBadge}>
                  <Text style={styles.acceptedLabel}>ACCEPTED</Text>
                </View>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.noResponsesText}>No responses yet.</Text>}
        contentContainerStyle={styles.flatListContent}
      />

      {/* Add Response Input */}
      {post?.status === "open" && (
        <View style={styles.responseInputContainer}>
          <TextInput
            style={styles.responseInput}
            placeholder="Type your response..."
            placeholderTextColor="#aaa"
            value={responseText}
            onChangeText={setResponseText}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleAddResponse} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Icon name="send" size={20} color="#fff" />}
          </TouchableOpacity>
        </View>
      )}
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
  postStatusContainer: {
    backgroundColor: "#95ff77",
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
  },
  postStatus: {
    fontSize: 12,
    color: "#1a1c1b",
    fontFamily: "Aeonik",
    textTransform: "uppercase",
  },
  responseCard: {
    backgroundColor: "#2a2e2e",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  responseContent: {
    flex: 1,
  },
  responseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  posterName: {
    fontSize: 16,
    color: "#95ff77",
    fontFamily: "Aeonik",
  },
  postedDate: {
    fontSize: 12,
    color: "#aaa",
    fontFamily: "Aeonik",
  },
  responseText: {
    fontSize: 16,
    color: "#fff",
    fontFamily: "Aeonik",
    marginBottom: 12,
  },
  voteContainer: {
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  likeButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  
  voteText: {
    fontSize: 16,
    color: "#fff",
    fontFamily: "Aeonik",
    marginLeft: 4,
  },
  voteCount: {
    fontSize: 16,
    color: "#aaa",
    fontFamily: "Aeonik",
  },
  acceptButton: {
    backgroundColor: "#95ff77",
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  acceptButtonText: {
    fontSize: 12,
    color: "#1a1c1b",
    fontFamily: "Aeonik",
    textTransform: "uppercase",
  },
  acceptedBadge: {
    backgroundColor: "#95ff77",
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  acceptedLabel: {
    fontSize: 12,
    color: "#1a1c1b",
    fontFamily: "Aeonik",
    textTransform: "uppercase",
  },
  responseInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2a2e2e",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
  },
  responseInput: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
    fontFamily: "Aeonik",
  },
  sendButton: {
    padding: 8,
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
  },
});

export default PostDetailsScreen;