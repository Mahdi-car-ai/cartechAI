import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { getAuth, signOut } from "firebase/auth";
import { app } from "../config/firebaseConfig";
import Logo from "@/components/ui/Logo";
import CustomButton from "@/components/Button";

export default function UserScreen() {
  const navigation = useNavigation();
  const auth = getAuth(app);
  const user = auth.currentUser;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.navigate("Home"); 
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Logo />
        <View style={styles.profileSection}>
          <Image
            source={{
              uri:
                user?.photoURL ||
                "https://avatar.iran.liara.run/public/boy?username=Ash",
            }}
            style={styles.profileImage}
          />
          <Text style={styles.profileName}>
            {user?.email || ""}
          </Text>
          
        </View>

        <CustomButton
          title="Edit Profile"
          icon="edit"
          backgroundColor="#2a2e2e"
          color="#fff"
          iconColor="#fff"
          onPress={() => navigation.navigate("EditProfile")} // Navigate to EditProfile screen
        />

        <CustomButton
          title="Logout"
          icon="logout"
          backgroundColor="#ff4444"
          color="#fff"
          iconColor="#fff"
          onPress={handleLogout}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1c1b",
    width: '100%'
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  profileSection: {
    alignItems: "center",
    marginVertical: 32,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  profileName: {
    fontSize: 24,
    fontFamily: "Aeonik",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  profileEmail: {
    fontSize: 16,
    fontFamily: "Aeonik",
    color: "#888",
    textAlign: "center",
  },
});