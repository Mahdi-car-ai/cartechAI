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
import { StackNavigationProp } from "@react-navigation/stack";
import { getCommunityChats, CommunityChat } from "@/utils/Community";
// import { styles } from "./CommunityScreenStyles";

// Define navigation types
type RootStackParamList = {
  CreatePostScreen: undefined;
  PostDetailsScreen: { chatId: string };
  [key: string]: undefined | object;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

const CommunityScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [chats, setChats] = useState<CommunityChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [activeFilter, setActiveFilter] = useState("All"); // State for active filter

  useEffect(() => {
    fetchChats();
  }, [activeFilter]); // Refetch chats when the filter changes

  const fetchChats = async (searchQuery = "") => {
    setLoading(true);
    try {
      const communityChats = await getCommunityChats();

      // Filter chats based on search query
      let filteredChats = communityChats;
      if (searchQuery) {
        const lowerCaseQuery = searchQuery.toLowerCase();
        filteredChats = communityChats.filter(
          (chat) =>
            chat.topic.toLowerCase().includes(lowerCaseQuery) ||
            chat.description.toLowerCase().includes(lowerCaseQuery)
        );
      }

      setChats(filteredChats);
    } catch (error) {
      console.error("Error fetching community chats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchChats(searchText.trim());
  };

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    // Note: Filters would need to be implemented with backend filtering
    // or moved to local filtering based on available data
  };

  const formatTimestamp = (timestamp: string) => {
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
        <View style={styles.filterRow}>
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
              activeFilter === "Popular" && styles.activeFilterButton,
            ]}
            onPress={() => handleFilterChange("Popular")}
          >
            <Text style={styles.filterButtonText}>Popular</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              activeFilter === "Recent" && styles.activeFilterButton,
            ]}
            onPress={() => handleFilterChange("Recent")}
          >
            <Text style={styles.filterButtonText}>Recent</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              activeFilter === "My Topics" && styles.activeFilterButton,
            ]}
            onPress={() => handleFilterChange("My Topics")}
          >
            <Text style={styles.filterButtonText}>My Topics</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Chats List */}
      {loading ? (
        <ActivityIndicator size="large" color="#95ff77" />
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.postCard}
              onPress={() =>
                navigation.navigate("PostDetailsScreen", { chatId: item.id })
              }
            >
              <View style={styles.postContent}>
                <View style={styles.postText}>
                  <Text style={styles.postTitle}>{item.topic}</Text>
                  <Text style={styles.postDescription} numberOfLines={2}>
                    {item.description}
                  </Text>
                  <Text style={styles.askedAtText}>
                    Created on {formatTimestamp(item.createdAt)}
                  </Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.postStatus}>
                    {item.usersCount || 0} users
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
    flexDirection: "column",
    justifyContent: "center",
    marginBottom: 24,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: "#A3FE07",
    alignItems: "center",
    marginHorizontal: 4,
    flex: 1,
  },
  activeFilterButton: {
    backgroundColor: "#C4FF57",
  },
  filterButtonText: {
    fontSize: 16,
    alignContent: "center",
    color: "#111",
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
