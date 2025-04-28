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
import { ApiError, UserProfile } from "@/types/auth";
import { FontAwesome } from "@expo/vector-icons";

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
  const [userProfile, setUserProfile] = useState<UserProfile>({
    firstName: "",
    lastName: "",
    email: "",
    userLogo: "",
    phoneNumber: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const accessToken = await AsyncStorage.getItem("accessToken");

      if (accessToken) {
        // Try to get user profile from AsyncStorage
        const profileData = await AsyncStorage.getItem("userProfile");

        if (profileData) {
          // Use stored profile data
          setUserProfile(JSON.parse(profileData));
        } else {
          // Fallback to just email if no profile data
          const email = (await AsyncStorage.getItem("userEmail")) || "User";
          setUserProfile({
            firstName: "User",
            lastName: "",
            email: email,
            userLogo: "",
          });
        }
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
      await AsyncStorage.removeItem("userProfile");

      // Signal authentication state change
      global.authStateChanged = true;

      Alert.alert("Success", "You have been logged out successfully", [
        {
          text: "OK",
          onPress: () => {
            // No need to navigate, the layout will detect the change
            console.log("Logged out, app will update");
          },
        },
      ]);
    } catch (error: unknown) {
      console.error("Logout error:", error);

      const apiError = error as ApiError;
      let errorMessage = "Failed to log out. Please try again.";

      if (apiError.response?.data?.message) {
        errorMessage = apiError.response.data.message;
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Logo />
        <View style={styles.profileSection}>
          {userProfile.userLogo ? (
            <Image
              source={{ uri: userProfile.userLogo }}
              style={styles.profileImage}
            />
          ) : (
            <Image
              source={{
                uri: "https://avatar.iran.liara.run/public/boy?username=Ash",
              }}
              style={styles.profileImage}
            />
          )}

          <Text style={styles.profileName}>
            {userProfile.firstName} {userProfile.lastName}
          </Text>
          <Text style={styles.profileEmail}>{userProfile.email}</Text>

          {userProfile.phoneNumber && (
            <Text style={styles.profileDetail}>
              <FontAwesome name="phone" size={14} color="#888" />
              {userProfile.phoneNumber}
            </Text>
          )}

          {userProfile.companyName && (
            <Text style={styles.profileDetail}>
              <FontAwesome name="building" size={14} color="#888" />{" "}
              {userProfile.companyName}
            </Text>
          )}
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
    width: "80%",
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#2a2e2e",
    justifyContent: "center",
    alignItems: "center",
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
    marginBottom: 16,
  },
  profileDetail: {
    fontSize: 14,
    fontFamily: "Aeonik",
    color: "#aaa",
    textAlign: "center",
    marginTop: 4,
  },
});
