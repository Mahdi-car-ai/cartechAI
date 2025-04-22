import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import Logo from "@/components/ui/Logo";
import CustomButton from "@/components/Button";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

// Add the type declaration for the global var
declare global {
  var authStateChanged: boolean;
}

type RootStackParamList = {
  Login: undefined;
  EditProfile: undefined;
  [key: string]: undefined | object;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function UserScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [userEmail, setUserEmail] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Fetch user info on component mount
  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const accessToken = await AsyncStorage.getItem("accessToken");

      if (accessToken) {
        // For now, we'll just use any stored user email or a placeholder
        const email = await AsyncStorage.getItem("userEmail");
        setUserEmail(email || "User");
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await AsyncStorage.removeItem("accessToken");
      await AsyncStorage.removeItem("refreshToken");
      await AsyncStorage.removeItem("userEmail");

      // Signal authentication state change
      global.authStateChanged = true;

      // Alert user of successful logout
      Alert.alert("Success", "You have been logged out successfully", [
        {
          text: "OK",
          onPress: () => {
            // No need to navigate, the layout will detect the change
            console.log("Logged out, app will update");
          },
        },
      ]);
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert("Error", "Failed to log out. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Logo />
        <View style={styles.profileSection}>
          <Image
            source={{
              uri: "https://avatar.iran.liara.run/public/boy?username=Ash",
            }}
            style={styles.profileImage}
          />
          <Text style={styles.profileName}>{userEmail}</Text>
        </View>

        <CustomButton
          title="Edit Profile"
          icon="edit"
          backgroundColor="#2a2e2e"
          color="#fff"
          iconColor="#fff"
          onPress={() => navigation.navigate("EditProfile")}
        />

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#ff4444"
            style={{ marginTop: 16 }}
          />
        ) : (
          <CustomButton
            title="Logout"
            icon="logout"
            backgroundColor="#ff4444"
            color="#fff"
            iconColor="#fff"
            onPress={handleLogout}
          />
        )}
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
    width: "100%",
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
