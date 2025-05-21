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
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import CustomButton from "@/components/Button/Button";
import * as Google from "expo-auth-session/providers/google";
import { FontAwesome } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { Image } from "react-native";
import Logo from "@/components/ui/Logo";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthTokens, ApiError } from "@/types/auth";
import { API_URL } from "@/constants/Environment";

declare global {
  var authStateChanged: boolean;
  var registrationCompleted: boolean;
}

WebBrowser.maybeCompleteAuthSession();

type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Home: undefined;
};

export default function LoginScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [email, setEmail] = useState("admin@dev.com");
  const [password, setPassword] = useState("Qwertyuiop123");
  const [loading, setLoading] = useState(false);
  const width = useWindowDimensions().width * 0.9;

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId:
      "689253185881-vmc7t8c485hj8coo0qum31o99dpbdai7.apps.googleusercontent.com",
    androidClientId:
      "631048456486-27tqnvubmng4bg1e3diu596cvfpl4j0o.apps.googleusercontent.com",
    redirectUri: "https://auth.expo.io/@stevenson.nagathota/cartechai",
  });

  useEffect(() => {
    if (response?.type === "success") {
      const { authentication } = response;
    }
  }, [response]);

  const handleCreateUser = async () => {
    if (!email || !password) {
      Alert.alert(
        "Missing Information",
        "Please enter both email and password."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/signup`, {
        email: email.trim(),
        password,
      });

      const responseData = response.data as AuthTokens;

      await AsyncStorage.setItem("accessToken", responseData.accessToken);
      await AsyncStorage.setItem("refreshToken", responseData.refreshToken);

      reloadApp();
    } catch (error: unknown) {
      console.log(error);
      let errorMessage = "Signup failed. Please try again.";

      const apiError = error as ApiError;
      if (apiError.response?.data?.message) {
        errorMessage = apiError.response.data.message;
      }

      Alert.alert("Signup Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginWithEmailAndPassword = async () => {
    if (!email || !password) {
      Alert.alert(
        "Missing Information",
        "Please enter both email and password."
      );
      return;
    }
    setLoading(true);
    try {
      console.log(`Attempting to login with API URL: ${API_URL}`);

      const response = await axios.post(
        `${API_URL}/auth/signin`,
        {
          email: email.trim(),
          password,
        },
        {
          timeout: 15000, // 15 second timeout
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      const responseData = response.data as AuthTokens;

      console.log("Login successful, received tokens");

      await AsyncStorage.setItem("accessToken", responseData.accessToken);
      await AsyncStorage.setItem("refreshToken", responseData.refreshToken);
      // Fetch user data after successful login
      await fetchUserData(responseData.accessToken);

      reloadApp();
    } catch (error: unknown) {
      console.error("Login error details:", error);

      let errorMessage = "Login failed. Please try again.";
      let errorDetails = "";

      const apiError = error as ApiError;
      if (apiError.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        errorMessage = apiError.response.data?.message || "Server error";
        errorDetails = `Status: ${apiError.response.status}`;
        console.log("Error response:", apiError.response.data);
      } else if (apiError.request) {
        // The request was made but no response was received
        errorMessage =
          "No response from server. Please check your network connection.";
        errorDetails = "Network or server might be down";
        console.log("No response received:", apiError.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        errorMessage = apiError.message || "Unknown error occurred";
        console.log("Error message:", apiError.message);
      }

      console.log(`API URL used: ${API_URL}`);
      Alert.alert("Login Error", `${errorMessage}\n${errorDetails}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserData = async (accessToken: string) => {
    try {
      console.log(`Fetching user data from: ${API_URL}/auth/me`);

      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        timeout: 10000, // 10 second timeout
      });

      const userData = response.data;
      console.log("User data received successfully");
      await AsyncStorage.setItem("userProfile", JSON.stringify(userData));
    } catch (error) {
      console.error("Error fetching user data:", error);
      console.log("Creating basic profile due to fetch error");

      const basicProfile = {
        firstName: "User",
        lastName: "",
        email: email,
        userLogo: "",
        phoneNumber: "",
        companyName: "",
        address: {
          streetAddress1: "",
          streetAddress2: "",
          city: "",
          postCode: "",
        },
      };
      await AsyncStorage.setItem("userProfile", JSON.stringify(basicProfile));
    }
  };

  const reloadApp = async () => {
    try {
      // Set both flags to true to trigger navigation to the main app
      global.authStateChanged = true;
      global.registrationCompleted = true;

      Alert.alert("Success", "Login successful!", [
        {
          text: "OK",
          onPress: () => {
            console.log("Login successful, app will update");
          },
        },
      ]);
    } catch (error) {
      console.error("Error after login:", error);
    }
  };

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const accessToken = await AsyncStorage.getItem("accessToken");
        if (accessToken) {
          console.log("Auth token exists, layout will handle navigation");
        }
      } catch (error) {
        console.log("Error checking auth status:", error);
      }
    };

    checkAuthStatus();
  }, []);

  const [isLogin, _] = useState(true);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View
        // style={{
        //   alignItems: "center",
        //   justifyContent: "center",
        //   flexDirection: "row",
        // }}
        >
          <Logo />
        </View>

        <Text style={styles.subtitle}>
          AI-Powered Solutions for Every Car Problem
        </Text>
        <TextInput
          style={[styles.input, { width: width }]}
          placeholder="Email"
          placeholderTextColor="#7A7A7A"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={[styles.input, { width: width }]}
          placeholder="Password"
          placeholderTextColor="#7A7A7A"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={[styles.continueButton, { width: width }]}
          onPress={handleLoginWithEmailAndPassword}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>

        <View style={styles.createAccountContainer}>
          <Text style={styles.noAccountText}>Dont have an Account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
            <Text style={styles.createOneText}>Create One</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.or}>Or</Text>
          <View style={styles.divider} />
        </View>

        <TouchableOpacity
          style={[
            styles.socialButton,
            { width: width, backgroundColor: "#2E2A32" },
          ]}
          onPress={() => promptAsync()}
        >
          <FontAwesome
            name="apple"
            size={24}
            color="#fff"
            style={{ position: "absolute", left: 24 }}
          />
          <Text style={styles.socialButtonText}>Continue With Apple</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.socialButton,
            { width: width, backgroundColor: "#2E2A32" },
          ]}
          onPress={() => promptAsync()}
        >
          <Image
            source={require("../assets/images/google.png")}
            style={{ width: 24, height: 24, position: "absolute", left: 20 }}
          />
          <Text style={styles.socialButtonText}>Continue With Google</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.socialButton,
            { width: width, backgroundColor: "#2E2A32" },
          ]}
        >
          <FontAwesome
            name="facebook"
            size={24}
            color="#3b5998"
            style={{ position: "absolute", left: 24 }}
          />
          <Text style={styles.socialButtonText}>Continue With Facebook</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    maxWidth: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1C2129",
  },
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: "#1C2129",

    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontFamily: "Arame",
    margin: 8,
    marginTop: 16,
    textAlign: "center",
    color: "#fff",
  },
  subtitle: {
    fontSize: 24,
    fontFamily: "Aeonik",
    marginVertical: 24,
    textAlign: "center",
    color: "#fff",
    width: "80%",
  },
  input: {
    fontSize: 16,
    fontFamily: "Aeonik",
    backgroundColor: "transparent",
    color: "#fff",
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  continueButton: {
    backgroundColor: "#A4FF04",
    padding: 16,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  continueButtonText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "500",
    fontFamily: "Aeonik",
  },
  createAccountContainer: {
    flexDirection: "row",
    marginVertical: 8,
  },
  noAccountText: {
    color: "#fff",
    fontFamily: "Aeonik",
  },
  createOneText: {
    color: "#A4FF04",
    fontFamily: "Aeonik",
    fontWeight: "500",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "90%",
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#333",
  },
  or: {
    fontFamily: "Aeonik",
    fontSize: 14,
    color: "#777",
    paddingHorizontal: 10,
  },
  socialButton: {
    padding: 16,
    borderRadius: 30,
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  socialButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Aeonik",
  },
});
