import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserProfile, ApiError } from "@/types/auth";
import api from "@/services/api";
import { updateProfile as updateUserProfile } from "@/services/authService";
import { styles } from "./EditProfileScreenStyles";
import PasswordChangeModal from "@/screens/EditProfileScreen/ui/PasswordChangeModal/PasswordChangeModal";
import ActionButtons from "@/screens/EditProfileScreen/ui/ActionButtons/ActionButtons";
import ProfileFormSection from "@/screens/EditProfileScreen/ui/ProfileFormSection/ProfileFormSection";
import ProfileHeader from "@/screens/EditProfileScreen/ui/ProfileHeader/ProfileHeader";

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
  streetAddress1: string;
  streetAddress2: string;
  city: string;
  postCode: string;
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

  const [formData, setFormData] = useState<EditProfileForm>({
    firstName: "",
    lastName: "",
    email: "",
    userLogo: "",
    phoneNumber: "",
    companyName: "",
    streetAddress1: "",
    streetAddress2: "",
    city: "",
    postCode: "",
  });

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
          streetAddress1: userProfile.address?.streetAddress1 || "",
          streetAddress2: userProfile.address?.streetAddress2 || "",
          city: userProfile.address?.city || "",
          postCode: userProfile.address?.postCode || "",
        });
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
      Alert.alert("Error", "Failed to load user profile data");
    } finally {
      setLoadingProfile(false);
    }
  };

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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address");
      return false;
    }

    if (formData.phoneNumber.trim()) {
      const phoneRegex = /^\+?[0-9]{8,15}$/;
      if (!phoneRegex.test(formData.phoneNumber.replace(/\s/g, ""))) {
        Alert.alert("Invalid Phone", "Please enter a valid phone number");
        return false;
      }
    }

    return true;
  };

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

  const handleUpdateProfile = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const updateData: Partial<UserProfile> = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        // userLogo: formData.userLogo,
        phoneNumber: formData.phoneNumber,
        companyName: formData.companyName,
        address: {
          streetAddress1: formData.streetAddress1,
          streetAddress2: formData.streetAddress2,
          city: formData.city,
          postCode: formData.postCode,
        },
      };

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

  const handleChangePassword = async () => {
    if (!validatePasswordForm()) {
      return;
    }

    setPasswordLoading(true);
    try {
      await api.patch("/users/change-password", {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });

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
          <View style={{ width: width, alignItems: "center" }}>
            <ProfileHeader
              onBackPress={() => navigation.goBack()}
              userLogo={formData.userLogo}
              onImagePress={pickImage}
            />

            <ProfileFormSection
              formData={formData}
              setFormData={setFormData}
              onPasswordChangePress={() => setShowPasswordModal(true)}
            />

            {loading ? (
              <ActivityIndicator
                size="large"
                color="#fff"
                style={{ marginTop: 20 }}
              />
            ) : (
              <ActionButtons
                onCancel={() => navigation.goBack()}
                onSave={handleUpdateProfile}
              />
            )}
          </View>
        </ScrollView>

        <PasswordChangeModal
          visible={showPasswordModal}
          passwordForm={passwordForm}
          setPasswordForm={setPasswordForm}
          onClose={() => setShowPasswordModal(false)}
          onSubmit={handleChangePassword}
          loading={passwordLoading}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
