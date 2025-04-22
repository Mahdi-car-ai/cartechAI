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
import LottieView from "lottie-react-native";
import CustomButton from "@/components/Button";
import * as Google from "expo-auth-session/providers/google";
import { FontAwesome } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { auth } from "../config/firebaseConfig";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  getAuth
} from "firebase/auth";
import { SocialIcon } from "react-native-elements";
import { Image } from "react-native";
import Logo from "@/components/ui/Logo";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { app } from "../config/firebaseConfig"; 
import { User } from "../types/Firestore";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const width = useWindowDimensions().width * 0.9;
  
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: "689253185881-vmc7t8c485hj8coo0qum31o99dpbdai7.apps.googleusercontent.com",
    androidClientId: "631048456486-27tqnvubmng4bg1e3diu596cvfpl4j0o.apps.googleusercontent.com",
    redirectUri: "https://auth.expo.io/@stevenson.nagathota/cartechai",
  });
  

  useEffect(() => {
    if (response?.type === "success") {
      const { authentication } = response;
      // Handle Google authentication here
    }
  }, [response]);

  const handleCreateUser = async () => {
    if (!email || !password) {
      Alert.alert("Missing Information", "Please enter both email and password.");
      return;
    }

    const db = getFirestore(app);

    try {
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Prepare user data for Firestore
      const userData: User = {
        user_id: user.uid, // Firebase UID
        email: email,
        name: "", // Optional name (can be updated later)
        created_at: new Date().toISOString(), // Current timestamp
      };

      // Add user to Firestore collection "users"
      await setDoc(doc(db, "users", user.uid), userData);

      // Navigate to Home screen after successful signup
      navigation.navigate("Home");
    } catch (error) {
      console.log(error);
      Alert.alert("Signup Error", error.message);
    }
  };

  const handleLoginWithEmailAndPassword = async () => {
    if (!email || !password) {
      Alert.alert("Missing Information", "Please enter both email and password.");
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      navigation.navigate("Home");
    } catch (error) {
      let errorMessage = "Something went wrong. Please try again.";

      switch (error.code) {
        case "auth/invalid-email":
          errorMessage = "Invalid email format. Please check your email.";
          break;
        case "auth/user-not-found":
          errorMessage = "No account found with this email.";
          break;
        case "auth/wrong-password":
          errorMessage = "Incorrect password. Please try again.";
          break;
        case "auth/too-many-requests":
          errorMessage = "Too many failed attempts. Try again later.";
          break;
      }
      console.log(error);
      Alert.alert("Login Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigation.navigate("Home");
      }
    });
    return unsubscribe;
  }, []);

  const [isLogin, setIsLogin] = useState(true);

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
          <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
            <Text
              style={{ color: "#fff", marginTop: 16, fontFamily: "Aeonik" }}
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Login"}
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
