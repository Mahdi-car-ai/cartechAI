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
import LottieView from "lottie-react-native";
import CustomButton from "@/components/Button";
import * as Google from "expo-auth-session/providers/google";
import { FontAwesome } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { Image } from "react-native";
import Logo from "@/components/ui/Logo";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthTokens, ApiError } from "@/types/auth";

declare global {
  var authStateChanged: boolean;
}

WebBrowser.maybeCompleteAuthSession();

const API_URL = "http://localhost:4000";

type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export default function LoginScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        "Please enter both email and password.",
      );
      return;
    }

    setLoading(true);
 
    console.log(`${API_URL}/auth/signup`);
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
      if (
        apiError.response?.data?.message
      ) {
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
        "Please enter both email and password.",
      );
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/signin`, {
        email: email.trim(),
        password,
      });

      const responseData = response.data as AuthTokens & { user?: any };
      
      await AsyncStorage.setItem("accessToken", responseData.accessToken);
      await AsyncStorage.setItem("refreshToken", responseData.refreshToken);
      await AsyncStorage.setItem("userEmail", email);
      
      // Create a basic user profile if it doesn't exist
      const existingProfile = await AsyncStorage.getItem("userProfile");
      if (!existingProfile) {
        // If response contains user data, use it
        if (responseData.user) {
          await AsyncStorage.setItem("userProfile", JSON.stringify(responseData.user));
        } else {
          // Create minimal profile with email only
          const basicProfile = {
            firstName: "User",
            lastName: "",
            email: email,
            userLogo: ""
          };
          await AsyncStorage.setItem("userProfile", JSON.stringify(basicProfile));
        }
      }

      reloadApp();
    } catch (error: unknown) {
      console.log(error);
      let errorMessage = "Login failed. Please try again.";
      
      const apiError = error as ApiError;
      if (
        apiError.response?.data?.message
      ) {
        errorMessage = apiError.response.data.message;
      }
      
      Alert.alert("Login Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const reloadApp = async () => {
    try {
      global.authStateChanged = true;
      
      Alert.alert(
        "Success", 
        "Login successful!",
        [
          {
            text: "OK",
            onPress: () => {
              console.log("Login successful, app will update");
            }
          }
        ]
      );
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
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
            }}
          >
            <Logo />
          </View>

          <Text style={styles.subtitle}>
            AI-Powered Solutions for Every Car Problem
          </Text>
          <TextInput
            style={[styles.input, { width: width, color: "#1a1c1b" }]}
            placeholder="Email"
            placeholderTextColor="#ddd"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={[styles.input, { width: width, color: "#1a1c1b" }]}
            placeholder="Password"
            placeholderTextColor="#ddd"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />
          {isLogin ? (
            <CustomButton
              title="Login with email"
              icon="mail"
              color="#1a1c1b"
              iconColor="#1a1c1b"
              onPress={handleLoginWithEmailAndPassword}
            />
          ) : (
            <CustomButton
              title="Sign up with email"
              icon="email"
              onPress={handleCreateUser}
            />
          )}
          <Text style={styles.or}>OR</Text>
          <TouchableOpacity
            style={[
              styles.socialButton,
              {
                width: width,
                backgroundColor: "#2a2e2e",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              },
            ]}
            onPress={() => promptAsync()}
          >
            <Image
              source={require("../assets/images/google.png")}
              style={{ width: 30, height: 30, position: "absolute", left: 18 }}
            />
            <Text
              style={[{ color: "#fff", fontSize: 16, fontFamily: "Aeonik" }]}
            >
              Continue with Google
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.socialButton,
              {
                width: width,
                backgroundColor: "#fff",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                marginTop: 0,
              },
            ]}
            onPress={() => promptAsync()}
          >
            <FontAwesome
              name="apple"
              size={24}
              color="#1a1b1c"
              style={{ position: "absolute", left: 24 }}
            />
            <Text
              style={[{ color: "#1a1c1b", fontSize: 16, fontFamily: "Aeonik" }]}
            >
              Continue with Apple
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
            <Text
              style={{ color: "#fff", marginTop: 16, fontFamily: "Aeonik" }}
            >
              Don't have an account? Sign up
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1c1b",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  title: {
    fontSize: 24,
    fontFamily: "Arame",
    margin: 8,
    marginTop: 16,
    textAlign: "center",
    color: "#fff",
  },
  or: {
    fontFamily: "Aeonik",
    fontSize: 12,
    color: "#555D58",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 32,
    fontFamily: "Aeonik",
    margin: 16,
    textAlign: "center",
    color: "#fff",
  },
  socialButton: {
    width: "100%",
    padding: 16,
    borderRadius: 16,
    margin: 16,
    textAlign: "center",
    alignItems: "center",
    justifyContent: "space-between",
    fontFamily: "Aeonik",
  },
  input: {
    fontSize: 16,
    fontFamily: "Aeonik",
    backgroundColor: "#fff",
    color: "#000",
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginTop: 16,
    textAlign: "center",
    width: "80%",
  },
});
