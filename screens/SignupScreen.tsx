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
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import CustomButton from "@/components/Button";
import * as Google from "expo-auth-session/providers/google";
import { FontAwesome } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import * as ImagePicker from "expo-image-picker";
import Logo from "@/components/ui/Logo";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  SignupFormStep1,
  SignupFormStep2,
  AuthTokens,
  ApiError,
  SignupData,
} from "@/types/auth";

WebBrowser.maybeCompleteAuthSession();

const API_URL = "http://localhost:4000";

type RootStackParamList = {
  Login: undefined;
};

export default function SignupScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const width = useWindowDimensions().width * 0.9;

  // Form data state
  const [step1Form, setStep1Form] = useState<SignupFormStep1>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [step2Form, setStep2Form] = useState<SignupFormStep2>({
    phone: "",
    companyName: "",
    streetAddress: "",
    streetAddressLine2: "",
    city: "",
    postalCode: "",
  });

  // Google auth
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId:
      "689253185881-vmc7t8c485hj8coo0qum31o99dpbdai7.apps.googleusercontent.com",
    androidClientId:
      "631048456486-27tqnvubmng4bg1e3diu596cvfpl4j0o.apps.googleusercontent.com",
    redirectUri: "https://auth.expo.io/@stevenson.nagathota/cartechai",
  });

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
      setStep1Form({ ...step1Form, userLogo: result.assets[0].uri });
    }
  };

  // Validation for Step 1
  const validateStep1 = () => {
    if (!step1Form.firstName.trim()) {
      Alert.alert("Invalid Input", "Please enter your first name");
      return false;
    }

    if (!step1Form.lastName.trim()) {
      Alert.alert("Invalid Input", "Please enter your last name");
      return false;
    }

    if (!step1Form.email.trim()) {
      Alert.alert("Invalid Input", "Please enter your email");
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(step1Form.email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address");
      return false;
    }

    if (!step1Form.password) {
      Alert.alert("Invalid Input", "Please enter a password");
      return false;
    }

    if (step1Form.password.length < 6) {
      Alert.alert(
        "Invalid Password",
        "Password must be at least 6 characters long",
      );
      return false;
    }

    if (step1Form.password !== step1Form.confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match");
      return false;
    }

    return true;
  };

  // Validation for Step 2
  const validateStep2 = () => {
    if (!step2Form.phone.trim()) {
      Alert.alert("Invalid Input", "Please enter your phone number");
      return false;
    }

    // Basic phone validation
    const phoneRegex = /^\+?[0-9]{8,15}$/;
    if (!phoneRegex.test(step2Form.phone.replace(/\s/g, ""))) {
      Alert.alert("Invalid Phone", "Please enter a valid phone number");
      return false;
    }

    return true;
  };

  // Handle step 1 submission and proceed to step 2
  const handleNextStep = async () => {
    if (!validateStep1()) {
      return;
    }

    setLoading(true);
    try {
      // Send only the step 1 data to the signup endpoint
      const signupData = {
        firstName: step1Form.firstName,
        lastName: step1Form.lastName,
        email: step1Form.email,
        password: step1Form.password,
        // userLogo: step1Form.userLogo,
      };

      const response = await axios.post(`${API_URL}/auth/signup`, signupData);

      // Store the userId for the second step
      const userData = response.data as {
        id: string;
        accessToken: string;
        refreshToken: string;
      };
      setUserId(userData.id);

      // Store tokens
      await AsyncStorage.setItem("accessToken", userData.accessToken);
      await AsyncStorage.setItem("refreshToken", userData.refreshToken);
      await AsyncStorage.setItem("userEmail", step1Form.email);

      // Proceed to step 2
      setCurrentStep(2);
    } catch (error: unknown) {
      console.log(error);
      let errorMessage = "Signup failed. Please try again.";

      // Type assertion for axios error
      const apiError = error as ApiError;
      if (apiError.response?.data?.message) {
        errorMessage = apiError.response.data.message;
      }

      Alert.alert("Signup Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Go back to step 1
  const handlePrevStep = () => {
    setCurrentStep(1);
  };

  // Handle Google authentication
  useEffect(() => {
    if (response?.type === "success") {
      const { authentication } = response;
      // TODO: Handle Google sign-in with backend
    }
  }, [response]);

  // Handle final signup (step 2 submission)
  const handleCompleteSignup = async () => {
    if (!validateStep2()) {
      return;
    }

    // if (!userId) {
    //   Alert.alert("Error", "User ID is missing. Please try again.");
    //   setCurrentStep(1);
    //   return;
    // }

    setLoading(true);
    try {
      // Send the step 2 data to the add-user-fields endpoint
      const userData = {
        phoneNumber: step2Form.phone,
        companyName: step2Form.companyName,
        address: {
          streetLine1: step2Form.streetAddress,
          streetLine2: step2Form.streetAddressLine2,
          city: step2Form.city,
          postCode: step2Form.postalCode,
        },
      };

      // Get the stored token
      const token = await AsyncStorage.getItem("accessToken");

      if (!token) {
        throw new Error("Authentication token is missing");
      }

      await axios.patch(`${API_URL}/auth/add-user-fields`, userData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Store user profile data
      const userProfileData = {
        firstName: step1Form.firstName,
        lastName: step1Form.lastName,
        email: step1Form.email,
        userLogo: step1Form.userLogo || "",
        phone: step2Form.phone,
        companyName: step2Form.companyName,
        address: {
          streetAddress: step2Form.streetAddress,
          streetAddressLine2: step2Form.streetAddressLine2,
          city: step2Form.city,
          postalCode: step2Form.postalCode,
        },
      };

      await AsyncStorage.setItem(
        "userProfile",
        JSON.stringify(userProfileData),
      );

      // Signal authentication state change
      global.authStateChanged = true;
      global.registrationCompleted = true;

      Alert.alert("Success", "Your account has been created successfully!");
    } catch (error: unknown) {
      console.log(error);
      let errorMessage = "Failed to save user information. Please try again.";

      // Type assertion for axios error
      const apiError = error as ApiError;
      if (apiError.response?.data?.message) {
        errorMessage = apiError.response.data.message;
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Render Step 1 form
  const renderStep1 = () => {
    return (
      <View style={{ width: width, alignItems: "center" }}>
        <Text style={styles.stepTitle}>Step 1: Account Information</Text>

        <TouchableOpacity
          onPress={pickImage}
          style={styles.profileImageContainer}
        >
          {step1Form.userLogo ? (
            <Image
              source={{ uri: step1Form.userLogo }}
              style={styles.profileImage}
            />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <FontAwesome name="user" size={40} color="#888" />
              <Text style={styles.uploadText}>Upload Photo</Text>
            </View>
          )}
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="First Name"
          placeholderTextColor="#aaa"
          value={step1Form.firstName}
          onChangeText={(text) =>
            setStep1Form({ ...step1Form, firstName: text })
          }
          autoCapitalize="words"
        />

        <TextInput
          style={styles.input}
          placeholder="Last Name"
          placeholderTextColor="#aaa"
          value={step1Form.lastName}
          onChangeText={(text) =>
            setStep1Form({ ...step1Form, lastName: text })
          }
          autoCapitalize="words"
        />

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#aaa"
          value={step1Form.email}
          onChangeText={(text) => setStep1Form({ ...step1Form, email: text })}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#aaa"
          value={step1Form.password}
          onChangeText={(text) =>
            setStep1Form({ ...step1Form, password: text })
          }
          secureTextEntry
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor="#aaa"
          value={step1Form.confirmPassword}
          onChangeText={(text) =>
            setStep1Form({ ...step1Form, confirmPassword: text })
          }
          secureTextEntry
          autoCapitalize="none"
        />

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#fff"
            style={{ marginTop: 16 }}
          />
        ) : (
          <CustomButton title="Continue" onPress={handleNextStep} />
        )}

        <Text style={styles.or}>OR</Text>

        <TouchableOpacity
          style={[
            styles.socialButton,
            {
              backgroundColor: "#2a2e2e",
            },
          ]}
          onPress={() => promptAsync()}
        >
          <Image
            source={require("../assets/images/google.png")}
            style={{ width: 24, height: 24, position: "absolute", left: 16 }}
          />
          <Text style={styles.socialButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.socialButton,
            {
              backgroundColor: "#fff",
              marginTop: 12,
            },
          ]}
          onPress={() => promptAsync()}
        >
          <FontAwesome
            name="apple"
            size={24}
            color="#1a1b1c"
            style={{ position: "absolute", left: 16 }}
          />
          <Text style={[styles.socialButtonText, { color: "#1a1c1b" }]}>
            Continue with Apple
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.switchModeText}>
            Already have an account? Sign in
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render Step 2 form
  const renderStep2 = () => {
    return (
      <View style={{ width: width, alignItems: "center" }}>
        <Text style={styles.stepTitle}>Step 2: Contact Information</Text>

        <TextInput
          style={styles.input}
          placeholder="Phone Number *"
          placeholderTextColor="#aaa"
          value={step2Form.phone}
          onChangeText={(text) => setStep2Form({ ...step2Form, phone: text })}
          keyboardType="phone-pad"
        />

        <TextInput
          style={styles.input}
          placeholder="Company Name (Optional)"
          placeholderTextColor="#aaa"
          value={step2Form.companyName}
          onChangeText={(text) =>
            setStep2Form({ ...step2Form, companyName: text })
          }
        />

        <Text style={styles.sectionTitle}>Address (Optional)</Text>

        <TextInput
          style={styles.input}
          placeholder="Street Address"
          placeholderTextColor="#aaa"
          value={step2Form.streetAddress}
          onChangeText={(text) =>
            setStep2Form({ ...step2Form, streetAddress: text })
          }
        />

        <TextInput
          style={styles.input}
          placeholder="Street Address Line 2"
          placeholderTextColor="#aaa"
          value={step2Form.streetAddressLine2}
          onChangeText={(text) =>
            setStep2Form({ ...step2Form, streetAddressLine2: text })
          }
        />

        <TextInput
          style={styles.input}
          placeholder="City"
          placeholderTextColor="#aaa"
          value={step2Form.city}
          onChangeText={(text) => setStep2Form({ ...step2Form, city: text })}
        />

        <TextInput
          style={styles.input}
          placeholder="Postal / Zip Code"
          placeholderTextColor="#aaa"
          value={step2Form.postalCode}
          onChangeText={(text) =>
            setStep2Form({ ...step2Form, postalCode: text })
          }
          keyboardType="numeric"
        />

        <View style={styles.buttonRow}>
          <CustomButton
            title="Back"
            onPress={handlePrevStep}
            backgroundColor="#666"
          />

          {loading ? (
            <ActivityIndicator
              size="large"
              color="#2a2e2e"
              style={{ marginTop: 16 }}
            />
          ) : (
            <CustomButton
              title="Create Account"
              onPress={handleCompleteSignup}
            />
          )}
        </View>
      </View>
    );
  };

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
          <View style={styles.logoContainer}>
            <Logo />
          </View>

          {currentStep === 1 ? renderStep1() : renderStep2()}
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
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 30,
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontFamily: "Aeonik",
    color: "#fff",
    marginBottom: 20,
    textAlign: "center",
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
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 24,
    overflow: "hidden",
    backgroundColor: "#2a2e2e",
    alignItems: "center",
    justifyContent: "center",
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  profileImagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  uploadText: {
    color: "#fff",
    marginTop: 8,
    fontSize: 12,
    fontFamily: "Aeonik",
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
  or: {
    fontFamily: "Aeonik",
    fontSize: 16,
    color: "#888",
    marginVertical: 16,
    textAlign: "center",
  },
  socialButton: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 12,
  },
  socialButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Aeonik",
  },
  switchModeText: {
    color: "#fff",
    marginTop: 24,
    fontFamily: "Aeonik",
    fontSize: 14,
  },
  buttonRow: {
    justifyContent: "center",
    marginTop: 16,
  },
});
