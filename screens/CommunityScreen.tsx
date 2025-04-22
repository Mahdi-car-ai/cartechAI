import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Icon } from "react-native-elements";
import Logo from "@/components/ui/Logo";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { auth } from "@/config/firebaseConfig";


const CommunityScreen = () => {
  const navigation = useNavigation();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [activeFilter, setActiveFilter] = useState("All"); // State for active filter

  useEffect(() => {
    fetchPosts();
  }, [activeFilter]); // Refetch posts when the filter changes

  const fetchPosts = async (searchQuery = "") => {
    setLoading(true);
    const db = getFirestore();
    let q = collection(db, "community_posts");

    // Add search query filter
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      q = query(
        q,
        where("title_lowercase", ">=", lowerCaseQuery),
        where("title_lowercase", "<=", lowerCaseQuery + "\uf8ff")
      );
    }
    
    // Add status filter
    if (activeFilter === "Open") {
      q = query(q, where("status", "==", "open"));
    } else if (activeFilter === "Closed") {
      q = query(q, where("status", "==", "closed"));
    } else if (activeFilter === "Posted By You") {
      q = query(q, where("user_id", "==", auth.currentUser!.uid));
    }

    try {
      const querySnapshot = await getDocs(q);
      const postList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(postList);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchPosts(searchText.trim());
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "Unknown";
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return "Invalid Date";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoWrapper}>
          <Logo />
        </View>

        <TouchableOpacity
          style={styles.newPostButton}
          onPress={() => navigation.navigate("CreatePostScreen")}
        >
          <Icon name="add" type="material" color="#fff" size={24} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search Community Posts..."
          placeholderTextColor="#aaa"
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Icon name="search" type="material" color="#fff" size={22} />
        </TouchableOpacity>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFilter === "All" && styles.activeFilterButton,
          ]}
          onPress={() => handleFilterChange("All")}
        >
          <Text style={styles.filterButtonText}>All</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFilter === "Open" && styles.activeFilterButton,
          ]}
          onPress={() => handleFilterChange("Open")}
        >
          <Text style={styles.filterButtonText}>Open</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFilter === "Closed" && styles.activeFilterButton,
          ]}
          onPress={() => handleFilterChange("Closed")}
        >
          <Text style={styles.filterButtonText}>Closed</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFilter === "Posted By You" && styles.activeFilterButton,
          ]}
          onPress={() => handleFilterChange("Posted By You")}
        >
          <Text style={styles.filterButtonText}>Posted By You</Text>
        </TouchableOpacity>
      </View>

      {/* Posts List */}
      {loading ? (
        <ActivityIndicator size="large" color="#95ff77" />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.postCard}
              onPress={() =>
                navigation.navigate("PostDetailsScreen", { postId: item.id })
              }
            >
              <View style={styles.postContent}>
                <View style={styles.postText}>
                  <Text style={styles.postTitle}>{item.title}</Text>
                  <Text style={styles.postDescription} numberOfLines={2}>
                    {item.description}
                  </Text>
                  <Text style={styles.askedAtText}>
                    Asked on {formatTimestamp(item.created_at)}
                  </Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.postStatus}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.flatListContent}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1c1b",
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: -10,
    marginBottom: 24,
    position: "relative",
  },
  logoWrapper: {
    alignItems: "center",
  },
  newPostButton: {
    position: "absolute",
    right: 0,
    padding: 10,
    backgroundColor: "#2a2e2e",
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2a2e2e",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    fontFamily: "Aeonik",
  },
  searchButton: {
    padding: 8,
  },
  filterContainer: {
    flexDirection: "row",
    width: 600,
    justifyContent: "center",
    marginBottom: 24,
  },
  filterButton: {
    flex: 1,
    
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "#2a2e2e",
    alignItems: "center",
    marginHorizontal: 4,
  },
  activeFilterButton: {
    backgroundColor: "#95ff77",
  },
  filterButtonText: {
    fontSize: 16,
    alignContent: "center",
    color: "#fff",
    fontFamily: "Aeonik",
  },
  postCard: {
    backgroundColor: "#2a2e2e",
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
  },
  postContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  postText: {
    flex: 1,
    marginRight: 16,
  },
  postTitle: {
    fontSize: 16,
    color: "#fff",
    fontFamily: "Aeonik",
    marginBottom: 8,
  },
  postDescription: {
    fontSize: 16,
    color: "#ddd",
    fontFamily: "Aeonik",
    marginBottom: 8,
  },
  askedAtText: {
    fontSize: 16,
    color: "#aaa",
    fontFamily: "Aeonik",
  },
  statusBadge: {
    backgroundColor: "#95ff77",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  postStatus: {
    fontSize: 16,
    color: "#1a1c1b",
    fontFamily: "Aeonik",
  },
  flatListContent: {
    paddingBottom: 24,
  },
});

export default CommunityScreen;