import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
} from "react-native";

import { useNavigation, DrawerActions } from "@react-navigation/native";
import { Icon } from "react-native-elements";
import { getAuth, signOut } from "firebase/auth";
import { app } from "../config/firebaseConfig";
import Logo from "./ui/Logo";
import { getChats } from "../utils/Chat"; 


const categorizeChats = (chats) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset to start of the day

  const categorizedChats = {
    Today: [],
    Yesterday: [],
    "3 days ago": [],
    "4 days ago": [],
    "5 days ago": [],
    "6 days ago": [],
    "Last Week": [],
  };

  if (!chats) return categorizedChats; 

  chats.forEach((chat) => {
    if (!chat.created_at) return;

    const chatDate = chat.created_at.toDate(); 
    chatDate.setHours(0, 0, 0, 0); 

    const diffInDays = Math.floor((today - chatDate) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      categorizedChats.Today.push(chat);
    } else if (diffInDays === 1) {
      categorizedChats.Yesterday.push(chat);
    } else if (diffInDays >= 2 && diffInDays <= 6) {
      const key = `${diffInDays} days ago`;
      if (categorizedChats[key]) {
        categorizedChats[key].push(chat);
      }
    } else {
      categorizedChats["Last Week"].push(chat);
    }
  });

  return categorizedChats;
};

const CustomDrawer = (props) => {
  const navigation = useNavigation();
  const auth = getAuth(app);
  const user = auth.currentUser;
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);

  useEffect(() => {
    const fetchChats = async () => {
      const fetchedChats = await getChats();
      setChats(fetchedChats);
    };

    fetchChats();
  }, []);

  const categorizedChats = categorizeChats(chats);

  const currentRoute = props.state?.routes[props.state.index]?.name;
  const isCommunityScreen = currentRoute === "CommunityScreen";
  const isHomeScreen = currentRoute === "Home";

  const renderHeader = () => (
  <View>
    <Logo />
    <TouchableOpacity
      style={[
        styles.communityButton,
        isHomeScreen && styles.activeButton,
      ]}
      onPress={() => navigation.navigate("Home")}
    >
      <Icon name="chat" type="material" color="#fff" size={24} />
      <Text style={styles.communityButtonText}>New Chat</Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={[
        styles.communityButton,
        isCommunityScreen && styles.activeButton,
      ]}
      onPress={() => navigation.navigate("CommunityScreen")}
    >
      <Icon name="people" type="material" color="#fff" size={24} />
      <Text style={styles.communityButtonText}>Community</Text>
    </TouchableOpacity>
  </View>
);

// Render a section of chats
const renderSection = (title, data) => {
  if (data.length === 0) return null; 
  return (
    <View key={title}>
      <View
          style={{
            borderTopWidth: 1.5,
            borderTopColor: "#444",
            marginTop: 16,
          }}
        />
      <Text style={styles.sectionTitle}>{title}</Text>
      {data.map((item) => {
        const isActive = activeChatId === item.id && currentRoute === "ChatScreen";
        return (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.chatItemButton,
              isActive ? styles.activeChatItem : null,
            ]}
            onPress={() => {
              setActiveChatId(item.id);
              navigation.navigate("ChatScreen", { chatId: item.id, carDetails: item.carDetails });
            }}
          >
            <Text style={styles.chatText}>{item.carDetails}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

  return (
    <View style={styles.container}>
      <FlatList
        data={Object.entries(categorizedChats)}
        keyExtractor={([title]) => title}
        ListHeaderComponent={renderHeader}
        renderItem={({ item: [title, data] }) => renderSection(title, data)}
      />

      {/* User Profile Section */}
      <TouchableOpacity
        style={styles.profileContainer}
        onPress={() => navigation.navigate("UserScreen")}
      >
        <Image
          source={{
            uri:
              user?.photoURL ||
              "https://avatar.iran.liara.run/public/boy?username=Ash",
          }}
          style={styles.profileImage}
        />
        <Text style={styles.profileName} numberOfLines={1} ellipsizeMode="tail">
          {user?.email || " "}
        </Text>
        <Icon name="more-horiz" type="material" color="#fff" size={24} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 48,
    paddingHorizontal: 16,
    backgroundColor: "#1a1c1b",
  },
  sectionContainer: {
    borderTopWidth: 1.5,
    borderTopColor: "#444",
    marginTop: 16,
  },
  // Community Button Styles
  communityButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,

  },
  activeButton: {
    backgroundColor: "#2a2e2e", // Background color when active
  },
  communityButtonText: {
    fontSize: 16,
    color: "#fff",
    fontFamily: "Aeonik",
    marginLeft: 12,
  },
  // Chat Item Styles
  chatItemButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    
  },
  activeChatItem: {
    backgroundColor: "#2a2e2e", // Default background color
  },
  chatText: {
    fontFamily: "Aeonik",
    fontSize: 16,
    color: "#fff",
  },
  // Profile Section Styles
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderTopWidth: 1,
    paddingBottom: 24,
    borderTopColor: "#444",
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  profileName: {
    fontSize: 16,
    color: "#fff",
    fontFamily: "Aeonik",
    flex: 1,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    color: "#95ff77",
    padding: 16,
    fontFamily: "Aeonik",
  },
});

export default CustomDrawer;
