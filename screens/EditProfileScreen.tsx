import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  useColorScheme,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import CustomButton from "@/components/Button";
import { FontAwesome } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import Logo from "@/components/ui/Logo";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserProfile, ApiError } from "@/types/auth";
import { Colors } from "@/constants/Colors";

const API_URL = "http://localhost:4000";

type RootStackParamList = {
  UserScreen: undefined;
};

interface EditProfileForm {
  firstName: string;
  lastName: string;
  email: string;
  userLogo?: string;
  phone: string;
  companyName: string;
  streetAddress: string;
  streetAddressLine2: string;
  city: string;
  postalCode: string;
  password: string;
  confirmPassword: string;
}

export default function EditProfileScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const width = useWindowDimensions().width * 0.9;
  const colorScheme = useColorScheme();
  const iconColor = Colors[colorScheme ?? "light"].icon;

  // Form state
  const [formData, setFormData] = useState<EditProfileForm>({
    firstName: "",
    lastName: "",
    email: "",
    userLogo: "",
    phone: "",
    companyName: "",
    streetAddress: "",
    streetAddressLine2: "",
    city: "",
    postalCode: "",
    password: "",
    confirmPassword: "",
  });

  // Load user data
  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const profileData = await AsyncStorage.getItem("userProfile");

      if (profileData) {
        const userProfile = JSON.parse(profileData) as UserProfile;

        setFormData({
          firstName: userProfile.firstName || "",
          lastName: userProfile.lastName || "",
          email: userProfile.email || "",
          userLogo: userProfile.userLogo || "",
          phone: userProfile.phone || "",
          companyName: userProfile.companyName || "",
          streetAddress: userProfile.address?.streetAddress || "",
          streetAddressLine2: userProfile.address?.streetAddressLine2 || "",
          city: userProfile.address?.city || "",
          postalCode: userProfile.address?.postalCode || "",
          password: "",
          confirmPassword: "",
        });
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
      Alert.alert("Error", "Failed to load user profile data");
    } finally {
      setLoadingProfile(false);
    }
  };

  // Image picker
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please allow access to your photo library to upload a profile picture.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setFormData({ ...formData, userLogo: result.assets[0].uri });
    }
  };

  // Validation
  const validateForm = () => {
    if (!formData.firstName.trim()) {
      Alert.alert("Invalid Input", "Please enter your first name");
      return false;
    }

    if (!formData.lastName.trim()) {
      Alert.alert("Invalid Input", "Please enter your last name");
      return false;
    }

    if (!formData.email.trim()) {
      Alert.alert("Invalid Input", "Please enter your email");
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address");
      return false;
    }

    // Validate password only if both password fields have input
    if (formData.password || formData.confirmPassword) {
      if (formData.password.length < 6) {
        Alert.alert(
          "Invalid Password",
          "Password must be at least 6 characters long",
        );
        return false;
      }

      if (formData.password !== formData.confirmPassword) {
        Alert.alert("Password Mismatch", "Passwords do not match");
        return false;
      }
    }

    // Only validate phone if it's not empty
    if (formData.phone.trim()) {
      const phoneRegex = /^\+?[0-9]{8,15}$/;
      if (!phoneRegex.test(formData.phone.replace(/\s/g, ""))) {
        Alert.alert("Invalid Phone", "Please enter a valid phone number");
        return false;
      }
    }

    return true;
  };

  // Handle profile update
  const handleUpdateProfile = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Prepare update data
      const updateData: Partial<UserProfile> = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        userLogo: formData.userLogo,
        phone: formData.phone,
        companyName: formData.companyName,
        address: {
          streetAddress: formData.streetAddress,
          streetAddressLine2: formData.streetAddressLine2,
          city: formData.city,
          postalCode: formData.postalCode,
        },
      };

      // Optional: Send update to backend
      // Uncomment this when backend API is ready
      /*
      const accessToken = await AsyncStorage.getItem("accessToken");
      if (accessToken) {
        await axios.put(`${API_URL}/users/profile`, updateData, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
      }
      */

      // Include password in update if provided
      if (formData.password) {
        // Optional: Update password on backend
        // Uncomment this when backend API is ready
        /*
        if (accessToken) {
          await axios.post(`${API_URL}/users/change-password`, {
            password: formData.password
          }, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
        }
        */
      }

      // Update local storage
      await AsyncStorage.setItem("userProfile", JSON.stringify(updateData));
      await AsyncStorage.setItem("userEmail", formData.email);

      Alert.alert("Success", "Your profile has been updated successfully", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error: unknown) {
      console.error("Error updating profile:", error);

      const apiError = error as ApiError;
      let errorMessage = "Failed to update profile. Please try again.";

      if (apiError.response?.data?.message) {
        errorMessage = apiError.response.data.message;
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loadingProfile) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading profile data...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerContainer}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={[
                styles.backButton,
                { flexDirection: "row", alignItems: "center" },
              ]}
            >
              <FontAwesome name="chevron-left" size={18} color={iconColor} />
              <Text style={{ marginLeft: 10, color: iconColor, fontSize: 16 }}>
                Back
              </Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Profile</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={{ width: width, alignItems: "center" }}>
            <TouchableOpacity
              onPress={pickImage}
              style={styles.profileImageContainer}
            >
              {formData.userLogo ? (
                <Image
                  source={{ uri: formData.userLogo }}
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
              <View style={styles.editIconContainer}>
                <FontAwesome name="camera" size={16} color="#fff" />
              </View>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Personal Information</Text>

            <TextInput
              style={styles.input}
              placeholder="First Name"
              placeholderTextColor="#aaa"
              value={formData.firstName}
              onChangeText={(text) =>
                setFormData({ ...formData, firstName: text })
              }
              autoCapitalize="words"
            />

            <TextInput
              style={styles.input}
              placeholder="Last Name"
              placeholderTextColor="#aaa"
              value={formData.lastName}
              onChangeText={(text) =>
                setFormData({ ...formData, lastName: text })
              }
              autoCapitalize="words"
            />

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#aaa"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.sectionTitle}>Change Password (Optional)</Text>

            <TextInput
              style={styles.input}
              placeholder="New Password"
              placeholderTextColor="#aaa"
              value={formData.password}
              onChangeText={(text) =>
                setFormData({ ...formData, password: text })
              }
              secureTextEntry
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Confirm New Password"
              placeholderTextColor="#aaa"
              value={formData.confirmPassword}
              onChangeText={(text) =>
                setFormData({ ...formData, confirmPassword: text })
              }
              secureTextEntry
              autoCapitalize="none"
            />

            <Text style={styles.sectionTitle}>Contact Information</Text>

            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              placeholderTextColor="#aaa"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              keyboardType="phone-pad"
            />

            <TextInput
              style={styles.input}
              placeholder="Company Name (Optional)"
              placeholderTextColor="#aaa"
              value={formData.companyName}
              onChangeText={(text) =>
                setFormData({ ...formData, companyName: text })
              }
            />

            <Text style={styles.sectionTitle}>Address Information</Text>

            <TextInput
              style={styles.input}
              placeholder="Street Address"
              placeholderTextColor="#aaa"
              value={formData.streetAddress}
              onChangeText={(text) =>
                setFormData({ ...formData, streetAddress: text })
              }
            />

            <TextInput
              style={styles.input}
              placeholder="Street Address Line 2"
              placeholderTextColor="#aaa"
              value={formData.streetAddressLine2}
              onChangeText={(text) =>
                setFormData({ ...formData, streetAddressLine2: text })
              }
            />

            <TextInput
              style={styles.input}
              placeholder="City"
              placeholderTextColor="#aaa"
              value={formData.city}
              onChangeText={(text) => setFormData({ ...formData, city: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Postal / Zip Code"
              placeholderTextColor="#aaa"
              value={formData.postalCode}
              onChangeText={(text) =>
                setFormData({ ...formData, postalCode: text })
              }
              keyboardType="numeric"
            />

            {loading ? (
              <ActivityIndicator
                size="large"
                color="#fff"
                style={{ marginTop: 20 }}
              />
            ) : (
              <View style={styles.buttonContainer}>
                <CustomButton
                  title="Cancel"
                  onPress={() => navigation.goBack()}
                  backgroundColor="#666"
                />
                <CustomButton
                  title="Save Changes"
                  onPress={handleUpdateProfile}
                />
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1c1b",
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    marginTop: 10,
    fontFamily: "Aeonik",
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: "center",
    paddingVertical: 30,
  },
  headerContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  backButton: {
    zIndex: 10,
    marginLeft: 20,
  },
  headerTitle: {
    width: "100%",
    position: "absolute",
    fontSize: 22,
    fontFamily: "Aeonik",
    color: "#fff",
    textAlign: "center",
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 24,
    position: "relative",
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  editIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#2a2e2e",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#1a1c1b",
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Aeonik",
    color: "#fff",
    marginTop: 16,
    marginBottom: 8,
    alignSelf: "flex-start",
    paddingLeft: 8,
  },
  input: {
    width: "100%",
    fontSize: 16,
    fontFamily: "Aeonik",
    backgroundColor: "#fff",
    color: "#1a1c1b",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  buttonContainer: {
    marginTop: 20,
  },
});
