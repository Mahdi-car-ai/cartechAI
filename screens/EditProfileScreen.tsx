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
  Modal,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { FontAwesome } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import Logo from "@/components/ui/Logo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserProfile, ApiError } from "@/types/auth";
import { Colors } from "@/constants/Colors";
import api from "@/services/api";
import { updateProfile as updateUserProfile } from "@/services/authService";
import CustomButton from "@/components/Button";

type RootStackParamList = {
  UserScreen: undefined;
};

interface EditProfileForm {
  firstName: string;
  lastName: string;
  email: string;
  userLogo?: string;
  phoneNumber: string;
  companyName: string;
  streetAddress: string;
  streetAddressLine2: string;
  city: string;
  postalCode: string;
}

interface PasswordChangeForm {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function EditProfileScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const width = useWindowDimensions().width * 0.9;
  const colorScheme = useColorScheme();
  const iconColor = Colors[colorScheme ?? "light"].icon;

  // Form state
  const [formData, setFormData] = useState<EditProfileForm>({
    firstName: "",
    lastName: "",
    email: "",
    userLogo: "",
    phoneNumber: "",
    companyName: "",
    streetAddress: "",
    streetAddressLine2: "",
    city: "",
    postalCode: "",
  });

  // Password change form state
  const [passwordForm, setPasswordForm] = useState<PasswordChangeForm>({
    oldPassword: "",
    newPassword: "",
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
          phoneNumber: userProfile.phoneNumber || "",
          companyName: userProfile.companyName || "",
          streetAddress: userProfile.address?.streetAddress || "",
          streetAddressLine2: userProfile.address?.streetAddressLine2 || "",
          city: userProfile.address?.city || "",
          postalCode: userProfile.address?.postalCode || "",
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
      console.log(result.assets[0].uri);
      setFormData({ ...formData, userLogo: result.assets[0].uri });
    }
  };

  // Validation for profile form
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

    // Only validate phone if it's not empty
    if (formData.phoneNumber.trim()) {
      const phoneRegex = /^\+?[0-9]{8,15}$/;
      if (!phoneRegex.test(formData.phoneNumber.replace(/\s/g, ""))) {
        Alert.alert("Invalid Phone", "Please enter a valid phone number");
        return false;
      }
    }

    return true;
  };

  // Validation for password change
  const validatePasswordForm = () => {
    if (!passwordForm.oldPassword) {
      Alert.alert("Invalid Input", "Please enter your current password");
      return false;
    }

    if (!passwordForm.newPassword) {
      Alert.alert("Invalid Input", "Please enter your new password");
      return false;
    }

    if (passwordForm.newPassword.length < 6) {
      Alert.alert(
        "Invalid Password",
        "New password must be at least 6 characters long",
      );
      return false;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Alert.alert("Password Mismatch", "New passwords do not match");
      return false;
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
        // userLogo: formData.userLogo,
        phoneNumber: formData.phoneNumber,
        companyName: formData.companyName,
        address: {
          streetAddress: formData.streetAddress,
          streetAddressLine2: formData.streetAddressLine2,
          city: formData.city,
          postalCode: formData.postalCode,
        },
      };

      // Use the API utility that handles token refresh
      const success = await updateUserProfile(updateData);

      if (success) {
        await AsyncStorage.setItem("userProfile", JSON.stringify(updateData));
        Alert.alert("Success", "Your profile has been updated successfully", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert("Error", "Failed to update profile. Please try again.");
      }
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

  // Handle password change
  const handleChangePassword = async () => {
    if (!validatePasswordForm()) {
      return;
    }

    setPasswordLoading(true);
    try {
      // Use the API utility that handles token refresh
      await api.post("/auth/change-password", {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });

      // Reset form and close modal
      setPasswordForm({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowPasswordModal(false);

      Alert.alert("Success", "Your password has been changed successfully");
    } catch (error: unknown) {
      console.error("Error changing password:", error);

      const apiError = error as ApiError;
      let errorMessage = "Failed to change password. Please try again.";

      if (apiError.response?.data?.message) {
        errorMessage = apiError.response.data.message;
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setPasswordLoading(false);
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
                  source={require("../assets/images/icons/user.png")}
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

            <TouchableOpacity
              style={styles.changePasswordButton}
              onPress={() => setShowPasswordModal(true)}
            >
              <Text style={styles.changePasswordText}>Change Password</Text>
              <FontAwesome name="lock" size={16} color="#fff" />
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Contact Information</Text>

            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              placeholderTextColor="#aaa"
              value={formData.phoneNumber}
              onChangeText={(text) =>
                setFormData({ ...formData, phoneNumber: text })
              }
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

        {/* Password Change Modal */}
        <Modal
          visible={showPasswordModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowPasswordModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Change Password</Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowPasswordModal(false)}
                >
                  <FontAwesome name="times" size={20} color="#fff" />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.modalInput}
                placeholder="Current Password"
                placeholderTextColor="#888"
                value={passwordForm.oldPassword}
                onChangeText={(text) =>
                  setPasswordForm({ ...passwordForm, oldPassword: text })
                }
                secureTextEntry
                autoCapitalize="none"
              />

              <TextInput
                style={styles.modalInput}
                placeholder="New Password"
                placeholderTextColor="#888"
                value={passwordForm.newPassword}
                onChangeText={(text) =>
                  setPasswordForm({ ...passwordForm, newPassword: text })
                }
                secureTextEntry
                autoCapitalize="none"
              />

              <TextInput
                style={styles.modalInput}
                placeholder="Confirm New Password"
                placeholderTextColor="#888"
                value={passwordForm.confirmPassword}
                onChangeText={(text) =>
                  setPasswordForm({ ...passwordForm, confirmPassword: text })
                }
                secureTextEntry
                autoCapitalize="none"
              />

              <View style={styles.modalButtonsContainer}>
                {passwordLoading ? (
                  <ActivityIndicator size="large" color="#95ff77" />
                ) : (
                  <>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.cancelButton]}
                      onPress={() => setShowPasswordModal(false)}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.modalButton, styles.submitButton]}
                      onPress={handleChangePassword}
                    >
                      <Text style={styles.submitButtonText}>
                        Change Password
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </View>
        </Modal>
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
  changePasswordButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2a2e2e",
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 16,
    width: "100%",
  },
  changePasswordText: {
    color: "#fff",
    fontFamily: "Aeonik",
    fontSize: 16,
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#2a2e2e",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: "#444",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: "Aeonik",
    color: "#fff",
    textAlign: "center",
    flex: 1,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#444",
    justifyContent: "center",
    alignItems: "center",
  },
  modalInput: {
    width: "100%",
    fontSize: 16,
    fontFamily: "Aeonik",
    backgroundColor: "#1a1c1b",
    color: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#444",
  },
  modalButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 6,
  },
  cancelButton: {
    backgroundColor: "#444",
    borderWidth: 1,
    borderColor: "#555",
  },
  submitButton: {
    backgroundColor: "#95ff77",
  },
  cancelButtonText: {
    fontFamily: "Aeonik",
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
  },
  submitButtonText: {
    fontFamily: "Aeonik",
    fontSize: 16,
    color: "#1a1c1b",
    fontWeight: "600",
  },
});
